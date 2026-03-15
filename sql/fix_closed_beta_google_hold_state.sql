-- Closed beta hold-state must happen after auth session creation, in the app flow.
-- Blocking user_profiles inserts during auth signup causes OAuth signups to fail
-- before the Bilhete Dourado modal can be shown.

drop trigger if exists enforce_closed_beta_user_profile_insert on public.user_profiles;
drop function if exists public.enforce_closed_beta_user_profile_insert();

do $$
declare
  v_trigger record;
  v_function_sql text;
begin
  for v_trigger in
    select
      t.tgname as trigger_name,
      p.oid as function_oid
    from pg_trigger t
    join pg_class c
      on c.oid = t.tgrelid
    join pg_namespace n
      on n.oid = c.relnamespace
    join pg_proc p
      on p.oid = t.tgfoid
    where not t.tgisinternal
      and n.nspname = 'auth'
      and c.relname = 'users'
  loop
    select lower(pg_get_functiondef(v_trigger.function_oid))
    into v_function_sql;

    if v_function_sql like '%user_profiles%'
      and (
        v_function_sql like '%insert into public.user_profiles%'
        or v_function_sql like '%insert into user_profiles%'
        or v_function_sql like '%upsert%'
      ) then
      execute format('drop trigger if exists %I on auth.users', v_trigger.trigger_name);
    end if;
  end loop;
end;
$$;
