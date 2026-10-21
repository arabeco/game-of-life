-- Coleções futuras completas: quatro temas e as três peças visuais de Zênite II.
-- As temporadas continuam desligadas (`is_live_in_game = false`): este cadastro não
-- muda inventários, não concede recompensa nem antecipa o calendário.
begin;

insert into public.items (
  id, name, category, tier, rarity, image_url, gold_price,
  is_rank_exclusive, is_gold_exclusive, is_season_exclusive,
  is_premium_only, is_chest_exclusive, is_legacy_retired,
  season_key, season_slot, recycle_value, craft_cost, is_live_in_game
) values
  ('ZENITE_I', 'Tema: Zênite I', 'ui_skin', 6, 'mythic', null, null, false, false, true, false, false, false, 'zenite_1_2027', 'ui_skin', 0, 0, false),
  ('ECLIPSE_I', 'Tema: Eclipse I', 'ui_skin', 6, 'mythic', null, null, false, false, true, false, false, false, 'eclipse_1_2027', 'ui_skin', 0, 0, false),
  ('EGIDE_I', 'Tema: Égide I', 'ui_skin', 6, 'mythic', null, null, false, false, true, false, false, false, 'egide_1_2027', 'ui_skin', 0, 0, false),
  ('ZENITE_II', 'Tema: Zênite II', 'ui_skin', 6, 'mythic', null, null, false, false, true, false, false, false, 'zenite_2_2027', 'ui_skin', 0, 0, false),
  ('item_border_zenite_2_2027', 'Zênite II', 'border', 6, 'mythic', '/assets/catalog/interface/borda-zenite-ii.webp', null, false, false, true, false, false, false, 'zenite_2_2027', 'border', 0, 0, false),
  ('item_banner_zenite_2_2027', 'Zênite II', 'banner', 6, 'mythic', '/assets/catalog/interface/banner-zenite-ii.webp', null, false, false, true, false, false, false, 'zenite_2_2027', 'banner', 0, 0, false),
  ('insignia_season_zenite_2_2027', 'Zênite II', 'insignia', 6, 'mythic', '/assets/catalog/interface/insignia-zenite-ii.webp', null, false, false, true, false, false, false, 'zenite_2_2027', 'insignia', 0, 0, false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  tier = excluded.tier,
  rarity = excluded.rarity,
  image_url = excluded.image_url,
  season_key = excluded.season_key,
  season_slot = excluded.season_slot,
  is_season_exclusive = excluded.is_season_exclusive;

-- Checagem esperada: quatro coleções com cinco peças, todas futuras desligadas.
select season_key, count(*) as pecas, bool_and(not is_live_in_game) as todas_desligadas
from public.items
where season_key in ('zenite_1_2027', 'eclipse_1_2027', 'egide_1_2027', 'zenite_2_2027')
  and not is_legacy_retired
group by season_key
order by season_key;

commit;
