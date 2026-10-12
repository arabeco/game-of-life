-- Regras atuais dos planos: sem baús, sem ficha grátis Premium, sem nova cena grátis.
-- Créditos antigos são preservados. Ouro e ativação passam a ocorrer na mesma transação.
begin;

create or replace function public.process_approved_membership_payment(
  p_user_id uuid,
  p_payment_id text,
  p_membership_tier text,
  p_amount_paid decimal(10, 2),
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_existing_status text;
  v_requested_tier text := case
    when lower(coalesce(p_membership_tier, '')) = 'platinum' then 'platinum'
    else 'premium'
  end;
  v_effective_tier text := 'premium';
  v_now timestamptz := now();
  v_base_expiry timestamptz;
  v_new_expiry timestamptz;
  v_legacy_credits integer := 0;
  v_free_quiz_credits integer := 0;
  v_medium_quiz_credits integer := 0;
  v_reward_payload jsonb := '{}'::jsonb;
begin
  if p_user_id is null then
    raise exception 'USER_REQUIRED';
  end if;

  if coalesce(trim(p_payment_id), '') = '' then
    raise exception 'PAYMENT_REQUIRED';
  end if;

  select status
  into v_existing_status
  from public.user_purchases
  where payment_id = p_payment_id
  for update;

  if found and lower(coalesce(v_existing_status, '')) = 'approved' then
    return jsonb_build_object(
      'success', false,
      'message', 'Pagamento já processado'
    );
  end if;

  if not found then
    insert into public.user_purchases (
      user_id,
      payment_id,
      gold_amount,
      amount_paid,
      status,
      metadata
    ) values (
      p_user_id,
      p_payment_id,
      0,
      coalesce(p_amount_paid, 0),
      'processing',
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if coalesce(v_profile.premium_expires_at, to_timestamp(0)) > v_now then
    v_base_expiry := v_profile.premium_expires_at;
  else
    v_base_expiry := v_now;
  end if;

  v_effective_tier := case
    when v_requested_tier = 'premium'
      and lower(coalesce(v_profile.subscription_tier, '')) = 'platinum'
      and coalesce(v_profile.is_premium, false)
      and (v_profile.premium_expires_at is null or v_profile.premium_expires_at > v_now)
      then 'platinum'
    else v_requested_tier
  end;

  v_new_expiry := v_base_expiry + interval '30 days';

  if v_effective_tier = 'platinum' then
    v_legacy_credits := 0;
    v_medium_quiz_credits := 1;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'platinum',
      'eyebrow', 'Renovação platinum',
      'title', 'Platinum ativo',
      'summary', 'Seu plano maior foi renovado por mais 30 dias. Seu vale de campanha média está disponível.',
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Campanha', 'value', '1 vale de campanha média', 'detail', 'Use no próximo quiz para liberar uma campanha média.', 'tone', 'emerald')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Todas as vantagens do Premium',
        'Até 30 arenas no total',
        'Todos os planos de fundo e aparências premium'
      ),
      'emptyMessage', 'Vale de campanha média disponível. Cena de legado com 70% de desconto.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Platinum', 'detail', '30 dias ativos'),
        jsonb_build_object('label', 'Ativo até', 'value', to_char(v_new_expiry at time zone 'utc', 'DD/MM/YYYY'), 'detail', 'validade atual'),
        jsonb_build_object('label', 'Entrega', 'value', 'Vale de campanha média', 'detail', 'rodada do Platinum')
      ),
      'itemIds', '[]'::jsonb,
      'legacyProjectionSceneCreditsGranted', 0,
      'campaignQuizFreeCreditsGranted', 0,
      'campaignQuizMediumCreditsGranted', 1
    );
  else
    v_free_quiz_credits := 0;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'premium',
      'eyebrow', 'Renovação premium',
      'title', 'Premium ativo',
      'summary', 'Seu Premium foi renovado por mais 30 dias. As vantagens do plano já estão disponíveis.',
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Ciclo', 'value', '+5% XP', 'detail', 'Bônus ativo no fechamento do ciclo.', 'tone', 'cyan')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Até 15 arenas no total',
        'Fundos premium de perfil e ativos',
        'Todos os modos do Oráculo',
        'Cena do legado com 50% off',
        'Bônus de legado +5% XP'
      ),
      'emptyMessage', 'Vantagens do Premium disponíveis.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Premium', 'detail', '30 dias ativos'),
        jsonb_build_object('label', 'Ativo até', 'value', to_char(v_new_expiry at time zone 'utc', 'DD/MM/YYYY'), 'detail', 'validade atual'),
        jsonb_build_object('label', 'Entrega', 'value', 'Vantagens Premium', 'detail', 'rodada do Premium')
      ),
      'itemIds', '[]'::jsonb,
      'legacyProjectionSceneCreditsGranted', 0,
      'campaignQuizFreeCreditsGranted', 0,
      'campaignQuizMediumCreditsGranted', 0
    );
  end if;

  update public.user_profiles
  set
    is_premium = true,
    premium_expires_at = v_new_expiry,
    subscription_tier = v_effective_tier,
    premium_reward_pending = true,
    premium_reward_shown_at = null,
    premium_reward_payload = v_reward_payload,
    legacy_projection_scene_credits = coalesce(legacy_projection_scene_credits, 0) + v_legacy_credits,
    campaign_quiz_free_credits = coalesce(campaign_quiz_free_credits, 0) + v_free_quiz_credits,
    campaign_quiz_medium_credits = coalesce(campaign_quiz_medium_credits, 0) + v_medium_quiz_credits
  where id = p_user_id;

  update public.user_purchases
  set
    user_id = p_user_id,
    gold_amount = 0,
    amount_paid = coalesce(p_amount_paid, 0),
    status = 'approved',
    metadata = coalesce(p_metadata, '{}'::jsonb)
  where payment_id = p_payment_id;

  return jsonb_build_object(
    'success', true,
    'membership_tier', v_effective_tier,
    'premium_expires_at', v_new_expiry,
    'legacy_projection_scene_credits_granted', v_legacy_credits,
    'campaign_quiz_free_credits_granted', v_free_quiz_credits,
    'campaign_quiz_medium_credits_granted', v_medium_quiz_credits
  );
