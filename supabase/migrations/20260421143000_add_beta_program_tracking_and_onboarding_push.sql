alter table public.user_profiles
  add column if not exists onboarding_push_prompted_at timestamptz,
  add column if not exists beta_program_code text,
  add column if not exists beta_program_label text,
  add column if not exists beta_program_started_at timestamptz,
  add column if not exists beta_program_ends_at timestamptz,
  add column if not exists beta_program_last_check_in_date date,
  add column if not exists beta_program_check_in_count integer not null default 0,
  add column if not exists beta_program_days_target integer not null default 0,
  add column if not exists beta_reward_pending boolean not null default false,
  add column if not exists beta_reward_shown_at timestamptz,
  add column if not exists beta_reward_payload jsonb not null default '{}'::jsonb;

alter table if exists public.marco1_beta_tracking
  add column if not exists reward_code text,
  add column if not exists reward_code_redeemed_at timestamptz,
  add column if not exists beta_program_key text,
  add column if not exists beta_program_days_target integer,
  add column if not exists beta_program_last_check_in_date date,
  add column if not exists beta_program_rewarded_at timestamptz;

create table if not exists public.beta_program_checkins (
  id uuid primary key default gen_random_uuid(),
  program_key text not null,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  reward_code_id uuid not null references public.reward_codes(id) on delete cascade,
  reward_redemption_id uuid not null references public.reward_code_redemptions(id) on delete cascade,
  check_in_date date not null,
  ordinal_day integer not null check (ordinal_day > 0),
  created_at timestamptz not null default now(),
  unique (program_key, user_id, check_in_date)
);

create index if not exists beta_program_checkins_user_idx
  on public.beta_program_checkins (user_id, created_at desc);

create index if not exists beta_program_checkins_program_idx
  on public.beta_program_checkins (program_key, check_in_date desc);

alter table public.beta_program_checkins enable row level security;

drop policy if exists "Users can read own beta program checkins" on public.beta_program_checkins;
create policy "Users can read own beta program checkins"
on public.beta_program_checkins
for select
using (auth.uid() = user_id);

drop policy if exists "beta_program_checkins_no_direct_write" on public.beta_program_checkins;
create policy "beta_program_checkins_no_direct_write"
on public.beta_program_checkins
for all
using (false)
with check (false);

drop function if exists public.process_beta_program_checkin(uuid);

