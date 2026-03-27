begin;

alter table public.user_profiles
add column if not exists asset_art_by_id jsonb not null default '{}'::jsonb;

update public.user_profiles
set asset_art_by_id = '{}'::jsonb
where asset_art_by_id is null;

commit;