end;
$$;

revoke all on function public.process_approved_membership_payment(uuid, text, text, decimal, jsonb) from public;

revoke all on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) from anon, authenticated;
grant execute on function public.process_approved_membership_payment(uuid, text, text, numeric, jsonb) to service_role;


-- Idempotência por tentativa de compra. A pessoa só compra para auth.uid().
create or replace function public.buy_membership_with_gold(p_item_id text, p_request_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_tier text;
  v_base integer;
  v_price integer;
  v_discount boolean := false;
  v_key text;
  v_result jsonb;
  v_previous_role text;
  v_duplicate boolean := false;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_request_id is null then raise exception 'REQUEST_REQUIRED'; end if;
  v_tier := case p_item_id when 'premium_30d' then 'premium' when 'platinum_30d' then 'platinum' else null end;
  if v_tier is null then raise exception 'INVALID_MEMBERSHIP'; end if;
  select * into v_profile from public.user_profiles where id=v_user for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  v_key := 'membership-gold:' || v_user::text || ':' || p_request_id::text;
  select exists(select 1 from public.user_purchases where payment_id=v_key and status='approved') into v_duplicate;
  if not v_duplicate then
    if v_profile.subscription_tier='platinum' and v_profile.is_premium
       and (v_profile.premium_expires_at is null or v_profile.premium_expires_at>now())
       and v_tier='premium' then
      raise exception 'ACTIVE_PLATINUM_REQUIRES_PLATINUM_RENEWAL';
    end if;
    select gold_price into v_base from public.store_prices where id=p_item_id and kind='premium';
    if v_base is null or v_base<=0 then raise exception 'MEMBERSHIP_NOT_FOR_SALE'; end if;
    v_discount := coalesce(v_profile.premium_expires_at>now()
      and ceil(extract(epoch from (v_profile.premium_expires_at-now()))/86400.0)<=3
      and coalesce(v_profile.subscription_tier,'premium')=v_tier, false);
    v_price := case when v_discount then round(v_base*0.9)::integer else v_base end;
    if coalesce((v_profile.wallet->>'gold')::integer,0)<v_price then raise exception 'Insufficient gold'; end if;
    update public.user_profiles set wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{gold}',
      to_jsonb(coalesce((wallet->>'gold')::integer,0)-v_price)) where id=v_user;
    -- Escopo interno e transacional: o guard continua recusando UPDATE do cliente.
    -- Nenhuma entrada do cliente controla a role, o destinatário, o preço ou a duração.
    v_previous_role := current_setting('request.jwt.claim.role', true);
    perform set_config('request.jwt.claim.role','service_role',true);
    v_result := public.process_approved_membership_payment(v_user,v_key,v_tier,0,
      jsonb_build_object('source','gold','item_id',p_item_id,'gold_charged',v_price));
    perform set_config('request.jwt.claim.role',coalesce(v_previous_role,''),true);
    if not coalesce((v_result->>'success')::boolean,false) then raise exception 'MEMBERSHIP_NOT_DELIVERED'; end if;
  end if;
  select * into v_profile from public.user_profiles where id=v_user;
  return jsonb_build_object('success',true,'already_processed',v_duplicate,
    'charged',coalesce(v_price,0),'base_price',v_base,'discounted',v_discount,
    'new_gold',coalesce((v_profile.wallet->>'gold')::integer,0),
    'membership',jsonb_build_object('isPremium',v_profile.is_premium,
      'subscriptionTier',v_profile.subscription_tier,'premiumExpiresAt',v_profile.premium_expires_at,
      'premiumRewardPending',v_profile.premium_reward_pending,'premiumRewardPayload',v_profile.premium_reward_payload,
      'legacyProjectionSceneCredits',v_profile.legacy_projection_scene_credits,
      'campaignQuizFreeCredits',v_profile.campaign_quiz_free_credits,
      'campaignQuizMediumCredits',v_profile.campaign_quiz_medium_credits));
end;
$$;
revoke all on function public.buy_membership_with_gold(text,uuid) from public, anon;
grant execute on function public.buy_membership_with_gold(text,uuid) to authenticated;

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

  -- Compatibilidade com clientes antigos: não debitar antes de ativar.
  if p_type = 'premium' then
    return public.buy_membership_with_gold(p_item_id, gen_random_uuid());
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
commit;
