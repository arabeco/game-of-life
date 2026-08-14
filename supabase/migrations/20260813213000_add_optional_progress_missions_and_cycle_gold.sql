alter table public.user_profiles
  add column if not exists accepted_system_challenges text[] not null default '{}'::text[];

create or replace function public.claim_glyph_progress_gold(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward integer := 0;
  v_eligible boolean := false;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.user_profiles
    where id = v_user_id
      and p_reward_id = any(coalesce(accepted_system_challenges, '{}'::text[]))
  ) then
    raise exception 'MISSION_NOT_ACCEPTED';
  end if;

  if p_reward_id = 'system-first-arena-gold' then
    v_reward := 1;
    select exists (
      select 1
      from public.arenas ar
      where ar.user_id = v_user_id
        and exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
        )
        and not exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
            and (
              select count(*)
              from public.scheduled_tasks st
              where st.user_id = v_user_id
                and st.action_id::text = a.id::text
                and coalesce(st.completed, false) = true
            ) < greatest(1, coalesce(a.repetitions, 1))
        )
    ) into v_eligible;
  elsif p_reward_id = 'system-five-day-proof-streak' then
    v_reward := 2;
    select coalesce(
      nullif(daily_proof_streak ->> 'current', '')::integer,
      nullif(daily_proof_streak ->> 'current_streak', '')::integer,
      0
    ) >= 5
    into v_eligible
    from public.user_profiles
    where id = v_user_id;
  elsif p_reward_id = 'system-twenty-actions' then
    v_reward := 2;
    select count(*) >= 20
    into v_eligible
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
     and a.user_id = v_user_id
    where st.user_id = v_user_id
      and coalesce(st.completed, false) = true
      and coalesce(a.action_type, '') <> 'Livre';
  else
    raise exception 'UNKNOWN_PROGRESS_REWARD';
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'REWARD_NOT_ELIGIBLE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':progress:' || p_reward_id, 0));

  if public._starter_reward_has_purchase_marker(v_user_id, 'progress_reward', p_reward_id) then
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
    into v_new_gold
    from public.user_profiles
    where id = v_user_id;

    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'gold_granted', 0,
      'new_gold', v_new_gold
    );
  end if;

  v_new_gold := public._starter_reward_credit_gold(
    v_user_id,
    v_reward,
    'progress_reward',
    'Recompensa de missao opcional',
    jsonb_build_object('reward_id', p_reward_id)
  );
  perform public._starter_reward_mark_purchase(v_user_id, 'progress_reward', p_reward_id, false);

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold
  );
end;
$$;

create or replace function public.claim_cycle_completion_gold(p_cycle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.cycles%rowtype;
  v_score numeric := 0;
  v_honored_units numeric := 0;
  v_active_days integer := 0;
  v_measurement_status text := 'low_signal';
  v_score_reward integer := 0;
  v_effort_cap integer := 0;
  v_days_cap integer := 0;
  v_reward integer := 0;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':cycle:' || p_cycle_id::text, 0));

  select *
  into v_cycle
  from public.cycles
  where id = p_cycle_id
    and user_id = v_user_id
    and report_data is not null
  for update;

  if not found then
    raise exception 'SEALED_CYCLE_NOT_FOUND';
  end if;

  if public._starter_reward_has_purchase_marker(v_user_id, 'cycle_completion_reward', p_cycle_id::text) then
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
    into v_new_gold
    from public.user_profiles
    where id = v_user_id;

    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'gold_granted', 0,
      'new_gold', v_new_gold
    );
  end if;

  v_score := coalesce(v_cycle.performance_score, 0);
  v_honored_units := coalesce(
    nullif(v_cycle.report_data #>> '{metrics,fairness,honored_load_units}', '')::numeric,
    nullif(v_cycle.report_data #>> '{metrics,fairness,honoredLoadUnits}', '')::numeric,
    0
  );
  v_active_days := coalesce(
    nullif(v_cycle.report_data #>> '{metrics,fairness,active_days}', '')::integer,
    nullif(v_cycle.report_data #>> '{metrics,fairness,activeDays}', '')::integer,
    0
  );
  v_measurement_status := coalesce(
    nullif(v_cycle.report_data #>> '{metrics,fairness,measurement_status}', ''),
    nullif(v_cycle.report_data #>> '{metrics,fairness,measurementStatus}', ''),
    'low_signal'
  );

  v_score_reward := case
    when v_score >= 92 then 5
    when v_score >= 84 then 4
    when v_score >= 70 then 3
    when v_score >= 55 then 2
    when v_score >= 40 then 1
    else 0
  end;

  v_effort_cap := case
    when v_honored_units < 2 then 0
    when v_honored_units < 4 then 1
    when v_honored_units < 6 then 2
    when v_honored_units < 8 then 3
    else 5
  end;

  v_days_cap := case
    when v_active_days <= 0 then 0
    when v_active_days = 1 then 1
    when v_active_days = 2 then 2
    when v_active_days = 3 then 3
    else 5
  end;

  if v_measurement_status = 'scored' then
    v_reward := greatest(0, least(v_score_reward, v_effort_cap, v_days_cap));
  end if;

  if v_reward > 0 then
    v_new_gold := public._starter_reward_credit_gold(
      v_user_id,
      v_reward,
      'cycle_completion_reward',
      'Recompensa por ciclo concluido',
      jsonb_build_object(
        'cycle_id', p_cycle_id,
        'score', v_score,
        'honored_load_units', v_honored_units,
        'active_days', v_active_days
      )
    );
  else
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
    into v_new_gold
    from public.user_profiles
    where id = v_user_id;
  end if;

  perform public._starter_reward_mark_purchase(v_user_id, 'cycle_completion_reward', p_cycle_id::text, false);

  update public.cycles
  set report_data = jsonb_set(
    coalesce(report_data, '{}'::jsonb),
    '{metrics,gold_gained}',
    to_jsonb(v_reward),
    true
  )
  where id = p_cycle_id
    and user_id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold,
    'score', v_score,
    'honored_load_units', v_honored_units,
    'active_days', v_active_days
  );
end;
$$;

revoke all on function public.claim_glyph_progress_gold(text) from public;
revoke all on function public.claim_cycle_completion_gold(uuid) from public;
grant execute on function public.claim_glyph_progress_gold(text) to authenticated;
grant execute on function public.claim_cycle_completion_gold(uuid) to authenticated;
