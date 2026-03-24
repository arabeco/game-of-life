alter table public.user_profiles
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_reward_pending boolean not null default false,
  add column if not exists premium_reward_payload jsonb not null default '{}'::jsonb,
  add column if not exists premium_reward_shown_at timestamptz;

update public.user_profiles
set premium_expires_at = coalesce(premium_expires_at, now() + interval '30 days')
where coalesce(is_premium, false) = true
  and premium_expires_at is null;
