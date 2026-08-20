-- A insignia da Temporada Zero. O kit do Genesis tinha 4 dos 5 slots: skin,
-- borda, banner e UI existiam, a insignia nunca foi criada.
--
-- Sem ela o bau Mitico do Genesis sorteia sobre uma colecao incompleta, e a
-- tela da colecao mostra 4/5 para sempre.
--
-- A arte entra depois: image_url fica null e o app cai no icone ate o PNG
-- chegar.

insert into public.items (
  id, name, category, tier, rarity,
  is_season_exclusive, is_gold_exclusive,
  recycle_value, craft_cost, gold_price, image_url, description,
  is_live_in_game, is_rank_exclusive, is_premium_only, is_chest_exclusive,
  is_legacy_retired, is_gm_exclusive, is_quest_exclusive, is_report_exclusive,
  season_key, season_slot
) values (
  'insignia_season_genesis', 'Genesis', 'insignia', 6, 'mythic',
  true, false,
  3000, 12000, null, null,
  'Marca de quem esteve na Temporada Zero, antes da Primeira Era comecar.',
  true, false, false, false,
  false, false, false, false,
  'genesis_legacy', 'insignia'
)
on conflict (id) do update set
  name = excluded.name,
  tier = excluded.tier,
  rarity = excluded.rarity,
  is_season_exclusive = excluded.is_season_exclusive,
  is_live_in_game = excluded.is_live_in_game,
  season_key = excluded.season_key,
  season_slot = excluded.season_slot;

-- Confere: a colecao do Genesis tem que fechar em 5 linhas tier 6.
select id, season_slot, tier, rarity, image_url is not null as tem_arte
from public.items
where season_key = 'genesis_legacy'
order by season_slot;
