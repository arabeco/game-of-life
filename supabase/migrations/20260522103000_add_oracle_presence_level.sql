alter table public.oracle_preferences
  add column if not exists presence_level integer not null default 1;

alter table public.oracle_preferences
  drop constraint if exists oracle_preferences_presence_level_check;

alter table public.oracle_preferences
  add constraint oracle_preferences_presence_level_check
  check (presence_level between 0 and 3);
