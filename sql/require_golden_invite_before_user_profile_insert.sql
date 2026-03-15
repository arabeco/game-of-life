create or replace function public.enforce_closed_beta_user_profile_insert()
returns trigger
language plpgsql
set search_path = public, auth
as $$
declare
  v_request_role text := lower(coalesce(current_setting('request.jwt.claim.role', true), ''));
  v_has_invite boolean := false;
  v_profile_role text := lower(coalesce(new.role, 'user'));
begin
  if v_request_role in ('service_role', 'postgres') then
    return new;
  end if;

  if v_profile_role in ('admin', 'admin_gm', 'gm') then
    return new;
  end if;

  select exists(
    select 1
    from public.golden_invites
    where claimed_by_user_id = new.id
      and is_used = true
  )
  into v_has_invite;

  if not v_has_invite then
    raise exception 'CLOSED_BETA_INVITE_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_closed_beta_user_profile_insert on public.user_profiles;

create trigger enforce_closed_beta_user_profile_insert
before insert on public.user_profiles
for each row
execute function public.enforce_closed_beta_user_profile_insert();
