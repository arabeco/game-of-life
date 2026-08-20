-- Insignia nao cai de bau comum. Ganha-se subindo de patente, fechando ciclo
-- ou concluindo missao.
--
-- O sorteio nunca filtrou por categoria: escolhe um tier e pega qualquer item
-- vivo daquele tier. Insignias tem tier como qualquer outro item, entao um bau
-- Raro podia devolver a insignia de ciclo, e um Epico a de patente. O cliente
-- ja recusava isso em isChestEligibleItem, mas quem decide o drop e esta funcao
-- - o cliente so desenha o resultado.
--
-- Piorou agora que insignias de honra acumulam: antes a copia repetida virava
-- fragmento e o vazamento passava por dano leve; hoje ela empilha, e o bau
-- viraria uma segunda via de coisa que era pra ser merecida.
--
-- A excecao e o bau Mitico, que e justamente como a insignia da temporada
-- chega. Por isso o filtro so vale fora de 'season'.
--
-- As colunas is_quest_exclusive e is_report_exclusive nao existem nesta tabela,
-- so no catalogo do cliente - filtrar por categoria e o que da para fazer aqui,
-- e e o que descreve a regra de verdade.

drop function if exists public.open_chest(character varying);

create or replace function public.open_chest(
  p_chest_type character varying,
  p_season_key text default null
)
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

  v_chest_type := case lower(v_input_chest_type)
    when 'comum' then 'comum'
    when 'incomum' then 'incomum'
    when 'raro' then 'radiante'
    when 'radiante' then 'radiante'
    when 'Ã©pico' then 'epico'
    when 'epico' then 'epico'
    when 'lendÃ¡rio' then 'lendario'
    when 'lendario' then 'lendario'
    when 'season' then 'season'
    when 'ciclo' then 'ciclo'
    else lower(v_input_chest_type)
  end;

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

  if v_chest_type in ('ciclo', 'radiante', 'epico', 'lendario', 'season') then
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
      when v_chest_type = 'lendario' and v_pity_counter >= 6 then 5
      when v_chest_type = 'season' and v_pity_counter >= 5 then 6
      else 0
    end;
  end if;

  declare
    v_rand float := random() * 100;
  begin
    if v_guaranteed_tier > 0 then
      v_dropped_tier := v_guaranteed_tier;
    else
      case v_chest_type
        when 'comum' then
          if v_rand < 80 then v_dropped_tier := 1;
          elsif v_rand < 95 then v_dropped_tier := 2;
          elsif v_rand < 98 then v_dropped_tier := 3;
          else v_dropped_tier := 4; end if;
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
          if v_rand < 40 then v_dropped_tier := 2;
          elsif v_rand < 85 then v_dropped_tier := 3;
          else v_dropped_tier := 4; end if;
        when 'epico' then
          if v_rand < 50 then v_dropped_tier := 3;
          elsif v_rand < 85 then v_dropped_tier := 4;
          else v_dropped_tier := 5; end if;
        when 'lendario' then
          if v_rand < 40 then v_dropped_tier := 4;
          else v_dropped_tier := 5; end if;
        when 'season' then
          v_dropped_tier := 6;
        else
          v_dropped_tier := 1;
      end case;
    end if;
  end;

  select i.id, i.name, i.recycle_value
  into v_dropped_item_id, v_item_name, v_recycle_value
  from items i
  where i.tier = v_dropped_tier
    and coalesce(i.is_live_in_game, true) = true
    and (v_chest_type = 'season' or i.category not in ('insignia', 'insignias'))
    and (i.is_gold_exclusive = false or i.is_gold_exclusive is null)
    and (i.is_season_exclusive = (v_chest_type = 'season'))
    and (v_chest_type <> 'season' or p_season_key is null or i.season_key = p_season_key)
    and not exists (
      select 1
      from user_inventory ui
      where ui.user_id = v_user_id
        and ui.item_id = i.id
    )
  order by random()
  limit 1;

  if v_dropped_item_id is null then
    select i.id, i.name, i.recycle_value
    into v_dropped_item_id, v_item_name, v_recycle_value
    from items i
    where i.tier = v_dropped_tier
      and coalesce(i.is_live_in_game, true) = true
      and (v_chest_type = 'season' or i.category not in ('insignia', 'insignias'))
      and (i.is_gold_exclusive = false or i.is_gold_exclusive is null)
      and (i.is_season_exclusive = (v_chest_type = 'season'))
      and (v_chest_type <> 'season' or p_season_key is null or i.season_key = p_season_key)
    order by random()
    limit 1;
  end if;

  if v_dropped_item_id is null and v_chest_type <> 'season' then
    select i.id, i.name, i.recycle_value
    into v_dropped_item_id, v_item_name, v_recycle_value
    from items i
    where i.tier = v_dropped_tier
      and coalesce(i.is_live_in_game, true) = true
      and (v_chest_type = 'season' or i.category not in ('insignia', 'insignias'))
      and not exists (
        select 1
        from user_inventory ui
        where ui.user_id = v_user_id
          and ui.item_id = i.id
      )
    order by random()
    limit 1;
  end if;

  if v_dropped_item_id is null and v_chest_type <> 'season' then
    select i.id, i.name, i.recycle_value
    into v_dropped_item_id, v_item_name, v_recycle_value
    from items i
    where i.tier = v_dropped_tier
      and coalesce(i.is_live_in_game, true) = true
      and (v_chest_type = 'season' or i.category not in ('insignia', 'insignias'))
    order by random()
    limit 1;
  end if;

  if v_dropped_item_id is null then
    raise exception 'No live item available for tier %', v_dropped_tier;
  end if;

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

  if v_chest_type in ('ciclo', 'radiante', 'epico', 'lendario', 'season') then
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

  update user_chests
  set is_opened = true, opened_at = now()
  where id = v_chest_id;

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
