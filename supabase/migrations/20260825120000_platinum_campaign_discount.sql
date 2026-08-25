-- Desconto de Platinum nas campanhas.
--
-- O Platinum custa 2,5x o Premium e, fora XP e limite de arenas, so entregava
-- cosmetico e consumivel de uso unico — coisa que se compra uma vez. Desconto e
-- o unico beneficio que volta a valer a cada compra, entao e ele que sustenta o
-- tier.
--
-- Mora AQUI porque e aqui que se cobra: buy_codex_catalog_item le price_gold do
-- catalogo e debita. Desconto so no cliente faria a tela prometer um valor e a
-- carteira pagar outro.
--
-- ATENCAO: a mesma taxa esta em CAMPAIGN_DISCOUNT_BY_TIER, em
-- utils/premiumAccess.ts, que e quem EXIBE o preco. Mudar uma exige mudar a outra.

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
    -- Arredonda para cima: ouro e inteiro, e a casa nao paga a diferenca.
    return greatest(1, ceil(v_base * 0.80)::integer);
  end if;

  return v_base;
end;
$$;

revoke all on function public.campaign_price_for_user(uuid, integer) from public;
grant execute on function public.campaign_price_for_user(uuid, integer) to authenticated;

-- A funcao de compra recriada por inteiro, com o preco do comprador no lugar do
-- preco de tabela. Recriar e mais seguro que remendar a fonte por substituicao.

create or replace function public.buy_codex_catalog_item(p_catalog_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_catalog public.codex_catalog%rowtype;
  v_existing public.codex%rowtype;
  v_profile public.user_profiles%rowtype;
  v_inserted public.codex%rowtype;
  v_current_gold integer := 0;
  v_new_gold integer := 0;
  -- Preco efetivamente cobrado. Calculado uma vez para o debito, o historico e
  -- o retorno contarem a mesma coisa.
  v_price integer := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_catalog
  from public.codex_catalog
  where id = p_catalog_id;

  if not found then
    raise exception 'CODEX_CATALOG_NOT_FOUND';
  end if;

  select *
  into v_existing
  from public.codex
  where owner_id = v_uid
    and catalog_id = p_catalog_id
  order by created_at desc nulls last
  limit 1;

  if found then
    raise exception 'Voce ja possui este Codex.';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
  v_price := public.campaign_price_for_user(v_uid, v_catalog.price_gold);

  if coalesce(v_catalog.price_gold, 0) > 0 then
    v_new_gold := public._codex_debit_gold(
      v_uid,
      v_price,
      'codex_catalog_purchase',
      format('Compra do Codex "%s"', coalesce(v_catalog.title, 'Codex')),
      jsonb_build_object(
        'catalog_id', v_catalog.id,
        'title', v_catalog.title,
        'price_gold', v_price,
        'list_price_gold', coalesce(v_catalog.price_gold, 0)
      )
    );
  else
    v_new_gold := v_current_gold;
  end if;

  insert into public.codex (
    owner_id,
    catalog_id,
    name,
    description,
    author,
    price,
    template,
    schema_version,
    is_public,
    source_type,
    created_by_user_id,
    origin_codex_id
  ) values (
    v_uid,
    v_catalog.id,
    v_catalog.title,
    v_catalog.description,
    v_catalog.author_name,
    v_price,
    v_catalog.template,
    'v2',
    false,
    'catalog',
    null,
    null
  )
  returning * into v_inserted;

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'codex_catalog',
    v_catalog.id::text,
    v_price,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'catalog_id', v_catalog.id,
    'price_gold', v_price,
    'list_price_gold', coalesce(v_catalog.price_gold, 0),
    'new_gold', v_new_gold,
    'codex', to_jsonb(v_inserted)
  );
end;
$$;
