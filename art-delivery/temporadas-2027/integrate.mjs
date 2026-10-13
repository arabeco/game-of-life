import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bundle=await build({entryPoints:[path.join(root,'constants/items.ts')],bundle:true,platform:'node',format:'esm',write:false});
const {ITEMS_DB,SEASON_COLLECTIONS}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const assetBundle=await build({entryPoints:[path.join(root,'constants/catalogAssets.ts')],bundle:true,platform:'node',format:'esm',write:false});
const {resolveCatalogAssetUrl}=await import(`data:text/javascript;base64,${Buffer.from(assetBundle.outputFiles[0].text).toString('base64')}`);
for(const [oldName,newName] of [['borda_aurora_i','borda-aurora-ii'],['banner_aurora_i','banner-aurora-ii'],['insignia_season_aurora_1','insignia-aurora-ii']]){
  for(const prefix of ['/assets/catalog/interface/','https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/']){
    for(const ext of ['png','webp'])assert.equal(resolveCatalogAssetUrl(prefix+oldName+'.'+ext),'/assets/catalog/interface/'+newName+'.webp');
  }
}
assert.equal(resolveCatalogAssetUrl('https://example.com/avatar.png'),'https://example.com/avatar.png');
const keys=['zenite_1_2027','eclipse_1_2027','egide_1_2027','aurora_1_2026'];
const items=ITEMS_DB.filter(i=>keys.includes(i.seasonKey)&&['border','banner','insignia'].includes(i.seasonSlot));
assert.equal(items.length,12);
assert.equal(new Set(items.map(i=>i.id)).size,12);
for(const item of items){
  assert.equal(item.isSeasonExclusive,true);
  assert.equal(item.tier,6);
  assert.equal(item.costGold,undefined);
  assert.equal(SEASON_COLLECTIONS[item.seasonKey].slots[item.seasonSlot],item.id);
  const shipped=await fs.readFile(path.join(root,'public',item.imageUrl));
  const approved=await fs.readFile(path.join(root,'art-delivery/temporadas-2027/release',path.basename(item.imageUrl)));
  assert.ok(shipped.equals(approved),'Arte de producao difere da versao conferida');
}
const q=s=>`'${s.replaceAll("'","''")}'`;
const existing=items.filter(i=>i.seasonKey==='aurora_1_2026');
const future=items.filter(i=>i.seasonKey!=='aurora_1_2026');
const sql=`-- Artes das quatro temporadas de 2027. Executar manualmente no Supabase.
-- Aurora preserva IDs, economia e ativacao. Novas pecas entram DESLIGADAS:
-- faltam skins, temas, missoes e revisao do pool antes de ativar cada temporada.
-- Repetir nao religa itens nem altera saldos/inventarios. Nao aposenta outros itens.
begin;
${existing.map(i=>`update public.items set image_url = ${q(i.imageUrl)}, name = ${q(i.name)} where id = ${q(i.id)};`).join('\n')}
insert into public.items (
 id,name,category,tier,rarity,image_url,gold_price,
 is_rank_exclusive,is_gold_exclusive,is_season_exclusive,
 is_premium_only,is_chest_exclusive,is_legacy_retired,
 season_key,season_slot,recycle_value,craft_cost,is_live_in_game
) values
${future.map(i=>` (${[i.id,i.name,i.category].map(q).join(',')},6,'mythic',${q(i.imageUrl)},null,false,false,true,false,false,false,${q(i.seasonKey)},${q(i.seasonSlot)},0,0,false)`).join(',\n')}
on conflict (id) do update set
 name=excluded.name,image_url=excluded.image_url,
 season_key=excluded.season_key,season_slot=excluded.season_slot;
-- O resultado deve conter 12 linhas. As nove novas devem estar desligadas.
select id,image_url,season_key,season_slot,is_live_in_game
from public.items where id in (${items.map(i=>q(i.id)).join(',')}) order by season_key,season_slot;
commit;
`;
await fs.writeFile(path.join(root,'sql/temporadas-2027-artes.sql'),sql);
console.log('12 artes ligadas a colecoes validas; SQL limitado a 12 IDs preparado.');
