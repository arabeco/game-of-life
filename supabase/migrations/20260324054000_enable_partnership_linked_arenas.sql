create or replace function public.create_linked_relationship_arena(
  p_relationship_link_id uuid,
  p_asset_id text,
  p_name text,
  p_description text default '',
  p_icon text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_new_gold integer;
  v_arena public.arenas%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
  v_ledger_id text;
  v_reason text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'ARENA_NAME_REQUIRED';
  end if;

  if coalesce(trim(p_asset_id), '') = '' then
    raise exception 'ARENA_ASSET_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and ended_at is null
    and (
      (link_type = 'mentoria' and mentor_id = v_uid)
      or (link_type = 'parceria' and (mentor_id = v_uid or pupil_id = v_uid))
    )
  for update;

  if not found then
    raise exception 'ACTIVE_SHAREABLE_LINK_REQUIRED';
  end if;

  if v_link.link_type = 'parceria' then
    v_ledger_id := 'partnership_linked_arena';
    v_reason := 'Arena compartilhada de parceria';
  else
    v_ledger_id := 'mentor_linked_arena';
    v_reason := 'Arena vinculada de mentoria';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    v_ledger_id,
    format('%s: %s', v_reason, trim(p_name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'link_type', v_link.link_type,
      'asset_id', p_asset_id,
      'name', trim(p_name)
    )
  );

  insert into public.arenas (
    id, user_id, asset_id, name, description, icon, is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_uid,
    p_asset_id,
    trim(p_name),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(p_icon), ''), '🏛️'),
    false
  )
  returning * into v_arena;

  insert into public.relationship_link_arenas (
    relationship_link_id, arena_id, created_by_user_id, created_at, metadata
  ) values (
    v_link.id,
    v_arena.id,
    v_uid,
    now(),
    jsonb_build_object(
      'link_type', v_link.link_type,
      'asset_id', v_arena.asset_id,
      'name', v_arena.name,
      'description', coalesce(v_arena.description, ''),
      'icon', v_arena.icon
    )
  )
  returning * into v_linked;

  if v_link.link_type = 'mentoria' and v_link.arena_id is null then
    update public.relationship_links
    set arena_id = v_arena.id,
        arena_snapshot = jsonb_build_object('name', v_arena.name, 'icon', v_arena.icon)
    where id = v_link.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'link_type', v_link.link_type,
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

grant execute on function public.create_linked_relationship_arena(uuid, text, text, text, text) to authenticated;
