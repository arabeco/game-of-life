begin;

alter table if exists public.oracle_preferences
  add column if not exists dm_notifications_enabled boolean not null default true;

update public.oracle_preferences
set dm_notifications_enabled = true
where dm_notifications_enabled is null;

create or replace function public.notify_direct_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_nickname text := 'Alguem';
  v_notifications_enabled boolean := true;
  v_dm_notifications_enabled boolean := true;
begin
  if new.sender_id is null or new.recipient_id is null or new.sender_id = new.recipient_id then
    return new;
  end if;

  select coalesce(nullif(trim(nickname), ''), 'Alguem')
  into v_sender_nickname
  from public.user_profiles
  where id = new.sender_id;

  select
    coalesce(op.notifications_enabled, true),
    coalesce(op.dm_notifications_enabled, true)
  into
    v_notifications_enabled,
    v_dm_notifications_enabled
  from public.oracle_preferences op
  where op.user_id = new.recipient_id
  limit 1;

  v_notifications_enabled := coalesce(v_notifications_enabled, true);
  v_dm_notifications_enabled := coalesce(v_dm_notifications_enabled, true);

  if not v_notifications_enabled or not v_dm_notifications_enabled then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    type,
    content,
    read,
    metadata
  ) values (
    new.recipient_id,
    'direct_message',
    v_sender_nickname || ' enviou uma mensagem direta.',
    false,
    jsonb_build_object(
      'senderId', new.sender_id,
      'senderNickname', v_sender_nickname,
      'messageId', new.id,
      'url', '/?oracle=dms'
    )
  );

  return new;
end;
$$;

drop trigger if exists on_direct_message_created_notify_recipient on public.direct_messages;

create trigger on_direct_message_created_notify_recipient
after insert on public.direct_messages
for each row
execute function public.notify_direct_message_created();

commit;
