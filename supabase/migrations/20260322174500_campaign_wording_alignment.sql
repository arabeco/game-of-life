create or replace function public.deliver_authored_codex_to_pupil(
  p_source_codex_id uuid,
  p_recipient_id uuid,
  p_relationship_link_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_sender_profile public.user_profiles%rowtype;
  v_recipient_profile public.user_profiles%rowtype;
  v_source_codex public.codex%rowtype;
  v_inserted_codex public.codex%rowtype;
  v_notification_id uuid := extensions.gen_random_uuid();
  v_relationship_link_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_sender_profile
  from public.user_profiles
  where id = v_uid;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select *
  into v_recipient_profile
  from public.user_profiles
  where id = p_recipient_id;

  if not found then
    raise exception 'PUPIL_NOT_FOUND';
  end if;

  if v_uid = p_recipient_id then
    raise exception 'INVALID_RECIPIENT';
  end if;

  if p_relationship_link_id is not null then
    select id
    into v_relationship_link_id
    from public.relationship_links
    where id = p_relationship_link_id
      and mentor_id = v_uid
      and pupil_id = p_recipient_id
      and link_type = 'mentoria'
      and ended_at is null;
  else
    select id
    into v_relationship_link_id
    from public.relationship_links
    where mentor_id = v_uid
      and pupil_id = p_recipient_id
      and link_type = 'mentoria'
      and ended_at is null
    order by created_at desc nulls last
    limit 1;
  end if;

  if v_relationship_link_id is null then
    raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED';
  end if;

  select *
  into v_source_codex
  from public.codex
  where id = p_source_codex_id
    and owner_id = v_uid
  for update;

  if not found then
    raise exception 'CODEX_NOT_FOUND';
  end if;

  if coalesce(v_source_codex.source_type, 'created') <> 'created' then
    raise exception 'Apenas campanha autoral pode ser entregue ao pupilo.';
  end if;

  if not public._codex_template_is_shareable(v_source_codex.template) then
    raise exception 'Finalize o manuscrito antes de entregar ao pupilo.';
  end if;

  insert into public.codex (
    owner_id,
    catalog_id,
    name,
    description,
    author,
    price,
    template,
    schema_version,
    is_public,
    source_type,
    created_by_user_id,
    origin_codex_id,
    mentor_relationship_link_id
  ) values (
    p_recipient_id,
    null,
    coalesce(v_source_codex.name, 'Campanha sem nome'),
    coalesce(v_source_codex.description, ''),
    coalesce(v_source_codex.author, v_sender_profile.nickname, 'Mentor'),
    null,
    v_source_codex.template,
    coalesce(v_source_codex.schema_version, 'v2'),
    false,
    'gift_in_app',
    v_uid,
    v_source_codex.id,
    v_relationship_link_id
  )
  returning * into v_inserted_codex;

  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  ) values (
    v_notification_id,
    p_recipient_id,
    'codex_gift',
    format('@%s enviou a campanha "%s" para voce.', coalesce(v_sender_profile.nickname, 'Mentor'), coalesce(v_source_codex.name, 'Campanha')),
    false,
    now(),
    jsonb_build_object(
      'codexId', v_inserted_codex.id,
      'originCodexId', v_source_codex.id,
      'codexName', v_inserted_codex.name,
      'senderNickname', v_sender_profile.nickname,
      'relationshipLinkId', v_relationship_link_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'codex_id', v_inserted_codex.id,
    'codex_name', v_inserted_codex.name,
    'relationship_link_id', v_relationship_link_id
  );
end;
$$;

create or replace function public.forge_mentor_codex_for_pupil(
  p_recipient_id uuid,
  p_name text,
  p_description text default '',
  p_template jsonb default '{}'::jsonb,
  p_relationship_link_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_sender_profile public.user_profiles%rowtype;
  v_recipient_profile public.user_profiles%rowtype;
  v_link public.relationship_links%rowtype;
  v_inserted public.codex%rowtype;
  v_new_gold integer;
  v_notification_id uuid := extensions.gen_random_uuid();
  v_level_count integer := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_sender_profile
  from public.user_profiles
  where id = v_uid;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select *
  into v_recipient_profile
  from public.user_profiles
  where id = p_recipient_id;

  if not found then
    raise exception 'PUPIL_NOT_FOUND';
  end if;

  if jsonb_typeof(coalesce(p_template -> 'levels', 'null'::jsonb)) = 'array' then
    v_level_count := jsonb_array_length(coalesce(p_template -> 'levels', '[]'::jsonb));
  end if;

  if v_level_count <= 0 then
    raise exception 'CODEX_TEMPLATE_LEVELS_REQUIRED';
  end if;

  if p_relationship_link_id is not null then
    select *
    into v_link
    from public.relationship_links
    where id = p_relationship_link_id
      and mentor_id = v_uid
      and pupil_id = p_recipient_id
      and link_type = 'mentoria'
      and ended_at is null
    for update;
  else
    select *
    into v_link
    from public.relationship_links
    where mentor_id = v_uid
      and pupil_id = p_recipient_id
      and link_type = 'mentoria'
      and ended_at is null
    order by created_at desc
    limit 1
    for update;
  end if;

  if not found then
    raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    100,
    'mentor_codex_forge',
    format('Forja de campanha para o pupilo %s', coalesce(v_recipient_profile.nickname, 'Pupilo')),
    jsonb_build_object(
      'recipient_id', p_recipient_id,
      'relationship_link_id', v_link.id,
      'codex_name', coalesce(nullif(trim(p_name), ''), 'Nova Campanha')
    )
  );

  insert into public.codex (
    owner_id,
    name,
    description,
    author,
    price,
    template,
    schema_version,
    is_public,
    source_type,
    origin_codex_id,
    created_by_user_id,
    mentor_relationship_link_id
  ) values (
    p_recipient_id,
    coalesce(nullif(trim(p_name), ''), 'Nova Campanha'),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(v_sender_profile.nickname), ''), 'Mentor'),
    null,
    p_template,
    'v2',
    false,
    'gift_in_app',
    null,
    v_uid,
    v_link.id
  )
  returning * into v_inserted;

  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  ) values (
    v_notification_id,
    p_recipient_id,
    'codex_gift',
    format('@%s forjou uma nova campanha para voce: "%s".', coalesce(v_sender_profile.nickname, 'Mentor'), v_inserted.name),
    false,
    now(),
    jsonb_build_object(
      'codexId', v_inserted.id,
      'codexName', v_inserted.name,
      'senderNickname', v_sender_profile.nickname,
      'relationshipLinkId', v_link.id,
      'deliveryMethod', 'mentor_forge'
    )
  );

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'mentor_codex_forge',
    v_inserted.id::text,
    100,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'codex_id', v_inserted.id,
    'codex_name', v_inserted.name
  );
end;
$$;
