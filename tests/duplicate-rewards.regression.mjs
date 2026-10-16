import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = mkdtempSync(join(tmpdir(), 'glyph-duplicates-'));
async function load(file) {
 const result = await build({entryPoints:[file],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'});
 const path = join(dir,file.split('/').pop()+'.mjs');
 writeFileSync(path,result.outputFiles[0].text);
 return import(pathToFileURL(path).href);
}
const { buildAchievementRewardPayload: present } = await load('utils/achievementRewardPayload.ts');
const mixed = present('Missão', '', '', {items:['new'], fragments:15, convertedItems:[{itemId:'old',fragments:3000}],ownedItems:['owned']});
assert.deepEqual(mixed.itemIds,['new']);
assert.equal(mixed.metricCards[0].value,'+15');
assert.equal(mixed.rewardHighlights[0].detail,'+3000 fragmentos pela conversão.');
assert.equal(mixed.rewardHighlights[1].label,'Já está na sua coleção');
const { montarModalDeSegredos: secret, REGRAS_DE_DESBLOQUEIO: rules } = await load('utils/medidorDeSegredos.ts');
const rule=rules[0];
const owned=secret([rule],{items:[],ownedItems:rule.itens,convertedItems:[]});
assert.deepEqual(owned.reward.items,[]);
assert.deepEqual(owned.reward.rewardDetails,[]);
assert.deepEqual(present(owned.title,'','',owned.reward).itemIds,[]);
assert.equal(present(owned.title,'','',owned.reward).rewardHighlights.length,rule.itens.length);
assert.deepEqual(secret([rule]).reward.items,rule.itens);
console.log('OK: recompensas mistas, conversão mítica, segredo já possuído e compatibilidade.');
// Executa a função real de entrega com inventário e persistência controlados.
const { readFileSync } = await import('node:fs');
const { transform } = await import('esbuild');
const source = readFileSync('contexts/GameContext.tsx','utf8');
const start = source.indexOf('    const getDuplicateItemFragmentReward =');
const end = source.indexOf('\n    };',source.indexOf('    const grantInventoryItem =',start))+7;
const js = await transform(source.slice(start,end)+'\nreturn grantInventoryItem;', {loader:'ts'});
const { ECONOMY } = await load('constants/economy.ts');
const profile = {current:{wallet:{fragments:10,gold:4}}};
const toasts=[];
const grant = new Function('resolveItemDef','ECONOMY','getSupabaseUserId','inventory','userProfileRef','updateUserProfile','showToast','isItemCatalogVisible',js.code)(
 id=>({id,name:id,tier:6,category:'border'}),ECONOMY,()=> 'user',[{id:'owned'}],profile,()=>{},(...args)=>toasts.push(args),()=>true);
const first=await grant('owned',true);
const second=await grant('owned',true);
assert.equal(first.fragmentsGranted,3000);
assert.equal(second.duplicateConverted,true);
assert.equal(profile.current.wallet.fragments,6010,'duas conversões devem somar');
assert.equal(profile.current.wallet.gold,4);
assert.equal(toasts.length,0,'entrega silenciosa não dispara aviso sobre o modal');
console.log('OK: função real converte míticos, soma entregas consecutivas e respeita silent.');
