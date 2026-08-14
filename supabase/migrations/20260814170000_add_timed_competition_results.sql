begin;

alter table public.scheduled_tasks
  add column if not exists completed_at timestamptz;

create or replace function public.set_scheduled_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.completed, false) then
    if tg_op = 'INSERT' then
      new.completed_at := coalesce(new.completed_at, now());
    elsif not coalesce(old.completed, false) or new.completed_at is null then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists scheduled_tasks_completed_at_trigger on public.scheduled_tasks;
create trigger scheduled_tasks_completed_at_trigger
before insert or update of completed on public.scheduled_tasks
for each row execute function public.set_scheduled_task_completed_at();

update public.scheduled_tasks
set completed_at = coalesce(
  completed_at,
  (date::text || ' 23:59:59')::timestamp at time zone 'America/Sao_Paulo'
)
where coalesce(completed, false) = true
  and completed_at is null;

alter table public.relationship_competition_challenges
  add column if not exists duration_days integer,
  add column if not exists starts_at timestamptz,
  add column if not exists deadline_at timestamptz,
  add column if not exists result_kind text;

alter table public.relationship_competition_challenges
  drop constraint if exists relationship_competition_duration_days_check;
alter table public.relationship_competition_challenges
  add constraint relationship_competition_duration_days_check
  check (duration_days is null or duration_days between 1 and 30);

create index if not exists relationship_competition_due_idx
  on public.relationship_competition_challenges (deadline_at)
  where completed_at is null and deadline_at is not null;

create or replace function public._competition_compute_arena_progress_at(
  p_arena_id uuid,
  p_cutoff timestamptz default null
)
returns jsonb
language sql
security definer
set search_path = public, auth
as $$
  with action_totals as (
    select
      a.id,
      greatest(1, coalesce(a.repetitions, 1)) as planned,
      (
        select count(*)
        from public.scheduled_tasks st
        where st.action_id = a.id::text
          and coalesce(st.completed, false) = true
          and (p_cutoff is null or st.completed_at <= p_cutoff)
      ) as completed
    from public.actions a
    where a.arena_id = p_arena_id
      and coalesce(a.action_type, '') <> 'Livre'
  ), totals as (
    select
      coalesce(sum(planned), 0)::integer as total_planned,
      coalesce(sum(completed), 0)::integer as total_completed,
      count(*)::integer as action_count
    from action_totals
  )
  select jsonb_build_object(
    'total_planned', total_planned,
    'total_completed', least(total_completed, total_planned),
    'action_count', action_count,
    'is_cleared', action_count > 0 and total_completed >= total_planned
  )
  from totals;
$$;

