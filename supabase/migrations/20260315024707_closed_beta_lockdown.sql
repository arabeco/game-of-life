-- CLOSED BETA LOCKDOWN
-- Run in Supabase SQL Editor.
-- This script:
-- 1) hardens golden_invites behind RPC only
-- 2) removes burned invite codes exposed in the old client bundle
-- 3) tops up to 5 fresh unused invites
-- 4) creates a real delete_my_account() RPC for the app
--
-- Important limitation:
-- SQL removes auth + database rows. Public files in storage buckets still need
-- separate cleanup if you want zero file residue in storage.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1) Harden golden_invites
-- ---------------------------------------------------------------------------

alter table public.golden_invites enable row level security;

update public.golden_invites
set is_used = false
where is_used is null;

alter table public.golden_invites
  alter column is_used set default false;

alter table public.golden_invites
  alter column is_used set not null;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'golden_invites'
  loop
    execute format('drop policy if exists %I on public.golden_invites', policy_row.policyname);
  end loop;
end
$$;

revoke all on table public.golden_invites from public;
revoke all on table public.golden_invites from anon;
revoke all on table public.golden_invites from authenticated;

create unique index if not exists golden_invites_code_ci_idx
  on public.golden_invites ((lower(code)));

-- Burn codes that were exposed in the old frontend bundle or are legacy/test codes.
delete from public.golden_invites
where lower(code) in (
  'temp123',
  'ouro2024alpha',
  'ouro2024beta',
  'ouro2026ahtn19g',
  'ouro2026-001',
  'ouro2026-002',
  'ouro2026-003',
  'ouro2026-004',
  'ouro2026-005',
  'ouro2026-destino',
  'ouro2026-gloria',
  'ouro2026-impulso',
  'ouro2026-legado',
  'ouro2026-maestria',
  'ouro2026-poder',
  'ouro2026-renascer',
  'ouro2026-sabedoria',
  'ouro2026-visionario'
);

create or replace function public.check_golden_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := trim(coalesce(p_code, ''));
  v_invite public.golden_invites%rowtype;
begin
  if v_code = '' then
    return jsonb_build_object('valid', false, 'invite', null);
  end if;

  select *
  into v_invite
  from public.golden_invites
  where lower(code) = lower(v_code)
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'invite', null);
  end if;

  return jsonb_build_object(
    'valid', not v_invite.is_used,
    'invite', jsonb_build_object(
      'id', v_invite.id,
      'code', v_invite.code,
      'is_used', v_invite.is_used,
      'claimed_by_user_id', null,
      'claimed_at', null,
      'created_at', v_invite.created_at
    )
  );
end;
$$;

create or replace function public.get_closed_beta_access_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_has_profile boolean := false;
  v_has_invite boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('authorized', false, 'has_profile', false, 'has_invite', false);
  end if;

  select exists(
    select 1
    from public.user_profiles
    where id = v_uid
  ) into v_has_profile;

  select exists(
    select 1
    from public.golden_invites
    where claimed_by_user_id = v_uid
      and is_used = true
  ) into v_has_invite;

  return jsonb_build_object(
    'authorized', (v_has_profile or v_has_invite),
    'has_profile', v_has_profile,
    'has_invite', v_has_invite
  );
end;
$$;