create function public.process_beta_program_checkin(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $beta_program_checkin$
declare
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_profile public.user_profiles%rowtype;
  v_reward public.reward_codes%rowtype;
  v_redemption public.reward_code_redemptions%rowtype;
  v_program_key text;
  v_program_label text;
  v_target_days integer := 0;
  v_reward_gold integer := 50;
  v_started_at timestamptz;
  v_ends_at timestamptz;
  v_today date := current_date;
  v_window_last_date date;
  v_ordinal_day integer := 0;
  v_new_check_in boolean := false;
  v_insert_count integer := 0;
  v_check_in_count integer := 0;
  v_current_gold integer := 0;
  v_current_fragments integer := 0;
  v_reward_granted_now boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if auth.uid() is not null and auth.uid() <> v_uid then
    return jsonb_build_object(
      'success', false,
      'error', 'USER_MISMATCH'
    );
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'PROFILE_NOT_FOUND'
    );
  end if;

  select rcr.*
  into v_redemption
  from public.reward_code_redemptions rcr
  join public.reward_codes rc
    on rc.id = rcr.code_id
  where rcr.user_id = v_uid
    and greatest(coalesce((rc.reward_payload ->> 'beta_program_days')::integer, 0), 0) > 0
  order by rcr.created_at desc, rcr.id desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', true,
      'program_key', null
    );
  end if;

  select *
  into v_reward
  from public.reward_codes
  where id = v_redemption.code_id
    and greatest(coalesce((reward_payload ->> 'beta_program_days')::integer, 0), 0) > 0
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', true,
      'program_key', null
    );
  end if;

  v_program_key := coalesce(nullif(trim(v_reward.reward_payload ->> 'beta_program_key'), ''), lower(v_reward.code));
  v_program_label := coalesce(nullif(trim(v_reward.reward_payload ->> 'beta_program_label'), ''), v_reward.title, v_reward.code);
  v_target_days := greatest(coalesce((v_reward.reward_payload ->> 'beta_program_days')::integer, 0), 0);
  v_reward_gold := greatest(coalesce((v_reward.reward_payload ->> 'beta_program_reward_gold')::integer, 50), 0);

  if v_target_days <= 0 then
    return jsonb_build_object(
      'success', true,
      'program_key', null
    );
  end if;

  v_started_at := coalesce(v_redemption.created_at, now());
  v_window_last_date := (v_started_at::date + (v_target_days - 1));
  v_ends_at := (v_window_last_date::timestamp + interval '23 hours 59 minutes 59 seconds');
  v_ordinal_day := least(v_target_days, greatest(1, (v_today - v_started_at::date) + 1));

  if v_today <= v_window_last_date then
    insert into public.beta_program_checkins (
      program_key,
      user_id,
      reward_code_id,
      reward_redemption_id,
      check_in_date,
      ordinal_day
    )
    values (
      v_program_key,
      v_uid,
      v_reward.id,
      v_redemption.id,
      v_today,
      v_ordinal_day
    )
    on conflict (program_key, user_id, check_in_date) do nothing;

    get diagnostics v_insert_count = row_count;
    v_new_check_in := v_insert_count > 0;
  else
    v_new_check_in := false;
  end if;

  select count(*)::integer
  into v_check_in_count
  from public.beta_program_checkins
  where user_id = v_uid
    and program_key = v_program_key;

  insert into public.marco1_beta_tracking (
    user_id,
    email,
    nickname,
    source,
    cohort_label,
    beta_tier,
    stage,
    invited_at,
    observation_started_at,
    observation_ends_at,
    active_days_14d,
    reward_code,
    reward_code_redeemed_at,
    beta_program_key,
    beta_program_days_target,
    beta_program_last_check_in_date
  ) values (
    v_uid,
    v_profile.email,
    v_profile.nickname,
    'reward_code',
    v_program_key,
    case when upper(v_reward.code) = 'VANGUARDA25' then 'ouro' else null end,
    case
      when v_check_in_count >= v_target_days then 'retained'
      when v_check_in_count > 0 then 'observed'
      else 'activated'
    end,
    v_redemption.created_at,
    v_started_at,
    v_ends_at,
    v_check_in_count,
    v_reward.code,
    v_redemption.created_at,
    v_program_key,
    v_target_days,
    case when v_new_check_in then v_today else null end
  )
  on conflict (user_id) do update
  set
    email = coalesce(public.marco1_beta_tracking.email, excluded.email),
    nickname = coalesce(excluded.nickname, public.marco1_beta_tracking.nickname),
    source = coalesce(public.marco1_beta_tracking.source, excluded.source),
    cohort_label = coalesce(nullif(public.marco1_beta_tracking.cohort_label, 'marco1'), excluded.cohort_label, public.marco1_beta_tracking.cohort_label),
    beta_tier = coalesce(public.marco1_beta_tracking.beta_tier, excluded.beta_tier),
    stage = case
      when public.marco1_beta_tracking.stage in ('lost', 'ignored', 'cycled') then public.marco1_beta_tracking.stage
      else excluded.stage
    end,
    invited_at = coalesce(public.marco1_beta_tracking.invited_at, excluded.invited_at),
    observation_started_at = coalesce(public.marco1_beta_tracking.observation_started_at, excluded.observation_started_at),
    observation_ends_at = coalesce(public.marco1_beta_tracking.observation_ends_at, excluded.observation_ends_at),
    active_days_14d = greatest(coalesce(public.marco1_beta_tracking.active_days_14d, 0), excluded.active_days_14d),
    reward_code = coalesce(public.marco1_beta_tracking.reward_code, excluded.reward_code),
    reward_code_redeemed_at = coalesce(public.marco1_beta_tracking.reward_code_redeemed_at, excluded.reward_code_redeemed_at),
    beta_program_key = coalesce(public.marco1_beta_tracking.beta_program_key, excluded.beta_program_key),
    beta_program_days_target = coalesce(public.marco1_beta_tracking.beta_program_days_target, excluded.beta_program_days_target),
    beta_program_last_check_in_date = coalesce(excluded.beta_program_last_check_in_date, public.marco1_beta_tracking.beta_program_last_check_in_date),
    updated_at = now();

  if v_check_in_count >= v_target_days
     and not coalesce(v_profile.beta_reward_pending, false)
     and v_profile.beta_reward_shown_at is null then
    v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
    v_current_fragments := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, v_profile.fragments, 0);

    update public.user_profiles
    set
      gold = v_current_gold + v_reward_gold,
      wallet = jsonb_build_object(
        'gold', v_current_gold + v_reward_gold,
        'fragments', v_current_fragments
      ),
      beta_program_code = v_program_key,
      beta_program_label = v_program_label,
      beta_program_started_at = v_started_at,
      beta_program_ends_at = v_ends_at,
      beta_program_last_check_in_date = v_today,
      beta_program_check_in_count = v_check_in_count,
      beta_program_days_target = v_target_days,
      beta_reward_pending = true,
      beta_reward_payload = jsonb_build_object(
        'eyebrow', 'Beta 14/14',
        'title', 'Vigilia completa',
        'summary', 'Voce atravessou os 14 dias completos do beta. O bonus final ja foi liberado no seu perfil.',
        'buttonLabel', 'Receber',
        'emptyMessage', 'Seu bonus final ja foi integrado ao perfil.',
        'metricCards', jsonb_build_array(
          jsonb_build_object('label', 'Dias', 'value', format('%s/%s', v_target_days, v_target_days), 'detail', 'Presenca completa durante toda a vigilia.'),
          jsonb_build_object('label', 'Codigo', 'value', upper(v_program_key), 'detail', 'Cohort oficial do teste.')
        ),
        'rewardHighlightsTitle', 'Entregue agora',
        'rewardHighlights', jsonb_build_array(
          jsonb_build_object('label', 'Ouro', 'value', format('+%s', v_reward_gold), 'detail', 'Bonus final por fechar o beta sem quebrar a cadeia.', 'tone', 'gold'),
          jsonb_build_object('label', 'Meta', 'value', '14/14', 'detail', 'Todos os dias do periodo foram registrados.', 'tone', 'emerald')
        )
      ),
      updated_at = now()
    where id = v_uid;

    v_reward_granted_now := true;

    update public.marco1_beta_tracking
    set
      active_days_14d = v_check_in_count,
      stage = case
        when stage in ('lost', 'ignored', 'cycled') then stage
        else 'retained'
      end,
      beta_program_rewarded_at = coalesce(beta_program_rewarded_at, now()),
      updated_at = now()
    where user_id = v_uid;

    select *
    into v_profile
    from public.user_profiles
    where id = v_uid;
  else
    update public.user_profiles
    set
      beta_program_code = v_program_key,
      beta_program_label = v_program_label,
      beta_program_started_at = v_started_at,
      beta_program_ends_at = v_ends_at,
      beta_program_last_check_in_date = case
        when v_new_check_in then v_today
        else beta_program_last_check_in_date
      end,
      beta_program_check_in_count = v_check_in_count,
      beta_program_days_target = v_target_days,
      updated_at = now()
    where id = v_uid;
  end if;

  return jsonb_build_object(
    'success', true,
    'program_key', v_program_key,
    'program_label', v_program_label,
    'check_in_date', v_today,
    'started_at', v_started_at,
    'ends_at', v_ends_at,
    'target_days', v_target_days,
    'ordinal_day', v_ordinal_day,
    'check_in_count', v_check_in_count,
    'new_check_in', v_new_check_in,
    'reward_granted_now', v_reward_granted_now,
    'reward_pending', coalesce(v_profile.beta_reward_pending, false),
    'reward_payload', case
      when coalesce(v_profile.beta_reward_pending, false) then v_profile.beta_reward_payload
      else null
    end
  );
end;
$beta_program_checkin$;

revoke all on function public.process_beta_program_checkin(uuid) from public;
grant execute on function public.process_beta_program_checkin(uuid) to authenticated;
