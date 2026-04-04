begin;

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references public.user_profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.user_profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create unique index if not exists user_blocks_blocker_blocked_uidx
  on public.user_blocks (blocker_user_id, blocked_user_id);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_user_id, created_at desc);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_blocks_not_self'
  ) then
    alter table public.user_blocks
      add constraint user_blocks_not_self
      check (blocker_user_id <> blocked_user_id);
  end if;
end $$;

alter table public.user_blocks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_blocks'
      and policyname = 'Users can read own blocked users'
  ) then
    create policy "Users can read own blocked users"
      on public.user_blocks
      for select
      to authenticated
      using (auth.uid() = blocker_user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_blocks'
      and policyname = 'Users can insert own blocked users'
  ) then
    create policy "Users can insert own blocked users"
      on public.user_blocks
      for insert
      to authenticated
      with check (auth.uid() = blocker_user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_blocks'
      and policyname = 'Users can delete own blocked users'
  ) then
    create policy "Users can delete own blocked users"
      on public.user_blocks
      for delete
      to authenticated
      using (auth.uid() = blocker_user_id);
  end if;
end $$;

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.user_profiles(id) on delete cascade,
  target_user_id uuid references public.user_profiles(id) on delete set null,
  target_kind text not null,
  channel_kind text not null,
  target_id text,
  reason text not null,
  details text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_reports_reporter_idx
  on public.moderation_reports (reporter_user_id, created_at desc);

create index if not exists moderation_reports_target_user_idx
  on public.moderation_reports (target_user_id, created_at desc);

create index if not exists moderation_reports_status_idx
  on public.moderation_reports (status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_reports_target_kind_check'
  ) then
    alter table public.moderation_reports
      add constraint moderation_reports_target_kind_check
      check (target_kind in ('direct_message', 'clan_message', 'user'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_reports_channel_kind_check'
  ) then
    alter table public.moderation_reports
      add constraint moderation_reports_channel_kind_check
      check (channel_kind in ('dm', 'clan', 'profile'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_reports_reason_check'
  ) then
    alter table public.moderation_reports
      add constraint moderation_reports_reason_check
      check (reason in ('abuse', 'harassment', 'spam', 'sexual_content', 'hate', 'impersonation', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_reports_status_check'
  ) then
    alter table public.moderation_reports
      add constraint moderation_reports_status_check
      check (status in ('pending', 'reviewing', 'resolved', 'dismissed'));
  end if;
end $$;

alter table public.moderation_reports enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'moderation_reports'
      and policyname = 'Users can insert own moderation reports'
  ) then
    create policy "Users can insert own moderation reports"
      on public.moderation_reports
      for insert
      to authenticated
      with check (auth.uid() = reporter_user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'moderation_reports'
      and policyname = 'Users can read own moderation reports'
  ) then
    create policy "Users can read own moderation reports"
      on public.moderation_reports
      for select
      to authenticated
      using (auth.uid() = reporter_user_id);
  end if;
end $$;

create or replace function public.set_moderation_report_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_moderation_reports_set_updated_at on public.moderation_reports;

create trigger on_moderation_reports_set_updated_at
before update on public.moderation_reports
for each row
execute function public.set_moderation_report_updated_at();

create or replace function public.block_direct_message_if_users_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id is null or new.recipient_id is null or new.sender_id = new.recipient_id then
    return new;
  end if;

  if exists (
    select 1
    from public.user_blocks ub
    where (ub.blocker_user_id = new.sender_id and ub.blocked_user_id = new.recipient_id)
       or (ub.blocker_user_id = new.recipient_id and ub.blocked_user_id = new.sender_id)
  ) then
    raise exception 'DIRECT_MESSAGE_BLOCKED';
  end if;

  return new;
end;
$$;

drop trigger if exists before_direct_message_block_guard on public.direct_messages;

create trigger before_direct_message_block_guard
before insert on public.direct_messages
for each row
execute function public.block_direct_message_if_users_blocked();

commit;
