-- Account deletion is an administrative cleanup. Snapshot arenas are immutable
-- during normal gameplay, but cannot be allowed to make account deletion fail.
create or replace function public.delete_account_data_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := p_user_id;
  v_clan_outcome jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER_ID');
  end if;

  -- The snapshot guard uses this transaction-local flag. This RPC is granted
  -- only to service_role, so normal users still cannot mutate sealed arenas.
  perform set_config('app.relationship_competition_admin', '1', true);

  v_clan_outcome := public._handoff_or_delete_led_clans(v_uid);

  perform public._delete_public_rows_if_any_uuid_match(
    'clan_custom_quests',
    array['creator_id', 'assigned_user_id'],
    v_uid
  );
  perform public._delete_public_rows_if_any_uuid_match(
    'codex_shares',
    array['sender_user_id', 'recipient_user_id', 'claimed_by_user_id'],
    v_uid
  );
  perform public._delete_public_rows_if_any_uuid_match(
    'relationship_competition_challenges',
    array['challenger_user_id', 'opponent_user_id', 'winner_user_id'],
    v_uid
  );
  perform public._delete_public_rows_if_any_uuid_match(
    'user_blocks',
    array['blocker_user_id', 'blocked_user_id'],
    v_uid
  );
  perform public._delete_public_rows_if_uuid_match('moderation_reports', 'reporter_user_id', v_uid);
  perform public._nullify_public_uuid_column('moderation_reports', 'target_user_id', v_uid);
  perform public._nullify_public_uuid_column('relationship_link_arenas', 'created_by_user_id', v_uid);
  perform public._nullify_public_uuid_column('codex', 'created_by_user_id', v_uid);
  perform public._nullify_public_uuid_column('golden_invites', 'claimed_by_user_id', v_uid);
  perform public._delete_public_rows_if_uuid_match('deleted_account_blocks', 'deleted_user_id', v_uid);

  perform public._delete_public_rows_by_common_user_columns(v_uid);
  perform public._delete_public_rows_if_uuid_match('user_profiles', 'id', v_uid);

  return jsonb_build_object(
    'success', true,
    'clan_outcome', v_clan_outcome
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.delete_account_data_for_user(uuid) from public;
grant execute on function public.delete_account_data_for_user(uuid) to service_role;
