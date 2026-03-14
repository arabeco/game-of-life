alter table public.user_profiles
  add column if not exists assets_visibility text,
  add column if not exists mastery_visibility text;

update public.user_profiles
set
  assets_visibility = coalesce(assets_visibility, 'all'),
  mastery_visibility = coalesce(mastery_visibility, 'all')
where assets_visibility is null
   or mastery_visibility is null;

alter table public.user_profiles
  alter column assets_visibility set default 'all',
  alter column mastery_visibility set default 'all';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_assets_visibility_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_assets_visibility_check
      check (assets_visibility in ('all', 'friends', 'nobody'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_mastery_visibility_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_mastery_visibility_check
      check (mastery_visibility in ('all', 'friends', 'nobody'));
  end if;
end
$$;
