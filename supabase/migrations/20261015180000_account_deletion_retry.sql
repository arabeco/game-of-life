begin;
alter table public.account_deletion_requests
  add column if not exists retry_after timestamptz default now(),
  add column if not exists lease_until timestamptz,
  add column if not exists retry_count integer not null default 0;

create or replace function public.begin_account_deletion(p_user_id uuid, p_metadata jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.account_deletion_requests%rowtype;
begin
  if p_user_id is null then raise exception 'User required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into r from public.account_deletion_requests
    where user_id=p_user_id and status in ('started','failed','cleanup_pending')
    order by requested_at desc limit 1 for update;
  if found then
    if r.lease_until > now() then return jsonb_build_object('busy',true,'request',to_jsonb(r)); end if;
    update public.account_deletion_requests set
      metadata=metadata || p_metadata, lease_until=now()+interval '10 minutes', retry_count=0
      where id=r.id returning * into r;
  else
    insert into public.account_deletion_requests(user_id,status,metadata,lease_until)
      values(p_user_id,'started',p_metadata,now()+interval '10 minutes') returning * into r;
  end if;
  return jsonb_build_object('busy',false,'request',to_jsonb(r));
end; $$;

create or replace function public.claim_account_deletion_retries()
returns setof public.account_deletion_requests
language sql security definer set search_path = public as $$
  update public.account_deletion_requests r set
    lease_until=now()+interval '10 minutes', retry_count=retry_count+1
  where r.id in (
    select id from public.account_deletion_requests
    where status in ('started','failed','cleanup_pending')
      and (metadata->>'identity_verified'='true' or metadata->>'auth_deleted'='true')
      and retry_count < 10 and coalesce(retry_after,requested_at) <= now()
      and (lease_until is null or lease_until < now())
    order by requested_at for update skip locked limit 5
  ) returning r.*;
$$;

create or replace function public.enqueue_account_deletion_retry()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare project_url text; secret text;
begin
  project_url:=public.get_internal_runtime_config('web_push_project_url');
  secret:=public.get_internal_runtime_config('web_push_webhook_secret');
  if coalesce(project_url,'')='' or coalesce(secret,'')='' then
    raise warning 'Account deletion retry: internal runtime config missing'; return;
  end if;
  perform net.http_post(
    url:=rtrim(project_url,'/')||'/functions/v1/account-delete-retry',
    headers:=jsonb_build_object('Content-Type','application/json','x-account-cleanup-secret',secret),
    body:='{}'::jsonb, timeout_milliseconds:=120000);
end; $$;

revoke all on function public.begin_account_deletion(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.claim_account_deletion_retries() from public, anon, authenticated;
revoke all on function public.enqueue_account_deletion_retry() from public, anon, authenticated;
grant execute on function public.begin_account_deletion(uuid,jsonb) to service_role;
grant execute on function public.claim_account_deletion_retries() to service_role;
grant execute on function public.enqueue_account_deletion_retry() to service_role;
do $$ begin
  if exists(select 1 from cron.job where jobname='glyph-account-deletion-retry') then
    perform cron.unschedule('glyph-account-deletion-retry');
  end if;
  perform cron.schedule('glyph-account-deletion-retry','*/15 * * * *','select public.enqueue_account_deletion_retry();');
end; $$;
commit;
