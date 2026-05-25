begin;

create temporary table if not exists pg_temp.garden_item_seed (
  id text primary key,
  name text not null,
  category text not null,
  tier integer not null,
  rarity text not null,
  recycle_value integer,
  craft_cost integer,
  image_url text,
  description text
) on commit drop;

insert into pg_temp.garden_item_seed (
  id,
  name,
  category,
  tier,
  rarity,
  recycle_value,
  craft_cost,
  image_url,
  description
)
values
  ('item_garden_stone_1', 'Pedra Serena', 'artifact', 1, 'common', 8, 40, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_PEDRA_SERENA.png', 'Pedra basica para iniciar o Jardim Zen.'),
  ('item_garden_plant_1', 'Musgo Vivo', 'artifact', 1, 'common', 8, 40, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_MUSGO_VIVO.png', 'Planta basica para iniciar o Jardim Zen.'),
  ('item_garden_tool_1', 'Garfo de Areia', 'artifact', 1, 'common', 8, 40, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_GARFO_3_DENTES.png', 'Ferramenta decorativa para compor o Jardim Zen.'),
  ('item_garden_stone_2', 'Pedra Lunar', 'artifact', 2, 'uncommon', 18, 120, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_PEDRA_LUNAR.png', 'Pedra clara para composicoes de areia.'),
  ('item_garden_lantern_1', 'Lanterna de Pedra', 'artifact', 2, 'uncommon', 18, 120, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_LANTERNA_PEDRA.png', 'Lanterna ornamental para dar profundidade ao Jardim Zen.'),
  ('item_garden_plant_2', 'Bambu Jovem', 'artifact', 2, 'uncommon', 18, 120, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_BAMBU_JOVEM.png', 'Vegetacao vertical para o Jardim Zen.'),
  ('item_garden_bridge_1', 'Ponte de Madeira', 'artifact', 2, 'uncommon', 18, 120, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_PONTE_MADEIRA.png', 'Ponte pequena para criar caminho e composicao no Jardim Zen.'),
  ('item_garden_stone_3', 'Pedra Obsidiana', 'artifact', 3, 'rare', 45, 400, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_PEDRA_OBSIDIANA.png', 'Pedra escura e mais rara para contraste no Jardim Zen.'),
  ('item_garden_statue_1', 'Estatua de Meditacao', 'artifact', 3, 'rare', 45, 400, 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/JARDIM_ESTATUA_MEDITACAO.png', 'Ponto de contemplacao raro para o Jardim Zen.')
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  tier = excluded.tier,
  rarity = excluded.rarity,
  recycle_value = excluded.recycle_value,
  craft_cost = excluded.craft_cost,
  image_url = excluded.image_url,
  description = excluded.description;

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

do $$
declare
  v_insert_columns text := 'id';
  v_select_columns text := 'id';
  v_update_set text := '';
  v_column text;
  v_assignment text;
  v_existing_columns text[];
begin
  select array_agg(column_name::text)
  into v_existing_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'items';

  foreach v_column in array array[
    'name',
    'category',
    'tier',
    'rarity',
    'recycle_value',
    'craft_cost',
    'image_url',
    'description'
  ] loop
    if v_column = any(v_existing_columns) then
      v_insert_columns := v_insert_columns || ', ' || quote_ident(v_column);
      v_select_columns := v_select_columns || ', ' || quote_ident(v_column);
      v_assignment := quote_ident(v_column) || ' = excluded.' || quote_ident(v_column);
      v_update_set := concat_ws(', ', nullif(v_update_set, ''), v_assignment);
    end if;
  end loop;

  foreach v_column in array array[
    'is_season_exclusive',
    'is_gold_exclusive',
    'is_rank_exclusive',
    'is_premium_only',
    'is_chest_exclusive',
    'is_legacy_retired',
    'is_gm_exclusive',
    'is_quest_exclusive',
    'is_report_exclusive'
  ] loop
    if v_column = any(v_existing_columns) then
      v_insert_columns := v_insert_columns || ', ' || quote_ident(v_column);
      v_select_columns := v_select_columns || ', false';
      v_assignment := quote_ident(v_column) || ' = false';
      v_update_set := concat_ws(', ', nullif(v_update_set, ''), v_assignment);
    end if;
  end loop;

  if 'is_live_in_game' = any(v_existing_columns) then
    v_insert_columns := v_insert_columns || ', is_live_in_game';
    v_select_columns := v_select_columns || ', true';
    v_update_set := concat_ws(', ', nullif(v_update_set, ''), 'is_live_in_game = true');
  end if;

  if 'gold_price' = any(v_existing_columns) then
    v_insert_columns := v_insert_columns || ', gold_price';
    v_select_columns := v_select_columns || ', null::integer';
    v_update_set := concat_ws(', ', nullif(v_update_set, ''), 'gold_price = null');
  end if;

  if 'season_key' = any(v_existing_columns) then
    v_insert_columns := v_insert_columns || ', season_key';
    v_select_columns := v_select_columns || ', null::text';
    v_update_set := concat_ws(', ', nullif(v_update_set, ''), 'season_key = null');
  end if;

  if 'season_slot' = any(v_existing_columns) then
    v_insert_columns := v_insert_columns || ', season_slot';
    v_select_columns := v_select_columns || ', null::text';
    v_update_set := concat_ws(', ', nullif(v_update_set, ''), 'season_slot = null');
  end if;

  execute format(
    'insert into public.items (%s) select %s from pg_temp.garden_item_seed on conflict (id) do update set %s',
    v_insert_columns,
    v_select_columns,
    v_update_set
  );
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

    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'item_border_vanguarda_01');
    v_vanguard_item_ids := array_append(v_vanguard_item_ids, 'item_banner_vanguarda_01');

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
      'eyebrow', 'Convite dourado',
      'title', 'Bem-vindo a Vanguarda',
      'summary', 'Seu acesso ouro foi selado. O pacote real da Vanguarda ja entrou no Arsenal.',
      'buttonLabel', 'Entrar na Vanguarda',
      'itemSectionTitle', 'Itens da Vanguarda',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Ouro', 'value', '+50', 'detail', 'Reserva inicial da Vanguarda.', 'tone', 'gold'),
        jsonb_build_object('label', 'Bau', 'value', v_chest_type, 'detail', 'Entrega inicial do convite ouro.', 'tone', 'cyan'),
        jsonb_build_object('label', 'Arsenal', 'value', 'Kit Vanguarda', 'detail', 'Borda, banner e itens de vitrine ja foram adicionados.', 'tone', 'emerald')
      ),
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

commit;
