create or replace function public.notify_clan_join_request_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leader_id uuid;
  v_clan_name text := 'seu grupo';
  v_requester_nickname text := 'Alguem';
begin
  if lower(coalesce(new.status, 'pending')) <> 'pending' then
    return new;
  end if;

  select coalesce(nullif(trim(name), ''), 'seu grupo')
  into v_clan_name
  from public.clans
  where id = new.clan_id;

  select cm.user_id
  into v_leader_id
  from public.clan_members cm
  where cm.clan_id = new.clan_id
    and cm.role = 'leader'
  order by cm.joined_at asc
  limit 1;

  if v_leader_id is null or v_leader_id = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(nickname), ''), 'Alguem')
  into v_requester_nickname
  from public.user_profiles
  where id = new.user_id;

  insert into public.notifications (
    user_id,
    type,
    content,
    read,
    metadata
  ) values (
    v_leader_id,
    'clan_invite',
    v_requester_nickname || ' solicitou entrada em ' || v_clan_name || '.',
    false,
    jsonb_build_object(
      'joinRequest', true,
      'requestId', new.id,
      'requesterId', new.user_id,
      'requesterNickname', v_requester_nickname,
      'clanId', new.clan_id,
      'clanName', v_clan_name,
      'url', '/?oracle=clan',
      'emailSubject', 'Glyph - Pedido para entrar no grupo'
    )
  );

  return new;
end;
$$;

drop trigger if exists on_clan_join_request_created_notify_leader on public.clan_join_requests;

create trigger on_clan_join_request_created_notify_leader
after insert on public.clan_join_requests
for each row
execute function public.notify_clan_join_request_created();
