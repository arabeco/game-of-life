-- O BOOST PASSA A SER CONCEDIDO POR QUEM COBRA POR ELE.
--
-- `buy_store_item` debitava o ouro do boost e nao entregava nada: quem
-- escrevia `exp_boost_multiplier`, `exp_boost_expires_at` e
-- `exp_boost_product_id` era o APLICATIVO, depois, com um update de perfil.
-- Entao o debito e a entrega eram dois atos separados, e so o primeiro era
-- vigiado. Dava para pular o primeiro.
--
-- Agora e um ato so, dentro da mesma transacao: quem nao pagou nao recebe, e
-- quem pagou recebe mesmo que o aplicativo morra no segundo seguinte.
--
-- AS OUTRAS QUATRO COLUNAS QUE FECHAM AQUI JA ERAM DO SERVIDOR.
--
-- `chests` e os tres creditos ja eram escritos por RPC. O aplicativo tambem os
-- escrevia, mas copiando de volta o que o servidor tinha acabado de responder
-- — espelho, nao decisao. Fechar a coluna nao tira nenhuma capacidade dele.
--
-- O QUE CONTINUA ABERTO, E POR QUE.
--
-- `nobility` — o EXP — segue gravavel pelo cliente, e nao e esquecimento. O
-- progresso inteiro e decidido no aplicativo: e ele que sabe que tarefa foi
-- concluida e quanto ela vale. Um RPC que recebesse o numero pronto nao
-- fecharia nada, so mudaria a porta por onde o numero entra. Fechar de
-- verdade e mover a regra de progressao para o servidor, e isso e outro
-- trabalho.
--
-- `unlocked_items` e `unlocked_skins` tambem ficam: insignia de patente e
-- codex sao concedidos por escrita do cliente, e cada um precisa de caminho
-- proprio antes.

begin;

-- --------------------------------------------------------------------------
-- 1. O CATALOGO PRECISA SABER O QUE O BOOST FAZ, E NAO SO O QUE CUSTA.
-- --------------------------------------------------------------------------

alter table public.store_prices add column if not exists duration_hours integer;
alter table public.store_prices add column if not exists multiplier numeric;

update public.store_prices set duration_hours = 24,  multiplier = 1.05 where id = 'boost_xp_24h';
update public.store_prices set duration_hours = 168, multiplier = 1.10 where id = 'boost_xp_7d';

-- --------------------------------------------------------------------------
-- 2. COBRAR E ENTREGAR VIRAM O MESMO ATO.
-- --------------------------------------------------------------------------

