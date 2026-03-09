create or replace function public.open_chest(p_chest_type character varying)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_user_id uuid;
  v_chest_id bigint;
  v_input_chest_type varchar(20);
  v_chest_type varchar(20);
  v_pity_counter int default 0;
  v_guaranteed_tier int default 0;
  v_bonus_fragments int;
  v_dropped_tier int;
  v_dropped_item_id text;
  v_is_duplicate boolean;
  v_recycle_value int;
  v_fragments_gained int default 0;
  v_item_name text;
begin
  v_user_id := auth.uid();
  v_input_chest_type := trim(p_chest_type);

  -- Normaliza aliases usados pelo app atual sem quebrar os nomes antigos do backend.
  v_chest_type := case lower(v_input_chest_type)
    when 'comum' then 'comum'
    when 'incomum' then 'incomum'
    when 'raro' then 'radiante'
    when 'radiante' then 'radiante'
    when 'épico' then 'epico'
    when 'epico' then 'epico'
    when 'lendário' then 'season'
    when 'lendario' then 'season'
    when 'season' then 'season'
    when 'ciclo' then 'ciclo'
    else lower(v_input_chest_type)
  end;

  -- 1. Verify chest ownership and status (pick first available)
  select id
  into v_chest_id
  from user_chests
  where user_id = v_user_id
    and chest_type in (v_input_chest_type, v_chest_type)
    and is_opened = false
  limit 1;

  if v_chest_id is null then
    raise exception 'Chest not found or already opened';
  end if;

  -- 2. Handle pity system
  if v_chest_type in ('ciclo', 'radiante', 'epico', 'season') then
    select coalesce(counter, 0)
    into v_pity_counter
    from user_pity_counters
    where user_id = v_user_id
      and chest_type = v_chest_type;

    if v_pity_counter is null then
      insert into user_pity_counters (user_id, chest_type, counter)
      values (v_user_id, v_chest_type, 0);
      v_pity_counter := 0;
    end if;

    v_pity_counter := v_pity_counter + 1;

    v_guaranteed_tier := case
      when v_chest_type = 'ciclo' and v_pity_counter >= 15 then 3
      when v_chest_type = 'radiante' and v_pity_counter >= 10 then 3
      when v_chest_type = 'epico' and v_pity_counter >= 8 then 4
      when v_chest_type = 'season' and v_pity_counter >= 5 then 5
      else 0
    end;
  end if;

  -- 3. Determine drop tier
  declare
    v_rand float := random() * 100;
  begin
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
        when 'radiante' then
          if v_rand < 45 then v_dropped_tier := 2;
          elsif v_rand < 85 then v_dropped_tier := 3;
          elsif v_rand < 95 then v_dropped_tier := 4;
          else v_dropped_tier := 5; end if;
        when 'epico' then
          if v_rand < 50 then v_dropped_tier := 3;
          elsif v_rand < 85 then v_dropped_tier := 4;
          else v_dropped_tier := 5; end if;
        when 'season' then
          if v_rand < 60 then v_dropped_tier := 4;
          else v_dropped_tier := 5; end if;
        else
          v_dropped_tier := 1;
      end case;
    end if;
  end;

  -- 4. Pick item of dropped tier, respecting the live catalog flag.
  select id, name, recycle_value
  into v_dropped_item_id, v_item_name, v_recycle_value
  from items
  where tier = v_dropped_tier
    and coalesce(is_live_in_game, true) = true
    and (is_gold_exclusive = false or is_gold_exclusive is null)
    and (is_season_exclusive = (v_chest_type = 'season'))
  order by random()
  limit 1;

  if v_dropped_item_id is null then
    select id, name, recycle_value
    into v_dropped_item_id, v_item_name, v_recycle_value
    from items
    where tier = v_dropped_tier
      and coalesce(is_live_in_game, true) = true
    limit 1;
  end if;

  if v_dropped_item_id is null then
    raise exception 'No live item available for tier %', v_dropped_tier;
  end if;

  -- 5. Check duplicate
  select exists(
    select 1
    from user_inventory
    where user_id = v_user_id
      and item_id = v_dropped_item_id
  )
  into v_is_duplicate;

  if v_is_duplicate then
    v_fragments_gained := v_recycle_value;
  else
    insert into user_inventory (user_id, item_id)
    values (v_user_id, v_dropped_item_id);
  end if;

  -- 6. Bonus fragments
  v_bonus_fragments := case v_chest_type
    when 'incomum' then floor(random() * (15 - 5 + 1) + 5)
    when 'ciclo' then floor(random() * (30 - 10 + 1) + 10)
    when 'radiante' then floor(random() * (80 - 30 + 1) + 30)
    when 'epico' then floor(random() * (200 - 80 + 1) + 80)
    when 'season' then floor(random() * (500 - 200 + 1) + 200)
    else 0
  end;

  v_fragments_gained := v_fragments_gained + v_bonus_fragments;

  update user_profiles
  set fragments = coalesce(fragments, 0) + v_fragments_gained
  where id = v_user_id;

  -- 7. Update pity
  if v_chest_type in ('ciclo', 'radiante', 'epico', 'season') then
    if v_dropped_tier >= v_guaranteed_tier and v_guaranteed_tier > 0 then
      update user_pity_counters
      set counter = 0, last_reset = now()
      where user_id = v_user_id
        and chest_type = v_chest_type;
    else
      update user_pity_counters
      set counter = v_pity_counter
      where user_id = v_user_id
        and chest_type = v_chest_type;
    end if;
  end if;

  -- 8. Close chest
  update user_chests
  set is_opened = true, opened_at = now()
  where id = v_chest_id;

  -- 9. Log
  insert into transactions (user_id, type, currency, amount, description)
  values (
    v_user_id,
    'open_chest',
    'fragments',
    v_fragments_gained,
    'Opened ' || v_input_chest_type || ' chest. Got ' || v_item_name || (case when v_is_duplicate then ' (Duplicate)' else '' end)
  );

  return jsonb_build_object(
    'success', true,
    'item_id', v_dropped_item_id,
    'item_name', v_item_name,
    'tier', v_dropped_tier,
    'is_duplicate', v_is_duplicate,
    'fragments_gained', v_fragments_gained,
    'bonus_fragments', v_bonus_fragments
  );
end;
$function$;
