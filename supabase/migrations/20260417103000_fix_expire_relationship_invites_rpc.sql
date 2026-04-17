create or replace function public.expire_stale_relationship_link_invites(
  p_max_age_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $function$
declare
  v_invite record;
  v_expired_count integer := 0;
begin
  for v_invite in
    select id
    from public.relationship_link_invites
    where status = 'pending'
      and coalesce(expires_at, created_at + make_interval(hours => greatest(coalesce(p_max_age_hours, 168), 1))) <= now()
  loop
    perform public._relationship_refund_pending_invite(v_invite.id, 'expired');

    update public.relationship_link_invites
    set
      status = 'expired',
      responded_at = now()
    where id = v_invite.id
      and status = 'pending';

    v_expired_count := v_expired_count + 1;
  end loop;

  return jsonb_build_object('success', true, 'expired', v_expired_count);
end;
$function$;

revoke all on function public.expire_stale_relationship_link_invites(integer) from public;
grant execute on function public.expire_stale_relationship_link_invites(integer) to authenticated;
