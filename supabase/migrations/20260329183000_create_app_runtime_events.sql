create table if not exists public.app_runtime_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_session_id uuid not null,
  event_name text not null check (event_name in ('shell_ready', 'boot_error')),
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  entry_mode text null,
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.app_runtime_events is 'Minimal runtime boot telemetry kept separate from beta funnel metrics.';

create index if not exists app_runtime_events_created_at_idx
  on public.app_runtime_events (created_at desc);

create index if not exists app_runtime_events_event_created_at_idx
  on public.app_runtime_events (event_name, created_at desc);

create index if not exists app_runtime_events_user_created_at_idx
  on public.app_runtime_events (user_id, created_at desc);

alter table public.app_runtime_events enable row level security;

drop policy if exists "Users can insert own app runtime events" on public.app_runtime_events;
create policy "Users can insert own app runtime events"
  on public.app_runtime_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);
