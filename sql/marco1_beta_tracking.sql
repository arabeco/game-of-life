create extension if not exists pgcrypto;

create table if not exists public.marco1_beta_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  email text null,
  nickname text null,
  full_name text null,
  whatsapp text null,
  source text null,
  cohort_label text not null default 'marco1',
  beta_tier text null check (beta_tier in ('ouro', 'prata', 'bronze')),
  stage text not null default 'candidate'
    check (stage in (
      'candidate',
      'invited',
      'scheduled',
      'onboarding',
      'activated',
      'observed',
      'retained',
      'cycled',
      'lost',
      'ignored'
    )),
  invite_code text null references public.golden_invites(code) on update cascade on delete set null,
  first_contact_at timestamptz null,
  invited_at timestamptz null,
  onboarding_call_scheduled_at timestamptz null,
  onboarding_call_completed_at timestamptz null,
  observation_started_at timestamptz null,
  observation_ends_at timestamptz null,
  first_value_at timestamptz null,
  first_value_minutes integer null check (first_value_minutes is null or first_value_minutes >= 0),
  activated_at timestamptz null,
  d2_returned_override boolean null,
  d7_returned_override boolean null,
  cycle_started_override boolean null,
  cycle_closed_override boolean null,
  active_days_14d integer null check (active_days_14d is null or active_days_14d >= 0),
  tasks_completed_14d integer null check (tasks_completed_14d is null or tasks_completed_14d >= 0),
  where_stuck text null,
  what_confused text null,
  what_made_them_return text null,
  qualitative_feedback text null,
  ceo_notes text null,
  next_follow_up_at timestamptz null,
  ignore_in_marco1 boolean not null default false,
  ignore_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marco1_beta_tracking_user_id_unique unique (user_id)
);

create unique index if not exists marco1_beta_tracking_email_unique_idx
  on public.marco1_beta_tracking ((lower(email)))
  where email is not null;

create index if not exists marco1_beta_tracking_stage_idx
  on public.marco1_beta_tracking (stage, created_at desc);

create index if not exists marco1_beta_tracking_follow_up_idx
  on public.marco1_beta_tracking (next_follow_up_at)
  where next_follow_up_at is not null;

create index if not exists marco1_beta_tracking_ignore_idx
  on public.marco1_beta_tracking (ignore_in_marco1, stage);

create or replace function public.set_marco1_beta_tracking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marco1_beta_tracking_set_updated_at on public.marco1_beta_tracking;
create trigger marco1_beta_tracking_set_updated_at
before update on public.marco1_beta_tracking
for each row
execute function public.set_marco1_beta_tracking_updated_at();

alter table public.marco1_beta_tracking enable row level security;

