-- As sete linhas que só existem no banco.
--
-- Seis bordas e um tema aparecem em public.items e não existem em lugar nenhum
-- do repositório: nem no constants/items.ts, nem no items_catalog_seed.sql, nem
-- como arte em public/assets/. Foram criadas fora daqui.
--
-- Duas pistas do que elas foram: o chest_canonicalization marcou o Fundador
-- como is_gold_exclusive, e o Tema Nebulosa como ui_skin da temporada
-- genesis_legacy — o mesmo slot que hoje o tema GENESIS ocupa.
--
-- Antes de decidir se voltam ou somem, três perguntas.

-- 1. Elas têm arte? Se image_url vier null, são só nome.
select
  id,
  name,
  category,
  tier,
  rarity,
  image_url,
  gold_price,
  is_gold_exclusive,
  is_rank_exclusive,
  season_key,
  season_slot,
  coalesce(is_live_in_game, true) as vivo
from public.items
where id in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001',
  'item_theme_nebulosa'
)
order by category, tier, id;

-- 2. Alguém tem alguma delas? Isto decide se dá para apagar.
select
  ui.item_id,
  count(*) as copias,
  count(distinct ui.user_id) as donos
from public.user_inventory ui
where ui.item_id in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001',
  'item_theme_nebulosa'
)
group by ui.item_id
order by donos desc;

-- 3. E alguém tem alguma delas EQUIPADA?
select
  'borda equipada' as onde,
  border as item,
  count(*) as pessoas
from public.user_profiles
where border in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001'
)
group by border
union all
select
  'tema equipado',
  skin,
  count(*)
from public.user_profiles
where skin = 'item_theme_nebulosa'
group by skin;
