create extension if not exists pgcrypto;

create table if not exists public.golden_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_used boolean not null default false,
  claimed_by_user_id uuid null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists golden_invites_is_used_idx
  on public.golden_invites (is_used, created_at desc);

create table if not exists public.beta_tracking (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text null,
  whatsapp text null,
  source text null,
  stage text not null default 'candidate'
    check (stage in (
      'candidate',
      'invited',
      'scheduled',
      'onboarded',
      'active',
      'd2_returned',
      'cycle_started',
      'cycle_closed',
      'dropped'
    )),
  invite_code text null references public.golden_invites(code) on update cascade on delete set null,
  invited_at timestamptz null,
  onboarding_scheduled_at timestamptz null,
  onboarding_completed_at timestamptz null,
  activation_completed boolean not null default false,
  activation_date date null,
  d2_returned boolean not null default false,
  d2_checked_at timestamptz null,
  d7_returned boolean not null default false,
  d7_checked_at timestamptz null,
  cycle_started boolean not null default false,
  cycle_started_at timestamptz null,
  cycle_closed boolean not null default false,
  cycle_closed_at timestamptz null,
  days_active integer not null default 0,
  tasks_completed integer not null default 0,
  friction_point text null,
  confusion_point text null,
  return_reason text null,
  qualitative_feedback text null,
  owner_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_tracking_stage_idx
  on public.beta_tracking (stage, created_at desc);

create index if not exists beta_tracking_email_idx
  on public.beta_tracking (email);

create or replace function public.set_beta_tracking_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beta_tracking_set_updated_at on public.beta_tracking;
create trigger beta_tracking_set_updated_at
before update on public.beta_tracking
for each row
execute function public.set_beta_tracking_updated_at();

create or replace view public.beta_tracking_export as
select
  bt.full_name,
  bt.email,
  bt.whatsapp,
  bt.source,
  bt.stage,
  bt.invite_code,
  bt.invited_at,
  bt.onboarding_scheduled_at,
  bt.onboarding_completed_at,
  bt.activation_completed,
  bt.activation_date,
  bt.d2_returned,
  bt.d2_checked_at,
  bt.d7_returned,
  bt.d7_checked_at,
  bt.cycle_started,
  bt.cycle_started_at,
  bt.cycle_closed,
  bt.cycle_closed_at,
  bt.days_active,
  bt.tasks_completed,
  bt.friction_point,
  bt.confusion_point,
  bt.return_reason,
  bt.qualitative_feedback,
  bt.owner_notes,
  bt.created_at,
  bt.updated_at
from public.beta_tracking bt
order by bt.created_at desc;

insert into public.golden_invites (code, is_used)
values
  ('ouro2026-001', false),
  ('ouro2026-002', false),
  ('ouro2026-003', false),
  ('ouro2026-004', false),
  ('ouro2026-005', false)
on conflict (code) do nothing;
