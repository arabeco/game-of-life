import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
export {buildCycleCommitment} from './utils/cycleCommitment';
export {campaignAwareTasks} from './utils/campaignScope';
export {unavailableCampaignArenas} from './utils/campaignScheduling';
export {calculateArenaProgress,getCampaignArenaStates} from './utils/progressUtilsEngine.js';
export {buildCodexTemplateFromDraft,buildCodexCampaignPreview} from './utils/codexPreview';
export {getArenaCapacitySummary} from './utils/arenaCapacity';
`, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const arenas = [{id:'one',name:'Leitura',assetId:'trabalho',icon:'📚',originCodexId:'book'}, {id:'two',name:'Caminhada',assetId:'saude',icon:'💪',originCodexId:'book'}, {id:'own',name:'Pessoal',assetId:'saude'}];
const actions = [{id:'a',arenaId:'one',actionType:'Ação Recorrente',repetitions:2,originCodexId:'book'}, {id:'b',arenaId:'one',actionType:'Ação Recorrente',repetitions:2,originCodexId:'book'}, {id:'c',arenaId:'two',actionType:'Ação Recorrente',repetitions:20,originCodexId:'book'}, {id:'personal',arenaId:'own',actionType:'Ação Recorrente',repetitions:5}];
const task=(id,actionId,date='2026-09-01')=>({id,actionId,date,completed:true,duration:30});
const over=[task('1','a'),task('2','a'),task('3','a'),task('4','a')];
const p=api.calculateArenaProgress({arena:arenas[0],actions:actions.slice(0,2),tasks:over});
assert.equal(p.progressPercent,50);assert.equal(p.isCleared,false);
const campaign={id:'run',status:'active',arenaIds:['one','two'],arenaConfig:{two:{isLocked:true,prerequisiteArenaIds:['one']}}};
const completed=[...over,task('5','b'),task('6','b')];
const cycle={startDate:'2026-10-15',endDate:'2026-10-19'};
assert.equal(api.unavailableCampaignArenas([campaign],arenas,actions,over,cycle).has('two'),true);
assert.equal(api.unavailableCampaignArenas([campaign],arenas,actions,completed,cycle).has('two'),false,'past-cycle completions unlock installed campaign');
assert.equal(api.unavailableCampaignArenas([{...campaign,status:'archived'}],arenas,actions,completed,cycle).has('one'),true);
const current=[...completed,task('7','c','2026-10-15'),task('8','personal','2026-10-15')];
const commitment=api.buildCycleCommitment({arenas,actions,tasks:current,...cycle});
// Campanha conta so para o bem (19/10): a acao de campanha feita no ciclo entra
// como 1 de 1; o pessoal segue com a meta inteira (5, feita 1).
assert.equal(commitment.plannedCount,6);assert.equal(commitment.completedCount,2);
assert.equal(commitment.questTasks.length,0,'campaigns are not mission reward claims');
assert.equal(commitment.cycleTasks.length,2,'campaign work contributes to cycle activity');
const archived=api.buildCycleCommitment({arenas:arenas.map(a=>a.id==='two'?{...a,isArchived:true}:a),actions,tasks:current,...cycle});
assert.equal(archived.cycleTasks.length,2,'archiving cannot erase performed work from this cycle');
const scoped=api.campaignAwareTasks(current,current.filter(t=>t.date>=cycle.startDate),actions);
assert.equal(scoped.length,current.length);
const template=api.buildCodexTemplateFromDraft({name:'Mista',arenas:arenas.slice(0,2),actions});
const preview=api.buildCodexCampaignPreview('book',template);
assert.deepEqual(preview.arenas.map(a=>a.assetId),['trabalho','saude']);
assert.deepEqual(preview.arenas.map(a=>a.icon),['📚','💪']);
const cap=api.getArenaCapacitySummary([{arenas:arenas.map(a=>({...a,isArchived:true}))}]);
assert.equal(cap.total,0,'archived attempts free capacity for a fresh install');
console.log('PASS: capped progress, cross-cycle unlocks, archived locks, no cycle debt, retained activity, no mission bonus, multi-asset roundtrip, replay capacity.');

const parallelTemplate=api.buildCodexTemplateFromDraft({name:'Mista',arenas:arenas.slice(0,2),actions,campaign:{...campaign,type:'parallel',arenaConfig:{one:{isLocked:false,phase:0,prerequisiteArenaIds:[]},two:{isLocked:false,phase:0,prerequisiteArenaIds:[]}}}});
const parallelPreview=api.buildCodexCampaignPreview('new-copy',parallelTemplate);
assert.equal(parallelPreview.campaign.type,'parallel');
assert.deepEqual(Object.values(parallelPreview.campaign.arenaConfig).map(c=>c.prerequisiteArenaIds),[[],[]]);
assert.ok(parallelPreview.actions.every(a=>!actions.some(old=>old.id===a.id)),'new attempts have distinct action identities');
console.log('PASS: reusable parallel layout and independent attempt identities.');
