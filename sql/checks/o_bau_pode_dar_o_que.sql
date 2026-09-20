-- O que cada baú alcança DE VERDADE, contado no banco e não no catálogo.
--
-- O app e o servidor não filtram igual. O `isChestEligibleItem` do TypeScript
-- recusa item de staff, de quest e de relatório; o WHERE da função
-- `open_chest` (migração 20260903150000) não conhece nenhum dos três. Ele
-- recusa só: insígnia, cabelo, is_rank_exclusive, is_premium_only,
-- is_legacy_retired, is_gold_exclusive e is_season_exclusive.
--
-- Isso deixa em pé uma pergunta que só o banco responde: os itens de GM estão
-- com `is_live_in_game` ligado? Se estiverem, o baú Lendário pode entregar a
-- Borda de Grande Mestre e o Banner de Grão Mestre.
--
-- Isto só lê. Não muda nada.

-- 1. Quantos itens cada tier oferece ao sorteio, com o filtro do servidor.
select
  tier,
  count(*) as itens_sorteaveis,
  string_agg(distinct category, ', ' order by category) as categorias
from public.items
where coalesce(is_live_in_game, true) = true
  and category not in ('insignia', 'insignias')
  and category <> 'hair'
  and is_rank_exclusive is not true
  and is_premium_only is not true
  and is_legacy_retired is not true
  and (is_gold_exclusive = false or is_gold_exclusive is null)
  and (is_season_exclusive = false or is_season_exclusive is null)
group by tier
order by tier;

-- 2. Os itens de GM: dá para cair de baú?
select
  id,
  name,
  tier,
  category,
  coalesce(is_live_in_game, true) as vivo,
  is_rank_exclusive,
  is_gold_exclusive,
  is_premium_only,
  case
    when coalesce(is_live_in_game, true)
     and is_rank_exclusive is not true
     and is_premium_only is not true
     and (is_gold_exclusive = false or is_gold_exclusive is null)
    then 'PODE CAIR DE BAU'
    else 'fora do bau'
  end as situacao
from public.items
where id in ('item_skin_season_001', 'item_border_5_001', 'item_banner_gm')
   or lower(name) like '%grande mestre%'
   or lower(name) like '%grao mestre%'
   or lower(name) like '%criador%'
order by tier, id;

-- 3. Quem está prometido numa patente e mesmo assim pode cair de baú.
--    O RANK_REWARDS é do código, então aqui só dá para ver o lado do banco:
--    quantos itens NÃO estão marcados is_rank_exclusive.
select
  category,
  count(*) filter (where is_rank_exclusive is true) as marcados_de_patente,
  count(*) filter (where is_rank_exclusive is not true) as sorteaveis
from public.items
where coalesce(is_live_in_game, true) = true
  and category in ('border', 'banner', 'skin', 'ui_skin', 'aura', 'plate')
group by category
order by category;
