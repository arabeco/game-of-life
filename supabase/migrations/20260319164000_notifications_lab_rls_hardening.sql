alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can delete own notifications" on public.notifications;
drop policy if exists "Users can notify friends" on public.notifications;

create policy "Users can view own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "Users can update own notifications"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own notifications"
on public.notifications
for delete
using (auth.uid() = user_id);

create policy "Users can notify friends"
on public.notifications
for insert
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.friends f
    where (f.user_id = auth.uid() and f.friend_id = notifications.user_id)
       or (f.user_id = notifications.user_id and f.friend_id = auth.uid())
  )
  or lower(
    coalesce(
      (select up.role from public.user_profiles up where up.id = auth.uid()),
      ''
    )
  ) in ('sovereign', 'gm', 'admin', 'admin_gm')
);