create or replace function public._competition_grant_bonus_xp(
  p_user_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_new_exp integer := 0;
begin
  if p_user_id is null or coalesce(p_amount, 0) <= 0 then
    return 0;
  end if;

  update public.user_profiles
  set nobility = jsonb_set(
    coalesce(nobility, '{}'::jsonb),
    '{exp}',
    to_jsonb(coalesce((nobility ->> 'exp')::integer, 0) + p_amount),
    true
  )
  where id = p_user_id
  returning coalesce((nobility ->> 'exp')::integer, 0) into v_new_exp;

  return coalesce(v_new_exp, 0);
end;
$$;

create or replace function public._competition_finalize_challenge(
  p_challenge_id uuid,
  p_reason text default 'deadline'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
set row_security = off
as $$
declare
  v_challenge public.relationship_competition_challenges%rowtype;
  v_challenger_progress jsonb;
  v_opponent_progress jsonb;
  v_challenger_done integer := 0;
  v_opponent_done integer := 0;
  v_challenger_target integer := 0;
  v_opponent_target integer := 0;
  v_challenger_cleared boolean := false;
  v_opponent_cleared boolean := false;
  v_winner_id uuid := null;
  v_winner_arena_id uuid := null;
  v_result_kind text := 'draw';
  v_reward_eligible boolean := true;
  v_reward_chest_type varchar(30) := null;
  v_winner_bonus_xp integer := 0;
  v_winner_new_exp integer := 0;
  v_action_count integer := 0;
  v_total_planned integer := 0;
  v_challenger_nickname text;
  v_opponent_nickname text;
  v_challenge_name text;
  v_cutoff timestamptz;
begin
  select * into v_challenge
  from public.relationship_competition_challenges
  where id = p_challenge_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'status', 'not_found');
  end if;

  if v_challenge.completed_at is not null and v_challenge.sealed_at is not null then
    return jsonb_build_object(
      'success', true,
      'status', 'already_finalized',
      'finalized_now', false,
      'result_kind', coalesce(v_challenge.result_kind, case when v_challenge.winner_user_id is null then 'draw' else 'winner' end),
      'winner_user_id', v_challenge.winner_user_id,
      'reward_chest_type', v_challenge.reward_chest_type,
      'winner_bonus_xp', coalesce(v_challenge.winner_bonus_xp, 0),
      'challenge', to_jsonb(v_challenge)
    );
  end if;

  v_cutoff := case
    when v_challenge.deadline_at is not null and (p_reason = 'deadline' or now() >= v_challenge.deadline_at)
      then v_challenge.deadline_at
    else null
  end;

  v_challenger_progress := public._competition_compute_arena_progress_at(v_challenge.challenger_arena_id, v_cutoff);
  v_opponent_progress := public._competition_compute_arena_progress_at(v_challenge.opponent_arena_id, v_cutoff);
  v_challenger_done := coalesce((v_challenger_progress ->> 'total_completed')::integer, 0);
  v_opponent_done := coalesce((v_opponent_progress ->> 'total_completed')::integer, 0);
  v_challenger_target := coalesce((v_challenger_progress ->> 'total_planned')::integer, 0);
  v_opponent_target := coalesce((v_opponent_progress ->> 'total_planned')::integer, 0);
  v_challenger_cleared := coalesce((v_challenger_progress ->> 'is_cleared')::boolean, false);
  v_opponent_cleared := coalesce((v_opponent_progress ->> 'is_cleared')::boolean, false);

  if p_reason <> 'deadline'
     and (v_challenge.deadline_at is null or now() < v_challenge.deadline_at) then
    if not v_challenger_cleared and not v_opponent_cleared then
      return jsonb_build_object('success', true, 'status', 'in_progress', 'finalized_now', false);
    end if;

    if v_challenger_cleared and v_opponent_cleared then
      if v_challenge.challenger_completed_at is not null
         and v_challenge.opponent_completed_at is not null
         and v_challenge.challenger_completed_at = v_challenge.opponent_completed_at then
        v_result_kind := 'draw';
      elsif v_challenge.opponent_completed_at is null
         or (v_challenge.challenger_completed_at is not null
             and v_challenge.challenger_completed_at < v_challenge.opponent_completed_at) then
        v_winner_id := v_challenge.challenger_user_id;
        v_winner_arena_id := v_challenge.challenger_arena_id;
        v_result_kind := 'winner';
      else
        v_winner_id := v_challenge.opponent_user_id;
        v_winner_arena_id := v_challenge.opponent_arena_id;
        v_result_kind := 'winner';
      end if;
    elsif v_challenger_cleared then
      v_winner_id := v_challenge.challenger_user_id;
      v_winner_arena_id := v_challenge.challenger_arena_id;
      v_result_kind := 'winner';
    else
      v_winner_id := v_challenge.opponent_user_id;
      v_winner_arena_id := v_challenge.opponent_arena_id;
      v_result_kind := 'winner';
    end if;
  else
    if v_challenger_target > 0 and v_opponent_target > 0 then
      if (v_challenger_done::bigint * v_opponent_target::bigint) > (v_opponent_done::bigint * v_challenger_target::bigint) then
        v_winner_id := v_challenge.challenger_user_id;
        v_winner_arena_id := v_challenge.challenger_arena_id;
        v_result_kind := 'winner';
      elsif (v_opponent_done::bigint * v_challenger_target::bigint) > (v_challenger_done::bigint * v_opponent_target::bigint) then
        v_winner_id := v_challenge.opponent_user_id;
        v_winner_arena_id := v_challenge.opponent_arena_id;
        v_result_kind := 'winner';
      end if;
    end if;
  end if;

  v_action_count := coalesce((v_challenger_progress ->> 'action_count')::integer, 0);
  v_total_planned := v_challenger_target;
  v_reward_eligible := coalesce((v_challenge.metadata ->> 'reward_eligible')::boolean, true);

  if v_winner_id is not null and v_reward_eligible then
    v_reward_chest_type := case
      when v_total_planned >= 6 or v_action_count >= 4 then 'Incomum'
      else 'Comum'
    end;
    v_winner_bonus_xp := public._competition_calculate_bonus_xp(v_total_planned, v_action_count);
    perform public._competition_grant_chest(v_winner_id, v_reward_chest_type);
    v_winner_new_exp := public._competition_grant_bonus_xp(v_winner_id, v_winner_bonus_xp);
  end if;

  perform set_config('app.relationship_competition_admin', '1', true);
  update public.arenas
  set is_archived = true
  where id in (v_challenge.challenger_arena_id, v_challenge.opponent_arena_id)
    and coalesce(is_archived, false) = false;

  update public.relationship_competition_challenges
  set winner_user_id = v_winner_id,
      winner_arena_id = v_winner_arena_id,
      reward_chest_type = v_reward_chest_type,
      winner_bonus_xp = v_winner_bonus_xp,
      reward_granted_at = case when v_winner_id is not null and v_reward_eligible then now() else null end,
      completed_at = now(),
      sealed_at = now(),
      result_kind = v_result_kind,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'result_kind', v_result_kind,
        'final_reason', p_reason,
        'challenger_completed', v_challenger_done,
        'challenger_target', v_challenger_target,
        'opponent_completed', v_opponent_done,
        'opponent_target', v_opponent_target
      )
  where id = v_challenge.id
  returning * into v_challenge;

  select nickname into v_challenger_nickname from public.user_profiles where id = v_challenge.challenger_user_id;
  select nickname into v_opponent_nickname from public.user_profiles where id = v_challenge.opponent_user_id;
  v_challenge_name := coalesce(v_challenge.metadata ->> 'source_name', 'Desafio');

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values
  (
    extensions.gen_random_uuid(), v_challenge.challenger_user_id, 'competition_result',
    case
      when v_result_kind = 'draw' then format('O desafio "%s" terminou empatado.', v_challenge_name)
      when v_winner_id = v_challenge.challenger_user_id then format('Voce venceu o desafio "%s".', v_challenge_name)
      else format('@%s venceu o desafio "%s".', coalesce(v_opponent_nickname, 'Seu rival'), v_challenge_name)
    end,
    false, now(),
    jsonb_build_object(
      'challengeId', v_challenge.id, 'resultKind', v_result_kind,
      'winnerUserId', v_winner_id, 'challengeName', v_challenge_name,
      'selfCompleted', v_challenger_done, 'selfTarget', v_challenger_target,
      'rivalCompleted', v_opponent_done, 'rivalTarget', v_opponent_target,
      'opponentNickname', coalesce(v_opponent_nickname, 'seu rival'),
      'rewardChestType', case when v_winner_id = v_challenge.challenger_user_id then v_reward_chest_type else null end,
      'winnerBonusXp', case when v_winner_id = v_challenge.challenger_user_id then v_winner_bonus_xp else 0 end,
      'linkType', 'competicao'
    )
  ),
  (
    extensions.gen_random_uuid(), v_challenge.opponent_user_id, 'competition_result',
    case
      when v_result_kind = 'draw' then format('O desafio "%s" terminou empatado.', v_challenge_name)
      when v_winner_id = v_challenge.opponent_user_id then format('Voce venceu o desafio "%s".', v_challenge_name)
      else format('@%s venceu o desafio "%s".', coalesce(v_challenger_nickname, 'Seu rival'), v_challenge_name)
    end,
    false, now(),
    jsonb_build_object(
      'challengeId', v_challenge.id, 'resultKind', v_result_kind,
      'winnerUserId', v_winner_id, 'challengeName', v_challenge_name,
      'selfCompleted', v_opponent_done, 'selfTarget', v_opponent_target,
      'rivalCompleted', v_challenger_done, 'rivalTarget', v_challenger_target,
      'opponentNickname', coalesce(v_challenger_nickname, 'seu rival'),
      'rewardChestType', case when v_winner_id = v_challenge.opponent_user_id then v_reward_chest_type else null end,
      'winnerBonusXp', case when v_winner_id = v_challenge.opponent_user_id then v_winner_bonus_xp else 0 end,
      'linkType', 'competicao'
    )
  );

  return jsonb_build_object(
    'success', true,
    'status', 'finalized',
    'finalized_now', true,
    'result_kind', v_result_kind,
    'winner_user_id', v_winner_id,
    'reward_chest_type', v_reward_chest_type,
    'winner_bonus_xp', v_winner_bonus_xp,
    'winner_new_exp', v_winner_new_exp,
    'challenger_progress', v_challenger_progress,
    'opponent_progress', v_opponent_progress,
    'challenge', to_jsonb(v_challenge)
  );