create or replace view public.marco1_beta_scoreboard_base as
with tracked as (
  select
    bt.id,
    bt.user_id,
    bt.email as tracking_email,
    bt.nickname as tracking_nickname,
    bt.full_name,
    bt.whatsapp,
    bt.source,
    bt.cohort_label,
    bt.beta_tier,
    bt.stage,
    bt.invite_code,
    bt.first_contact_at,
    bt.invited_at,
    bt.onboarding_call_scheduled_at,
    bt.onboarding_call_completed_at,
    bt.observation_started_at,
    bt.observation_ends_at,
    bt.first_value_at,
    bt.first_value_minutes,
    bt.activated_at as activated_at_override,
    bt.d2_returned_override,
    bt.d7_returned_override,
    bt.cycle_started_override,
    bt.cycle_closed_override,
    bt.active_days_14d,
    bt.tasks_completed_14d,
    bt.where_stuck,
    bt.what_confused,
    bt.what_made_them_return,
    bt.qualitative_feedback,
    bt.ceo_notes,
    bt.next_follow_up_at,
    bt.ignore_in_marco1,
    bt.ignore_reason,
    bt.created_at,
    bt.updated_at,
    up.email as profile_email,
    up.nickname as profile_nickname,
    up.role as profile_role,
    up.created_at as profile_created_at,
    au.created_at as auth_created_at,
    claimed.code as claimed_invite_code,
    claimed.claimed_at as invite_claimed_at
  from public.marco1_beta_tracking bt
  left join public.user_profiles up
    on up.id = bt.user_id
  left join auth.users au
    on au.id = bt.user_id
  left join public.golden_invites claimed
    on claimed.claimed_by_user_id = bt.user_id
),
arena_stats as (
  select
    user_id,
    count(*) as arenas_count,
    min(created_at) as first_arena_at
  from public.arenas
  group by user_id
),
action_stats as (
  select
    user_id,
    count(*) as actions_count,
    min(created_at) as first_action_at
  from public.actions
  group by user_id
),
task_stats as (
  select
    user_id,
    count(*) as tasks_scheduled_count,
    count(*) filter (where completed = true) as tasks_completed_count,
    min(created_at) as first_task_scheduled_at,
    max((nullif(date::text, ''))::date) as latest_task_date
  from public.scheduled_tasks
  group by user_id
),
sitrep_stats as (
  select
    user_id,
    count(*) as sitrep_days_count,
    min(created_at) as first_sitrep_opened_at,
    count(*) filter (where stage in ('battle', 'judgment')) as sitrep_locked_days,
    count(*) filter (where stage = 'judgment') as sitrep_closed_days
  from public.daily_commitments
  group by user_id
),
cycle_stats as (
  select
    user_id,
    count(*) as cycles_started_count,
    min(start_date::timestamptz) as first_cycle_started_at,
    count(*) filter (where report_data is not null) as cycles_closed_count,
    min(end_date::timestamptz) filter (where report_data is not null) as first_cycle_closed_at
  from public.cycles
  group by user_id
),
activity_days as (
  select distinct user_id, activity_date
  from (
    select user_id, created_at::date as activity_date from public.arenas
    union all
    select user_id, created_at::date as activity_date from public.actions
    union all
    select user_id, (nullif(date::text, ''))::date as activity_date from public.scheduled_tasks
    union all
    select user_id, (nullif(date::text, ''))::date as activity_date from public.daily_commitments
    union all
    select user_id, start_date::date as activity_date from public.cycles
    union all
    select user_id, end_date::date as activity_date from public.cycles where report_data is not null
  ) events
),
joined as (
  select
    t.*, 
    coalesce(t.profile_email, t.tracking_email) as email,
    coalesce(t.profile_nickname, t.tracking_nickname) as nickname,
    coalesce(a.arenas_count, 0) as arenas_count,
    a.first_arena_at,
    coalesce(ac.actions_count, 0) as actions_count,
    ac.first_action_at,
    coalesce(ts.tasks_scheduled_count, 0) as tasks_scheduled_count,
    coalesce(ts.tasks_completed_count, 0) as tasks_completed_count,
    ts.first_task_scheduled_at,
    coalesce(ss.sitrep_days_count, 0) as sitrep_days_count,
    ss.first_sitrep_opened_at,
    coalesce(ss.sitrep_locked_days, 0) as sitrep_locked_days,
    coalesce(ss.sitrep_closed_days, 0) as sitrep_closed_days,
    coalesce(cs.cycles_started_count, 0) as cycles_started_count,
    cs.first_cycle_started_at,
    coalesce(cs.cycles_closed_count, 0) as cycles_closed_count,
    cs.first_cycle_closed_at,
    case
      when a.first_arena_at is not null
       and ac.first_action_at is not null
       and ts.first_task_scheduled_at is not null
      then greatest(a.first_arena_at, ac.first_action_at, ts.first_task_scheduled_at)
      else null
    end as activated_at_derived
  from tracked t
  left join arena_stats a on a.user_id = t.user_id
  left join action_stats ac on ac.user_id = t.user_id
  left join task_stats ts on ts.user_id = t.user_id
  left join sitrep_stats ss on ss.user_id = t.user_id
  left join cycle_stats cs on cs.user_id = t.user_id
)
select
  j.id,
  j.user_id,
  j.email,
  j.nickname,
  j.full_name,
  j.whatsapp,
  j.source,
  j.cohort_label,
  coalesce(
    j.beta_tier,
    case
      when coalesce(j.invite_code, j.claimed_invite_code, '') ilike 'ouro-%' then 'ouro'
      when coalesce(j.invite_code, j.claimed_invite_code, '') ilike 'prata-%' then 'prata'
      when coalesce(j.invite_code, j.claimed_invite_code, '') ilike 'bronze-%' then 'bronze'
      else null
    end
  ) as beta_tier,
  j.stage as manual_stage,
  case
    when j.ignore_in_marco1 then 'ignored'
    when coalesce(j.cycle_closed_override, j.cycles_closed_count > 0, false) then 'cycled'
    when coalesce(j.d7_returned_override,
      exists (
        select 1
        from activity_days ad
        where ad.user_id = j.user_id
          and ad.activity_date = (coalesce(j.activated_at_override, j.activated_at_derived)::date + 6)
      ), false
    ) then 'retained'
    when coalesce(j.d2_returned_override,
      exists (
        select 1
        from activity_days ad
        where ad.user_id = j.user_id
          and ad.activity_date = (coalesce(j.activated_at_override, j.activated_at_derived)::date + 1)
      ), false
    ) then 'observed'
    when (j.arenas_count >= 1 and j.actions_count >= 1 and j.tasks_scheduled_count >= 1) then 'activated'
    when (j.arenas_count >= 1 or j.actions_count >= 1) then 'onboarding'
    when j.onboarding_call_completed_at is not null then 'scheduled'
    when j.invited_at is not null then 'invited'
    else j.stage
  end as stage_suggested,
  j.profile_role,
  j.auth_created_at,
  j.profile_created_at,
  j.invite_code,
  j.claimed_invite_code,
  j.invite_claimed_at,
  j.first_contact_at,
  j.invited_at,
  j.onboarding_call_scheduled_at,
  j.onboarding_call_completed_at,
  j.observation_started_at,
  j.observation_ends_at,
  j.arenas_count,
  j.first_arena_at,
  j.actions_count,
  j.first_action_at,
  j.tasks_scheduled_count,
  j.tasks_completed_count,
  j.first_task_scheduled_at,
  j.sitrep_days_count,
  j.first_sitrep_opened_at,
  j.sitrep_locked_days,
  j.sitrep_closed_days,
  j.cycles_started_count,
  j.first_cycle_started_at,
  j.cycles_closed_count,
  j.first_cycle_closed_at,
  coalesce(j.activated_at_override, j.activated_at_derived) as activated_at,
  (j.arenas_count >= 1 and j.actions_count >= 1 and j.tasks_scheduled_count >= 1) as activation_passed,
  coalesce(j.d2_returned_override,
    exists (
      select 1
      from activity_days ad
      where ad.user_id = j.user_id
        and ad.activity_date = (coalesce(j.activated_at_override, j.activated_at_derived)::date + 1)
    ), false
  ) as d2_returned,
  coalesce(j.d7_returned_override,
    exists (
      select 1
      from activity_days ad
      where ad.user_id = j.user_id
        and ad.activity_date = (coalesce(j.activated_at_override, j.activated_at_derived)::date + 6)
    ), false
  ) as d7_returned,
  coalesce(j.cycle_started_override, j.cycles_started_count > 0, false) as cycle_started,
  coalesce(j.cycle_closed_override, j.cycles_closed_count > 0, false) as cycle_closed,
  j.first_value_at,
  j.first_value_minutes,
  (j.first_value_minutes is not null and j.first_value_minutes <= 7) as first_value_under_7m,
  j.active_days_14d,
  j.tasks_completed_14d,
  j.where_stuck,
  j.what_confused,
  j.what_made_them_return,
  j.qualitative_feedback,
  j.ceo_notes,
  j.next_follow_up_at,
  j.ignore_in_marco1,
  j.ignore_reason,
  j.created_at,
  j.updated_at
