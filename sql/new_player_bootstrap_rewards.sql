create extension if not exists pgcrypto with schema extensions;

alter table public.user_profiles
  add column if not exists starter_rewards_pending boolean not null default false;

create or replace function public._starter_reward_detect_unlock_category(p_item_id text)
returns text
language plpgsql
immutable
as $$
begin
  if p_item_id is null or trim(p_item_id) = '' then
    return null;
  end if;

  if p_item_id like 'item_skin_%' then return 'skins'; end if;
  if p_item_id like 'item_artifact_%' or p_item_id like 'item_garden_%' then return 'artifacts'; end if;
  if p_item_id like 'item_orb_%' then return 'orbs'; end if;
  if p_item_id like 'item_plate_%' then return 'plates'; end if;
  if p_item_id like 'item_border_%' then return 'borders'; end if;
  if p_item_id like 'item_banner_%' then return 'banners'; end if;
  if p_item_id like 'item_glyph_%' then return 'glyphs'; end if;
  if p_item_id like 'item_aura_%' then return 'auras'; end if;
  if p_item_id like 'item_theme_%' then return 'ui_skins'; end if;
  if p_item_id in ('BASIC', 'GOLD', 'FROST', 'EMBER', 'CYBER', 'AURORA', 'VOID') then return 'ui_skins'; end if;
  if p_item_id in ('cachos', 'medio_reto', 'grunge_longo', 'textured_crop', 'dreads', 'mullet_topete', 'anime_spikes', 'princesa', 'fluxo_espiritual') then return 'hairStyles'; end if;

  return null;
end;
$$;

