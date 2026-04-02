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
  v_first_chest text := null;
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
    perform public.grant_chest(p_user_id, 'Season');
    perform public.grant_chest(p_user_id, 'Raro');
    v_first_chest := 'Season';
    v_legacy_credits := 1;
    v_medium_quiz_credits := 1;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'platinum',
      'eyebrow', 'Renovação platinum',
      'title', 'Platinum ativo',
      'summary', 'Seu plano maior foi renovado por mais 30 dias. Os baús desta rodada, a ficha média de quiz e o crédito grátis de legado já foram liberados.',
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Baús', 'value', 'Temporada + raro', 'detail', 'Rodada completa do Platinum.', 'tone', 'gold'),
        jsonb_build_object('label', 'Legado', 'value', '1 cena grátis', 'detail', 'Crédito liberado para a próxima projeção.', 'tone', 'cyan'),
        jsonb_build_object('label', 'Quiz', 'value', '1 ficha média', 'detail', 'Use no próximo quiz para liberar uma campanha média.', 'tone', 'emerald')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Todas as vantagens do Premium',
        'Até 30 arenas ativas',
        'Todos os planos de fundo e aparências premium'
      ),
      'emptyMessage', 'Nenhum cosmético novo era necessário agora. Os baús Temporada + raro já foram entregues. Crédito de legado: 1. Ficha média de quiz: 1.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Platinum', 'detail', '30 dias ativos'),
        jsonb_build_object('label', 'Ativo até', 'value', to_char(v_new_expiry at time zone 'utc', 'DD/MM/YYYY'), 'detail', 'validade atual'),
        jsonb_build_object('label', 'Entrega', 'value', 'Temporada + raro', 'detail', 'rodada do Platinum')
      ),
      'chestType', v_first_chest,
      'itemIds', '[]'::jsonb,
      'legacyProjectionSceneCreditsGranted', 1,
      'campaignQuizFreeCreditsGranted', 0,
      'campaignQuizMediumCreditsGranted', 1
    );
  else
    perform public.grant_chest(p_user_id, 'Raro');
    v_first_chest := 'Raro';
    v_free_quiz_credits := 1;

    v_reward_payload := jsonb_build_object(
      'membershipTier', 'premium',
      'eyebrow', 'Renovação premium',
      'title', 'Premium ativo',
      'summary', 'Seu Premium foi renovado por mais 30 dias. O baú raro e a ficha grátis de quiz desta rodada já foram liberados.',
      'buttonLabel', 'Seguir',
      'rewardHighlightsTitle', 'Entregue agora',
      'rewardHighlights', jsonb_build_array(
        jsonb_build_object('label', 'Baú', 'value', 'Raro', 'detail', 'Rodada do Premium confirmada.', 'tone', 'gold'),
        jsonb_build_object('label', 'Quiz', 'value', '1 ficha grátis', 'detail', 'Use no próximo quiz para liberar uma campanha grátis.', 'tone', 'emerald'),
        jsonb_build_object('label', 'Ciclo', 'value', '+10% XP', 'detail', 'Bônus ativo no fechamento do ciclo.', 'tone', 'cyan')
      ),
      'itemSectionTitle', 'Cosméticos integrados',
      'activeBenefitsTitle', 'Vantagens ativas',
      'activeBenefits', jsonb_build_array(
        'Até 15 arenas ativas',
        'Fundos premium de perfil e ativos',
        'Todos os modos do Oráculo',
        'Cena do legado com 50% off',
        'Bônus de legado +10% XP'
      ),
      'emptyMessage', 'Nenhum cosmético novo era necessário agora. O baú raro já foi entregue. Ficha grátis de quiz: 1.',
      'metricCards', jsonb_build_array(
        jsonb_build_object('label', 'Plano', 'value', 'Premium', 'detail', '30 dias ativos'),
        jsonb_build_object('label', 'Ativo até', 'value', to_char(v_new_expiry at time zone 'utc', 'DD/MM/YYYY'), 'detail', 'validade atual'),
        jsonb_build_object('label', 'Entrega', 'value', 'Baú raro + ficha', 'detail', 'rodada do Premium')
      ),
      'chestType', v_first_chest,
      'itemIds', '[]'::jsonb,
      'legacyProjectionSceneCreditsGranted', 0,
      'campaignQuizFreeCreditsGranted', 1,
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
grant execute on function public.process_approved_membership_payment(uuid, text, text, decimal, jsonb) to authenticated;