from joined j;

create or replace view public.marco1_beta_scoreboard as
select *
from public.marco1_beta_scoreboard_base
where coalesce(ignore_in_marco1, false) = false
  and lower(coalesce(profile_role, 'user')) not in ('gm', 'admin', 'admin_gm');

create or replace view public.marco1_beta_funnel as
select
  count(*) as tracked_users,
  count(*) filter (where invited_at is not null) as invited_users,
  count(*) filter (where onboarding_call_completed_at is not null) as onboarded_users,
  count(*) filter (where activation_passed) as activated_users,
  count(*) filter (where d2_returned) as d2_users,
  count(*) filter (where d7_returned) as d7_users,
  count(*) filter (where cycle_started) as cycle_started_users,
  count(*) filter (where cycle_closed) as cycle_closed_users,
  round((count(*) filter (where activation_passed)::numeric / nullif(count(*), 0)) * 100, 2) as activation_pct,
  round((count(*) filter (where d2_returned)::numeric / nullif(count(*), 0)) * 100, 2) as d2_pct,
  round((count(*) filter (where d7_returned)::numeric / nullif(count(*), 0)) * 100, 2) as d7_pct,
  round((count(*) filter (where cycle_closed)::numeric / nullif(count(*), 0)) * 100, 2) as cycle_closed_pct,
  round(avg(first_value_minutes)::numeric, 2) as avg_first_value_minutes,
  count(*) filter (where first_value_minutes is not null and first_value_minutes <= 7) as users_under_7m,
  round((count(*) filter (where first_value_minutes is not null and first_value_minutes <= 7)::numeric / nullif(count(*) filter (where first_value_minutes is not null), 0)) * 100, 2) as first_value_under_7m_pct
from public.marco1_beta_scoreboard;

comment on table public.marco1_beta_tracking is 'Operacao manual do Marco 1: convites, onboarding, checkpoints e feedback qualitativo dos betas assistidos.';
comment on view public.marco1_beta_scoreboard is 'Scoreboard por usuario do Marco 1, filtrando GM/admin/admin_gm e contas marcadas para ignorar.';
comment on view public.marco1_beta_funnel is 'Funil resumido do Marco 1: ativacao, D2, D7 e fechamento de ciclo.';

