alter table public.daily_commitments
  add column if not exists operational_scratch text;