end;
$$;

create or replace function public._create_competition_snapshot_from_invite(
  p_relationship_link_id uuid,
  p_source_arena_id uuid,
  p_challenger_id uuid,
  p_opponent_id uuid,
  p_duration_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_source public.arenas%rowtype;
  v_challenger_arena public.arenas%rowtype;
  v_opponent_arena public.arenas%rowtype;
  v_challenge public.relationship_competition_challenges%rowtype;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  if coalesce(p_duration_days, 0) not between 1 and 30 then
    raise exception 'COMPETITION_DURATION_INVALID';
  end if;

  select * into v_source
  from public.arenas
  where id = p_source_arena_id
    and user_id = p_challenger_id
    and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_source.id and coalesce(action_type, '') <> 'Livre';
  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  insert into public.arenas (id, user_id, asset_id, name, description, icon, is_archived)
  values (extensions.gen_random_uuid(), p_challenger_id, v_source.asset_id, v_source.name,
          coalesce(v_source.description, ''), coalesce(nullif(v_source.icon, ''), 'T'), false)
  returning * into v_challenger_arena;

  insert into public.arenas (id, user_id, asset_id, name, description, icon, is_archived)
  values (extensions.gen_random_uuid(), p_opponent_id, v_source.asset_id, v_source.name,
          coalesce(v_source.description, ''), coalesce(nullif(v_source.icon, ''), 'T'), false)
  returning * into v_opponent_arena;

  insert into public.relationship_competition_challenges (
    relationship_link_id, source_arena_id, challenger_user_id, opponent_user_id,
    challenger_arena_id, opponent_arena_id, duration_days, starts_at, deadline_at, metadata
  ) values (
    p_relationship_link_id, v_source.id, p_challenger_id, p_opponent_id,
    v_challenger_arena.id, v_opponent_arena.id, p_duration_days, now(),
    now() + make_interval(days => p_duration_days),
    jsonb_build_object(
      'source_name', v_source.name, 'source_icon', coalesce(v_source.icon, 'T'),
      'source_asset_id', v_source.asset_id, 'action_count', v_action_count,
      'planned_total', v_total_planned, 'lock_mode', 'snapshot',
      'created_from_invite', true, 'reward_eligible', true
    )
  ) returning * into v_challenge;

  insert into public.actions (
    id, user_id, arena_id, name, description, icon, duration, repetitions,
    action_type, difficulty, briefing, assets, pre_flight, context, origin_codex_id
  )
  select extensions.gen_random_uuid(), p_challenger_id, v_challenger_arena.id,
         name, description, icon, duration, repetitions, action_type, difficulty,
         briefing, coalesce(assets, '[]'::jsonb), coalesce(pre_flight, '[]'::jsonb),
         coalesce(context, '{}'::jsonb), origin_codex_id
  from public.actions where arena_id = v_source.id;

  insert into public.actions (
    id, user_id, arena_id, name, description, icon, duration, repetitions,
    action_type, difficulty, briefing, assets, pre_flight, context, origin_codex_id
  )
  select extensions.gen_random_uuid(), p_opponent_id, v_opponent_arena.id,
         name, description, icon, duration, repetitions, action_type, difficulty,
         briefing, coalesce(assets, '[]'::jsonb), coalesce(pre_flight, '[]'::jsonb),
         coalesce(context, '{}'::jsonb), origin_codex_id
  from public.actions where arena_id = v_source.id;

  insert into public.relationship_link_arenas (
    relationship_link_id, arena_id, created_by_user_id, created_at, metadata
  ) values
  (p_relationship_link_id, v_challenger_arena.id, p_challenger_id, now(),
    jsonb_build_object('link_type', 'competicao', 'challenge_id', v_challenge.id,
      'owner_user_id', p_challenger_id, 'lock_mode', 'snapshot',
      'asset_id', v_source.asset_id, 'name', v_source.name, 'icon', v_source.icon)),
  (p_relationship_link_id, v_opponent_arena.id, p_opponent_id, now(),
    jsonb_build_object('link_type', 'competicao', 'challenge_id', v_challenge.id,
      'owner_user_id', p_opponent_id, 'lock_mode', 'snapshot',
      'asset_id', v_source.asset_id, 'name', v_source.name, 'icon', v_source.icon));

  return jsonb_build_object('challenge', to_jsonb(v_challenge));
end;
$$;

drop function if exists public.create_competition_invite(uuid, uuid);
create or replace function public.create_competition_invite(
  p_recipient_id uuid,
  p_source_arena_id uuid,
  p_duration_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_arena public.arenas%rowtype;
  v_invite public.relationship_link_invites%rowtype;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then raise exception 'INVALID_RECIPIENT'; end if;
  if coalesce(p_duration_days, 0) not between 1 and 30 then raise exception 'COMPETITION_DURATION_INVALID'; end if;

  select * into v_profile from public.user_profiles where id = v_uid;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select * into v_arena from public.arenas
  where id = p_source_arena_id and user_id = v_uid and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_arena.id and coalesce(action_type, '') <> 'Livre';
  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  if exists (
    select 1 from public.relationship_link_invites
    where link_type = 'competicao' and status = 'pending'
      and ((sender_id = v_uid and recipient_id = p_recipient_id)
        or (sender_id = p_recipient_id and recipient_id = v_uid))
  ) then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;

  if exists (
    select 1
    from public.relationship_competition_challenges challenge
    where challenge.completed_at is null
      and ((challenge.challenger_user_id = v_uid and challenge.opponent_user_id = p_recipient_id)
        or (challenge.challenger_user_id = p_recipient_id and challenge.opponent_user_id = v_uid))
  ) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;

  if exists (
    select 1 from public.relationship_competition_challenges
    where reward_granted_at > now() - interval '7 days'
      and ((challenger_user_id = v_uid and opponent_user_id = p_recipient_id)
        or (challenger_user_id = p_recipient_id and opponent_user_id = v_uid))
  ) then raise exception 'COMPETITION_REWARD_COOLDOWN'; end if;

  insert into public.relationship_link_invites (
    sender_id, recipient_id, link_type, arena_id, arena_snapshot, status,
    cost_gold, refunded_at, expires_at
  ) values (
    v_uid, p_recipient_id, 'competicao', v_arena.id,
    jsonb_build_object(
      'name', v_arena.name, 'icon', v_arena.icon, 'actionCount', v_action_count,
      'plannedTotal', v_total_planned, 'durationDays', p_duration_days,
      'rewardChestType', case when v_total_planned >= 6 or v_action_count >= 4 then 'Incomum' else 'Comum' end,
      'rewardXp', public._competition_calculate_bonus_xp(v_total_planned, v_action_count)
    ),
    'pending', 0, null, now() + interval '7 days'
  ) returning * into v_invite;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), p_recipient_id, 'arena_access',
    format('@%s desafiou voce em "%s" por %s dia(s).', coalesce(v_profile.nickname, 'Um aliado'), v_arena.name, p_duration_days),
    false, now(),
    jsonb_build_object('inviteId', v_invite.id, 'senderId', v_uid, 'linkType', 'competicao',
      'arenaId', v_arena.id, 'durationDays', p_duration_days)
  );

  return jsonb_build_object('success', true, 'invite', to_jsonb(v_invite));
