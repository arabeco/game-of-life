-- O trigger de cadastro ja entrega o pack inicial pelo servidor. O cliente so
-- pode pedir uma verificacao idempotente da propria conta, nunca informar um id.
begin;

create or replace function public.ensure_my_starter_rewards()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return public.bootstrap_new_player_rewards_for_user(v_user_id);
end;
$$;

revoke all on function public.ensure_my_starter_rewards() from public;
grant execute on function public.ensure_my_starter_rewards() to authenticated;

commit;
