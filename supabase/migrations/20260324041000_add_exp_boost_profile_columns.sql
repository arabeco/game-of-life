alter table public.user_profiles
  add column if not exists exp_boost_multiplier numeric,
  add column if not exists exp_boost_expires_at timestamptz,
  add column if not exists exp_boost_product_id text;
