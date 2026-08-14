create or replace function public._handoff_or_delete_led_clans(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clan_id uuid;
  v_successor_id uuid;
  v_transfers jsonb := '[]'::jsonb;
  v_deleted_clans jsonb := '[]'::jsonb;
begin
  if p_user_id is null or to_regclass('public.clan_members') is null then
    return jsonb_build_object('transfers', v_transfers, 'deleted_clans', v_deleted_clans);
  end if;

  for v_clan_id in
    select distinct clan_id
    from public.clan_members
    where user_id = p_user_id
      and role = 'leader'
  loop
    perform pg_advisory_xact_lock(hashtextextended('clan-leadership:' || v_clan_id::text, 0));

    select member.user_id
    into v_successor_id
    from public.clan_members member
    where member.clan_id = v_clan_id
      and member.user_id <> p_user_id
    order by member.joined_at asc nulls last, member.user_id
    limit 1
    for update;

    if v_successor_id is not null then
      update public.clan_members
      set role = 'member'
      where clan_id = v_clan_id
        and user_id = p_user_id;

      update public.clan_members
      set role = 'leader'
      where clan_id = v_clan_id
        and user_id = v_successor_id;

      v_transfers := v_transfers || jsonb_build_array(jsonb_build_object(
        'clan_id', v_clan_id,
        'new_leader_id', v_successor_id
      ));
    else
      perform public._delete_public_rows_if_uuid_match('clan_custom_quests', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_messages', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_xp_contributions', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_mission_participants', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_mission_progress', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_join_requests', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_slots', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_aldeia_presence', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_positions', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('sanctuary_area_stats', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clan_members', 'clan_id', v_clan_id);
      perform public._delete_public_rows_if_uuid_match('clans', 'id', v_clan_id);

      v_deleted_clans := v_deleted_clans || jsonb_build_array(v_clan_id);
    end if;
  end loop;

  return jsonb_build_object('transfers', v_transfers, 'deleted_clans', v_deleted_clans);
end;
$$;

revoke all on function public._handoff_or_delete_led_clans(uuid) from public;
grant execute on function public._handoff_or_delete_led_clans(uuid) to service_role;

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
