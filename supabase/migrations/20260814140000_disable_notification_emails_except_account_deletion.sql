create or replace function public.prepare_notification_email_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    - 'sendEmail'
    - 'emailSubject'
    - 'welcome';
  return new;
end;
$$;

drop trigger if exists on_notification_prepare_email_metadata on public.notifications;

create trigger on_notification_prepare_email_metadata
before insert on public.notifications
for each row
execute function public.prepare_notification_email_metadata();
