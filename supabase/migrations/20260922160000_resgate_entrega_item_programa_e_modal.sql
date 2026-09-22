-- O CODIGO DE RESGATE ENTREGAVA UM TERCO DO QUE PROMETIA.
--
-- O VANGUARDA25 grava no `reward_payload`, desde abril: 50 de ouro, um bau
-- Incomum, quatro `item_ids`, o programa beta de 14 dias e o `vanguard_payload`
-- inteiro — titulo, resumo e os tres destaques do modal de boas-vindas.
--
-- A funcao `redeem_reward_code` lia ouro, fragmentos, dias premium, bau e
-- creditos. So isso. `item_ids`, `beta_program_*`, `vanguard_payload` e
-- `set_vanguard_welcome` eram ignorados em silencio: quem resgatava recebia o
-- ouro e o bau, e o "Pacote da Vanguarda" chegava sem borda, sem banner, sem
-- programa e sem o modal que ja existe pronto na tela esperando o campo.
--
-- Ninguem percebeu porque resgate que da certo pela metade nao reclama. Confira
-- depois de aplicar com o bloco em sql/checks/vanguarda25_esta_de_pe.sql.
--
-- As tres entregas novas sao idempotentes: `_starter_reward_grant_inventory_item_once`
-- ja nao duplica item, e os dois updates escrevem o mesmo valor se rodarem de
-- novo. O resgate em si continua protegido pelo limite por pessoa.