end;
$$;

create or replace function public.respond_relationship_link_invite(
  p_invite_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.relationship_link_invites%rowtype;
  v_link public.relationship_links%rowtype;
  v_source_arena public.arenas%rowtype;
  v_new_gold integer := 0;
  v_competition jsonb := null;
  v_duration_days integer := 7;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_action, '') not in ('accept', 'decline', 'revoke') then raise exception 'RELATIONSHIP_INVITE_ACTION_INVALID'; end if;

  select * into v_invite from public.relationship_link_invites where id = p_invite_id for update;
  if not found then raise exception 'RELATIONSHIP_INVITE_NOT_FOUND'; end if;
  if v_invite.status <> 'pending' then raise exception 'RELATIONSHIP_INVITE_NOT_PENDING'; end if;

  if p_action = 'accept' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
    if v_invite.expires_at is not null and v_invite.expires_at <= now() then raise exception 'RELATIONSHIP_INVITE_EXPIRED'; end if;

    perform pg_advisory_xact_lock(hashtextextended(concat_ws(':', v_invite.link_type,
      least(v_invite.sender_id::text, v_invite.recipient_id::text),
      greatest(v_invite.sender_id::text, v_invite.recipient_id::text)), 0));

    select * into v_link
    from public.relationship_links rl
    where rl.link_type = v_invite.link_type and rl.ended_at is null
      and ((rl.mentor_id = v_invite.sender_id and rl.pupil_id = v_invite.recipient_id)
        or (rl.mentor_id = v_invite.recipient_id and rl.pupil_id = v_invite.sender_id))
    limit 1
    for update;

    if found and v_invite.link_type <> 'competicao' then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;

    if not found then
      insert into public.relationship_links (
        mentor_id, pupil_id, link_type, arena_id, arena_snapshot, satisfaction_level
      ) values (
        v_invite.sender_id, v_invite.recipient_id, v_invite.link_type,
        v_invite.arena_id, v_invite.arena_snapshot, 50
      ) returning * into v_link;
    end if;

    if v_invite.link_type = 'competicao' then
      if v_invite.arena_id is null then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;
      v_duration_days := greatest(1, least(30, coalesce((v_invite.arena_snapshot ->> 'durationDays')::integer, 7)));

      if exists (
        select 1
        from public.relationship_competition_challenges challenge
        where challenge.completed_at is null
          and ((challenge.challenger_user_id = v_invite.sender_id and challenge.opponent_user_id = v_invite.recipient_id)
            or (challenge.challenger_user_id = v_invite.recipient_id and challenge.opponent_user_id = v_invite.sender_id))
      ) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;

      if exists (
        select 1
        from public.relationship_competition_challenges challenge
        where challenge.reward_granted_at > now() - interval '7 days'
          and ((challenge.challenger_user_id = v_invite.sender_id and challenge.opponent_user_id = v_invite.recipient_id)
            or (challenge.challenger_user_id = v_invite.recipient_id and challenge.opponent_user_id = v_invite.sender_id))
      ) then raise exception 'COMPETITION_REWARD_COOLDOWN'; end if;

      select * into v_source_arena
      from public.arenas
      where id = v_invite.arena_id
        and user_id = v_invite.sender_id
        and coalesce(is_archived, false) = false
      for update;
      if not found then raise exception 'COMPETITION_SOURCE_CHANGED'; end if;

      select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
      into v_action_count, v_total_planned
      from public.actions
      where arena_id = v_source_arena.id and coalesce(action_type, '') <> 'Livre';

      if v_source_arena.name is distinct from (v_invite.arena_snapshot ->> 'name')
        or v_action_count is distinct from coalesce((v_invite.arena_snapshot ->> 'actionCount')::integer, -1)
        or v_total_planned is distinct from coalesce((v_invite.arena_snapshot ->> 'plannedTotal')::integer, -1)
      then
        raise exception 'COMPETITION_SOURCE_CHANGED';
      end if;

      if coalesce(v_invite.cost_gold, 0) <= 0 then
        begin
          v_new_gold := public._codex_debit_gold(
            v_invite.sender_id, 50, 'competition_challenge',
            format('Desafio: %s', coalesce(v_invite.arena_snapshot ->> 'name', 'Arena')),
            jsonb_build_object('invite_id', v_invite.id, 'recipient_id', v_invite.recipient_id,
              'arena_id', v_invite.arena_id, 'duration_days', v_duration_days)
          );
        exception
          when others then
            if sqlerrm like '%Saldo insuficiente%' then raise exception 'COMPETITION_CHALLENGER_GOLD_REQUIRED'; end if;
            raise;
        end;
      end if;

      v_competition := public._create_competition_snapshot_from_invite(
        v_link.id, v_invite.arena_id, v_invite.sender_id, v_invite.recipient_id, v_duration_days
      );
    end if;

    update public.relationship_link_invites
    set status = 'accepted', responded_at = now(),
        cost_gold = case when link_type = 'competicao' then 50 else cost_gold end
    where id = v_invite.id;

    return jsonb_build_object(
      'success', true, 'link', to_jsonb(v_link), 'competition', v_competition,
      'challenger_new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_uid)
    );
  end if;

  if p_action = 'decline' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
    v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'declined');
    update public.relationship_link_invites set status = 'declined', responded_at = now() where id = v_invite.id;
    return jsonb_build_object('success', true, 'new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_invite.sender_id));
  end if;

  if v_invite.sender_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
  v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'revoked');
  update public.relationship_link_invites set status = 'revoked', responded_at = now() where id = v_invite.id;
  return jsonb_build_object('success', true, 'new_gold', v_new_gold,
    'summary', public._relationship_build_capacity_summary(v_uid));
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
  v_final jsonb;
  v_opponent_id uuid;
  v_opponent_nickname text;
  v_challenge_name text;
  v_is_cleared boolean := false;
  v_result_kind text;
  v_winner_id uuid;
