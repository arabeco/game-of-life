create or replace function public.delete_relationship_mentor_codex(
  p_codex_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_codex public.codex%rowtype;
  v_link public.relationship_links%rowtype;
  v_arena_ids uuid[];
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

  select c.*
  into v_codex
  from public.codex c
  join public.relationship_links rl
    on rl.id = c.mentor_relationship_link_id
  where c.id = p_codex_id
    and coalesce(c.source_type, '') = 'gift_in_app'
    and rl.link_type = 'mentoria'
    and rl.ended_at is null
    and (rl.mentor_id = v_uid or rl.pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_MENTORIA_CODEX_REQUIRED';
  end if;

  select rl.*
  into v_link
  from public.relationship_links rl
  where rl.id = v_codex.mentor_relationship_link_id
  for update;

  select coalesce(array_agg(a.id), '{}'::uuid[])
  into v_arena_ids
  from public.arenas a
  where a.user_id = v_codex.owner_id
    and a.origin_codex_id = p_codex_id;

  if coalesce(array_length(v_arena_ids, 1), 0) > 0 then
    select coalesce(array_agg(id), '{}'::uuid[])
    into v_action_ids
    from public.actions
    where arena_id = any(v_arena_ids);

    if coalesce(array_length(v_action_ids, 1), 0) > 0 then
      delete from public.scheduled_tasks
      where action_id = any(v_action_ids);
    end if;

    delete from public.actions
    where arena_id = any(v_arena_ids);

    for v_campaign in
      select id, arena_ids, arena_config
      from public.campaigns
      where user_id = v_codex.owner_id
      for update
    loop
      select coalesce(jsonb_agg(value), '[]'::jsonb)
      into v_next_arena_ids
      from jsonb_array_elements(coalesce(v_campaign.arena_ids, '[]'::jsonb)) as elem(value)
      where not ((value #>> '{}') = any(array(select arena_id::text from unnest(v_arena_ids) as arena_id)));

      if v_next_arena_ids is null then
        v_next_arena_ids := '[]'::jsonb;
      end if;

      if v_next_arena_ids = coalesce(v_campaign.arena_ids, '[]'::jsonb) then
        continue;
      end if;

      v_next_config := '{}'::jsonb;

      for v_config_key, v_config_value in
        select key, value
        from jsonb_each(coalesce(v_campaign.arena_config, '{}'::jsonb))
      loop
        if v_config_key = any(array(select arena_id::text from unnest(v_arena_ids) as arena_id)) then
          continue;
        end if;

        select coalesce(jsonb_agg(prereq), '[]'::jsonb)
        into v_next_prereqs
        from jsonb_array_elements(coalesce(v_config_value->'prerequisiteArenaIds', '[]'::jsonb)) as prereq
        where not ((prereq #>> '{}') = any(array(select arena_id::text from unnest(v_arena_ids) as arena_id)));

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
    ) then
      execute $sql$
        update public.cycles
        set arena_ids = coalesce((
          select jsonb_agg(value)
          from jsonb_array_elements(coalesce(cycles.arena_ids, '[]'::jsonb)) as elem(value)
          where not ((value #>> '{}') = any(array(select arena_id::text from unnest($1::uuid[]) as arena_id)))
        ), '[]'::jsonb)
        where user_id = $2
      $sql$
      using v_arena_ids, v_codex.owner_id;
    end if;

    delete from public.arenas
    where id = any(v_arena_ids);
  end if;

  delete from public.codex
  where id = p_codex_id;

  return jsonb_build_object(
    'success', true,
    'codex_id', p_codex_id,
    'relationship_link_id', v_link.id
  );
end;
$$;

revoke all on function public.delete_relationship_mentor_codex(uuid) from public;
grant execute on function public.delete_relationship_mentor_codex(uuid) to authenticated;
