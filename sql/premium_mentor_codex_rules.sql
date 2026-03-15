create or replace function public._codex_user_has_mentor_access(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.user_profiles up
    where up.id = p_user_id
      and (
        coalesce(up.is_premium, false)
        or lower(coalesce(up.role, 'user')) in ('admin', 'gm', 'admin_gm')
      )
  );
$$;

create or replace function public.enforce_premium_mentoria_invites()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if coalesce(new.link_type, '') <> 'mentoria' then
    return new;
  end if;

  if new.recipient_id is null then
    raise exception 'MENTOR_TARGET_REQUIRED';
  end if;

  if not public._codex_user_has_mentor_access(new.recipient_id) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_premium_mentoria_invites on public.relationship_link_invites;

create trigger enforce_premium_mentoria_invites
before insert or update on public.relationship_link_invites
for each row
execute function public.enforce_premium_mentoria_invites();

create or replace function public.enforce_premium_mentoria_links()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if coalesce(new.link_type, '') <> 'mentoria' then
    return new;
  end if;

  if new.mentor_id is null then
    raise exception 'MENTOR_ID_REQUIRED';
  end if;

  if not public._codex_user_has_mentor_access(new.mentor_id) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_premium_mentoria_links on public.relationship_links;

create trigger enforce_premium_mentoria_links
before insert or update on public.relationship_links
for each row
execute function public.enforce_premium_mentoria_links();

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

  if not public._codex_user_has_mentor_access(v_uid) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
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
    300,
    'mentor_codex_forge',
    format('Forja de Codex para o pupilo %s', coalesce(v_recipient_profile.nickname, 'Pupilo')),
    jsonb_build_object(
      'recipient_id', p_recipient_id,
      'relationship_link_id', v_link.id,
      'codex_name', coalesce(nullif(trim(p_name), ''), 'Novo Codex')
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
    created_by_user_id
  ) values (
    p_recipient_id,
    coalesce(nullif(trim(p_name), ''), 'Novo Codex'),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(v_sender_profile.nickname), ''), 'Mentor'),
    null,
    p_template,
    'v2',
    false,
    'gift_in_app',
    null,
    v_uid
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
    format('@%s forjou um novo Codex para voce: "%s".', coalesce(v_sender_profile.nickname, 'Mentor'), v_inserted.name),
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
    300,
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

revoke all on function public._codex_user_has_mentor_access(uuid) from public;
revoke all on function public.enforce_premium_mentoria_invites() from public;
revoke all on function public.enforce_premium_mentoria_links() from public;
revoke all on function public.forge_mentor_codex_for_pupil(uuid, text, text, jsonb, uuid) from public;

grant execute on function public.forge_mentor_codex_for_pupil(uuid, text, text, jsonb, uuid) to authenticated;
