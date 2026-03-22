create table if not exists public.notification_email_dispatches (
  dispatch_key text primary key,
  notification_id uuid null references public.notifications(id) on delete cascade,
  user_id uuid null references public.user_profiles(id) on delete cascade,
  notification_type text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.prepare_notification_email_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_metadata jsonb := coalesce(new.metadata, '{}'::jsonb);
  v_email text := '';
  v_send_email boolean := lower(coalesce(v_metadata ->> 'sendEmail', 'false')) in ('true', 't', '1', 'yes');
  v_welcome boolean := lower(coalesce(v_metadata ->> 'welcome', 'false')) in ('true', 't', '1', 'yes');
  v_subject text := '';
begin
  if new.type in ('mentor_invite', 'partnership_invite', 'clan_invite') then
    v_send_email := true;
  end if;

  if not v_send_email and not v_welcome then
    new.metadata := v_metadata;
    return new;
  end if;

  if coalesce(trim(v_metadata ->> 'email'), '') = '' then
    select trim(coalesce(email, ''))
    into v_email
    from public.user_profiles
    where id = new.user_id;

    if v_email <> '' and lower(v_email) not like '%@gol.local' then
      v_metadata := v_metadata || jsonb_build_object('email', v_email);
    end if;
  end if;

  if v_send_email and not (v_metadata ? 'sendEmail') then
    v_metadata := v_metadata || jsonb_build_object('sendEmail', true);
  end if;

  if coalesce(trim(v_metadata ->> 'emailSubject'), '') = '' then
    v_subject := case
      when v_welcome then 'Glyph - Bem-vindo!'
      when new.type = 'mentor_invite' then 'Glyph - Convite de mentoria'
      when new.type = 'partnership_invite' then 'Glyph - Convite de parceria'
      when new.type = 'clan_invite' then 'Glyph - Convite de cla'
      else ''
    end;

    if v_subject <> '' then
      v_metadata := v_metadata || jsonb_build_object('emailSubject', v_subject);
    end if;
  end if;

  new.metadata := v_metadata;
  return new;
end;
$$;

drop trigger if exists on_notification_prepare_email_metadata on public.notifications;

create trigger on_notification_prepare_email_metadata
before insert on public.notifications
for each row
execute function public.prepare_notification_email_metadata();
