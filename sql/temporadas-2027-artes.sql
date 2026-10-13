-- Artes das quatro temporadas de 2027. Executar manualmente no Supabase.
-- Aurora preserva IDs, economia e ativacao. Novas pecas entram DESLIGADAS:
-- faltam skins, temas, missoes e revisao do pool antes de ativar cada temporada.
-- Repetir nao religa itens nem altera saldos/inventarios. Nao aposenta outros itens.
begin;
update public.items set image_url = '/assets/catalog/interface/borda-aurora-ii.webp', name = 'Aurora II' where id = 'item_border_aurora_1_2026';
update public.items set image_url = '/assets/catalog/interface/banner-aurora-ii.webp', name = 'Aurora II' where id = 'item_banner_aurora_1_2026';
update public.items set image_url = '/assets/catalog/interface/insignia-aurora-ii.webp', name = 'Aurora II' where id = 'insignia_season_aurora_1';
insert into public.items (
 id,name,category,tier,rarity,image_url,gold_price,
 is_rank_exclusive,is_gold_exclusive,is_season_exclusive,
 is_premium_only,is_chest_exclusive,is_legacy_retired,
 season_key,season_slot,recycle_value,craft_cost,is_live_in_game
) values
 ('item_border_zenite_1_2027','Zênite I','border',6,'mythic','/assets/catalog/interface/borda-zenite-i.webp',null,false,false,true,false,false,false,'zenite_1_2027','border',0,0,false),
 ('item_border_eclipse_1_2027','Eclipse I','border',6,'mythic','/assets/catalog/interface/borda-eclipse-i.webp',null,false,false,true,false,false,false,'eclipse_1_2027','border',0,0,false),
 ('item_border_egide_1_2027','Égide I','border',6,'mythic','/assets/catalog/interface/borda-egide-i.webp',null,false,false,true,false,false,false,'egide_1_2027','border',0,0,false),
 ('item_banner_zenite_1_2027','Zênite I','banner',6,'mythic','/assets/catalog/interface/banner-zenite-i.webp',null,false,false,true,false,false,false,'zenite_1_2027','banner',0,0,false),
 ('item_banner_eclipse_1_2027','Eclipse I','banner',6,'mythic','/assets/catalog/interface/banner-eclipse-i.webp',null,false,false,true,false,false,false,'eclipse_1_2027','banner',0,0,false),
 ('item_banner_egide_1_2027','Égide I','banner',6,'mythic','/assets/catalog/interface/banner-egide-i.webp',null,false,false,true,false,false,false,'egide_1_2027','banner',0,0,false),
 ('insignia_season_zenite_1_2027','Zênite I','insignia',6,'mythic','/assets/catalog/interface/insignia-zenite-i.webp',null,false,false,true,false,false,false,'zenite_1_2027','insignia',0,0,false),
 ('insignia_season_eclipse_1_2027','Eclipse I','insignia',6,'mythic','/assets/catalog/interface/insignia-eclipse-i.webp',null,false,false,true,false,false,false,'eclipse_1_2027','insignia',0,0,false),
 ('insignia_season_egide_1_2027','Égide I','insignia',6,'mythic','/assets/catalog/interface/insignia-egide-i.webp',null,false,false,true,false,false,false,'egide_1_2027','insignia',0,0,false)
on conflict (id) do update set
 name=excluded.name,image_url=excluded.image_url,
 season_key=excluded.season_key,season_slot=excluded.season_slot;
-- O resultado deve conter 12 linhas. As nove novas devem estar desligadas.
select id,image_url,season_key,season_slot,is_live_in_game
from public.items where id in ('item_border_aurora_1_2026','item_border_zenite_1_2027','item_border_eclipse_1_2027','item_border_egide_1_2027','item_banner_aurora_1_2026','item_banner_zenite_1_2027','item_banner_eclipse_1_2027','item_banner_egide_1_2027','insignia_season_aurora_1','insignia_season_zenite_1_2027','insignia_season_eclipse_1_2027','insignia_season_egide_1_2027') order by season_key,season_slot;
commit;
