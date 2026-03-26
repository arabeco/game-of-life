create extension if not exists pgcrypto with schema extensions;

alter table public.items
  add column if not exists is_rank_exclusive boolean not null default false,
  add column if not exists is_premium_only boolean not null default false,
  add column if not exists is_chest_exclusive boolean not null default false,
  add column if not exists is_legacy_retired boolean not null default false,
  add column if not exists season_key text,
  add column if not exists season_slot text;

update public.items
set
  is_rank_exclusive = case
    when id in (
      'item_skin_1_001','item_skin_1_002','item_skin_1_004','item_skin_2_001','item_skin_2_002','item_skin_4_002','item_skin_5_001',
      'item_artifact_1_005','item_artifact_2_003','item_artifact_4_002',
      'cachos','medio_reto','grunge_longo','textured_crop','dreads','mullet_topete','anime_spikes','fluxo_espiritual',
      'item_border_vanguarda_01','item_banner_vanguarda_01'
    ) then true
    else coalesce(is_rank_exclusive, false)
  end,
  is_season_exclusive = case
    when id in ('item_skin_season_001','item_border_genesis_01','item_banner_origin_01') then true
    else coalesce(is_season_exclusive, false)
  end,
  is_gold_exclusive = case
    when id in ('item_skin_exclusive_001','item_aura_exclusive_001','item_border_exclusive_001') then true
    else coalesce(is_gold_exclusive, false)
  end,
  is_premium_only = case
    when id in ('item_border_genesis_01','item_banner_origin_01') then false
    else coalesce(is_premium_only, false)
  end,
  is_legacy_retired = case
    when id in ('item_border_genesis_01','item_banner_origin_01') then true
    else coalesce(is_legacy_retired, false)
  end,
  season_key = case
    when id in ('item_border_aurora_1_2026','item_banner_aurora_1_2026','insignia_season_aurora_1') then 'aurora_1_2026'
    when id in ('item_skin_season_001','item_border_genesis_01','item_banner_origin_01','item_theme_nebulosa') then 'genesis_legacy'
    else season_key
  end,
  season_slot = case
    when id = 'item_skin_season_001' then 'skin'
    when id in ('item_border_aurora_1_2026','item_border_genesis_01') then 'border'
    when id in ('item_banner_aurora_1_2026','item_banner_origin_01') then 'banner'
    when id = 'insignia_season_aurora_1' then 'insignia'
    when id = 'item_theme_nebulosa' then 'ui_skin'
    else season_slot
  end;

update public.items
set is_rank_exclusive = false
where id in ('item_border_genesis_01','item_banner_origin_01');

update public.user_chests
set chest_type = case
  when lower(chest_type) = 'comum' then 'Comum'
  when lower(chest_type) = 'incomum' then 'Incomum'
  when lower(chest_type) in ('raro', 'radiante') then 'Raro'
  when lower(chest_type) = 'ciclo' then 'Ciclo'
  when lower(chest_type) in ('epico', U&'\00E9pico') then U&'\00C9pico'
  when lower(chest_type) in ('lendario', U&'lend\00E1rio', 'legendary') then U&'Lend\00E1rio'
  when lower(chest_type) = 'season' then 'Season'
  else chest_type
end
where chest_type is not null;

update public.user_pity_counters
set chest_type = case
  when lower(chest_type) in ('raro', 'radiante') then 'raro'
  when lower(chest_type) = 'ciclo' then 'ciclo'
  when lower(chest_type) in ('epico', U&'\00E9pico') then 'epico'
  when lower(chest_type) in ('lendario', U&'lend\00E1rio', 'legendary') then 'lendario'
  when lower(chest_type) = 'season' then 'season'
  when lower(chest_type) = 'incomum' then 'incomum'
  when lower(chest_type) = 'comum' then 'comum'
  else lower(chest_type)
end
where chest_type is not null;

update public.user_profiles
set chests = '[]'::jsonb;

with chest_counts as (
  select user_id, chest_type, count(*) as count
  from public.user_chests
  where is_opened = false
  group by user_id, chest_type
), chest_json as (
  select user_id, jsonb_agg(jsonb_build_object('type', chest_type, 'count', count) order by chest_type) as chests_data
  from chest_counts
  group by user_id
)
update public.user_profiles up
set chests = chest_json.chests_data
from chest_json
where up.id = chest_json.user_id;

