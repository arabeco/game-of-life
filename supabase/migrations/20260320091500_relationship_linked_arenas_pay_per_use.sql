create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_partnership_active integer := 0;
  v_partnership_pending integer := 0;
  v_competition_active integer := 0;
  v_competition_pending integer := 0;
  v_mentor_active integer := 0;
  v_mentor_pending integer := 0;
  v_pupil_mentor_active integer := 0;
  v_linked_arenas integer := 0;
begin
  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select count(*) into v_partnership_active
  from public.relationship_links rl
  where rl.link_type = 'parceria'
    and rl.ended_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  select count(*) into v_partnership_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'parceria'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_competition_active
  from public.relationship_links rl
  where rl.link_type = 'competicao'
    and rl.ended_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  select count(*) into v_competition_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'competicao'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_mentor_active
  from public.relationship_links rl
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.mentor_id = p_user_id;

  select count(*) into v_mentor_pending
  from public.relationship_link_invites rli
  where rli.link_type = 'mentoria'
    and rli.status = 'pending'
    and rli.sender_id = p_user_id;

  select count(*) into v_pupil_mentor_active
  from public.relationship_links rl
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.pupil_id = p_user_id;

  select count(*) into v_linked_arenas
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rl.link_type = 'mentoria'
    and rl.ended_at is null
    and rl.mentor_id = p_user_id;

  return jsonb_build_object(
    'partnership', jsonb_build_object(
      'used', v_partnership_active + v_partnership_pending,
      'limit', public._relationship_get_slot_limit(p_user_id, 'partnership'),
      'base', 1,
      'purchased', coalesce(v_profile.partnership_slots_purchased, 0),
      'costGold', 50,
      'requiresPremium', false
    ),
    'competition', jsonb_build_object(
      'used', v_competition_active + v_competition_pending,
      'limit', public._relationship_get_slot_limit(p_user_id, 'competition'),
      'base', 1,
      'purchased', coalesce(v_profile.competition_slots_purchased, 0),
      'costGold', 50,
      'requiresPremium', false
    ),
    'mentor', jsonb_build_object(
      'used', v_mentor_active + v_mentor_pending,
      'limit', public._relationship_get_slot_limit(p_user_id, 'mentor'),
      'base', 1,
      'purchased', coalesce(v_profile.mentor_slots_purchased, 0),
      'costGold', 100,
      'requiresPremium', false
    ),
    'linked_arena', jsonb_build_object(
      'used', v_linked_arenas,
      'limit', greatest(v_linked_arenas + 1, 1),
      'base', 0,
      'purchased', 0,
      'costGold', 50,
      'requiresPremium', false
    ),
    'pupil_mentor', jsonb_build_object(
      'used', v_pupil_mentor_active,
      'limit', public._relationship_get_slot_limit(p_user_id, 'pupil_mentor'),
      'base', 1,
      'purchased', 0,
      'costGold', 0,
      'requiresPremium', false
    )
  );
end;
$$;

create or replace function public.buy_relationship_capacity_slot(
  p_slot_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_cost integer;
  v_new_gold integer;
  v_new_value integer;
  v_column_name text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_slot_type, '') not in ('partnership', 'competition', 'mentor', 'linked_arena') then
    raise exception 'RELATIONSHIP_SLOT_TYPE_INVALID';
  end if;

  if p_slot_type = 'linked_arena' then
    raise exception 'LINKED_ARENA_SLOT_DISABLED';
  end if;

  v_cost := public._relationship_get_slot_cost(p_slot_type);
  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'relationship_capacity_slot',
    format('Compra de slot de %s', p_slot_type),
    jsonb_build_object(
      'slot_type', p_slot_type,
      'cost_gold', v_cost
    )
  );

  v_column_name := case p_slot_type
    when 'partnership' then 'partnership_slots_purchased'
    when 'competition' then 'competition_slots_purchased'
    when 'mentor' then 'mentor_slots_purchased'
    else 'linked_arena_slots_purchased'
  end;

  execute format(
    'update public.user_profiles
     set %I = coalesce(%I, 0) + 1,
         updated_at = now()
     where id = $1
     returning %I',
    v_column_name,
    v_column_name,
    v_column_name
  )
  into v_new_value
  using v_uid;

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'relationship_capacity_slot',
    p_slot_type,
    v_cost,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'slot_type', p_slot_type,
    'new_gold', v_new_gold,
    'purchased_slots', v_new_value,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

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
    coalesce(nullif(trim(p_icon), ''), '??'),
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
    jsonb_build_object('link_type', v_link.link_type)
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
