begin;

create table if not exists public.relationship_competition_challenges (
  id uuid primary key default extensions.gen_random_uuid(),
  relationship_link_id uuid not null references public.relationship_links(id) on delete cascade,
  source_arena_id uuid references public.arenas(id) on delete set null,
  challenger_user_id uuid not null references auth.users(id) on delete cascade,
  opponent_user_id uuid not null references auth.users(id) on delete cascade,
  challenger_arena_id uuid not null references public.arenas(id) on delete cascade,
  opponent_arena_id uuid not null references public.arenas(id) on delete cascade,
  winner_user_id uuid references auth.users(id) on delete set null,
  winner_arena_id uuid references public.arenas(id) on delete set null,
  reward_chest_type varchar(30),
  reward_granted_at timestamptz,
  loser_notified_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists relationship_competition_challenges_link_idx
  on public.relationship_competition_challenges (relationship_link_id, created_at desc);

create unique index if not exists relationship_competition_challenges_active_link_idx
  on public.relationship_competition_challenges (relationship_link_id)
  where completed_at is null;

alter table public.relationship_competition_challenges enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'relationship_competition_challenges'
      and policyname = 'Competition participants can read challenges'
  ) then
    create policy "Competition participants can read challenges"
    on public.relationship_competition_challenges
    for select
    using (
      exists (
        select 1
        from public.relationship_links rl
        where rl.id = relationship_competition_challenges.relationship_link_id
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

grant select on public.relationship_competition_challenges to authenticated;

create or replace function public._competition_compute_arena_progress(
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_total_planned integer := 0;
  v_total_completed integer := 0;
  v_action_count integer := 0;
begin
  with action_totals as (
    select
      a.id,
      greatest(1, coalesce(a.repetitions, 1)) as planned,
      (
        select count(*)
        from public.scheduled_tasks st
        where st.action_id = a.id::text
          and coalesce(st.completed, false) = true
      ) as completed
    from public.actions a
    where a.arena_id = p_arena_id
      and coalesce(a.action_type, '') <> 'Livre'
  )
  select
    coalesce(sum(planned), 0),
    coalesce(sum(completed), 0),
    count(*)
  into
    v_total_planned,
    v_total_completed,
    v_action_count
  from action_totals;

  return jsonb_build_object(
    'total_planned', v_total_planned,
    'total_completed', v_total_completed,
    'action_count', v_action_count,
    'is_cleared', v_action_count > 0 and v_total_completed >= v_total_planned
  );
end;
$$;

create or replace function public._competition_grant_chest(
  p_user_id uuid,
  p_chest_type varchar
)
returns void
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_used_grant_chest boolean := false;
begin
  if p_user_id is null or coalesce(trim(p_chest_type), '') = '' then
    return;
  end if;

  begin
    perform public.grant_chest(p_user_id, p_chest_type);
    v_used_grant_chest := true;
  exception
    when undefined_function then
      null;
  end;

  if not v_used_grant_chest then
    insert into public.user_chests (
      user_id,
      chest_type,
      is_opened,
      earned_at
    ) values (
      p_user_id,
      p_chest_type,
      false,
      now()
    );
  end if;

  with chest_counts as (
    select chest_type, count(*) as count
    from public.user_chests
    where user_id::text = p_user_id::text
      and is_opened = false
    group by chest_type
  ), chest_json as (
    select coalesce(
      jsonb_agg(jsonb_build_object('type', chest_type, 'count', count) order by chest_type),
      '[]'::jsonb
    ) as chests_data
    from chest_counts
  )
  update public.user_profiles up
  set chests = chest_json.chests_data
  from chest_json
  where up.id::text = p_user_id::text;
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

  if exists (
    select 1
    from public.relationship_competition_challenges challenge
    where challenge.relationship_link_id = v_link.id
      and challenge.completed_at is null
  ) then
    raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE';
  end if;

  select *
  into v_source_arena
  from public.arenas
  where id = p_source_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false;

  if not found then
    raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED';
  end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_source_arena.id
    and coalesce(action_type, '') <> 'Livre';

  if v_action_count = 0 then
    raise exception 'COMPETITION_SOURCE_ARENA_EMPTY';
  end if;

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
      'action_count', v_action_count,
      'planned_total', v_total_planned
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
      'asset_id', v_challenger_arena.asset_id,
      'name', v_challenger_arena.name,
      'description', coalesce(v_challenger_arena.description, ''),
      'icon', v_challenger_arena.icon,
      'owner_user_id', v_uid
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
      'asset_id', v_opponent_arena.asset_id,
      'name', v_opponent_arena.name,
      'description', coalesce(v_opponent_arena.description, ''),
      'icon', v_opponent_arena.icon,
      'owner_user_id', v_opponent_id
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
    format('@%s lancou o desafio "%s". Sua arena espelhada ja esta pronta.', coalesce(v_sender_nickname, 'Seu rival'), v_source_arena.name),
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
    'challenge', to_jsonb(v_challenge),
    'challenger_arena', to_jsonb(v_challenger_arena),
    'opponent_arena', to_jsonb(v_opponent_arena),
    'challenger_actions', v_challenger_actions
  );
end;
$$;

grant execute on function public.create_competition_challenge(uuid, uuid) to authenticated;

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
  v_opponent_id uuid;
  v_opponent_nickname text;
  v_winner_nickname text;
  v_challenge_name text;
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

  if v_challenge.winner_user_id is not null then
    select nickname into v_winner_nickname
    from public.user_profiles
    where id::text = v_challenge.winner_user_id::text;

    return jsonb_build_object(
      'success', true,
      'status', case when v_challenge.winner_user_id = v_uid then 'already_won' else 'already_lost' end,
      'winner_user_id', v_challenge.winner_user_id,
      'reward_chest_type', v_challenge.reward_chest_type,
      'opponent_nickname', coalesce(v_winner_nickname, 'seu rival'),
      'challenge_name', v_challenge_name,
      'reward_granted_now', false
    );
  end if;

  v_progress := public._competition_compute_arena_progress(p_arena_id);
  v_is_cleared := coalesce((v_progress->>'is_cleared')::boolean, false);
  v_total_planned := coalesce((v_progress->>'total_planned')::integer, 0);
  v_action_count := coalesce((v_progress->>'action_count')::integer, 0);

  if not v_is_cleared then
    return jsonb_build_object(
      'success', true,
      'status', 'in_progress',
      'challenge_name', v_challenge_name
    );
  end if;

  v_reward_chest_type := case
    when v_total_planned >= 6 or v_action_count >= 4 then 'Incomum'
    else 'Comum'
  end;

  v_opponent_id := case
    when v_challenge.challenger_user_id = v_uid then v_challenge.opponent_user_id
    else v_challenge.challenger_user_id
  end;

  update public.relationship_competition_challenges
  set winner_user_id = v_uid,
      winner_arena_id = p_arena_id,
      reward_chest_type = v_reward_chest_type,
      reward_granted_at = now(),
      completed_at = now()
  where id = v_challenge.id
    and winner_user_id is null;

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
      format('@%s concluiu "%s" antes de voce. Essa corrida nao entrega bau na sua chegada.', coalesce(v_winner_nickname, 'Seu rival'), v_challenge_name),
      false,
      now(),
      jsonb_build_object(
        'challengeId', v_challenge.id,
        'winnerUserId', v_uid,
        'rewardChestType', v_reward_chest_type,
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
    'opponent_nickname', coalesce(v_opponent_nickname, 'seu rival'),
    'challenge_name', v_challenge_name,
    'reward_granted_now', true
  );
end;
$$;

grant execute on function public.resolve_competition_challenge_outcome(uuid) to authenticated;

commit;
