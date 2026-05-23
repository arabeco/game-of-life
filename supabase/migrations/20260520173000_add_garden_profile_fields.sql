begin;

alter table public.user_profiles
add column if not exists garden_visibility text not null default 'friends',
add column if not exists garden_state jsonb not null default '{"sandColor": "classic", "strokes": [], "items": []}'::jsonb;

update public.user_profiles
set garden_visibility = coalesce(garden_visibility, 'friends'),
    garden_state = coalesce(garden_state, '{"sandColor": "classic", "strokes": [], "items": []}'::jsonb);

alter table public.user_profiles
add constraint user_profiles_garden_visibility_check
check (garden_visibility in ('all', 'friends', 'nobody'))
not valid;

alter table public.user_profiles
validate constraint user_profiles_garden_visibility_check;

commit;
