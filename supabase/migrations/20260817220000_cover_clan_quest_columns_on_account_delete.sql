-- Account deletion swept public tables by a fixed list of uuid column names, so any
-- foreign key to auth.users on a differently named column was never cleared.
--
-- clan_custom_quests.creator_id and .assigned_user_id are both NO ACTION, so a user
-- holding either row could not be deleted at all: the delete failed on the constraint.
-- Account deletion is a store requirement, which makes that a compliance problem and
-- not only a bug.
--
-- The table is empty today (clanMissions is switched off), so this closes the gap
-- before anyone can hit it rather than repairing damage.
--
-- Only the column list changes; the sweep itself is unchanged.

begin;

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
        'friend_id',
        -- clan_custom_quests references auth.users through these two.
        'creator_id',
        'assigned_user_id'
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

commit;