create or replace function public.open_chest(p_chest_type character varying)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_user_id uuid;
  v_chest_id bigint;
  v_input_chest_type varchar(30);
  v_chest_type varchar(30);
  v_display_chest_type varchar(30);
  v_pity_counter int default 0;
  v_guaranteed_tier int default 0;
  v_bonus_fragments int default 0;
  v_bonus_gold int default 0;
  v_dropped_tier int;
  v_awarded_tier int;
  v_dropped_item_id text;
  v_is_duplicate boolean;
  v_recycle_value int;
  v_fragments_gained int default 0;
  v_item_name text;
  v_current_gold int default 0;
  v_current_fragments int default 0;
  v_season_max_tier int default 4;
  v_rand float;
  v_gold_roll float;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_input_chest_type := trim(coalesce(p_chest_type, ''));

  v_chest_type := case lower(v_input_chest_type)
    when 'comum' then 'comum'
    when 'incomum' then 'incomum'
    when 'raro' then 'raro'
    when 'radiante' then 'raro'
    when 'ciclo' then 'ciclo'
    when U&'\00E9pico' then 'epico'
    when 'epico' then 'epico'
    when U&'lend\00E1rio' then 'lendario'
    when 'lendario' then 'lendario'
    when 'legendary' then 'lendario'
    when 'season' then 'season'
    else lower(v_input_chest_type)
  end;

  v_display_chest_type := case v_chest_type
    when 'comum' then 'Comum'
    when 'incomum' then 'Incomum'
    when 'raro' then 'Raro'
    when 'ciclo' then 'Ciclo'
    when 'epico' then U&'\00C9pico'
    when 'lendario' then U&'Lend\00E1rio'
    when 'season' then 'Season'
    else initcap(v_chest_type)
  end;

  select id into v_chest_id
  from public.user_chests
  where user_id = v_user_id
    and is_opened = false
    and case
      when lower(coalesce(chest_type, '')) = 'comum' then 'comum'
      when lower(coalesce(chest_type, '')) = 'incomum' then 'incomum'
      when lower(coalesce(chest_type, '')) in ('raro', 'radiante') then 'raro'
      when lower(coalesce(chest_type, '')) = 'ciclo' then 'ciclo'
      when lower(coalesce(chest_type, '')) in ('epico', U&'\00E9pico') then 'epico'
      when lower(coalesce(chest_type, '')) in ('lendario', U&'lend\00E1rio', 'legendary') then 'lendario'
      when lower(coalesce(chest_type, '')) = 'season' then 'season'
      else lower(coalesce(chest_type, ''))
    end = v_chest_type
  order by earned_at asc nulls first, id asc
  limit 1;

  if v_chest_id is null then
    raise exception 'Chest not found or already opened';
  end if;

  if v_chest_type = 'season' then
    select coalesce(max(tier), 4) into v_season_max_tier
    from public.items
    where coalesce(is_live_in_game, true) = true
      and coalesce(is_gold_exclusive, false) = false
      and coalesce(is_rank_exclusive, false) = false
      and coalesce(is_premium_only, false) = false
      and coalesce(is_legacy_retired, false) = false
      and coalesce(is_season_exclusive, false) = true;
  end if;

  if v_chest_type in ('ciclo', 'raro', 'epico', 'lendario', 'season') then
    select coalesce(counter, 0)
    into v_pity_counter
    from public.user_pity_counters
    where user_id = v_user_id
      and chest_type = v_chest_type;

    if v_pity_counter is null then
      insert into public.user_pity_counters (user_id, chest_type, counter)
      values (v_user_id, v_chest_type, 0)
      on conflict (user_id, chest_type) do nothing;
      v_pity_counter := 0;
    end if;

    v_pity_counter := v_pity_counter + 1;

    v_guaranteed_tier := case
      when v_chest_type = 'ciclo' and v_pity_counter >= 15 then 3
      when v_chest_type = 'raro' and v_pity_counter >= 10 then 3
      when v_chest_type = 'epico' and v_pity_counter >= 8 then 4
      when v_chest_type = 'lendario' and v_pity_counter >= 5 then 5
      when v_chest_type = 'season' and v_pity_counter >= 5 then greatest(v_season_max_tier, 1)
      else 0
    end;
  end if;

  v_rand := random() * 100;
  v_gold_roll := random() * 100;

  if v_guaranteed_tier > 0 then
    v_dropped_tier := v_guaranteed_tier;
  else
    case v_chest_type
      when 'incomum' then
        if v_rand < 70 then v_dropped_tier := 1;
        elsif v_rand < 95 then v_dropped_tier := 2;
        else v_dropped_tier := 3; end if;
      when 'ciclo' then
        if v_rand < 40 then v_dropped_tier := 1;
        elsif v_rand < 75 then v_dropped_tier := 2;
        elsif v_rand < 95 then v_dropped_tier := 3;
        else v_dropped_tier := 4; end if;
      when 'raro' then
        if v_rand < 45 then v_dropped_tier := 2;
        elsif v_rand < 85 then v_dropped_tier := 3;
        elsif v_rand < 95 then v_dropped_tier := 4;
        else v_dropped_tier := 5; end if;
      when 'epico' then
        if v_rand < 50 then v_dropped_tier := 3;
        elsif v_rand < 85 then v_dropped_tier := 4;
        else v_dropped_tier := 5; end if;
      when 'lendario' then
        if v_rand < 60 then v_dropped_tier := 4;
        else v_dropped_tier := 5; end if;
      when 'season' then
        if v_rand < 60 then v_dropped_tier := 4;
        else v_dropped_tier := 5; end if;
      else
        v_dropped_tier := 1;
    end case;
  end if;

  if v_chest_type = 'season' then
    select id, name, recycle_value, tier
    into v_dropped_item_id, v_item_name, v_recycle_value, v_awarded_tier
    from public.items
    where tier = v_dropped_tier
      and coalesce(is_live_in_game, true) = true
      and coalesce(is_gold_exclusive, false) = false
      and coalesce(is_rank_exclusive, false) = false
      and coalesce(is_premium_only, false) = false
      and coalesce(is_legacy_retired, false) = false
      and coalesce(is_season_exclusive, false) = true
    order by random()
    limit 1;

    if v_dropped_item_id is null then
      select id, name, recycle_value, tier
      into v_dropped_item_id, v_item_name, v_recycle_value, v_awarded_tier
      from public.items
      where coalesce(is_live_in_game, true) = true
        and coalesce(is_gold_exclusive, false) = false
        and coalesce(is_rank_exclusive, false) = false
        and coalesce(is_premium_only, false) = false
        and coalesce(is_legacy_retired, false) = false
        and coalesce(is_season_exclusive, false) = true
      order by random()
      limit 1;
    end if;
  else
    select id, name, recycle_value, tier
    into v_dropped_item_id, v_item_name, v_recycle_value, v_awarded_tier
    from public.items
    where tier = v_dropped_tier
      and coalesce(is_live_in_game, true) = true
      and coalesce(is_gold_exclusive, false) = false
      and coalesce(is_rank_exclusive, false) = false
      and coalesce(is_premium_only, false) = false
      and coalesce(is_legacy_retired, false) = false
      and coalesce(is_season_exclusive, false) = false
    order by random()
    limit 1;
  end if;

  if v_dropped_item_id is null then
    raise exception 'No eligible item available for chest type %', v_display_chest_type;
  end if;

  v_recycle_value := coalesce(v_recycle_value, 0);

  select exists(
    select 1 from public.user_inventory where user_id = v_user_id and item_id = v_dropped_item_id
  ) into v_is_duplicate;

  if v_is_duplicate then
    v_fragments_gained := v_recycle_value;
  else
    insert into public.user_inventory (user_id, item_id)
    values (v_user_id, v_dropped_item_id);
  end if;

  v_bonus_fragments := case v_chest_type
    when 'incomum' then floor(random() * 11 + 5)
    when 'ciclo' then floor(random() * 21 + 10)
    when 'raro' then floor(random() * 51 + 30)
    when 'epico' then floor(random() * 121 + 80)
    when 'lendario' then floor(random() * 301 + 200)
    when 'season' then floor(random() * 301 + 200)
    else 0
  end;

  v_bonus_gold := case
    when v_chest_type = 'epico' and v_gold_roll < 20 then 5
    when v_chest_type = 'lendario' and v_gold_roll < 35 then 10
    else 0
  end;

  v_fragments_gained := v_fragments_gained + v_bonus_fragments;

  select
    coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0),
    coalesce((coalesce(wallet, '{}'::jsonb) ->> 'fragments')::integer, fragments, 0)
  into v_current_gold, v_current_fragments
  from public.user_profiles
  where id = v_user_id
  for update;

  update public.user_profiles
  set
    gold = v_current_gold + v_bonus_gold,
    fragments = v_current_fragments + v_fragments_gained,
    wallet = jsonb_build_object(
      'gold', v_current_gold + v_bonus_gold,
      'fragments', v_current_fragments + v_fragments_gained
    )
  where id = v_user_id;

  if v_chest_type in ('ciclo', 'raro', 'epico', 'lendario', 'season') then
    if v_guaranteed_tier > 0 and coalesce(v_awarded_tier, 0) >= v_guaranteed_tier then
      update public.user_pity_counters
      set counter = 0, last_reset = now()
      where user_id = v_user_id and chest_type = v_chest_type;
    else
      update public.user_pity_counters
      set counter = v_pity_counter
      where user_id = v_user_id and chest_type = v_chest_type;
    end if;
  end if;

  update public.user_chests
  set is_opened = true, opened_at = now()
  where id = v_chest_id;

  insert into public.transactions (user_id, type, currency, amount, description, metadata)
  values (
    v_user_id,
    'open_chest',
    'fragments',
    v_fragments_gained,
    'Opened ' || v_display_chest_type || ' chest. Got ' || v_item_name || case when v_is_duplicate then ' (Duplicate)' else '' end,
    jsonb_build_object(
      'chest_type', v_display_chest_type,
      'item_id', v_dropped_item_id,
      'tier', v_awarded_tier,
      'is_duplicate', v_is_duplicate,
      'bonus_fragments', v_bonus_fragments,
      'gold_gained', v_bonus_gold
    )
  );

  if v_bonus_gold > 0 then
    insert into public.transactions (user_id, type, currency, amount, description, metadata)
    values (
      v_user_id,
      'open_chest_gold_bonus',
      'gold',
      v_bonus_gold,
      'Gold bonus from ' || v_display_chest_type || ' chest',
      jsonb_build_object('chest_type', v_display_chest_type, 'item_id', v_dropped_item_id)
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'item_id', v_dropped_item_id,
    'item_name', v_item_name,
    'tier', v_awarded_tier,
    'is_duplicate', v_is_duplicate,
    'fragments_gained', v_fragments_gained,
    'bonus_fragments', v_bonus_fragments,
    'gold_gained', v_bonus_gold
  );
end;
$function$;

