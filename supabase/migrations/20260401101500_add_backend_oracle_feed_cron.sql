begin;

create or replace function public.enqueue_oracle_automatic_feed_webhook()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project_url text := '';
  v_webhook_secret text := '';
begin
  v_project_url := coalesce(public.get_internal_runtime_config('web_push_project_url'), '');
  v_webhook_secret := coalesce(public.get_internal_runtime_config('web_push_webhook_secret'), '');

  if coalesce(trim(v_project_url), '') = '' or coalesce(trim(v_webhook_secret), '') = '' then
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/oracle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-oracle-cron-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'action', 'generate-automatic-feed',
      'limit', 25
    )
  );
end;
$$;

do $$
begin
  begin
    perform cron.unschedule('glyph-generate-oracle-feed');
  exception
    when others then
      null;
  end;

  perform cron.schedule(
    'glyph-generate-oracle-feed',
    '*/10 * * * *',
    $cron$
      select public.enqueue_oracle_automatic_feed_webhook();
    $cron$
  );
exception
  when undefined_table then
    null;
end;
$$;

commit;
