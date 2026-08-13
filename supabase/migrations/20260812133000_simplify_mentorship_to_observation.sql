-- Mentoria acompanha uma arena do orientado. O mentor nunca cria ou altera
-- arenas, acoes ou tarefas na conta da outra pessoa.

drop policy if exists "Mentors can edit pupil arenas" on public.arenas;
drop policy if exists "Mentorship participants can update linked arenas" on public.arenas;
drop policy if exists "Mentors can delete linked mentorship arenas" on public.arenas;
drop policy if exists "Mentorship participants can insert linked actions" on public.actions;
drop policy if exists "Mentorship participants can update linked actions" on public.actions;
drop policy if exists "Mentorship participants can delete linked actions" on public.actions;
drop policy if exists "Mentorship participants can insert linked scheduled tasks" on public.scheduled_tasks;
drop policy if exists "Mentorship participants can update linked scheduled tasks" on public.scheduled_tasks;
drop policy if exists "Mentorship participants can delete linked scheduled tasks" on public.scheduled_tasks;

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
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  raise exception 'MENTORSHIP_ARENA_CREATION_DISABLED';
end;
$$;

create or replace function public.select_my_mentorship_arena(
  p_relationship_link_id uuid,
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
  v_existing public.relationship_link_arenas%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
  v_new_gold integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'mentoria'
    and pupil_id = v_uid
    and ended_at is null
  for update;

  if not found then
    raise exception 'MENTORSHIP_PUPIL_REQUIRED';
  end if;

  select * into v_arena
  from public.arenas
  where id = p_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then
    raise exception 'MENTORSHIP_OWN_ARENA_REQUIRED';
  end if;

  if exists (
    select 1
    from public.relationship_link_arenas
    where arena_id = p_arena_id
      and relationship_link_id <> v_link.id
  ) then
    raise exception 'RELATIONSHIP_ARENA_ALREADY_LINKED';
  end if;

  select * into v_existing
  from public.relationship_link_arenas
  where relationship_link_id = v_link.id
  order by created_at desc
  limit 1
  for update;

  if v_existing.arena_id = p_arena_id then
    return jsonb_build_object(
      'success', true,
      'changed', false,
      'arena', to_jsonb(v_arena),
      'linked_arena', to_jsonb(v_existing)
    );
  end if;

  if v_existing.id is null then
    v_new_gold := public._codex_debit_gold(
      v_uid,
      50,
      'mentorship_arena_share',
      format('Arena acompanhada na mentoria: %s', v_arena.name),
      jsonb_build_object('relationship_link_id', v_link.id, 'arena_id', v_arena.id)
    );
  end if;

  delete from public.relationship_link_arenas
  where relationship_link_id = v_link.id;

  insert into public.relationship_link_arenas (
    relationship_link_id,
    arena_id,
    created_by_user_id,
    metadata
  ) values (
    v_link.id,
    v_arena.id,
    v_uid,
    jsonb_build_object(
      'link_type', 'mentoria',
      'owner_user_id', v_uid,
      'asset_id', v_arena.asset_id,
      'name', v_arena.name,
      'description', coalesce(v_arena.description, ''),
      'icon', v_arena.icon
    )
  )
  returning * into v_linked;

  update public.relationship_links
  set arena_id = v_arena.id,
      arena_snapshot = jsonb_build_object('name', v_arena.name, 'icon', v_arena.icon)
  where id = v_link.id;

  return jsonb_build_object(
    'success', true,
    'changed', true,
    'new_gold', v_new_gold,
    'arena', to_jsonb(v_arena),
    'linked_arena', to_jsonb(v_linked)
  );
end;
$$;

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
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select rl.* into v_link
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rla.arena_id = p_arena_id
    and rl.link_type = 'mentoria'
    and rl.pupil_id = v_uid
    and rl.ended_at is null
  for update of rl;

  if not found then
    raise exception 'MENTORSHIP_PUPIL_REQUIRED';
  end if;

  delete from public.relationship_link_arenas
  where relationship_link_id = v_link.id
    and arena_id = p_arena_id;

  update public.relationship_links
  set arena_id = null,
      arena_snapshot = null
  where id = v_link.id
    and arena_id = p_arena_id;

  return jsonb_build_object(
    'success', true,
    'arena_preserved', true,
    'arena_id', p_arena_id,
    'relationship_link_id', v_link.id
  );
end;
$$;

revoke all on function public.create_linked_relationship_arena(uuid, text, text, text, text) from public;
grant execute on function public.create_linked_relationship_arena(uuid, text, text, text, text) to authenticated;
revoke all on function public.select_my_mentorship_arena(uuid, uuid) from public;
grant execute on function public.select_my_mentorship_arena(uuid, uuid) to authenticated;
revoke all on function public.delete_linked_relationship_arena(uuid) from public;
grant execute on function public.delete_linked_relationship_arena(uuid) to authenticated;
