begin;

alter table if exists public.daily_commitments
  add column if not exists relationship_bonus_xp integer not null default 0;

alter table if exists public.relationship_competition_challenges
  add column if not exists winner_bonus_xp integer,
  add column if not exists challenger_completed_at timestamptz,
  add column if not exists opponent_completed_at timestamptz,
  add column if not exists sealed_at timestamptz;

drop index if exists public.relationship_competition_challenges_active_link_idx;

create index if not exists relationship_competition_challenges_open_link_idx
  on public.relationship_competition_challenges (relationship_link_id, created_at desc)
  where sealed_at is null;

create or replace function public._competition_calculate_bonus_xp(
  p_total_planned integer,
  p_action_count integer
)
returns integer
language plpgsql
immutable
as $$
begin
  if coalesce(p_action_count, 0) >= 6 or coalesce(p_total_planned, 0) >= 12 then
    return 120;
  end if;

  if coalesce(p_action_count, 0) >= 4 or coalesce(p_total_planned, 0) >= 6 then
    return 90;
  end if;

  return 60;
end;
$$;

create or replace function public._competition_snapshot_arena_exists(
  p_arena_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.relationship_link_arenas rla
    join public.relationship_links rl
      on rl.id = rla.relationship_link_id
    where rla.arena_id = p_arena_id
      and coalesce(rla.metadata->>'link_type', rl.link_type) = 'competicao'
  );
$$;

create or replace function public.guard_competition_snapshot_arena_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_arena_id uuid := case when tg_op = 'DELETE' then old.id else new.id end;
begin
  if current_setting('app.relationship_competition_admin', true) = '1' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if public._competition_snapshot_arena_exists(v_arena_id) then
    raise exception 'COMPETITION_SNAPSHOT_LOCKED';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.guard_competition_snapshot_action_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_old_arena_id uuid := case when tg_op in ('UPDATE', 'DELETE') then old.arena_id else null end;
  v_new_arena_id uuid := case when tg_op in ('INSERT', 'UPDATE') then new.arena_id else null end;
begin
  if current_setting('app.relationship_competition_admin', true) = '1' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if (v_old_arena_id is not null and public._competition_snapshot_arena_exists(v_old_arena_id))
     or (v_new_arena_id is not null and public._competition_snapshot_arena_exists(v_new_arena_id)) then
    raise exception 'COMPETITION_SNAPSHOT_LOCKED';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_competition_snapshot_arena_mutation on public.arenas;
create trigger guard_competition_snapshot_arena_mutation
before update or delete on public.arenas
for each row
execute function public.guard_competition_snapshot_arena_mutation();

