create or replace function public.release_golden_invite_claim_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.golden_invites%rowtype;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER_ID');
  end if;

  update public.golden_invites
  set is_used = false,
      claimed_by_user_id = null,
      claimed_at = null
  where claimed_by_user_id = p_user_id
    and is_used = true
  returning * into v_invite;

  return jsonb_build_object(
    'success', true,
    'released', found,
    'invite_code', v_invite.code
  );
end;
$$;

create or replace function public.delete_my_account_with_policy(
  p_block_reentry boolean default true,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_request_id bigint;
  v_leader_clan_id uuid;
  v_email text;
  v_provider text;
  v_block_result jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  select email, coalesce(raw_app_meta_data->>'provider', app_metadata->>'provider')
  into v_email, v_provider
  from auth.users
  where id = v_uid;

  insert into public.account_deletion_requests (user_id, status, metadata)
  values (
    v_uid,
    'started',
    jsonb_build_object(
      'storage_cleanup_pending', true,
      'notes', 'SQL removed auth + database rows. Public storage files need separate cleanup if applicable.',
      'block_reentry', coalesce(p_block_reentry, true),
      'reason', p_reason
    )
  )
  returning id into v_request_id;

  if coalesce(p_block_reentry, true) and coalesce(trim(v_email), '') <> '' then
    select public.register_deleted_account_block(
      v_email,
      v_uid,
      v_provider,
      coalesce(nullif(trim(p_reason), ''), 'user_requested_account_deletion'),
      jsonb_build_object(
        'source', 'delete_my_account_with_policy',
        'request_id', v_request_id
      )
    )
    into v_block_result;

    if coalesce((v_block_result->>'success')::boolean, false) = false then
      raise exception '%', coalesce(v_block_result->>'error', 'FAILED_TO_REGISTER_DELETED_ACCOUNT_BLOCK');
    end if;
  elsif not coalesce(p_block_reentry, true) then
    select public.release_golden_invite_claim_for_user(v_uid)
    into v_block_result;

    if coalesce((v_block_result->>'success')::boolean, false) = false then
      raise exception '%', coalesce(v_block_result->>'error', 'FAILED_TO_RELEASE_GOLDEN_INVITE');
    end if;
  end if;

  if to_regclass('public.clan_members') is not null then
    for v_leader_clan_id in
      select distinct clan_id
      from public.clan_members
      where user_id = v_uid
        and role = 'leader'
    loop
      perform public._delete_public_rows_if_uuid_match('clan_mission_participants', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_mission_progress', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_join_requests', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_slots', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_presence', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_positions', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_area_stats', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_members', 'clan_id', v_leader_clan_id);
      perform public._delete_public_rows_if_uuid_match('clans', 'id', v_leader_clan_id);
    end loop;
  end if;

  perform public._delete_public_rows_by_common_user_columns(v_uid);
  perform public._nullify_public_uuid_column('golden_invites', 'claimed_by_user_id', v_uid);
  perform public._delete_public_rows_if_uuid_match('user_profiles', 'id', v_uid);

  delete from auth.users
  where id = v_uid;

  update public.account_deletion_requests
  set status = 'completed',
      completed_at = now(),
      metadata = metadata || jsonb_build_object(
        'completed_via', 'delete_my_account_with_policy',
        'block_reentry', coalesce(p_block_reentry, true),
        'reason', p_reason
      )
  where id = v_request_id;

  return jsonb_build_object('success', true);
exception
  when others then
    if v_request_id is not null then
      update public.account_deletion_requests
      set status = 'failed',
          completed_at = now(),
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'error', sqlerrm,
            'block_reentry', coalesce(p_block_reentry, true),
            'reason', p_reason
          )
      where id = v_request_id;
    end if;

    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.release_golden_invite_claim_for_user(uuid) from public;
grant execute on function public.release_golden_invite_claim_for_user(uuid) to service_role;
grant execute on function public.release_golden_invite_claim_for_user(uuid) to authenticated;
