-- Fix RLS policies for sanctuary_positions table

-- 1. Drop existing policies to avoid conflicts
drop policy if exists "insert own position" on sanctuary_positions;
drop policy if exists "select clan positions" on sanctuary_positions;
drop policy if exists "update own position" on sanctuary_positions;
drop policy if exists "Users can all on own positions" on sanctuary_positions;

-- 2. Enable RLS (just in case)
alter table sanctuary_positions enable row level security;

-- 3. Create comprehensive policies

-- Allow users to INSERT their own positions
create policy "insert_own_position" on sanctuary_positions
  for insert with check (auth.uid() = user_id);

-- Allow users to SELECT positions from members of the same clan (including themselves)
create policy "select_clan_positions" on sanctuary_positions
  for select using (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_positions.clan_id
        and cm.user_id = auth.uid()
    )
  );

-- Allow users to UPDATE their own positions
-- USING: Which rows can be updated (must be own rows)
-- WITH CHECK: New state must also belong to user
create policy "update_own_position" on sanctuary_positions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to DELETE their own positions
create policy "delete_own_position" on sanctuary_positions
  for delete using (auth.uid() = user_id);

-- Fix for sanctuary_area_stats as well, just in case
drop policy if exists "select clan stats" on sanctuary_area_stats;
drop policy if exists "update clan stats" on sanctuary_area_stats;

alter table sanctuary_area_stats enable row level security;

create policy "select_clan_stats" on sanctuary_area_stats
  for select using (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  );

create policy "update_clan_stats" on sanctuary_area_stats
  for update
  using (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  );

-- Insert policy for stats (anyone in clan can initialize stats)
create policy "insert_clan_stats" on sanctuary_area_stats
  for insert with check (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  );
