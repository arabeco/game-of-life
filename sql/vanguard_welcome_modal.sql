alter table public.user_profiles
  add column if not exists vanguard_welcome_pending boolean not null default false,
  add column if not exists vanguard_welcome_payload jsonb not null default '{}'::jsonb,
  add column if not exists vanguard_welcome_shown_at timestamptz;

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
  v_vanguard_item_ids text[] := array[]::text[];
  v_vanguard_payload jsonb := '{}'::jsonb;
  v_starter_items text[] := array[
    'item_skin_1_001',
    'item_skin_1_002',
    'cachos',
    'medio_reto',
    'grunge_longo',
    'textured_crop',
    'item_artifact_1_001',
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
    perform public._starter_reward_grant_inventory_item_once(p_user_id, 'dreads');
    perform public._starter_reward_grant_inventory_item_once(p_user_id, 'mullet_topete');

    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'item_border_vanguarda_01');
    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'item_banner_vanguarda_01');
    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'dreads');
    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'mullet_topete');

    v_artifact_ids := public._starter_reward_pick_items(p_user_id, v_artifact_pool, 3);
    foreach v_item_id in array v_artifact_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
      v_vanguard_item_ids := array_append(v_vanguard_item_ids, v_item_id);
    end loop;

    v_orb_ids := public._starter_reward_pick_items(p_user_id, v_orb_pool, 1);
    foreach v_item_id in array v_orb_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
      v_vanguard_item_ids := array_append(v_vanguard_item_ids, v_item_id);
    end loop;

    v_plate_ids := public._starter_reward_pick_items(p_user_id, v_plate_pool, 1);
    foreach v_item_id in array v_plate_ids loop
      perform public._starter_reward_grant_inventory_item_once(p_user_id, v_item_id);
      v_vanguard_item_ids := array_append(v_vanguard_item_ids, v_item_id);
    end loop;

    perform public._starter_reward_mark_purchase(p_user_id, 'invite_ouro_pack', v_ouro_marker, false);
    v_vanguard_payload := jsonb_build_object(
      'inviteCode', v_invite.code,
      'gold', 50,
      'chestType', v_chest_type,
      'itemIds', to_jsonb(v_vanguard_item_ids)
    );
    v_ouro_pack_granted := true;
  end if;

  update public.user_profiles
  set
    starter_rewards_pending = false,
    vanguard_welcome_pending = case
      when v_ouro_pack_granted then true
      else vanguard_welcome_pending
    end,
    vanguard_welcome_payload = case
      when v_ouro_pack_granted then v_vanguard_payload
      else coalesce(vanguard_welcome_payload, '{}'::jsonb)
    end,
    updated_at = now()
  where id = p_user_id
    and starter_rewards_pending = true;

  return jsonb_build_object(
    'success', true,
    'is_ouro', v_is_ouro,
    'starter_granted_now', v_starter_was_granted,
    'ouro_pack_granted_now', v_ouro_pack_granted,
    'chest_type', v_chest_type,
    'new_gold', v_new_gold,
    'vanguard_payload', case when v_ouro_pack_granted then v_vanguard_payload else null end
  );
end;
$$;
