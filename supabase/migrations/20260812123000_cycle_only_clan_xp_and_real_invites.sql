begin;

-- Clan EXP is permanent and may only be deposited by a closed cycle.
create table if not exists public.clan_xp_contributions (
  id bigint generated always as identity primary key,
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_amount integer not null check (xp_amount > 0),
  source_key text not null check (char_length(source_key) between 3 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create index if not exists clan_xp_contributions_clan_user_idx
  on public.clan_xp_contributions (clan_id, user_id);

alter table public.clan_xp_contributions enable row level security;
revoke all on table public.clan_xp_contributions from anon, authenticated;
grant select on table public.clan_xp_contributions to authenticated;

drop policy if exists "Clan members can read contribution history" on public.clan_xp_contributions;
create policy "Clan members can read contribution history"
on public.clan_xp_contributions
for select
to authenticated
using (
  exists (
    select 1
    from public.clan_members membership
    where membership.clan_id = clan_xp_contributions.clan_id
      and membership.user_id = auth.uid()
  )
);

create or replace function public.record_my_clan_xp(
  p_xp_amount integer,
  p_source_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_inserted_id bigint;
  v_clan_exp integer;
  v_member_total integer;
  v_source_key text := trim(coalesce(p_source_key, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_xp_amount is null or p_xp_amount <= 0 then
    raise exception 'XP amount must be positive';
  end if;

  if left(v_source_key, 6) <> 'cycle:' or char_length(v_source_key) not between 7 and 160 then
    return jsonb_build_object('awarded', false, 'reason', 'cycle_close_required');
  end if;

  select membership.clan_id into v_clan_id
  from public.clan_members membership
  where membership.user_id = v_user_id
  order by membership.joined_at desc nulls last
  limit 1;

  if v_clan_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_in_clan');
  end if;

  insert into public.clan_xp_contributions (clan_id, user_id, xp_amount, source_key)
  values (v_clan_id, v_user_id, p_xp_amount, v_source_key)
  on conflict (user_id, source_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'already_recorded');
  end if;

  update public.clans
  set exp = coalesce(exp, 0) + p_xp_amount,
      rank_id = case
        when coalesce(exp, 0) + p_xp_amount >= 2500000 then 'imperio'
        when coalesce(exp, 0) + p_xp_amount >= 1000000 then 'dinastia'
        when coalesce(exp, 0) + p_xp_amount >= 400000 then 'reino'
        when coalesce(exp, 0) + p_xp_amount >= 150000 then 'principado'
        when coalesce(exp, 0) + p_xp_amount >= 50000 then 'provincia'
        when coalesce(exp, 0) + p_xp_amount >= 10000 then 'bastiao'
        else 'feudo'
      end
  where id = v_clan_id
  returning exp into v_clan_exp;

  select coalesce(sum(contribution.xp_amount), 0)::integer into v_member_total
  from public.clan_xp_contributions contribution
  where contribution.clan_id = v_clan_id
    and contribution.user_id = v_user_id;

  return jsonb_build_object(
    'awarded', true,
    'clan_id', v_clan_id,
    'clan_exp', v_clan_exp,
    'member_total', v_member_total
  );
end;
$$;

revoke all on function public.record_my_clan_xp(integer, text) from public;
grant execute on function public.record_my_clan_xp(integer, text) to authenticated;

create or replace function public.send_my_clan_invite(p_invitee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_clan_name text;
  v_inviter_name text;
  v_notification_id text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_invitee_id is null or p_invitee_id = v_user_id then
    return jsonb_build_object('sent', false, 'reason', 'invalid_invitee');
  end if;

  select cm.clan_id, c.name into v_clan_id, v_clan_name
  from public.clan_members cm
  join public.clans c on c.id = cm.clan_id
  where cm.user_id = v_user_id and cm.role = 'leader'
  limit 1;

  if v_clan_id is null then return jsonb_build_object('sent', false, 'reason', 'leader_required'); end if;
  if not exists (
    select 1 from public.friends f
    where (f.user_id = v_user_id and f.friend_id = p_invitee_id)
       or (f.user_id = p_invitee_id and f.friend_id = v_user_id)
  ) then
    return jsonb_build_object('sent', false, 'reason', 'friend_required');
  end if;
  perform pg_advisory_xact_lock(hashtext(v_clan_id::text || ':' || p_invitee_id::text));
  if exists (select 1 from public.clan_members where user_id = p_invitee_id) then
    return jsonb_build_object('sent', false, 'reason', 'already_in_clan');
  end if;
  if (select count(*) from public.clan_members where clan_id = v_clan_id) >= 10 then
    return jsonb_build_object('sent', false, 'reason', 'clan_full');
  end if;
  if exists (
    select 1 from public.notifications n
    where n.user_id = p_invitee_id
      and n.type = 'clan_invite'
      and coalesce((n.metadata->>'inviteNotification')::boolean, false)
      and n.metadata->>'clanId' = v_clan_id::text
      and n.metadata->>'inviterId' = v_user_id::text
  ) then
    return jsonb_build_object('sent', false, 'reason', 'already_invited');
  end if;

  select coalesce(nullif(trim(nickname), ''), 'Lider') into v_inviter_name
  from public.user_profiles where id = v_user_id;

  insert into public.notifications (user_id, type, content, read, metadata)
  values (
    p_invitee_id,
    'clan_invite',
    coalesce(v_inviter_name, 'Lider') || ' convidou voce para entrar em ' || v_clan_name || '.',
    false,
    jsonb_build_object(
      'clanId', v_clan_id,
      'clanName', v_clan_name,
      'inviteNotification', true,
      'joinRequest', false,
      'inviterId', v_user_id,
      'senderId', v_user_id,
      'senderNickname', coalesce(v_inviter_name, 'Lider'),
      'url', '/?oracle=clan'
    )
  ) returning id::text into v_notification_id;

  return jsonb_build_object('sent', true, 'notification_id', v_notification_id);
end;
$$;

create or replace function public.get_my_pending_clan_invitee_ids()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(n.user_id order by n.created_at desc), '{}'::uuid[])
  from public.notifications n
  where n.type = 'clan_invite'
    and coalesce((n.metadata->>'inviteNotification')::boolean, false)
    and n.metadata->>'inviterId' = auth.uid()::text;
$$;

create or replace function public.revoke_my_clan_invite(p_invitee_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.notifications n
  where n.user_id = p_invitee_id
    and n.type = 'clan_invite'
    and coalesce((n.metadata->>'inviteNotification')::boolean, false)
    and n.metadata->>'inviterId' = auth.uid()::text;
  get diagnostics v_deleted = row_count;
  return jsonb_build_object('revoked', v_deleted > 0);
end;
$$;

create or replace function public.respond_to_my_clan_invite(
  p_notification_id text,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite record;
  v_clan_id uuid;
  v_clan_name text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select n.* into v_invite
  from public.notifications n
  where n.id::text = p_notification_id
    and n.user_id = v_user_id
    and n.type = 'clan_invite'
    and coalesce((n.metadata->>'inviteNotification')::boolean, false)
  for update;

  if v_invite.id is null then return jsonb_build_object('responded', false, 'reason', 'invite_not_found'); end if;
  v_clan_id := (v_invite.metadata->>'clanId')::uuid;

  if not coalesce(p_accept, false) then
    delete from public.notifications where id = v_invite.id;
    return jsonb_build_object('responded', true, 'accepted', false);
  end if;

  if exists (select 1 from public.clan_members where user_id = v_user_id) then
    return jsonb_build_object('responded', false, 'reason', 'already_in_clan');
  end if;
  if not exists (select 1 from public.clans where id = v_clan_id) then
    delete from public.notifications where id = v_invite.id;
    return jsonb_build_object('responded', false, 'reason', 'clan_not_found');
  end if;
  perform 1 from public.clans where id = v_clan_id for update;
  if (select count(*) from public.clan_members where clan_id = v_clan_id) >= 10 then
    return jsonb_build_object('responded', false, 'reason', 'clan_full');
  end if;

  insert into public.clan_members (user_id, clan_id, role)
  values (v_user_id, v_clan_id, 'member');

  select name into v_clan_name from public.clans where id = v_clan_id;
  delete from public.clan_join_requests where user_id = v_user_id and status = 'pending';
  delete from public.notifications n
  where n.user_id = v_user_id
    and n.type = 'clan_invite'
    and coalesce((n.metadata->>'inviteNotification')::boolean, false);

  insert into public.notifications (user_id, type, content, read, metadata)
  values (
    (v_invite.metadata->>'inviterId')::uuid,
    'clan_response',
    coalesce((select nickname from public.user_profiles where id = v_user_id), 'A pessoa convidada') || ' aceitou o convite para ' || v_clan_name || '.',
    false,
    jsonb_build_object('clanId', v_clan_id, 'clanName', v_clan_name, 'acceptedUserId', v_user_id)
  );

  return jsonb_build_object('responded', true, 'accepted', true, 'clan_id', v_clan_id);
end;
$$;

revoke all on function public.send_my_clan_invite(uuid) from public;
revoke all on function public.get_my_pending_clan_invitee_ids() from public;
revoke all on function public.revoke_my_clan_invite(uuid) from public;
revoke all on function public.respond_to_my_clan_invite(text, boolean) from public;
grant execute on function public.send_my_clan_invite(uuid) to authenticated;
grant execute on function public.get_my_pending_clan_invitee_ids() to authenticated;
grant execute on function public.revoke_my_clan_invite(uuid) to authenticated;
grant execute on function public.respond_to_my_clan_invite(text, boolean) to authenticated;

commit;