create or replace function public.consume_golden_invite(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_code text := trim(coalesce(p_code, ''));
  v_auth_uid uuid := auth.uid();
  v_invite public.golden_invites%rowtype;
begin
  if v_code = '' then
    return jsonb_build_object('success', false, 'error', 'EMPTY_CODE', 'invite', null);
  end if;

  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER', 'invite', null);
  end if;

  if v_auth_uid is not null and v_auth_uid <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'USER_MISMATCH', 'invite', null);
  end if;

  if not exists (
    select 1
    from auth.users
    where id = p_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND', 'invite', null);
  end if;

  select *
  into v_invite
  from public.golden_invites
  where lower(code) = lower(v_code)
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'INVITE_NOT_FOUND', 'invite', null);
  end if;

  if v_invite.is_used and v_invite.claimed_by_user_id = p_user_id then
    return jsonb_build_object(
      'success', true,
      'invite', jsonb_build_object(
        'id', v_invite.id,
        'code', v_invite.code,
        'is_used', v_invite.is_used,
        'claimed_by_user_id', v_invite.claimed_by_user_id,
        'claimed_at', v_invite.claimed_at,
        'created_at', v_invite.created_at
      )
    );
  end if;

  if v_invite.is_used then
    return jsonb_build_object('success', false, 'error', 'INVITE_ALREADY_USED', 'invite', null);
  end if;

  update public.golden_invites
  set is_used = true,
      claimed_by_user_id = p_user_id,
      claimed_at = now()
  where id = v_invite.id
  returning * into v_invite;

  return jsonb_build_object(
    'success', true,
    'invite', jsonb_build_object(
      'id', v_invite.id,
      'code', v_invite.code,
      'is_used', v_invite.is_used,
      'claimed_by_user_id', v_invite.claimed_by_user_id,
      'claimed_at', v_invite.claimed_at,
      'created_at', v_invite.created_at
    )
  );
end;
$$;

create or replace function public.issue_golden_invites(p_count integer default 5)
returns table (code text, created_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_remaining integer := greatest(coalesce(p_count, 0), 0);
  v_code text;
  v_row public.golden_invites%rowtype;
begin
  while v_remaining > 0 loop
    loop
      v_code := format(
        'ouro%s-%s',
        to_char(current_date, 'YYYY'),
        upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 10))
      );
      exit when not exists (
        select 1
        from public.golden_invites
        where lower(code) = lower(v_code)
      );
    end loop;

    insert into public.golden_invites (code, is_used)
    values (v_code, false)
    returning * into v_row;

    code := v_row.code;
    created_at := v_row.created_at;
    return next;

    v_remaining := v_remaining - 1;
  end loop;
end;
$$;

revoke all on function public.check_golden_invite(text) from public;
revoke all on function public.get_closed_beta_access_status() from public;
revoke all on function public.consume_golden_invite(text, uuid) from public;
revoke all on function public.issue_golden_invites(integer) from public;

grant execute on function public.check_golden_invite(text) to anon;
grant execute on function public.check_golden_invite(text) to authenticated;
grant execute on function public.get_closed_beta_access_status() to authenticated;
grant execute on function public.consume_golden_invite(text, uuid) to anon;
grant execute on function public.consume_golden_invite(text, uuid) to authenticated;

-- Keep exactly 5 live unused invites after cleanup.
select *
from public.issue_golden_invites(
  greatest(
    0,
    5 - coalesce((select count(*)::int from public.golden_invites where is_used = false), 0)
  )
);

create or replace function public.delete_account_data_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := p_user_id;
  v_leader_clan_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER_ID');
  end if;

  if to_regclass('public.clan_members') is not null then
    for v_leader_clan_id in
      select distinct clan_id
      from public.clan_members
      where user_id = v_uid
        and role = 'leader'
    loop
      perform public._delete_public_rows_if_uuid_match('clan_mission_participants', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_mission_progress', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_join_requests', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_slots', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_presence', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_positions', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_area_stats', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_members', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clans', 'id', v_leader_clan_id);
    end loop;
  end if;

  perform public._delete_public_rows_by_common_user_columns(v_uid);
  perform public._nullify_public_uuid_column('golden_invites', 'claimed_by_user_id', v_uid);
  perform public._delete_public_rows_if_uuid_match('user_profiles', 'id', v_uid);

  return jsonb_build_object('success', true);
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.delete_account_data_for_user(uuid) from public;
grant execute on function public.delete_account_data_for_user(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2) Real account deletion RPC
-- ---------------------------------------------------------------------------


