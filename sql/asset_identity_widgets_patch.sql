begin;

alter table public.user_profiles
add column if not exists asset_art_by_id jsonb;

alter table public.user_profiles
add column if not exists asset_widget_values jsonb;

update public.user_profiles
set
  asset_art_by_id = coalesce(asset_art_by_id, '{}'::jsonb),
  asset_widget_values = coalesce(asset_widget_values, '{}'::jsonb);

alter table public.user_profiles
alter column asset_art_by_id set default '{}'::jsonb;

alter table public.user_profiles
alter column asset_art_by_id set not null;

alter table public.user_profiles
alter column asset_widget_values set default '{}'::jsonb;

alter table public.user_profiles
alter column asset_widget_values set not null;

do $$
declare
  v_data_type text;
  v_udt_name text;
begin
  select data_type, udt_name
  into v_data_type, v_udt_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'user_profiles'
    and column_name = 'visible_widgets';

  if not found then
    execute 'alter table public.user_profiles add column visible_widgets text[] not null default ''{}''::text[]';
  elsif v_data_type = 'ARRAY' or v_udt_name = '_text' then
    execute 'update public.user_profiles set visible_widgets = coalesce(visible_widgets, ''{}''::text[])';
    execute 'alter table public.user_profiles alter column visible_widgets set default ''{}''::text[]';
    execute 'alter table public.user_profiles alter column visible_widgets set not null';
  elsif v_data_type = 'jsonb' then
    execute 'update public.user_profiles set visible_widgets = coalesce(visible_widgets, ''[]''::jsonb)';
    execute 'alter table public.user_profiles alter column visible_widgets set default ''[]''::jsonb';
    execute 'alter table public.user_profiles alter column visible_widgets set not null';
  else
    raise exception 'Unsupported type for public.user_profiles.visible_widgets: % / %', v_data_type, v_udt_name;
  end if;
end $$;

commit;