drop trigger if exists guard_competition_snapshot_action_mutation on public.actions;
create trigger guard_competition_snapshot_action_mutation
before insert or update or delete on public.actions
for each row
execute function public.guard_competition_snapshot_action_mutation();

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
  v_owner_user_id uuid;
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

  v_owner_user_id := v_link.pupil_id;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'mentor_linked_arena',
    format('Arena vinculada de mentoria: %s', trim(p_name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'link_type', v_link.link_type,
      'asset_id', p_asset_id,
      'name', trim(p_name)
    )
  );

  insert into public.arenas (
    id,
    user_id,
    asset_id,
    name,
    description,
    icon,
    is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_owner_user_id,
    p_asset_id,
    trim(p_name),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(p_icon), ''), '🏛️'),
    false
  )
  returning * into v_arena;

  insert into public.relationship_link_arenas (
    relationship_link_id,
    arena_id,
    created_by_user_id,
    created_at,
    metadata
  ) values (
    v_link.id,
    v_arena.id,
    v_uid,
    now(),
    jsonb_build_object(
      'link_type', 'mentoria',
      'owner_user_id', v_owner_user_id,
      'asset_id', v_arena.asset_id,
      'name', v_arena.name,
      'description', coalesce(v_arena.description, ''),
      'icon', v_arena.icon
    )
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
    'link_type', 'mentoria',
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public.share_relationship_arena(
  p_relationship_link_id uuid,
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
  v_partner_id uuid;
  v_new_gold integer;
  v_sender_nickname text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'parceria'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_PARTNERSHIP_LINK_REQUIRED';
  end if;

  select *
  into v_arena
  from public.arenas
  where id = p_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then
    raise exception 'PARTNERSHIP_SOURCE_ARENA_REQUIRED';
  end if;

  delete from public.relationship_link_arenas rla
  using public.relationship_links rl
  where rla.arena_id = v_arena.id
    and rl.id = rla.relationship_link_id
    and rl.link_type = 'parceria'
    and rl.ended_at is not null;

  if exists (
    select 1
    from public.relationship_link_arenas rla
    where rla.relationship_link_id = v_link.id
      and rla.arena_id = v_arena.id
  ) then
    raise exception 'RELATIONSHIP_ARENA_SHARE_ALREADY_EXISTS';
  end if;

  if exists (
    select 1
    from public.relationship_link_arenas rla
    join public.relationship_links rl
      on rl.id = rla.relationship_link_id
    where rla.arena_id = v_arena.id
      and not (
        rl.link_type = 'parceria'
        and rl.ended_at is not null
      )
  ) then
    raise exception 'RELATIONSHIP_ARENA_ALREADY_LINKED';
  end if;

  v_partner_id := case
    when v_link.mentor_id = v_uid then v_link.pupil_id
    else v_link.mentor_id
  end;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'partnership_linked_arena',
    format('Arena exposta em parceria: %s', trim(v_arena.name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'link_type', 'parceria',
      'arena_id', v_arena.id,
      'name', trim(v_arena.name)
    )
  );

  insert into public.relationship_link_arenas (
    relationship_link_id,
    arena_id,
    created_by_user_id,
    created_at,
    metadata
  ) values (
    v_link.id,
    v_arena.id,
    v_uid,
    now(),
    jsonb_build_object(
      'link_type', 'parceria',
      'owner_user_id', v_uid,
      'share_mode', 'live',
      'asset_id', v_arena.asset_id,
      'name', v_arena.name,
      'description', coalesce(v_arena.description, ''),
      'icon', v_arena.icon
    )
  )
  returning * into v_linked;

  select nickname
  into v_sender_nickname
  from public.user_profiles
  where id = v_uid;

  begin
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
      v_partner_id,
      'arena_access',
      format('@%s expôs "%s" na parceria. Ela ja esta disponivel na biblioteca compartilhada.', coalesce(v_sender_nickname, 'Seu parceiro'), v_arena.name),
      false,
      now(),
      jsonb_build_object(
        'relationshipLinkId', v_link.id,
        'arenaId', v_arena.id,
        'linkType', 'parceria'
      )
    );
  exception
    when others then
      null;
  end;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'link_type', 'parceria',
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public.remove_relationship_arena_share(
  p_relationship_link_id uuid,
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
  v_arena public.arenas%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'parceria'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_PARTNERSHIP_LINK_REQUIRED';
  end if;

  select *
  into v_linked
  from public.relationship_link_arenas
  where relationship_link_id = v_link.id
    and arena_id = p_arena_id
  for update;

  if not found then
    raise exception 'RELATIONSHIP_ARENA_SHARE_PERMISSION_DENIED';
  end if;

  select *
  into v_arena
  from public.arenas
  where id = p_arena_id;

  if not found then
    raise exception 'ARENA_NOT_FOUND';
  end if;

  if v_arena.user_id <> v_uid and coalesce(v_linked.created_by_user_id, v_arena.user_id) <> v_uid then
    raise exception 'RELATIONSHIP_ARENA_SHARE_PERMISSION_DENIED';
  end if;

  delete from public.relationship_link_arenas
  where id = v_linked.id;

  return jsonb_build_object(
    'success', true,
    'relationship_link_id', v_link.id,
    'arena_id', p_arena_id,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public.end_relationship_link(
  p_relationship_link_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
  for update;

  if not found then
    raise exception 'RELATIONSHIP_LINK_NOT_FOUND';
  end if;

  if v_link.ended_at is not null then
    raise exception 'RELATIONSHIP_LINK_ALREADY_ENDED';
  end if;

  if v_link.mentor_id <> v_uid and v_link.pupil_id <> v_uid then
    raise exception 'RELATIONSHIP_LINK_PERMISSION_DENIED';
  end if;

  update public.relationship_links
  set ended_at = now(),
      updated_at = now()
  where id = v_link.id;

  if v_link.link_type = 'parceria' then
    delete from public.relationship_link_arenas
    where relationship_link_id = v_link.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'link_id', v_link.id,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public.create_competition_challenge(
  p_relationship_link_id uuid,
  p_source_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_source_arena public.arenas%rowtype;
  v_source_action record;
  v_challenger_arena public.arenas%rowtype;
  v_opponent_arena public.arenas%rowtype;
  v_challenge public.relationship_competition_challenges%rowtype;
  v_opponent_id uuid;
  v_sender_nickname text;
  v_action_count integer := 0;
  v_total_planned integer := 0;
  v_new_gold integer;
  v_challenger_actions jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'competicao'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_COMPETITION_LINK_REQUIRED';
  end if;

  if (
    select count(*)
    from public.relationship_competition_challenges challenge
    where challenge.relationship_link_id = v_link.id
      and challenge.sealed_at is null
  ) >= 3 then
    raise exception 'COMPETITION_CHALLENGE_LIMIT_REACHED';
  end if;

  select *
  into v_source_arena
  from public.arenas
  where id = p_source_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then
    raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED';
  end if;

  delete from public.relationship_link_arenas rla
  using public.relationship_links rl
  where rla.arena_id = v_source_arena.id
    and rl.id = rla.relationship_link_id
    and rl.link_type = 'parceria'
    and rl.ended_at is not null;

  if exists (
    select 1
    from public.relationship_link_arenas rla
    join public.relationship_links rl
      on rl.id = rla.relationship_link_id
    where rla.arena_id = v_source_arena.id
      and not (
        rl.link_type = 'parceria'
        and rl.ended_at is not null
      )
  ) then
    raise exception 'COMPETITION_SOURCE_ARENA_LOCKED';
  end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_source_arena.id
    and coalesce(action_type, '') <> 'Livre';

  if v_action_count = 0 then
    raise exception 'COMPETITION_SOURCE_ARENA_EMPTY';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'competition_challenge',
    format('Duelo competitivo: %s', trim(v_source_arena.name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'link_type', 'competicao',
      'source_arena_id', v_source_arena.id,
      'source_name', trim(v_source_arena.name)
    )
  );

  v_opponent_id := case
    when v_link.mentor_id = v_uid then v_link.pupil_id
    else v_link.mentor_id
  end;

  insert into public.arenas (
    id,
    user_id,
    asset_id,
    name,
    description,
    icon,
    is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_uid,
    v_source_arena.asset_id,
    v_source_arena.name,
    coalesce(v_source_arena.description, ''),
    coalesce(nullif(v_source_arena.icon, ''), '🏆'),
    false
  )
  returning * into v_challenger_arena;

  insert into public.arenas (
    id,
    user_id,
    asset_id,
    name,
    description,
    icon,
    is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_opponent_id,
    v_source_arena.asset_id,
    v_source_arena.name,
    coalesce(v_source_arena.description, ''),
    coalesce(nullif(v_source_arena.icon, ''), '🏆'),
    false
  )
  returning * into v_opponent_arena;

  insert into public.relationship_competition_challenges (
    relationship_link_id,
    source_arena_id,
    challenger_user_id,
    opponent_user_id,
    challenger_arena_id,
    opponent_arena_id,
    metadata
  ) values (
    v_link.id,
    v_source_arena.id,
    v_uid,
    v_opponent_id,
    v_challenger_arena.id,
    v_opponent_arena.id,
    jsonb_build_object(
      'source_name', v_source_arena.name,
      'source_icon', coalesce(v_source_arena.icon, '🏆'),
      'source_asset_id', v_source_arena.asset_id,
      'action_count', v_action_count,
      'planned_total', v_total_planned,
      'lock_mode', 'snapshot'
    )
  )
  returning * into v_challenge;

  for v_source_action in
    select *
    from public.actions
    where arena_id = v_source_arena.id
  loop
    insert into public.actions (
      id,
      user_id,
      arena_id,
      name,
      description,
      icon,
      duration,
      repetitions,
      action_type,
      difficulty,
      briefing,
      assets,
      pre_flight,
      context,
      origin_codex_id
    ) values (
      extensions.gen_random_uuid(),
      v_uid,
      v_challenger_arena.id,
      v_source_action.name,
      v_source_action.description,
      v_source_action.icon,
      v_source_action.duration,
      v_source_action.repetitions,
      v_source_action.action_type,
      v_source_action.difficulty,
      v_source_action.briefing,
      coalesce(v_source_action.assets, '[]'::jsonb),
      coalesce(v_source_action.pre_flight, '[]'::jsonb),
      coalesce(v_source_action.context, '{}'::jsonb),
      v_source_action.origin_codex_id
    );

    insert into public.actions (
      id,
      user_id,
      arena_id,
      name,
      description,
      icon,
      duration,
      repetitions,
      action_type,
      difficulty,
      briefing,
      assets,
      pre_flight,
      context,
      origin_codex_id
    ) values (
      extensions.gen_random_uuid(),
      v_opponent_id,
      v_opponent_arena.id,
      v_source_action.name,
      v_source_action.description,
      v_source_action.icon,
      v_source_action.duration,
      v_source_action.repetitions,
      v_source_action.action_type,
      v_source_action.difficulty,
      v_source_action.briefing,
      coalesce(v_source_action.assets, '[]'::jsonb),
      coalesce(v_source_action.pre_flight, '[]'::jsonb),
      coalesce(v_source_action.context, '{}'::jsonb),
      v_source_action.origin_codex_id
    );
  end loop;

  insert into public.relationship_link_arenas (
    relationship_link_id,
    arena_id,
    created_by_user_id,
    created_at,
    metadata
  ) values
  (
    v_link.id,
    v_challenger_arena.id,
    v_uid,
    now(),
    jsonb_build_object(
      'link_type', 'competicao',
      'challenge_id', v_challenge.id,
      'source_arena_id', v_source_arena.id,
      'owner_user_id', v_uid,
      'lock_mode', 'snapshot',
      'asset_id', v_challenger_arena.asset_id,
      'name', v_challenger_arena.name,
      'description', coalesce(v_challenger_arena.description, ''),
      'icon', v_challenger_arena.icon
    )
  ),
  (
    v_link.id,
    v_opponent_arena.id,
    v_opponent_id,
    now(),
    jsonb_build_object(
      'link_type', 'competicao',
      'challenge_id', v_challenge.id,
      'source_arena_id', v_source_arena.id,
      'owner_user_id', v_opponent_id,
      'lock_mode', 'snapshot',
      'asset_id', v_opponent_arena.asset_id,
      'name', v_opponent_arena.name,
      'description', coalesce(v_opponent_arena.description, ''),
      'icon', v_opponent_arena.icon
    )
  );

  select nickname
  into v_sender_nickname
  from public.user_profiles
  where id = v_uid;

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
    v_opponent_id,
    'arena_access',
    format('@%s forjou o duelo "%s". Sua arena espelhada ja esta pronta.', coalesce(v_sender_nickname, 'Seu rival'), v_source_arena.name),
    false,
    now(),
    jsonb_build_object(
      'relationshipLinkId', v_link.id,
      'challengeId', v_challenge.id,
      'linkType', 'competicao'
    )
  );

  select coalesce(
    jsonb_agg(to_jsonb(a) order by a.name),
    '[]'::jsonb
  )
  into v_challenger_actions
  from public.actions a
  where a.arena_id = v_challenger_arena.id;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'challenge', to_jsonb(v_challenge),
    'challenger_arena', to_jsonb(v_challenger_arena),
    'opponent_arena', to_jsonb(v_opponent_arena),
    'challenger_actions', v_challenger_actions
  );
end;
$$;

create or replace function public.resolve_competition_challenge_outcome(
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_challenge public.relationship_competition_challenges%rowtype;
  v_progress jsonb;
  v_is_cleared boolean := false;
  v_total_planned integer := 0;
  v_action_count integer := 0;
  v_reward_chest_type varchar(30);
  v_winner_bonus_xp integer := 0;
  v_opponent_id uuid;
  v_opponent_nickname text;
  v_winner_nickname text;
  v_challenge_name text;
  v_sealed_now boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'status', 'auth_required');
  end if;

  select *
  into v_challenge
  from public.relationship_competition_challenges challenge
  where (
      challenge.challenger_user_id = v_uid
      and challenge.challenger_arena_id = p_arena_id
    ) or (
      challenge.opponent_user_id = v_uid
      and challenge.opponent_arena_id = p_arena_id
    )
  order by challenge.created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', true, 'status', 'not_found');
  end if;

  v_challenge_name := coalesce(v_challenge.metadata->>'source_name', 'esse duelo');

  v_progress := public._competition_compute_arena_progress(p_arena_id);
  v_is_cleared := coalesce((v_progress->>'is_cleared')::boolean, false);
  v_total_planned := coalesce((v_progress->>'total_planned')::integer, 0);
  v_action_count := coalesce((v_progress->>'action_count')::integer, 0);

  if not v_is_cleared then
    if v_challenge.winner_user_id is not null and v_challenge.winner_user_id <> v_uid then
      select nickname
      into v_winner_nickname
      from public.user_profiles
      where id::text = v_challenge.winner_user_id::text;

      return jsonb_build_object(
        'success', true,
        'status', 'already_lost',
        'winner_user_id', v_challenge.winner_user_id,
        'reward_chest_type', v_challenge.reward_chest_type,
        'winner_bonus_xp', coalesce(v_challenge.winner_bonus_xp, 0),
        'opponent_nickname', coalesce(v_winner_nickname, 'seu rival'),
        'challenge_name', v_challenge_name,
        'reward_granted_now', false,
        'sealed_now', false
      );
    end if;

    return jsonb_build_object(
      'success', true,
      'status', 'in_progress',
      'challenge_name', v_challenge_name
    );
  end if;

  if v_challenge.challenger_user_id = v_uid then
    update public.relationship_competition_challenges
    set challenger_completed_at = coalesce(challenger_completed_at, now())
    where id = v_challenge.id
    returning * into v_challenge;
    v_opponent_id := v_challenge.opponent_user_id;
  else
    update public.relationship_competition_challenges
    set opponent_completed_at = coalesce(opponent_completed_at, now())
    where id = v_challenge.id
    returning * into v_challenge;
    v_opponent_id := v_challenge.challenger_user_id;
  end if;

  v_reward_chest_type := case
    when v_total_planned >= 6 or v_action_count >= 4 then 'Incomum'
    else 'Comum'
  end;
  v_winner_bonus_xp := public._competition_calculate_bonus_xp(v_total_planned, v_action_count);

  if v_challenge.winner_user_id is null then
    update public.relationship_competition_challenges
    set winner_user_id = v_uid,
        winner_arena_id = p_arena_id,
        reward_chest_type = v_reward_chest_type,
        winner_bonus_xp = v_winner_bonus_xp,
        reward_granted_at = now(),
        completed_at = now()
    where id = v_challenge.id
      and winner_user_id is null
    returning * into v_challenge;

    perform public._competition_grant_chest(v_uid, v_reward_chest_type);

    select nickname into v_opponent_nickname
    from public.user_profiles
    where id::text = v_opponent_id::text;

    select nickname into v_winner_nickname
    from public.user_profiles
    where id::text = v_uid::text;

    begin
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
        v_opponent_id,
        'competition_result',
        format('@%s concluiu "%s" antes de voce. Voce ainda pode fechar sua arena, mas sem o bonus extra.', coalesce(v_winner_nickname, 'Seu rival'), v_challenge_name),
        false,
        now(),
        jsonb_build_object(
          'challengeId', v_challenge.id,
          'winnerUserId', v_uid,
          'rewardChestType', v_reward_chest_type,
          'winnerBonusXp', v_winner_bonus_xp,
          'linkType', 'competicao'
        )
      );

      update public.relationship_competition_challenges
      set loser_notified_at = now()
      where id = v_challenge.id;
    exception
      when others then
        null;
    end;

    return jsonb_build_object(
      'success', true,
      'status', 'winner',
      'winner_user_id', v_uid,
      'reward_chest_type', v_reward_chest_type,
      'winner_bonus_xp', v_winner_bonus_xp,
      'opponent_nickname', coalesce(v_opponent_nickname, 'seu rival'),
      'challenge_name', v_challenge_name,
      'reward_granted_now', true,
      'sealed_now', false
    );
  end if;

  if v_challenge.challenger_completed_at is not null
     and v_challenge.opponent_completed_at is not null
     and v_challenge.sealed_at is null then
    perform set_config('app.relationship_competition_admin', '1', true);

    update public.arenas
    set is_archived = true
    where id in (v_challenge.challenger_arena_id, v_challenge.opponent_arena_id)
      and coalesce(is_archived, false) = false;

    update public.relationship_competition_challenges
    set sealed_at = now()
    where id = v_challenge.id
      and sealed_at is null
    returning * into v_challenge;

    v_sealed_now := found;
  end if;

  select nickname into v_opponent_nickname
  from public.user_profiles
  where id::text = v_opponent_id::text;

  return jsonb_build_object(
    'success', true,
    'status', case when v_challenge.winner_user_id = v_uid then 'already_won' else 'sealed_after_loss' end,
    'winner_user_id', v_challenge.winner_user_id,
    'reward_chest_type', v_challenge.reward_chest_type,
    'winner_bonus_xp', coalesce(v_challenge.winner_bonus_xp, 0),
    'opponent_nickname', coalesce(v_opponent_nickname, 'seu rival'),
    'challenge_name', v_challenge_name,
    'reward_granted_now', false,
    'sealed_now', v_sealed_now
  );
end;
$$;

revoke all on function public.create_linked_relationship_arena(uuid, text, text, text, text) from public;
grant execute on function public.create_linked_relationship_arena(uuid, text, text, text, text) to authenticated;

revoke all on function public.share_relationship_arena(uuid, uuid) from public;
grant execute on function public.share_relationship_arena(uuid, uuid) to authenticated;

revoke all on function public.remove_relationship_arena_share(uuid, uuid) from public;
grant execute on function public.remove_relationship_arena_share(uuid, uuid) to authenticated;

revoke all on function public.end_relationship_link(uuid) from public;
grant execute on function public.end_relationship_link(uuid) to authenticated;

grant execute on function public.create_competition_challenge(uuid, uuid) to authenticated;
grant execute on function public.resolve_competition_challenge_outcome(uuid) to authenticated;

commit;