begin
  if v_uid is null then return jsonb_build_object('success', false, 'status', 'auth_required'); end if;

  select * into v_challenge
  from public.relationship_competition_challenges challenge
  where (challenge.challenger_user_id = v_uid and challenge.challenger_arena_id = p_arena_id)
     or (challenge.opponent_user_id = v_uid and challenge.opponent_arena_id = p_arena_id)
  order by challenge.created_at desc limit 1 for update;
  if not found then return jsonb_build_object('success', true, 'status', 'not_found'); end if;

  v_challenge_name := coalesce(v_challenge.metadata ->> 'source_name', 'esse desafio');
  v_opponent_id := case when v_challenge.challenger_user_id = v_uid then v_challenge.opponent_user_id else v_challenge.challenger_user_id end;
  select nickname into v_opponent_nickname from public.user_profiles where id = v_opponent_id;

  if v_challenge.completed_at is null then
    if v_challenge.deadline_at is not null and now() >= v_challenge.deadline_at then
      v_final := public._competition_finalize_challenge(v_challenge.id, 'deadline');
    else
      v_progress := public._competition_compute_arena_progress_at(p_arena_id, null);
      v_is_cleared := coalesce((v_progress ->> 'is_cleared')::boolean, false);
      if not v_is_cleared then
        return jsonb_build_object('success', true, 'status', 'in_progress', 'challenge_name', v_challenge_name);
      end if;

      if v_challenge.challenger_user_id = v_uid then
        update public.relationship_competition_challenges
        set challenger_completed_at = coalesce(challenger_completed_at, now())
        where id = v_challenge.id;
      else
        update public.relationship_competition_challenges
        set opponent_completed_at = coalesce(opponent_completed_at, now())
        where id = v_challenge.id;
      end if;
      v_final := public._competition_finalize_challenge(v_challenge.id, 'completion');
    end if;
  else
    v_final := public._competition_finalize_challenge(v_challenge.id, 'read');
  end if;

  v_result_kind := coalesce(v_final ->> 'result_kind', 'draw');
  v_winner_id := nullif(v_final ->> 'winner_user_id', '')::uuid;

  return v_final || jsonb_build_object(
    'status', case
      when v_result_kind = 'draw' then 'draw'
      when v_winner_id = v_uid then 'winner'
      else 'loss'
    end,
    'challenge_name', v_challenge_name,
    'opponent_nickname', coalesce(v_opponent_nickname, 'seu rival'),
    'reward_granted_now', coalesce((v_final ->> 'finalized_now')::boolean, false) and v_winner_id = v_uid
  );
