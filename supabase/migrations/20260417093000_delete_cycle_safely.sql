create or replace function public.delete_cycle_safely(p_cycle_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $function$
declare
  v_uid uuid := auth.uid();
  v_cycle public.cycles%rowtype;
  v_cycle_arena_ids text[] := array[]::text[];
  v_action_ids text[] := array[]::text[];
  v_task_ids text[] := array[]::text[];
  v_deleted_sitrep_count integer := 0;
  v_deleted_task_count integer := 0;
  v_deleted_cycle_count integer := 0;
  v_deleted_legacy_report_count integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'AUTH_REQUIRED');
  end if;

  select *
  into v_cycle
  from public.cycles
  where id::text = p_cycle_id::text
    and user_id = v_uid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'CYCLE_NOT_FOUND');
  end if;

  v_cycle_arena_ids := coalesce(v_cycle.arena_ids::text[], array[]::text[]);

  if coalesce(array_length(v_cycle_arena_ids, 1), 0) > 0 then
    select coalesce(array_agg(id::text), array[]::text[])
    into v_action_ids
    from public.actions
    where user_id = v_uid
      and arena_id::text = any(v_cycle_arena_ids);
  end if;

  if coalesce(array_length(v_action_ids, 1), 0) > 0 then
    select coalesce(array_agg(id::text), array[]::text[])
    into v_task_ids
    from public.scheduled_tasks
    where user_id = v_uid
      and action_id::text = any(v_action_ids)
      and date::date >= v_cycle.start_date::date
      and date::date <= coalesce(v_cycle.end_date, v_cycle.start_date)::date;

    delete from public.scheduled_tasks
    where user_id = v_uid
      and id::text = any(v_task_ids);

    get diagnostics v_deleted_task_count = row_count;
  end if;

  delete from public.sitrep_reports
  where user_id = v_uid
    and cycle_id::text = p_cycle_id::text;

  get diagnostics v_deleted_sitrep_count = row_count;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'reports'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'reports'
        and column_name = 'cycle_id'
    ) then
      execute 'delete from public.reports where user_id = $1 and (cycle_id::text = $2 or id::text = $2)'
      using v_uid, p_cycle_id;
    else
      execute 'delete from public.reports where user_id = $1 and id::text = $2'
      using v_uid, p_cycle_id;
    end if;

    get diagnostics v_deleted_legacy_report_count = row_count;
  end if;

  delete from public.cycles
  where id::text = p_cycle_id::text
    and user_id = v_uid;

  get diagnostics v_deleted_cycle_count = row_count;

  return jsonb_build_object(
    'success', v_deleted_cycle_count > 0,
    'cycle_id', p_cycle_id,
    'deleted_cycles', v_deleted_cycle_count,
    'deleted_sitrep_reports', v_deleted_sitrep_count,
    'deleted_scheduled_tasks', v_deleted_task_count,
    'deleted_legacy_reports', v_deleted_legacy_report_count,
    'deleted_scheduled_task_ids', coalesce(to_jsonb(v_task_ids), '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.delete_cycle_safely(text) from public;
grant execute on function public.delete_cycle_safely(text) to authenticated;
