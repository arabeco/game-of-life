-- Cinco skins aprovadas em 18/10. Cadastro sem antecipar liberação de temporadas.
-- Preserva Guardião Aurora e inventários. Reexecução não altera ativação.
begin;
insert into public.items (id,name,category,tier,rarity,image_url,gold_price,is_rank_exclusive,is_gold_exclusive,is_season_exclusive,is_premium_only,is_chest_exclusive,is_legacy_retired,season_key,season_slot,recycle_value,craft_cost,is_live_in_game) values
('item_skin_zenite_1_2027','Zênite I','skin',6,'mythic','/assets/catalog/avatars/SKIN_SEASON_ZENITE_I.png',null,false,false,true,false,false,false,'zenite_1_2027','skin',0,0,false),
('item_skin_eclipse_1_2027','Eclipse I','skin',6,'mythic','/assets/catalog/avatars/SKIN_SEASON_ECLIPSE_I.png',null,false,false,true,false,false,false,'eclipse_1_2027','skin',0,0,false),
('item_skin_egide_1_2027','Égide I','skin',6,'mythic','/assets/catalog/avatars/SKIN_SEASON_EGIDE_I.png',null,false,false,true,false,false,false,'egide_1_2027','skin',0,0,false),
('item_skin_aurora_2_2027','Aurora II','skin',6,'mythic','/assets/catalog/avatars/SKIN_SEASON_AURORA_II.png',null,false,false,true,false,false,false,'aurora_1_2026','skin',0,0,false),
('item_skin_zenite_2_2027','Zênite II','skin',6,'mythic','/assets/catalog/avatars/SKIN_SEASON_ZENITE_II.png',null,false,false,true,false,false,false,'zenite_2_2027','skin',0,0,false)
on conflict(id) do update set name=excluded.name,image_url=excluded.image_url,season_key=excluded.season_key,season_slot=excluded.season_slot;
commit;