end;
$$;

create or replace function public.finalize_due_competition_challenges()
returns integer
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id
    from public.relationship_competition_challenges
    where completed_at is null
      and deadline_at is not null
      and deadline_at <= now()
    order by deadline_at
    limit 100
  loop
    perform public._competition_finalize_challenge(v_id, 'deadline');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

do $$
begin
  begin
    perform cron.unschedule('glyph-finalize-competition-challenges');
  exception when others then null;
  end;

  perform cron.schedule(
    'glyph-finalize-competition-challenges',
    '* * * * *',
    $cron$select public.finalize_due_competition_challenges();$cron$
  );
exception when undefined_table then null;
end;
$$;

revoke all on function public._competition_compute_arena_progress_at(uuid, timestamptz) from public;
revoke all on function public._competition_grant_bonus_xp(uuid, integer) from public;
revoke all on function public._competition_finalize_challenge(uuid, text) from public;
revoke all on function public._create_competition_snapshot_from_invite(uuid, uuid, uuid, uuid, integer) from public;
revoke all on function public.finalize_due_competition_challenges() from public;
revoke all on function public.create_competition_invite(uuid, uuid, integer) from public;
grant execute on function public.create_competition_invite(uuid, uuid, integer) to authenticated;
revoke execute on function public.create_competition_challenge(uuid, uuid) from authenticated;
revoke all on function public.create_competition_challenge(uuid, uuid) from public;
revoke all on function public.respond_relationship_link_invite(uuid, text) from public;
grant execute on function public.respond_relationship_link_invite(uuid, text) to authenticated;
revoke all on function public.resolve_competition_challenge_outcome(uuid) from public;
grant execute on function public.resolve_competition_challenge_outcome(uuid) to authenticated;

commit;
