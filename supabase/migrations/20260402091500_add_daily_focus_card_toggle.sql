alter table public.oracle_preferences
  add column if not exists daily_focus_card_enabled boolean not null default false;

update public.oracle_preferences
set daily_focus_card_enabled = coalesce(daily_focus_card_enabled, false)
where daily_focus_card_enabled is distinct from coalesce(daily_focus_card_enabled, false);