create or replace function public.buy_store_item(p_item_id text, p_cost_gold integer, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user         uuid := auth.uid();
  v_base         integer;
  v_preco        integer;
  v_novo_saldo   integer;
  v_tier         text;
  v_expira       timestamptz;
  v_id_do_nivel  text;
  v_com_desconto boolean := false;
  v_horas        integer;
  v_multi        numeric;
  v_boost_ate    timestamptz;
  v_boost_novo   timestamptz;
begin
  if v_user is null then
    raise exception 'sem sessao';
  end if;

  if p_type not in ('exclusive', 'codex', 'boost', 'premium') then
    raise exception 'tipo invalido';
  end if;

  if p_type = 'exclusive' then
    select i.gold_price into v_base
    from public.items i
    where i.id = p_item_id
      and coalesce(i.is_live_in_game, true) = true
      and coalesce(i.is_chest_exclusive, false) = false
      and coalesce(i.is_rank_exclusive, false) = false
      and coalesce(i.is_premium_only, false) = false
      and coalesce(i.is_legacy_retired, false) = false;
  else
    select sp.gold_price, sp.duration_hours, sp.multiplier
      into v_base, v_horas, v_multi
    from public.store_prices sp
    where sp.id = p_item_id and sp.kind = p_type;
  end if;

  if v_base is null or v_base <= 0 then
    raise exception 'item nao esta a venda';
  end if;

  -- Um boost sem duracao entregaria nada em troca de ouro. Melhor recusar a
  -- venda do que cobrar por um efeito que nao existe.
  if p_type = 'boost' and (v_horas is null or v_horas <= 0 or v_multi is null) then
    raise exception 'boost sem duracao cadastrada';
  end if;

  v_preco := v_base;

  if p_type = 'premium' then
    select up.subscription_tier, up.premium_expires_at
      into v_tier, v_expira
    from public.user_profiles up
    where up.id = v_user;

    v_id_do_nivel := case when v_tier = 'platinum' then 'platinum_30d' else 'premium_30d' end;

    if v_expira is not null
       and v_expira > now()
       and ceil(extract(epoch from (v_expira - now())) / 86400.0) <= 3
       and p_item_id = v_id_do_nivel
    then
      v_preco := greatest(0, round(v_base * 0.9))::integer;
      v_com_desconto := true;
    end if;
  end if;

  if v_preco <= 0 then
    raise exception 'preco invalido';
  end if;

  update public.user_profiles
     set wallet = jsonb_set(
           coalesce(wallet, '{}'::jsonb),
           '{gold}',
           to_jsonb(coalesce((wallet->>'gold')::integer, 0) - v_preco))
   where id = v_user
     and coalesce((wallet->>'gold')::integer, 0) >= v_preco
  returning coalesce((wallet->>'gold')::integer, 0) into v_novo_saldo;

  if not found then
    raise exception 'Insufficient gold';
  end if;

  if p_type in ('exclusive', 'codex') then
    insert into public.user_inventory (user_id, item_id)
    select v_user, p_item_id
    where not exists (
      select 1 from public.user_inventory ui
      where ui.user_id = v_user and ui.item_id = p_item_id
    );
  end if;

  if p_type = 'boost' then
    -- Mesma regra de empilhamento do aplicativo (getNextExpBoostExpiryAt):
    -- comprar com boost ativo SOMA ao que falta, em vez de jogar fora o resto.
    select up.exp_boost_expires_at into v_boost_ate
    from public.user_profiles up where up.id = v_user;

    v_boost_novo := greatest(coalesce(v_boost_ate, now()), now())
                  + make_interval(hours => v_horas);

    update public.user_profiles
       set exp_boost_multiplier = v_multi,
           exp_boost_expires_at = v_boost_novo,
           exp_boost_product_id = p_item_id
     where id = v_user;
  end if;

  return jsonb_build_object(
    'success', true,
    'charged', v_preco,
    'base_price', v_base,
    'discounted', v_com_desconto,
    'new_gold', v_novo_saldo,
    'boost_multiplier', v_multi,
    'boost_expires_at', v_boost_novo
  );
end;
$function$;

-- --------------------------------------------------------------------------
-- 3. AS SETE COLUNAS SAEM DA MAO DO CLIENTE.
-- --------------------------------------------------------------------------
--
-- A lista continua sendo a das LIBERADAS, pelo mesmo motivo da anterior:
-- coluna nova tem de nascer fechada.

revoke update on table public.user_profiles from authenticated;

grant update (
  id,
  email,
  nickname,
  sovereign,
  avatar_url,
  border,
  level,
  background_url,
  banner_url,
  is_online,
  visible_widgets,
  skin,
  last_level_update,
  nobility,
  mood,
  completed_season_missions,
  unlocked_items,
  unlocked_skins,
  app_mode,
  theme_preference,
  arenas_view_mode,
  terms_version,
  terms_accepted_at,
  terms_accept_source,
  privacy_version,
  privacy_accepted_at,
  privacy_accept_source,
  onboarding_version,
  onboarding_started_at,
  onboarding_completed_at,
  onboarding_dismissed_at,
  codex_creation_slots_purchased,
  starter_rewards_pending,
  vanguard_welcome_pending,
  vanguard_welcome_payload,
  vanguard_welcome_shown_at,
  assets_visibility,
  mastery_visibility,
  partnership_slots_purchased,
  competition_slots_purchased,
  mentor_slots_purchased,
  linked_arena_slots_purchased,
  premium_reward_pending,
  premium_reward_payload,
  premium_reward_shown_at,
  feats_visibility,
  asset_art_by_id,
  asset_widget_values,
  sequence_items,
  onboarding_push_prompted_at,
  beta_program_code,
  beta_program_label,
  beta_program_started_at,
  beta_program_ends_at,
  beta_program_last_check_in_date,
  beta_program_check_in_count,
  beta_program_days_target,
  beta_reward_pending,
  beta_reward_shown_at,
  beta_reward_payload,
  username,
  title,
  checklist_items,
  garden_visibility,
  garden_state,
  daily_proof_streak,
  planner_view_mode,
  accepted_system_challenges,
  onboarding_age_range,
  onboarding_purpose,
  arena_pact_arena_id,
  arena_pact_kind,
  arena_pact_difficulty,
  arena_pact_goal,
  arena_pact_started_on,
  arena_pact_ends_on,
  legacy_five_day_eligible,
  legacy_plaque_color
) on table public.user_profiles to authenticated;

commit;