create table if not exists public.account_deletion_requests (
  id bigint generated by default as identity primary key,
  user_id uuid not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'started',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists account_deletion_requests_user_id_idx
  on public.account_deletion_requests (user_id, requested_at desc);

alter table public.account_deletion_requests enable row level security;

revoke all on table public.account_deletion_requests from public;
revoke all on table public.account_deletion_requests from anon;
revoke all on table public.account_deletion_requests from authenticated;

create or replace function public._delete_public_rows_if_uuid_match(
  p_table_name text,
  p_column_name text,
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value is null then
    return;
  end if;

  if to_regclass(format('public.%I', p_table_name)) is null then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table_name
      and column_name = p_column_name
  ) then
    execute format('delete from public.%I where %I = $1', p_table_name, p_column_name)
    using p_value;
  end if;
end;
$$;

create or replace function public._delete_public_rows_if_any_uuid_match(
  p_table_name text,
  p_column_names text[],
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_where text;
begin
  if p_value is null then
    return;
  end if;

  if to_regclass(format('public.%I', p_table_name)) is null then
    return;
  end if;

  select string_agg(format('%I = $1', column_name), ' or ' order by ordinal_position)
  into v_where
  from information_schema.columns
  where table_schema = 'public'
    and table_name = p_table_name
    and column_name = any(p_column_names);

  if v_where is null then
    return;
  end if;

  execute format('delete from public.%I where %s', p_table_name, v_where)
  using p_value;
end;
$$;

create or replace function public._delete_public_rows_by_common_user_columns(p_value uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_row record;
begin
  if p_value is null then
    return;
  end if;

  for table_row in
    select
      table_name,
      array_agg(column_name order by ordinal_position)::text[] as column_names
    from information_schema.columns
    where table_schema = 'public'
      and column_name in (
        'user_id',
        'owner_id',
        'sender_id',
        'recipient_id',
        'mentor_id',
        'pupil_id',
        'friend_id'
      )
    group by table_name
  loop
    perform public._delete_public_rows_if_any_uuid_match(
      table_row.table_name,
      table_row.column_names,
      p_value
    );
  end loop;
end;
$$;

create or replace function public._nullify_public_uuid_column(
  p_table_name text,
  p_column_name text,
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value is null then
    return;
  end if;

  if to_regclass(format('public.%I', p_table_name)) is null then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table_name
      and column_name = p_column_name
  ) then
    execute format('update public.%I set %I = null where %I = $1', p_table_name, p_column_name, p_column_name)
    using p_value;
  end if;
end;
$$;

create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_request_id bigint;
  v_leader_clan_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  insert into public.account_deletion_requests (user_id, status, metadata)
  values (
    v_uid,
    'started',
    jsonb_build_object(
      'storage_cleanup_pending', true,
      'notes', 'SQL removed auth + database rows. Public storage files need separate cleanup if applicable.'
    )
  )
  returning id into v_request_id;

  if to_regclass('public.clan_members') is not null then
    for v_leader_clan_id in
      select distinct clan_id
      from public.clan_members
      where user_id = v_uid
        and role = 'leader'
    loop
      perform public._delete_public_rows_if_uuid_match('clan_mission_participants', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_mission_progress', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_join_requests', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_slots', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_presence', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_positions', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_area_stats', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_members', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clans', 'id', v_leader_clan_id);
    end loop;
  end if;

  perform public._delete_public_rows_by_common_user_columns(v_uid);
  perform public._nullify_public_uuid_column('golden_invites', 'claimed_by_user_id', v_uid);
  perform public._delete_public_rows_if_uuid_match('user_profiles', 'id', v_uid);

  delete from auth.users
  where id = v_uid;

  update public.account_deletion_requests
  set status = 'completed',
      completed_at = now(),
      metadata = metadata || jsonb_build_object('completed_via', 'delete_my_account_rpc')
  where id = v_request_id;

  return jsonb_build_object('success', true);
exception
  when others then
    if v_request_id is not null then
      update public.account_deletion_requests
      set status = 'failed',
          completed_at = now(),
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('error', sqlerrm)
      where id = v_request_id;
    end if;

    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

revoke all on function public._delete_public_rows_if_uuid_match(text, text, uuid) from public;
revoke all on function public._delete_public_rows_if_any_uuid_match(text, text[], uuid) from public;
revoke all on function public._delete_public_rows_by_common_user_columns(uuid) from public;
revoke all on function public._nullify_public_uuid_column(text, text, uuid) from public;
revoke all on function public.delete_my_account() from public;

grant execute on function public.delete_my_account() to authenticated;
