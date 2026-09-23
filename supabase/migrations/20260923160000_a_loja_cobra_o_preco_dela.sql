-- O PRECO DEIXA DE VIR DO CLIENTE.
--
-- `buy_store_item(p_item_id, p_cost_gold, p_type)` cobrava o que o aplicativo
-- mandasse. Quem chamasse a RPC direto escolhia quanto pagar, e ja houve pior:
-- com custo negativo a verificacao `saldo < custo` passava e a subtracao virava
-- soma. A etapa anterior fechou o custo negativo e o debito em corrida. Esta
-- tira a decisao do preco das maos de quem compra.
--
-- Os precos moram em dois lugares porque os itens sempre moraram: o catalogo de
-- itens e `public.items` (sincronizado a partir de constants/items.ts), e os
-- outros tres tipos so existiam em constante de codigo. Esta migracao traz
-- esses tres para uma tabela, porque preco que o servidor nao conhece e preco
-- que o servidor nao pode conferir.
--
-- `p_cost_gold` continua na assinatura: o aplicativo ainda o envia, e mudar a
-- assinatura quebraria a versao publicada. Ele passou a ser IGNORADO.

begin;

-- --------------------------------------------------------------------------
-- 1. OS PRECOS QUE NAO ESTAO EM public.items
-- --------------------------------------------------------------------------

create table if not exists public.store_prices (
  id text primary key,
  kind text not null check (kind in ('codex', 'boost', 'premium')),
  gold_price integer not null check (gold_price > 0),
  label text not null default ''
);

alter table public.store_prices enable row level security;

-- Ninguem le esta tabela pela API. Quem consulta e a funcao abaixo, que roda
-- como dono. Deixar a tabela legivel nao seria vazamento — sao precos de loja —
-- mas seria uma segunda fonte de preco para o cliente, que e exatamente o
-- arranjo que esta migracao existe para desfazer.
revoke all on table public.store_prices from anon, authenticated;

insert into public.store_prices (id, kind, gold_price, label) values
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'codex',   200, 'Maquina Biologica'),
  ('codex_financas',                       'codex',   150, 'Campanha: Financas Pessoais'),
  ('codex_produtividade',                  'codex',   150, 'Campanha: Produtividade Extrema'),
  ('codex_saude',                          'codex',   150, 'Campanha: Saude & Fitness'),
  ('codex_mindset',                        'codex',   150, 'Campanha: Mindset de Sucesso'),
  ('boost_xp_24h',                         'boost',    50, 'Boost XP +5% (24h)'),
  ('boost_xp_7d',                          'boost',   200, 'Boost XP +10% (7 dias)'),
  ('premium_30d',                          'premium', 200, 'Premium (30 dias)'),
  ('platinum_30d',                         'premium', 500, 'Platinum (30 dias)')
on conflict (id) do update
  set kind = excluded.kind,
      gold_price = excluded.gold_price,
      label = excluded.label;

-- --------------------------------------------------------------------------
-- 2. A PORTA
-- --------------------------------------------------------------------------

create or replace function public.buy_store_item(p_item_id text, p_cost_gold integer, p_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user        uuid := auth.uid();
  v_base        integer;
  v_preco       integer;
  v_novo_saldo  integer;
  v_tier        text;
  v_expira      timestamptz;
  v_com_desconto boolean := false;
begin
  if v_user is null then
    raise exception 'sem sessao';
  end if;

  if p_type not in ('exclusive', 'codex', 'boost', 'premium') then
    raise exception 'tipo invalido';
  end if;

  -- O PRECO SAI DAQUI, NAO DO ARGUMENTO.
  if p_type = 'exclusive' then
    -- As quatro flags nao sao zelo extra: elas descrevem itens que existem no
    -- catalogo mas nao se compram — o que vem de bau, o que vem de patente, o
    -- que foi aposentado e o que esta desligado. Nenhum dos 50 itens com preco
    -- carrega alguma delas, entao a trava nao recusa nada que esteja a venda.
    select i.gold_price into v_base
    from public.items i
    where i.id = p_item_id
      and coalesce(i.is_live_in_game, true) = true
      and coalesce(i.is_chest_exclusive, false) = false
      and coalesce(i.is_rank_exclusive, false) = false
      and coalesce(i.is_premium_only, false) = false
      and coalesce(i.is_legacy_retired, false) = false;
  else
    select sp.gold_price into v_base
    from public.store_prices sp
    where sp.id = p_item_id and sp.kind = p_type;
  end if;

  if v_base is null or v_base <= 0 then
    raise exception 'item nao esta a venda';
  end if;

  v_preco := v_base;

  -- O UNICO DESCONTO LEGITIMO, CONFERIDO AQUI EM VEZ DE ACEITO DE LA.
  --
  -- A tela oferece 10% para renovar quando faltam tres dias ou menos, e so para
  -- quem TEM a assinatura ativa e renova o MESMO nivel. Era o unico motivo para
  -- o preco do cliente diferir do catalogo, e por isso o unico que precisa
  -- existir do lado de ca.
  if p_type = 'premium' then
    select up.subscription_tier, up.premium_expires_at
      into v_tier, v_expira
    from public.user_profiles up
    where up.id = v_user;

    if v_expira is not null
       and v_expira > now()
       and ceil(extract(epoch from (v_expira - now())) / 86400.0) <= 3
       and p_item_id = case when v_tier = 'platinum' then 'platinum_30d' else 'premium_30d' end
    then
      -- Mesma conta do cliente: Math.round(base * 0.9).
      v_preco := greatest(0, round(v_base * 0.9))::integer;
      v_com_desconto := true;
    end if;
  end if;

  if v_preco <= 0 then
    raise exception 'preco invalido';
  end if;

  -- Debito e verificacao na MESMA instrucao: ler o saldo e grava-lo depois
  -- deixava duas chamadas simultaneas passarem as duas pela conferencia.
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

  -- `charged` volta para o aplicativo poder mostrar o que foi realmente cobrado
  -- em vez de assumir o proprio palpite.
  return jsonb_build_object(
    'success', true,
    'charged', v_preco,
    'base_price', v_base,
    'discounted', v_com_desconto,
    'new_gold', v_novo_saldo
  );
end;
$function$;

commit;
