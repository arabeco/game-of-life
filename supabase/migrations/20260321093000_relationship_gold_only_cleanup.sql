create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_partnership_active integer := 0;
  v_partnership_pending integer := 0;
  v_competition_active integer := 0;
  v_competition_pending integer := 0;
  v_mentor_active integer := 0;
  v_mentor_pending integer := 0;
  v_pupil_mentor_active integer := 0;
  v_linked_arenas integer := 0;
begin
  if not exists (
    select 1
    from public.user_profiles
    where id = p_user_id
  ) then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select count(*) into v_partnership_active
  from public.relationship_links rl
  where rl.link_type = 'parceria'
    and rl.ended_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  select count(*) into v_partnership_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'parceria'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_competition_active
  from public.relationship_links rl
  where rl.link_type = 'competicao'
    and rl.ended_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  select count(*) into v_competition_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'competicao'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_mentor_active
  from public.relationship_links rl
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.mentor_id = p_user_id;

  select count(*) into v_mentor_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'mentoria'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_pupil_mentor_active
  from public.relationship_links rl
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.pupil_id = p_user_id;

  select count(*) into v_linked_arenas
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.mentor_id = p_user_id;

  return jsonb_build_object(
    'partnership', jsonb_build_object(
      'used', v_partnership_active + v_partnership_pending,
      'limit', greatest(v_partnership_active + v_partnership_pending, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 50,
      'requiresPremium', false
    ),
    'competition', jsonb_build_object(
      'used', v_competition_active + v_competition_pending,
      'limit', greatest(v_competition_active + v_competition_pending, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 50,
      'requiresPremium', false
    ),
    'mentor', jsonb_build_object(
      'used', v_mentor_active + v_mentor_pending,
      'limit', greatest(v_mentor_active + v_mentor_pending, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 100,
      'requiresPremium', false
    ),
    'linked_arena', jsonb_build_object(
      'used', v_linked_arenas,
      'limit', greatest(v_linked_arenas, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 50,
      'requiresPremium', false
    ),
    'pupil_mentor', jsonb_build_object(
      'used', v_pupil_mentor_active,
      'limit', greatest(v_pupil_mentor_active, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 0,
      'requiresPremium', false
    )
  );
end;
$$;

create or replace function public.create_relationship_link_invite(
  p_recipient_id uuid,
  p_link_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_sender_profile public.user_profiles%rowtype;
  v_cost integer;
  v_new_gold integer;
  v_invite public.relationship_link_invites%rowtype;
  v_notification_type text;
  v_notification_content text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_recipient_id is null or p_recipient_id = v_uid then
    raise exception 'INVALID_RECIPIENT';
  end if;

  if coalesce(p_link_type, '') not in ('mentoria', 'parceria', 'competicao') then
    raise exception 'RELATIONSHIP_LINK_TYPE_INVALID';
  end if;

  select *
  into v_sender_profile
  from public.user_profiles
  where id = v_uid;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.relationship_links rl
    where rl.link_type = p_link_type
      and rl.ended_at is null
      and (
        (rl.mentor_id = v_uid and rl.pupil_id = p_recipient_id)
        or (rl.mentor_id = p_recipient_id and rl.pupil_id = v_uid)
      )
  ) then
    raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE';
  end if;

  if exists (
    select 1
    from public.relationship_link_invites rli
    where rli.link_type = p_link_type
      and rli.status = 'pending'
      and (
        (rli.sender_id = v_uid and rli.recipient_id = p_recipient_id)
        or (rli.sender_id = p_recipient_id and rli.recipient_id = v_uid)
      )
  ) then
    raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING';
  end if;

  v_cost := public._relationship_get_invite_cost(p_link_type);
  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'relationship_invite',
    format('Convite de %s', p_link_type),
    jsonb_build_object(
      'recipient_id', p_recipient_id,
      'link_type', p_link_type,
      'cost_gold', v_cost
    )
  );

  insert into public.relationship_link_invites (
    sender_id,
    recipient_id,
    link_type,
    arena_id,
    arena_snapshot,
    status,
    cost_gold,
    refunded_at,
    expires_at
  ) values (
    v_uid,
    p_recipient_id,
    p_link_type,
    null,
    null,
    'pending',
    v_cost,
    null,
    now() + interval '7 days'
  )
  returning * into v_invite;

  v_notification_type := case p_link_type
    when 'mentoria' then 'mentor_invite'
    when 'parceria' then 'partnership_invite'
    else 'arena_access'
  end;

  v_notification_content := case p_link_type
    when 'mentoria' then format('@%s enviou um convite de Mentoria.', coalesce(v_sender_profile.nickname, 'Mentor'))
    when 'parceria' then format('@%s enviou um convite de Parceria.', coalesce(v_sender_profile.nickname, 'Aliado'))
    else format('@%s enviou um convite de Competicao.', coalesce(v_sender_profile.nickname, 'Aliado'))
  end;

  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  ) values (
    extensions.gen_random_uuid(),
    p_recipient_id,
    v_notification_type,
    v_notification_content,
    false,
    now(),
    jsonb_build_object(
      'inviteId', v_invite.id,
      'senderId', v_uid,
      'linkType', p_link_type
    )
  );

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'invite', to_jsonb(v_invite),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public.buy_relationship_capacity_slot(
  p_slot_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  raise exception 'RELATIONSHIP_CAPACITY_DISABLED';
end;
$$;

create or replace function public.create_linked_relationship_arena(
  p_relationship_link_id uuid,
  p_asset_id text,
  p_name text,
  p_description text default '',
  p_icon text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_new_gold integer;
  v_arena public.arenas%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'ARENA_NAME_REQUIRED';
  end if;

  if coalesce(trim(p_asset_id), '') = '' then
    raise exception 'ARENA_ASSET_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'mentoria'
    and mentor_id = v_uid
    and ended_at is null
  for update;

  if not found then
    raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'mentor_linked_arena',
    format('Arena vinculada de mentoria: %s', trim(p_name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'asset_id', p_asset_id,
      'name', trim(p_name)
    )
  );

  insert into public.arenas (
    id, user_id, asset_id, name, description, icon, is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_uid,
    p_asset_id,
    trim(p_name),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(p_icon), ''), '??'),
    false
  )
  returning * into v_arena;

  insert into public.relationship_link_arenas (
    relationship_link_id, arena_id, created_by_user_id, created_at, metadata
  ) values (
    v_link.id,
    v_arena.id,
    v_uid,
    now(),
    jsonb_build_object('link_type', v_link.link_type)
  )
  returning * into v_linked;

  if v_link.arena_id is null then
    update public.relationship_links
    set arena_id = v_arena.id,
        arena_snapshot = jsonb_build_object('name', v_arena.name, 'icon', v_arena.icon)
    where id = v_link.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
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
    created_by_user_id,
    mentor_relationship_link_id
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
