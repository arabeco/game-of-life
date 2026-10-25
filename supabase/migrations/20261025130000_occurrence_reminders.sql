-- Lembretes podem ser ajustados ou desligados numa ocorrência sem alterar a ação-base.
alter table public.scheduled_tasks
  add column if not exists reminder_enabled boolean,
  add column if not exists reminder_minutes integer;

alter table public.scheduled_tasks
  drop constraint if exists scheduled_tasks_reminder_minutes_valid;

alter table public.scheduled_tasks
  add constraint scheduled_tasks_reminder_minutes_valid
  check (reminder_minutes is null or reminder_minutes in (5, 10, 15, 30, 60));

create or replace function public.enqueue_due_action_reminder_notifications()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_now_local timestamp := timezone('America/Sao_Paulo', now());
  v_inserted integer := 0;
begin
  with candidates as (
    select
      st.id::text as task_id,
      st.user_id,
      a.id::text as action_id,
      a.arena_id::text as arena_id,
      a.name as action_name,
      coalesce(ar.name, '') as arena_name,
      coalesce(ar.icon, '🗂️') as arena_icon,
      st.date as scheduled_date,
      st.start_time as scheduled_start_time,
      case
        when st.reminder_enabled is false then null
        when st.reminder_enabled is true then coalesce(st.reminder_minutes, 15)
        else nullif(a.context->'schedule'->>'notifyBeforeMinutes', '')::integer
      end as reminder_minutes
    from public.scheduled_tasks st
    join public.actions a on a.id::text = st.action_id::text
    left join public.arenas ar on ar.id = a.arena_id
    left join public.oracle_preferences op on op.user_id = st.user_id
    where coalesce(st.completed, false) = false
      and st.start_time is not null
      and st.start_time >= 0
      and coalesce(op.notifications_enabled, true) = true
      and exists (
        select 1 from public.push_subscriptions ps
        where ps.user_id = st.user_id and ps.disabled_at is null
      )
  ),
  due as (
    select
      candidates.*,
      (nullif(scheduled_date::text, '')::date::timestamp + make_interval(mins => scheduled_start_time - reminder_minutes)) as reminder_at_local,
      (nullif(scheduled_date::text, '')::date::timestamp + make_interval(mins => scheduled_start_time)) as task_start_at_local,
      format('action_reminder:%s:%s:%s:%s', task_id, scheduled_date, scheduled_start_time, reminder_minutes) as dispatch_key
    from candidates
    where reminder_minutes in (5, 10, 15, 30, 60)
  ),
  eligible as (
    select * from due
    where v_now_local >= reminder_at_local
      and v_now_local <= task_start_at_local + interval '15 minutes'
  ),
  reserved as (
    insert into public.action_reminder_dispatches (
      dispatch_key, user_id, task_id, action_id, scheduled_date, scheduled_start_time, reminder_at_local
    )
    select dispatch_key, user_id, task_id, action_id, scheduled_date, scheduled_start_time, reminder_at_local
    from eligible
    on conflict (dispatch_key) do nothing
    returning dispatch_key
  )
  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  select
    extensions.gen_random_uuid(),
    eligible.user_id,
    'action_reminder',
    case
      when v_now_local >= eligible.task_start_at_local then
        format('Agora: %s%s', eligible.action_name, case when eligible.arena_name <> '' then format(' • %s %s', eligible.arena_icon, eligible.arena_name) else '' end)
      else
        format('Em %s min: %s%s', eligible.reminder_minutes, eligible.action_name, case when eligible.arena_name <> '' then format(' • %s %s', eligible.arena_icon, eligible.arena_name) else '' end)
    end,
    false,
    now(),
    jsonb_build_object(
      'dispatchKey', eligible.dispatch_key,
      'taskId', eligible.task_id,
      'actionId', eligible.action_id,
      'arenaId', nullif(eligible.arena_id, ''),
      'scheduledFor', eligible.scheduled_date || ' ' || lpad(floor(eligible.scheduled_start_time / 60)::text, 2, '0') || ':' || lpad((eligible.scheduled_start_time % 60)::text, 2, '0'),
      'url', '/?view=planner'
    )
  from eligible
  join reserved on reserved.dispatch_key = eligible.dispatch_key;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;
