begin;

alter table public.user_profiles
add column if not exists sequence_items jsonb;

update public.user_profiles
set sequence_items = coalesce(sequence_items, '[]'::jsonb);

alter table public.user_profiles
alter column sequence_items set default '[]'::jsonb;

alter table public.user_profiles
alter column sequence_items set not null;

commit;
