create or replace function public.list_account_storage_objects(p_user_id uuid)
returns table(bucket_id text, object_name text)
language sql
security definer
set search_path = public, storage
as $$
  select objects.bucket_id, objects.name
  from storage.objects
  where p_user_id is not null
    and (
      objects.owner_id::text = p_user_id::text
      or objects.name like 'avatars/' || p_user_id::text || '/%'
      or objects.name like 'slots/' || p_user_id::text || '/%'
    )
  order by objects.bucket_id, objects.name;
$$;

revoke all on function public.list_account_storage_objects(uuid) from public;
grant execute on function public.list_account_storage_objects(uuid) to service_role;

create or replace function public._delete_public_rows_by_common_user_columns(p_value uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_row record;
begin
  if p_value is null then
    return;
  end if;

  for table_row in
    select
      table_name,
      array_agg(column_name order by ordinal_position)::text[] as column_names
    from information_schema.columns
    where table_schema = 'public'
      and data_type = 'uuid'
      and table_name not in ('account_deletion_requests', 'deleted_account_blocks')
      and column_name in (
        'user_id',
        'owner_id',
        'sender_id',
        'recipient_id',
        'mentor_id',
        'pupil_id',
        'friend_id'
      )
    group by table_name
  loop
    perform public._delete_public_rows_if_any_uuid_match(
      table_row.table_name,
      table_row.column_names,
      p_value
    );
  end loop;
end;
$$;

create or replace function public.delete_account_data_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := p_user_id;
  v_leader_clan_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER_ID');
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

  return jsonb_build_object('success', true);
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

revoke all on function public._delete_public_rows_by_common_user_columns(uuid) from public;
revoke all on function public.delete_account_data_for_user(uuid) from public;
grant execute on function public.delete_account_data_for_user(uuid) to service_role;

revoke all on function public.delete_my_account_with_policy(boolean, text) from authenticated;
revoke all on function public.delete_my_account() from authenticated;
