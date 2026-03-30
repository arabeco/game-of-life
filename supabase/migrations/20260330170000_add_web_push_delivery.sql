begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text null,
  device_label text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_success_at timestamptz null,
  disabled_at timestamptz null,
  failure_count integer not null default 0,
  last_error text null
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id, disabled_at, updated_at desc);

alter table if exists public.push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.notification_push_dispatches (
  notification_id text not null,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null default 'pending',
  response_code integer null,
  error_message text null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null,
  primary key (notification_id, subscription_id)
);

create index if not exists notification_push_dispatches_user_idx
  on public.notification_push_dispatches (user_id, created_at desc);

create table if not exists public.oracle_message_push_dispatches (
  message_id text not null,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null default 'pending',
  response_code integer null,
  error_message text null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null,
  primary key (message_id, subscription_id)
);

create index if not exists oracle_message_push_dispatches_user_idx
  on public.oracle_message_push_dispatches (user_id, created_at desc);

create table if not exists public.action_reminder_dispatches (
  dispatch_key text primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  task_id text not null,
  action_id text not null,
  scheduled_date text not null,
  scheduled_start_time integer not null,
  reminder_at_local timestamp not null,
  created_at timestamptz not null default now()
);

create index if not exists action_reminder_dispatches_user_idx
  on public.action_reminder_dispatches (user_id, created_at desc);

create table if not exists public.internal_runtime_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table if exists public.internal_runtime_config enable row level security;

revoke all on public.internal_runtime_config from public;
revoke all on public.internal_runtime_config from anon;
revoke all on public.internal_runtime_config from authenticated;

insert into public.internal_runtime_config (key, value)
values
  ('web_push_project_url', ''),
  ('web_push_webhook_secret', '')
on conflict (key) do nothing;

create or replace function public.get_internal_runtime_config(p_key text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select value
  from public.internal_runtime_config
  where key = p_key
  limit 1;
$$;

create or replace function public.set_push_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_push_subscription_updated_at on public.push_subscriptions;
create trigger set_push_subscription_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_push_subscription_updated_at();

create or replace function public.enqueue_notification_push_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project_url text := '';
  v_webhook_secret text := '';
  v_skip_push boolean := false;
begin
  if new.read then
    return new;
  end if;

  v_skip_push := lower(coalesce(new.metadata ->> 'skipPush', 'false')) in ('true', 't', '1', 'yes');
  if v_skip_push then
    return new;
  end if;

  if not exists (
    select 1
    from public.push_subscriptions ps
    where ps.user_id = new.user_id
      and ps.disabled_at is null
  ) then
    return new;
  end if;

  v_project_url := coalesce(public.get_internal_runtime_config('web_push_project_url'), '');
  v_webhook_secret := coalesce(public.get_internal_runtime_config('web_push_webhook_secret'), '');

  if coalesce(trim(v_project_url), '') = '' or coalesce(trim(v_webhook_secret), '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/web-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-web-push-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'action', 'dispatch-notification',
      'record', to_jsonb(new)
    )
  );

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_notification_enqueue_push_webhook on public.notifications;
create trigger on_notification_enqueue_push_webhook
after insert on public.notifications
for each row
execute function public.enqueue_notification_push_webhook();

create or replace function public.enqueue_oracle_message_push_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project_url text := '';
  v_webhook_secret text := '';
begin
  if coalesce(new.delivery_type, '') <> 'feed' or coalesce(new.read, false) then
    return new;
  end if;

  if not exists (
    select 1
    from public.push_subscriptions ps
    where ps.user_id = new.user_id
      and ps.disabled_at is null
  ) then
    return new;
  end if;

  v_project_url := coalesce(public.get_internal_runtime_config('web_push_project_url'), '');
  v_webhook_secret := coalesce(public.get_internal_runtime_config('web_push_webhook_secret'), '');

  if coalesce(trim(v_project_url), '') = '' or coalesce(trim(v_webhook_secret), '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/web-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-web-push-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'action', 'dispatch-oracle-message',
      'record', to_jsonb(new)
    )
  );

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_oracle_message_enqueue_push_webhook on public.oracle_messages;
create trigger on_oracle_message_enqueue_push_webhook
after insert on public.oracle_messages
for each row
execute function public.enqueue_oracle_message_push_webhook();

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
  with due as (
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
      (nullif(st.date::text, '')::date::timestamp + make_interval(mins => st.start_time - 15)) as reminder_at_local,
      (nullif(st.date::text, '')::date::timestamp + make_interval(mins => st.start_time)) as task_start_at_local,
      format('action_reminder:%s:%s:%s', st.id::text, st.date, st.start_time) as dispatch_key
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
    left join public.arenas ar
      on ar.id = a.arena_id
    left join public.oracle_preferences op
      on op.user_id = st.user_id
    where coalesce(st.completed, false) = false
      and st.start_time is not null
      and st.start_time >= 0
      and coalesce((a.context->'schedule'->>'notifyBeforeMinutes')::int, 0) = 15
      and coalesce(op.notifications_enabled, true) = true
      and exists (
        select 1
        from public.push_subscriptions ps
        where ps.user_id = st.user_id
          and ps.disabled_at is null
      )
      and v_now_local >= (nullif(st.date::text, '')::date::timestamp + make_interval(mins => st.start_time - 15))
      and v_now_local <= (nullif(st.date::text, '')::date::timestamp + make_interval(mins => st.start_time + 15))
  ),
  reserved as (
    insert into public.action_reminder_dispatches (
      dispatch_key,
      user_id,
      task_id,
      action_id,
      scheduled_date,
      scheduled_start_time,
      reminder_at_local
    )
    select
      due.dispatch_key,
      due.user_id,
      due.task_id,
      due.action_id,
      due.scheduled_date,
      due.scheduled_start_time,
      due.reminder_at_local
    from due
    on conflict (dispatch_key) do nothing
    returning dispatch_key
  )
  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  )
  select
    extensions.gen_random_uuid(),
    due.user_id,
    'action_reminder',
    case
      when v_now_local >= due.task_start_at_local then
        format(
          'Agora: %s%s',
          due.action_name,
          case
            when due.arena_name <> '' then format(' • %s %s', due.arena_icon, due.arena_name)
            else ''
          end
        )
      else
        format(
          'Em 15 min: %s%s',
          due.action_name,
          case
            when due.arena_name <> '' then format(' • %s %s', due.arena_icon, due.arena_name)
            else ''
          end
        )
    end,
    false,
    now(),
    jsonb_build_object(
      'dispatchKey', due.dispatch_key,
      'taskId', due.task_id,
      'actionId', due.action_id,
      'arenaId', nullif(due.arena_id, ''),
      'scheduledFor', due.scheduled_date || ' ' || lpad(floor(due.scheduled_start_time / 60)::text, 2, '0') || ':' || lpad((due.scheduled_start_time % 60)::text, 2, '0'),
      'url', '/?view=planner'
    )
  from due
  join reserved
    on reserved.dispatch_key = due.dispatch_key;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

do $$
begin
  begin
    perform cron.unschedule('glyph-enqueue-action-reminders');
  exception
    when others then
      null;
  end;

  perform cron.schedule(
    'glyph-enqueue-action-reminders',
    '* * * * *',
    $cron$
      select public.enqueue_due_action_reminder_notifications();
    $cron$
  );
exception
  when undefined_table then
    null;
end;
$$;

commit;
