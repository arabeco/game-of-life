alter table if exists public.arenas enable row level security;
alter table if exists public.actions enable row level security;
alter table if exists public.scheduled_tasks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'arenas'
      and policyname = 'Relationship participants can read linked arenas'
  ) then
    create policy "Relationship participants can read linked arenas"
    on public.arenas
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = arenas.id
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'actions'
      and policyname = 'Relationship participants can read linked actions'
  ) then
    create policy "Relationship participants can read linked actions"
    on public.actions
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = actions.arena_id
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scheduled_tasks'
      and policyname = 'Relationship participants can read linked scheduled tasks'
  ) then
    create policy "Relationship participants can read linked scheduled tasks"
    on public.scheduled_tasks
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.actions a
        join public.relationship_link_arenas rla
          on rla.arena_id = a.arena_id
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where a.id::text = scheduled_tasks.action_id
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

update public.relationship_link_arenas rla
set metadata = coalesce(rla.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'asset_id', a.asset_id,
    'name', a.name,
    'description', coalesce(a.description, ''),
    'icon', a.icon
  )
from public.arenas a
where a.id = rla.arena_id
  and (
    coalesce(rla.metadata, '{}'::jsonb)->>'name' is null
    or coalesce(rla.metadata, '{}'::jsonb)->>'icon' is null
    or coalesce(rla.metadata, '{}'::jsonb)->>'asset_id' is null
  );

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
    and link_type = 'mentoria'
    and mentor_id = v_uid
    and ended_at is null
  for update;

  if not found then
    raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'mentor_linked_arena',
    format('Arena vinculada de mentoria: %s', trim(p_name)),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
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

  if v_link.arena_id is null then
    update public.relationship_links
    set arena_id = v_arena.id,
        arena_snapshot = jsonb_build_object('name', v_arena.name, 'icon', v_arena.icon)
    where id = v_link.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;
