create or replace function public.end_relationship_link(
  p_relationship_link_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
  for update;

  if not found then
    raise exception 'RELATIONSHIP_LINK_NOT_FOUND';
  end if;

  if v_link.ended_at is not null then
    raise exception 'RELATIONSHIP_LINK_ALREADY_ENDED';
  end if;

  if v_link.mentor_id <> v_uid and v_link.pupil_id <> v_uid then
    raise exception 'RELATIONSHIP_LINK_PERMISSION_DENIED';
  end if;

  update public.relationship_links
  set ended_at = now(),
      updated_at = now()
  where id = v_link.id;

  return jsonb_build_object(
    'success', true,
    'link_id', v_link.id,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

revoke all on function public.end_relationship_link(uuid) from public;
grant execute on function public.end_relationship_link(uuid) to authenticated;
