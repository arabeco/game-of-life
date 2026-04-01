begin;

create or replace function public.enqueue_oracle_automatic_feed_webhook_for_user(p_user_id uuid)
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
      'limit', 1,
      'userId', p_user_id::text
    )
  );
end;
$$;

commit;