create or replace function public.redeem_reward_code(p_code text, p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  -- O que a funcao nao sabia entregar ate 22/09/2026.
  v_item_ids text[] := array[]::text[];
  v_item_id text;
  v_vanguard_payload jsonb;
  v_beta_key text;
  v_beta_label text;
  v_beta_days integer := 0;
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_code text := upper(trim(coalesce(p_code, '')));
  v_reward public.reward_codes%rowtype;
  v_profile public.user_profiles%rowtype;
  v_now timestamptz := now();
  v_total_redemptions integer := 0;
  v_user_redemptions integer := 0;
  v_payload jsonb := '{}'::jsonb;
  v_gold integer := 0;
  v_fragments integer := 0;
  v_premium_days integer := 0;
  v_chest_type text := null;
  v_chest_count integer := 0;
  v_legacy_scene_credits integer := 0;
  v_campaign_quiz_free_credits integer := 0;
  v_campaign_quiz_medium_credits integer := 0;
  v_current_gold integer := 0;
  v_current_fragments integer := 0;
  v_next_gold integer := 0;
  v_next_fragments integer := 0;
  v_current_premium_expires_at timestamptz := null;
  v_next_premium_expires_at timestamptz := null;
  v_reward_summary text := '';
  v_snapshot jsonb := '{}'::jsonb;
  v_index integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if auth.uid() is not null and auth.uid() <> v_uid then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'USER_MISMATCH'
    );
  end if;

  if v_code = '' then
    return jsonb_build_object(
      'success', false,
      'code', '',
      'error', 'EMPTY_CODE'
    );
  end if;

  select *
  into v_reward
  from public.reward_codes
  where lower(code) = lower(v_code)
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', v_code,
      'error', 'CODE_NOT_FOUND'
    );
  end if;

  if not coalesce(v_reward.is_active, false) then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_INACTIVE'
    );
  end if;

  if v_reward.starts_at is not null and v_reward.starts_at > v_now then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_NOT_STARTED'
    );
  end if;

  if v_reward.ends_at is not null and v_reward.ends_at < v_now then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_EXPIRED'
    );
  end if;

  select count(*)::integer
  into v_total_redemptions
  from public.reward_code_redemptions
  where code_id = v_reward.id;

  if v_reward.max_redemptions is not null and v_total_redemptions >= v_reward.max_redemptions then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_LIMIT_REACHED'
    );
  end if;

  select count(*)::integer
  into v_user_redemptions
  from public.reward_code_redemptions
  where code_id = v_reward.id
    and user_id = v_uid;

  if v_user_redemptions >= greatest(1, coalesce(v_reward.per_user_limit, 1)) then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'CODE_ALREADY_REDEEMED'
    );
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', v_reward.code,
      'error', 'PROFILE_NOT_FOUND'
    );
  end if;

  v_payload := coalesce(v_reward.reward_payload, '{}'::jsonb);
  v_gold := greatest(0, coalesce((v_payload ->> 'gold')::integer, 0));
  v_fragments := greatest(0, coalesce((v_payload ->> 'fragments')::integer, 0));
  v_premium_days := greatest(0, coalesce((v_payload ->> 'premium_days')::integer, 0));
  v_chest_type := nullif(trim(coalesce(v_payload ->> 'chest_type', '')), '');
  v_chest_count := greatest(0, coalesce((v_payload ->> 'chest_count')::integer, 0));
  v_legacy_scene_credits := greatest(0, coalesce((v_payload ->> 'legacy_scene_credits')::integer, 0));
  v_campaign_quiz_free_credits := greatest(0, coalesce((v_payload ->> 'campaign_quiz_free_credits')::integer, 0));
  v_campaign_quiz_medium_credits := greatest(0, coalesce((v_payload ->> 'campaign_quiz_medium_credits')::integer, 0));

  /* ITEM, PROGRAMA E MODAL: o que o payload prometia e a funcao ignorava.

     O VANGUARDA25 grava item_ids, beta_program_* e vanguard_payload desde
     abril, e nada disso era lido. Quem resgatava recebia ouro e bau, e o
     "Pacote da Vanguarda" entregava um terco do que anunciava — sem borda,
     sem banner, sem programa e sem o modal de boas-vindas. */
  v_vanguard_payload := v_payload -> 'vanguard_payload';
  v_beta_key := nullif(trim(coalesce(v_payload ->> 'beta_program_key', '')), '');
  v_beta_label := nullif(trim(coalesce(v_payload ->> 'beta_program_label', '')), '');
  v_beta_days := greatest(0, coalesce((v_payload ->> 'beta_program_days')::integer, 0));

  select coalesce(array_agg(value), array[]::text[])
  into v_item_ids
  from jsonb_array_elements_text(coalesce(v_payload -> 'item_ids', '[]'::jsonb)) as value;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
  v_current_fragments := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, v_profile.fragments, 0);
  v_next_gold := v_current_gold + v_gold;
  v_next_fragments := v_current_fragments + v_fragments;

  v_current_premium_expires_at := v_profile.premium_expires_at;
  if v_premium_days > 0 then
    v_next_premium_expires_at := greatest(coalesce(v_current_premium_expires_at, v_now), v_now) + make_interval(days => v_premium_days);
  else
    v_next_premium_expires_at := v_current_premium_expires_at;
  end if;

  update public.user_profiles
  set
    gold = v_next_gold,
    fragments = v_next_fragments,
    wallet = jsonb_build_object(
      'gold', v_next_gold,
      'fragments', v_next_fragments
    ),
    is_premium = case
      when v_premium_days > 0 then true
      else coalesce(is_premium, false)
    end,
    subscription_tier = case
      when v_premium_days > 0 then 'premium'
      else subscription_tier
    end,
    premium_expires_at = v_next_premium_expires_at,
    legacy_projection_scene_credits = coalesce(legacy_projection_scene_credits, 0) + v_legacy_scene_credits,
    campaign_quiz_free_credits = coalesce(campaign_quiz_free_credits, 0) + v_campaign_quiz_free_credits,
    campaign_quiz_medium_credits = coalesce(campaign_quiz_medium_credits, 0) + v_campaign_quiz_medium_credits,
    updated_at = now()
  where id = v_uid;

  if v_chest_type is not null and v_chest_count > 0 then
    for v_index in 1..v_chest_count loop
      perform public.grant_chest(v_uid, v_chest_type);
    end loop;
  end if;

  v_snapshot := jsonb_build_object(
    'gold', v_gold,
    'fragments', v_fragments,
    'premium_days', v_premium_days,
    'chest_type', v_chest_type,
    'chest_count', v_chest_count,
    'legacy_scene_credits', v_legacy_scene_credits,
    'campaign_quiz_free_credits', v_campaign_quiz_free_credits,
    'campaign_quiz_medium_credits', v_campaign_quiz_medium_credits
  );

  insert into public.reward_code_redemptions (
    code_id,
    user_id,
    code,
    reward_snapshot
  ) values (
    v_reward.id,
    v_uid,
    v_reward.code,
    v_snapshot
  );

  -- Concede os itens. A funcao do starter ja e "once": resgatar de novo nao
  -- duplica nada no inventario.
  if array_length(v_item_ids, 1) is not null then
    foreach v_item_id in array v_item_ids loop
      perform public._starter_reward_grant_inventory_item_once(v_uid, v_item_id);
    end loop;
  end if;

  -- O programa beta, quando o codigo carrega um.
  if v_beta_key is not null then
    update public.user_profiles
    set beta_program_code = v_beta_key,
        beta_program_label = coalesce(v_beta_label, beta_program_label),
        beta_program_started_at = coalesce(beta_program_started_at, v_now),
        beta_program_ends_at = case
          when v_beta_days > 0 then greatest(coalesce(beta_program_ends_at, v_now), v_now) + make_interval(days => v_beta_days)
          else beta_program_ends_at
        end
    where id = v_uid;
  end if;

  -- E o modal de boas-vindas, que ja existe na tela esperando este campo.
  if coalesce((v_payload ->> 'set_vanguard_welcome')::boolean, false) and v_vanguard_payload is not null then
    update public.user_profiles
    set vanguard_welcome_pending = true,
        vanguard_welcome_payload = v_vanguard_payload
    where id = v_uid;
  end if;

  v_reward_summary := coalesce(v_payload ->> 'summary', '');
  if v_reward_summary = '' then
    v_reward_summary := concat_ws(
      ' · ',
      case when v_gold > 0 then '+' || v_gold::text || ' ouro' else null end,
      case when v_fragments > 0 then '+' || v_fragments::text || ' fragmentos' else null end,
      case when v_premium_days > 0 then '+' || v_premium_days::text || ' dias premium' else null end,
      case when v_chest_type is not null and v_chest_count > 0 then '+' || v_chest_count::text || ' bau ' || v_chest_type else null end,
      case when v_legacy_scene_credits > 0 then '+' || v_legacy_scene_credits::text || ' cena de legado' else null end
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'code', v_reward.code,
    'title', v_reward.title,
    'description', v_reward.description,
    'reward_summary', v_reward_summary,
    'wallet', jsonb_build_object(
      'gold', v_next_gold,
      'fragments', v_next_fragments
    ),
    'premium_days_granted', v_premium_days,
    'chest_type', v_chest_type,
    'chest_count', v_chest_count,
    'legacy_scene_credits_granted', v_legacy_scene_credits,
    'campaign_quiz_free_credits_granted', v_campaign_quiz_free_credits,
    'campaign_quiz_medium_credits_granted', v_campaign_quiz_medium_credits,
    'item_ids', to_jsonb(v_item_ids)
  );
end;
$$;
