-- OS PLANOS DE 28/10/2026 (decididos com o Afonso).
--
-- 1. Assinatura: mensal (30 dias) ou anual (365, plano base "anual" da Play;
--    quem diz e a resposta da Google, em google-play-purchase). O Platinum ganha
--    1 cena do Legado por mes de plano, como credito (1 no mensal, 12 no anual).
-- 2. Cena do Legado: 50 de ouro para todos; sai o desconto por plano.
-- 3. Campanhas: Premium -20%, Platinum -40%.
-- 4. Assinatura paga com ouro: Premium 150, Platinum 300 (era 200 e 500).
--
-- Plano nao da ouro. As fichas de vinculo sao outra migracao.
-- Pode ser rodado de novo sem estrago.

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
  -- 30 (mensal) ou 365 (anual, plano base "anual" da Play). So o servidor
  -- (google-play-purchase) escreve este campo.
  v_dias integer := case when coalesce((p_metadata->>'days')::integer, 30) = 365 then 365 else 30 end;
  v_meses integer;
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

  v_new_expiry := v_base_expiry + make_interval(days => v_dias);
  v_meses := case when v_dias = 365 then 12 else 1 end;

  if v_effective_tier = 'platinum' then
    -- 1 cena do Legado por mes de plano (28/10/2026): 1 no mensal, 12 no anual.
    v_legacy_credits := v_meses;
    v_medium_quiz_credits := 0;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'platinum',
      'eyebrow', 'Renovação platinum',
      'title', 'Platinum ativo',
      'summary', case when v_dias = 365 then 'Seu Platinum está ativo por 12 meses. As vantagens já estão disponíveis.' else 'Seu Platinum foi renovado por mais 30 dias. As vantagens já estão disponíveis.' end,
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Campanhas', 'value', '40% off', 'detail', 'Desconto em toda campanha enquanto o plano estiver ativo.', 'tone', 'emerald'),
        jsonb_build_object('label', 'Legado', 'value', v_meses || case when v_meses = 1 then ' cena' else ' cenas' end, 'detail', '1 cena do Legado por mês de plano.', 'tone', 'gold')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Tudo do Premium',
        'Até 40 arenas ativas',
        'Todos os fundos e temas de interface',
        '5 fichas de vínculo por mês',
        'Campanhas com 40% off',
        '1 cena do Legado por mês'
      ),
      'emptyMessage', 'Campanhas com 40% de desconto e 1 cena do Legado por mês.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Platinum', 'detail', case when v_dias = 365 then '12 meses ativos' else '30 dias ativos' end),
        jsonb_build_object('label', 'Ativo até', 'value', to_char(v_new_expiry at time zone 'utc', 'DD/MM/YYYY'), 'detail', 'validade atual'),
        jsonb_build_object('label', 'Entrega', 'value', 'Vantagens Platinum', 'detail', 'rodada do Platinum')
      ),
      'itemIds', '[]'::jsonb,
      'legacyProjectionSceneCreditsGranted', v_meses,
      'campaignQuizFreeCreditsGranted', 0,
      'campaignQuizMediumCreditsGranted', 0
    );
  else
    v_free_quiz_credits := 0;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'premium',
      'eyebrow', 'Renovação premium',
      'title', 'Premium ativo',
      'summary', case when v_dias = 365 then 'Seu Premium está ativo por 12 meses. As vantagens já estão disponíveis.' else 'Seu Premium foi renovado por mais 30 dias. As vantagens já estão disponíveis.' end,
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Arenas', 'value', 'Até 20', 'detail', 'Arquivadas e de missão não contam.', 'tone', 'cyan')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Até 20 arenas ativas',
        'Leitura Premium no painel do dia e no relatório do ciclo',
        'Oráculo completo',
        'Matriz de urgência e importância no planner',
        'Fundos premium nas áreas e no perfil',
        '2 fichas de vínculo por mês',
        'Campanhas com 20% off'
      ),
      'emptyMessage', 'Vantagens do Premium disponíveis.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Premium', 'detail', case when v_dias = 365 then '12 meses ativos' else '30 dias ativos' end),
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

-- A cena do Legado custa o mesmo para todos (a tela le LEGACY_PROJECTION_DISCOUNT_BY_TIER).
create or replace function public._desconto_da_cena_do_legado(p_tier text)
returns numeric
language sql
immutable
as $$
  select case lower(coalesce(p_tier, ''))
    when 'platinum' then 0
    when 'premium'  then 0
    else 0
  end;
$$;

-- Desconto em campanha (a tela le CAMPAIGN_DISCOUNT_BY_TIER). Arredonda para cima.
create or replace function public.campaign_price_for_user(p_user_id uuid, p_base_price integer)
returns integer
language plpgsql
stable
security definer
set search_path = public, auth, extensions
as $$
declare
  v_base integer := greatest(0, coalesce(p_base_price, 0));
  v_tier text;
  v_expires timestamptz;
begin
  if v_base <= 0 then
    return 0;
  end if;

  select subscription_tier, premium_expires_at
    into v_tier, v_expires
  from public.user_profiles
  where id = p_user_id;

  -- Assinatura vencida nao desconta.
  if v_expires is null or v_expires <= now() then
    return v_base;
  end if;

  if coalesce(v_tier, '') = 'platinum' then
    return greatest(1, ceil(v_base * 0.60)::integer);
  end if;
  if coalesce(v_tier, '') = 'premium' then
    return greatest(1, ceil(v_base * 0.80)::integer);
  end if;
  return v_base;
end;
$$;

revoke all on function public.campaign_price_for_user(uuid, integer) from public;
grant execute on function public.campaign_price_for_user(uuid, integer) to authenticated;

update public.store_prices set gold_price = 150, label = 'Premium (30 dias)' where id = 'premium_30d';
update public.store_prices set gold_price = 300, label = 'Platinum (30 dias)' where id = 'platinum_30d';

commit;
