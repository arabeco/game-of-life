begin;

alter table public.user_profiles
add column if not exists checklist_items jsonb;

update public.user_profiles
set checklist_items = coalesce(checklist_items, '{"date": null, "items": []}'::jsonb);

alter table public.user_profiles
alter column checklist_items set default '{"date": null, "items": []}'::jsonb;

alter table public.user_profiles
alter column checklist_items set not null;

commit;
