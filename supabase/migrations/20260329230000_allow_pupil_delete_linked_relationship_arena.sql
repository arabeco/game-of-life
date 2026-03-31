create or replace function public.delete_linked_relationship_arena(
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_action_ids uuid[];
  v_campaign record;
  v_next_arena_ids jsonb;
  v_next_config jsonb;
  v_config_key text;
  v_config_value jsonb;
  v_next_prereqs jsonb;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select rl.*
  into v_link
  from public.relationship_link_arenas rla
  join public.relationship_links rl
    on rl.id = rla.relationship_link_id
  where rla.arena_id = p_arena_id
    and rl.link_type = 'mentoria'
    and rl.ended_at is null
    and (rl.mentor_id = v_uid or rl.pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED';
  end if;

  select *
  into v_arena
  from public.arenas
  where id = p_arena_id
  for update;

  if not found then
    raise exception 'ARENA_NOT_FOUND';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
  into v_action_ids
  from public.actions
  where arena_id = p_arena_id;

  if coalesce(array_length(v_action_ids, 1), 0) > 0 then
    delete from public.scheduled_tasks
    where action_id = any(v_action_ids);
  end if;

  delete from public.actions
  where arena_id = p_arena_id;

  for v_campaign in
    select id, arena_ids, arena_config
    from public.campaigns
    where user_id = v_arena.user_id
      and coalesce(arena_ids, '[]'::jsonb) ? p_arena_id::text
    for update
  loop
    select coalesce(jsonb_agg(value), '[]'::jsonb)
    into v_next_arena_ids
    from jsonb_array_elements(coalesce(v_campaign.arena_ids, '[]'::jsonb)) as elem(value)
    where value <> to_jsonb(p_arena_id::text);

    v_next_config := '{}'::jsonb;

    for v_config_key, v_config_value in
      select key, value
      from jsonb_each(coalesce(v_campaign.arena_config, '{}'::jsonb))
    loop
      if v_config_key = p_arena_id::text then
        continue;
      end if;

      select coalesce(jsonb_agg(prereq), '[]'::jsonb)
      into v_next_prereqs
      from jsonb_array_elements(coalesce(v_config_value->'prerequisiteArenaIds', '[]'::jsonb)) as prereq
      where prereq <> to_jsonb(p_arena_id::text);

      v_config_value := jsonb_set(v_config_value, '{prerequisiteArenaIds}', v_next_prereqs, true);
      v_next_config := v_next_config || jsonb_build_object(v_config_key, v_config_value);
    end loop;

    if jsonb_array_length(v_next_arena_ids) = 0 then
      delete from public.campaigns
      where id = v_campaign.id;
    else
      update public.campaigns
      set arena_ids = v_next_arena_ids,
          arena_config = v_next_config,
          updated_at = now()
      where id = v_campaign.id;
    end if;
  end loop;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cycles'
      and column_name = 'arena_ids'
      and udt_name = '_uuid'
  ) then
    update public.cycles
    set arena_ids = array_remove(coalesce(arena_ids, '{}'::uuid[]), p_arena_id)
    where user_id = v_arena.user_id
      and p_arena_id = any(coalesce(arena_ids, '{}'::uuid[]));
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cycles'
      and column_name = 'arena_ids'
      and udt_name = 'jsonb'
  ) then
    execute $sql$
      update public.cycles
      set arena_ids = coalesce((
        select jsonb_agg(value)
        from jsonb_array_elements(coalesce(cycles.arena_ids, '[]'::jsonb)) as elem(value)
        where value <> to_jsonb($1::text)
      ), '[]'::jsonb)
      where user_id = $2
        and coalesce(arena_ids, '[]'::jsonb) ? $1::text
    $sql$
    using p_arena_id, v_arena.user_id;
  end if;

  delete from public.relationship_link_arenas
  where arena_id = p_arena_id;

  update public.relationship_links
  set arena_id = null,
      arena_snapshot = null
  where arena_id = p_arena_id;

  delete from public.arenas
  where id = p_arena_id;

  return jsonb_build_object(
    'success', true,
    'arena_id', p_arena_id,
    'relationship_link_id', v_link.id
  );
end;
$$;

revoke all on function public.delete_linked_relationship_arena(uuid) from public;
grant execute on function public.delete_linked_relationship_arena(uuid) to authenticated;
