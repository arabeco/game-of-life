-- O PLATINUM VIA 15 E PAGAVA 25.
--
-- A cena do legado custa 50 de ouro. O desconto por tier mudou no app: o
-- Platinum deixou de ganhar UMA cena gratis por renovacao e passou a ter 70% de
-- desconto permanente — o credito de uso unico continua sendo honrado para quem
-- tem saldo, mas o beneficio anunciado virou o desconto. Esta na lista de
-- vantagens do plano, com essas palavras: "Cena do legado com 70% off".
--
-- O cliente foi atualizado. Esta funcao nao.
--
--   if v_is_premium then
--     v_cost := 25;          -- 50% de 50, para premium E platinum
--   end if;
--
-- Entao a tela calculava 15 (`getLegacyProjectionScenePrice`, com o tier em
-- `LEGACY_PROJECTION_DISCOUNT_BY_TIER`) e o banco debitava 25. A compra dava
-- certo, sem erro nenhum: sumiam 10 de ouro a mais e ninguem era avisado.
--
-- O Premium estava correto dos dois lados, entao o unico lesado era o tier de
-- cima — justamente quem paga mais caro para ter vantagem.
--
-- Aqui o desconto vira TABELA, e nao um numero solto no meio do codigo. Era o
-- numero solto que permitia o app mudar e o banco ficar para tras.

begin;

/**
 * O desconto da cena do legado, por tier.
 *
 * Copia de `LEGACY_PROJECTION_DISCOUNT_BY_TIER` em `utils/premiumAccess.ts`.
 * Copia porque o banco nao le TypeScript — e o teste `economia-descontos`
 * compara as duas, para a proxima mudanca nao repetir esta historia.
 */
create or replace function public._desconto_da_cena_do_legado(p_tier text)
returns numeric
language sql
immutable
as $$
  select case lower(coalesce(p_tier, ''))
    when 'platinum' then 0.70
    when 'premium'  then 0.50
    else 0
  end;
$$;

create or replace function public.buy_legacy_projection_scene()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_base_cost integer := 50;
  v_cost integer := 50;
  v_new_gold integer;
  v_is_premium boolean := false;
  v_active_tier text := null;
  v_current_gold integer := 0;
  v_remaining_credits integer := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb)->>'gold')::integer, 0);

  v_is_premium := lower(coalesce(v_profile.role, '')) in ('admin', 'gm', 'admin_gm')
    or (
      coalesce(v_profile.is_premium, false)
      and (
        v_profile.premium_expires_at is null
        or v_profile.premium_expires_at > now()
      )
    );

  if v_is_premium then
    v_active_tier := coalesce(nullif(lower(coalesce(v_profile.subscription_tier, '')), ''), 'premium');

    -- AQUI ESTAVA O DEFEITO: `v_cost := 25` para todo mundo com plano.
    --
    -- O arredondamento e para BAIXO, de proposito: e o mesmo que
    -- `getDiscountedPremiumPrice` faz com Math.round em 50 * 0.3 = 15, e em
    -- 50 * 0.5 = 25. Nos dois casos da inteiro exato; o floor existe para o dia
    -- em que o preco base deixar de ser redondo e os dois lados precisarem
    -- concordar sem discussao.
    v_cost := greatest(
      1,
      floor(v_base_cost * (1 - public._desconto_da_cena_do_legado(v_active_tier)))::integer
    );
  end if;

  -- O credito antigo continua valendo para quem tem saldo. Ele deixou de ser o
  -- beneficio anunciado, mas quem ja recebeu nao perde.
  if v_active_tier = 'platinum' and coalesce(v_profile.legacy_projection_scene_credits, 0) > 0 then
    update public.user_profiles
    set legacy_projection_scene_credits = greatest(legacy_projection_scene_credits - 1, 0)
    where id = v_uid
    returning legacy_projection_scene_credits into v_remaining_credits;

    return jsonb_build_object(
      'success', true,
      'base_cost_gold', v_base_cost,
      'cost_gold', 0,
      'premium_discount_applied', true,
      'legacy_projection_scene_credit_applied', true,
      'legacy_projection_scene_credits_remaining', coalesce(v_remaining_credits, 0),
      'new_gold', v_current_gold
    );
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'legacy_projection_scene',
    'Geracao da cena do legado',
    jsonb_build_object(
      'base_cost_gold', v_base_cost,
      'cost_gold', v_cost,
      'premium_discount_applied', v_is_premium,
      'legacy_projection_scene_credit_applied', false,
      'surface', 'legacy_projection'
    )
  );

  return jsonb_build_object(
    'success', true,
    'base_cost_gold', v_base_cost,
    'cost_gold', v_cost,
    'premium_discount_applied', v_is_premium,
    'legacy_projection_scene_credit_applied', false,
    'legacy_projection_scene_credits_remaining', coalesce(v_profile.legacy_projection_scene_credits, 0),
    'new_gold', v_new_gold
  );
end;
$function$;

revoke all on function public.buy_legacy_projection_scene() from public, anon;
grant execute on function public.buy_legacy_projection_scene() to authenticated;

commit;
