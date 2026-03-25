begin;

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
  v_owner_user_id uuid;
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
    v_owner_user_id := v_uid;
  else
    v_ledger_id := 'mentor_linked_arena';
    v_reason := 'Arena vinculada de mentoria';
    v_owner_user_id := v_link.pupil_id;
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
    v_owner_user_id,
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
      'owner_user_id', v_owner_user_id,
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

update public.arenas arena
set user_id = link.pupil_id
from public.relationship_link_arenas linked
join public.relationship_links link
  on link.id = linked.relationship_link_id
where linked.arena_id = arena.id
  and link.link_type = 'mentoria'
  and link.ended_at is null
  and arena.user_id::text <> link.pupil_id::text;

update public.actions action_row
set user_id = link.pupil_id
from public.relationship_link_arenas linked
join public.relationship_links link
  on link.id = linked.relationship_link_id
where linked.arena_id = action_row.arena_id
  and link.link_type = 'mentoria'
  and link.ended_at is null
  and action_row.user_id::text <> link.pupil_id::text;

update public.scheduled_tasks task_row
set user_id = link.pupil_id
from public.actions action_row
join public.relationship_link_arenas linked
  on linked.arena_id = action_row.arena_id
join public.relationship_links link
  on link.id = linked.relationship_link_id
where task_row.action_id::text = action_row.id::text
  and link.link_type = 'mentoria'
  and link.ended_at is null
  and task_row.user_id::text <> link.pupil_id::text;

update public.relationship_link_arenas linked
set metadata = coalesce(linked.metadata, '{}'::jsonb)
  || jsonb_build_object('owner_user_id', link.pupil_id, 'link_type', 'mentoria')
from public.relationship_links link
where link.id = linked.relationship_link_id
  and link.link_type = 'mentoria'
  and link.ended_at is null;

drop policy if exists "Mentorship participants can insert linked actions" on public.actions;
create policy "Mentorship participants can insert linked actions"
on public.actions
for insert
with check (
  exists (
    select 1
    from public.arenas linked_arena
    join public.relationship_link_arenas rla
      on rla.arena_id = linked_arena.id
    join public.relationship_links rl
      on rl.id = rla.relationship_link_id
    where linked_arena.id = actions.arena_id
      and linked_arena.user_id::text = actions.user_id::text
      and rl.link_type = 'mentoria'
      and rl.ended_at is null
      and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
  )
);

drop policy if exists "Mentorship participants can insert linked scheduled tasks" on public.scheduled_tasks;
create policy "Mentorship participants can insert linked scheduled tasks"
on public.scheduled_tasks
for insert
with check (
  exists (
    select 1
    from public.actions action_row
    join public.relationship_link_arenas linked
      on linked.arena_id = action_row.arena_id
    join public.relationship_links link
      on link.id = linked.relationship_link_id
    where action_row.id::text = scheduled_tasks.action_id::text
      and action_row.user_id::text = scheduled_tasks.user_id::text
      and link.link_type = 'mentoria'
      and link.ended_at is null
      and (link.mentor_id = auth.uid() or link.pupil_id = auth.uid())
  )
);

commit;
