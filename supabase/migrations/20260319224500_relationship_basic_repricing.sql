create or replace function public._relationship_get_invite_cost(p_link_type text)
returns integer
language plpgsql
immutable
as $$
begin
  case coalesce(p_link_type, '')
    when 'parceria' then
      return 50;
    when 'competicao' then
      return 50;
    when 'mentoria' then
      return 100;
    else
      raise exception 'RELATIONSHIP_LINK_TYPE_INVALID';
  end case;
end;
$$;

create or replace function public._relationship_get_slot_cost(p_slot_type text)
returns integer
language plpgsql
immutable
as $$
begin
  case coalesce(p_slot_type, '')
    when 'partnership' then
      return 50;
    when 'competition' then
      return 50;
    when 'mentor' then
      return 50;
    when 'linked_arena' then
      return 50;
    else
      raise exception 'RELATIONSHIP_SLOT_TYPE_INVALID';
  end case;
end;
$$;

create or replace function public._relationship_get_slot_limit(p_user_id uuid, p_bucket text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.user_profiles%rowtype;
begin
  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  case coalesce(p_bucket, '')
    when 'partnership' then
      return 1 + coalesce(v_profile.partnership_slots_purchased, 0);
    when 'competition' then
      return 1 + coalesce(v_profile.competition_slots_purchased, 0);
    when 'mentor' then
      return 1 + coalesce(v_profile.mentor_slots_purchased, 0);
    when 'linked_arena' then
      return 1 + coalesce(v_profile.linked_arena_slots_purchased, 0);
    when 'pupil_mentor' then
      return 1;
    else
      raise exception 'RELATIONSHIP_SLOT_BUCKET_INVALID';
  end case;
end;
$$;

create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_partnership_active integer := 0;
  v_partnership_pending integer := 0;
  v_competition_active integer := 0;
  v_competition_pending integer := 0;
  v_mentor_active integer := 0;
  v_mentor_pending integer := 0;
  v_pupil_mentor_active integer := 0;
  v_linked_arenas integer := 0;
begin
  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id;

  if not found then
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
      'limit', public._relationship_get_slot_limit(p_user_id, 'partnership'),
      'base', 1,
      'purchased', coalesce(v_profile.partnership_slots_purchased, 0),
      'costGold', 50,
      'requiresPremium', false
    ),
    'competition', jsonb_build_object(
      'used', v_competition_active + v_competition_pending,
      'limit', public._relationship_get_slot_limit(p_user_id, 'competition'),
      'base', 1,
      'purchased', coalesce(v_profile.competition_slots_purchased, 0),
      'costGold', 50,
      'requiresPremium', false
    ),
    'mentor', jsonb_build_object(
      'used', v_mentor_active + v_mentor_pending,
      'limit', public._relationship_get_slot_limit(p_user_id, 'mentor'),
      'base', 1,
      'purchased', coalesce(v_profile.mentor_slots_purchased, 0),
      'costGold', 100,
      'requiresPremium', false
    ),
    'linked_arena', jsonb_build_object(
      'used', v_linked_arenas,
      'limit', public._relationship_get_slot_limit(p_user_id, 'linked_arena'),
      'base', 1,
      'purchased', coalesce(v_profile.linked_arena_slots_purchased, 0),
      'costGold', 50,
      'requiresPremium', false
    ),
    'pupil_mentor', jsonb_build_object(
      'used', v_pupil_mentor_active,
      'limit', public._relationship_get_slot_limit(p_user_id, 'pupil_mentor'),
      'base', 1,
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
  v_sender_used integer := 0;
  v_sender_limit integer := 0;
  v_recipient_pupil_used integer := 0;
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

  select * into v_sender_profile
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

  case p_link_type
    when 'parceria' then
      v_sender_limit := public._relationship_get_slot_limit(v_uid, 'partnership');
      select
        (
          select count(*) from public.relationship_links rl
          where rl.link_type = 'parceria'
            and rl.ended_at is null
            and (rl.mentor_id = v_uid or rl.pupil_id = v_uid)
        ) +
        (
          select count(*) from public.relationship_link_invites rli
          where rli.link_type = 'parceria'
            and rli.status = 'pending'
            and rli.sender_id = v_uid
        )
      into v_sender_used;
    when 'competicao' then
      v_sender_limit := public._relationship_get_slot_limit(v_uid, 'competition');
      select
        (
          select count(*) from public.relationship_links rl
          where rl.link_type = 'competicao'
            and rl.ended_at is null
            and (rl.mentor_id = v_uid or rl.pupil_id = v_uid)
        ) +
        (
          select count(*) from public.relationship_link_invites rli
          where rli.link_type = 'competicao'
            and rli.status = 'pending'
            and rli.sender_id = v_uid
        )
      into v_sender_used;
    when 'mentoria' then
      v_sender_limit := public._relationship_get_slot_limit(v_uid, 'mentor');
      select
        (
          select count(*) from public.relationship_links rl
          where rl.link_type = 'mentoria'
            and rl.ended_at is null
            and rl.mentor_id = v_uid
        ) +
        (
          select count(*) from public.relationship_link_invites rli
          where rli.link_type = 'mentoria'
            and rli.status = 'pending'
            and rli.sender_id = v_uid
        )
      into v_sender_used;

      select count(*)
      into v_recipient_pupil_used
      from public.relationship_links rl
      where rl.link_type = 'mentoria'
        and rl.ended_at is null
        and rl.pupil_id = p_recipient_id;

      if v_recipient_pupil_used >= public._relationship_get_slot_limit(p_recipient_id, 'pupil_mentor') then
        raise exception 'PUPIL_MENTOR_SLOT_LIMIT_REACHED';
      end if;
    else
      null;
  end case;

  if v_sender_used >= v_sender_limit then
    raise exception 'RELATIONSHIP_SLOT_LIMIT_REACHED';
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
declare
  v_uid uuid := auth.uid();
  v_cost integer;
  v_new_gold integer;
  v_new_value integer;
  v_column_name text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_slot_type, '') not in ('partnership', 'competition', 'mentor', 'linked_arena') then
    raise exception 'RELATIONSHIP_SLOT_TYPE_INVALID';
  end if;

  v_cost := public._relationship_get_slot_cost(p_slot_type);
  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'relationship_capacity_slot',
    format('Compra de slot de %s', p_slot_type),
    jsonb_build_object(
      'slot_type', p_slot_type,
      'cost_gold', v_cost
    )
  );

  v_column_name := case p_slot_type
    when 'partnership' then 'partnership_slots_purchased'
    when 'competition' then 'competition_slots_purchased'
    when 'mentor' then 'mentor_slots_purchased'
    else 'linked_arena_slots_purchased'
  end;

  execute format(
    'update public.user_profiles
     set %I = coalesce(%I, 0) + 1,
         updated_at = now()
     where id = $1
     returning %I',
    v_column_name,
    v_column_name,
    v_column_name
  )
  into v_new_value
  using v_uid;

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
    'relationship_capacity_slot',
    p_slot_type,
    v_cost,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'slot_type', p_slot_type,
    'new_gold', v_new_gold,
    'purchased_slots', v_new_value,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
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
  v_used integer := 0;
  v_limit integer := 0;
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

  select count(*)
  into v_used
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.mentor_id = v_uid;

  v_limit := public._relationship_get_slot_limit(v_uid, 'linked_arena');

  if v_used >= v_limit then
    raise exception 'LINKED_ARENA_SLOT_LIMIT_REACHED';
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

create or replace function public.enforce_premium_mentoria_invites()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.sender_id is null then
    raise exception 'MENTOR_ID_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_premium_mentoria_invites on public.relationship_link_invites;

create trigger enforce_premium_mentoria_invites
before insert or update on public.relationship_link_invites
for each row
execute function public.enforce_premium_mentoria_invites();

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
    raise exception 'Apenas Codex autoral pode ser entregue ao pupilo.';
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
    coalesce(v_source_codex.name, 'Codex sem nome'),
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
    format('@%s enviou o Codex "%s" para voce.', coalesce(v_sender_profile.nickname, 'Mentor'), coalesce(v_source_codex.name, 'Codex')),
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
  v_active_forged_count integer := 0;
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

  select count(*)
  into v_active_forged_count
  from public.codex c
  join public.relationship_links rl
    on rl.id = c.mentor_relationship_link_id
  where c.created_by_user_id = v_uid
    and coalesce(c.source_type, '') = 'gift_in_app'
    and c.origin_codex_id is null
    and rl.ended_at is null;

  if v_active_forged_count >= 2 then
    raise exception 'MENTOR_FORGED_CODEX_LIMIT_REACHED';
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