create or replace function public._starter_reward_mark_unlock(
  p_user_id uuid,
  p_item_id text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_category text;
begin
  if p_user_id is null or p_item_id is null or trim(p_item_id) = '' then
    return;
  end if;

  v_category := public._starter_reward_detect_unlock_category(p_item_id);
  if v_category is null then
    return;
  end if;

  update public.user_profiles
  set
    unlocked_items = jsonb_set(
      coalesce(unlocked_items, '{}'::jsonb),
      array[v_category, p_item_id],
      'true'::jsonb,
      true
    ),
    unlocked_skins = case
      when v_category = 'ui_skins' then coalesce(unlocked_skins, '{}'::jsonb) || jsonb_build_object(p_item_id, true)
      else unlocked_skins
    end,
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public._starter_reward_grant_inventory_item_once(
  p_user_id uuid,
  p_item_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_inserted boolean := false;
begin
  if p_user_id is null or p_item_id is null or trim(p_item_id) = '' then
    return false;
  end if;

  if not exists (
    select 1
    from public.user_inventory
    where user_id = p_user_id
      and item_id = p_item_id
  ) then
    insert into public.user_inventory (user_id, item_id)
    values (p_user_id, p_item_id);
    v_inserted := true;
  end if;

  perform public._starter_reward_mark_unlock(p_user_id, p_item_id);
  return v_inserted;
end;
$$;

create or replace function public._starter_reward_set_wallet_gold(
  p_user_id uuid,
  p_new_gold integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_fragments integer;
begin
  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_fragments := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, v_profile.fragments, 0);

  update public.user_profiles
  set
    gold = p_new_gold,
    fragments = v_fragments,
    wallet = jsonb_build_object(
      'gold', p_new_gold,
      'fragments', v_fragments
    ),
    updated_at = now()
  where id = p_user_id;
end;
$$;

create or replace function public._starter_reward_credit_gold(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_current_gold integer;
  v_new_gold integer;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    return coalesce((select gold from public.user_profiles where id = p_user_id), 0);
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
  v_new_gold := v_current_gold + p_amount;

  perform public._starter_reward_set_wallet_gold(p_user_id, v_new_gold);

  insert into public.transactions (
    id,
    user_id,
    type,
    currency,
    amount,
    description,
    created_at,
    metadata
  ) values (
    extensions.gen_random_uuid(),
    p_user_id,
    p_type,
    'gold',
    abs(p_amount),
    p_description,
    now(),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_new_gold;
end;
$$;

create or replace function public._starter_reward_has_purchase_marker(
  p_user_id uuid,
  p_product_type text,
  p_product_id text
)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.user_purchases
    where user_id = p_user_id
      and product_type = p_product_type
      and product_id = p_product_id
  );
$$;

create or replace function public._starter_reward_mark_purchase(
  p_user_id uuid,
  p_product_type text,
  p_product_id text,
  p_is_active boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public._starter_reward_has_purchase_marker(p_user_id, p_product_type, p_product_id) then
    return;
  end if;

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    p_user_id,
    p_product_type,
    p_product_id,
    0,
    null,
    coalesce(p_is_active, false),
    now()
  );
end;
$$;

create or replace function public._starter_reward_pick_items(
  p_user_id uuid,
  p_pool text[],
  p_limit integer
)
returns text[]
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result text[];
begin
  select coalesce(array_agg(item_id), array[]::text[])
  into v_result
  from (
    select pool.item_id
    from unnest(coalesce(p_pool, array[]::text[])) as pool(item_id)
    where not exists (
      select 1
      from public.user_inventory ui
      where ui.user_id = p_user_id
        and ui.item_id = pool.item_id
    )
    order by random()
    limit greatest(coalesce(p_limit, 0), 0)
  ) picks;

  return coalesce(v_result, array[]::text[]);
end;
$$;

create or replace function public.bootstrap_new_player_rewards_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_invite public.golden_invites%rowtype;
  v_is_ouro boolean := false;
  v_chest_type text := 'Comum';
  v_starter_marker text := 'starter_pack_v2';
  v_ouro_marker text := 'invite_ouro_pack_v1';
  v_starter_was_granted boolean := false;
  v_ouro_pack_granted boolean := false;
  v_new_gold integer := null;
  v_item_id text;
  v_artifact_ids text[];
  v_orb_ids text[];
  v_plate_ids text[];
  v_starter_items text[] := array[
    'item_skin_1_001',
    'item_skin_1_002',
    'cachos',
    'medio_reto',
    'grunge_longo',
    'textured_crop',
    'item_artifact_1_001',
    'item_garden_stone_1',
    'item_garden_plant_1',
    'item_orb_1_002',
    'item_plate_1_001',
    'BASIC'
  ];
  v_artifact_pool text[] := array[
    'item_artifact_1_002',
    'item_artifact_1_003',
    'item_artifact_1_004',
    'item_artifact_1_005',
    'item_artifact_2_001',
    'item_artifact_2_002',
    'item_artifact_2_003',
    'item_artifact_3_001',
    'item_artifact_3_002',
    'item_artifact_3_003',
    'item_artifact_3_004',
    'item_artifact_3_005',
    'item_artifact_3_006'
  ];
  v_orb_pool text[] := array[
    'item_orb_2_002',
    'item_orb_2_003',
    'item_orb_3_001'
  ];
  v_plate_pool text[] := array[
    'item_plate_2_001',
    'item_plate_3_001'
  ];
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'EMPTY_USER_ID');
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  end if;

  select *
  into v_invite
  from public.golden_invites
  where claimed_by_user_id = p_user_id
    and coalesce(is_used, false) = true
  order by claimed_at desc nulls last, created_at desc, code asc
  limit 1;

  v_is_ouro := found and lower(coalesce(v_invite.code, '')) like 'ouro%';
  v_chest_type := case when v_is_ouro then 'Incomum' else 'Comum' end;

  if not public._starter_reward_has_purchase_marker(p_user_id, 'starter_pack', v_starter_marker) then
    foreach v_item_id in array v_starter_items loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
    end loop;

    perform public.grant_chest(p_user_id, v_chest_type);
    perform public._starter_reward_mark_purchase(p_user_id, 'starter_pack', v_starter_marker, false);
    v_starter_was_granted := true;
  end if;

  if v_is_ouro and not public._starter_reward_has_purchase_marker(p_user_id, 'invite_ouro_pack', v_ouro_marker) then
    v_new_gold := public._starter_reward_credit_gold(
      p_user_id,
      50,
      'invite_ouro_reward',
      'Bonus do convite ouro',
      jsonb_build_object('invite_code', v_invite.code)
    );

    perform public._starter_reward_grant_inventory_item_once(p_user_id, 'item_border_vanguarda_01');
    perform public._starter_reward_grant_inventory_item_once(p_user_id, 'item_banner_vanguarda_01');

    v_artifact_ids := public._starter_reward_pick_items(p_user_id, v_artifact_pool, 3);
    foreach v_item_id in array v_artifact_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
    end loop;

    v_orb_ids := public._starter_reward_pick_items(p_user_id, v_orb_pool, 1);
    foreach v_item_id in array v_orb_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
    end loop;

    v_plate_ids := public._starter_reward_pick_items(p_user_id, v_plate_pool, 1);
    foreach v_item_id in array v_plate_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
    end loop;

    perform public._starter_reward_mark_purchase(p_user_id, 'invite_ouro_pack', v_ouro_marker, false);
    v_ouro_pack_granted := true;
  end if;

  update public.user_profiles
  set
    starter_rewards_pending = false,
    updated_at = now()
  where id = p_user_id
    and starter_rewards_pending = true;

  return jsonb_build_object(
    'success', true,
    'is_ouro', v_is_ouro,
    'starter_granted_now', v_starter_was_granted,
    'ouro_pack_granted_now', v_ouro_pack_granted,
    'chest_type', v_chest_type,
    'new_gold', v_new_gold
  );
end;
$$;

create or replace function public.handle_user_profile_starter_rewards()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if coalesce(new.starter_rewards_pending, false) <> true then
    return new;
  end if;

  perform public.bootstrap_new_player_rewards_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists user_profiles_bootstrap_starter_rewards on public.user_profiles;
create trigger user_profiles_bootstrap_starter_rewards
after insert or update of starter_rewards_pending on public.user_profiles
for each row
when (new.starter_rewards_pending = true)
execute function public.handle_user_profile_starter_rewards();

revoke all on function public._starter_reward_detect_unlock_category(text) from public;
revoke all on function public._starter_reward_mark_unlock(uuid, text) from public;
revoke all on function public._starter_reward_grant_inventory_item_once(uuid, text) from public;
revoke all on function public._starter_reward_set_wallet_gold(uuid, integer) from public;
revoke all on function public._starter_reward_credit_gold(uuid, integer, text, text, jsonb) from public;
revoke all on function public._starter_reward_has_purchase_marker(uuid, text, text) from public;
revoke all on function public._starter_reward_mark_purchase(uuid, text, text, boolean) from public;
revoke all on function public._starter_reward_pick_items(uuid, text[], integer) from public;
revoke all on function public.bootstrap_new_player_rewards_for_user(uuid) from public;
revoke all on function public.handle_user_profile_starter_rewards() from public;

grant execute on function public.bootstrap_new_player_rewards_for_user(uuid) to service_role;
