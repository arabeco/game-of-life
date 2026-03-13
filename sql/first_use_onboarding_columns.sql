alter table public.user_profiles
  add column if not exists onboarding_version text,
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_dismissed_at timestamptz;

update public.user_profiles
set
  onboarding_version = coalesce(onboarding_version, 'operational-v1'),
  onboarding_dismissed_at = coalesce(onboarding_dismissed_at, now())
where onboarding_started_at is null
  and onboarding_completed_at is null
  and onboarding_dismissed_at is null;
