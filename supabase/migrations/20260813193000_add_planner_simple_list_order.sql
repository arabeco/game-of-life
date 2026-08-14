alter table public.scheduled_tasks
  add column if not exists execution_order integer;

create index if not exists scheduled_tasks_execution_order_idx
  on public.scheduled_tasks (user_id, date, execution_order)
  where execution_order is not null;

alter table public.user_profiles
  add column if not exists planner_view_mode text not null default 'schedule';

alter table public.user_profiles
  drop constraint if exists user_profiles_planner_view_mode_check;

alter table public.user_profiles
  add constraint user_profiles_planner_view_mode_check
  check (planner_view_mode in ('schedule', 'list'));
