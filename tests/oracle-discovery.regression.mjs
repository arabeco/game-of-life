import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { discoveryBlock, selectSpeech, openingCandidates } from '../supabase/functions/_shared/oracle-engine-v2.ts';
import { rememberEngineSpeech, rememberDiscoveryClick, readEngineMemory } from '../utils/oracleEngineV2.ts';

// Exercise the real facts adapter without a network or journal/garden content.
const bundle = await build({ entryPoints: ['utils/oracleDiscovery.ts'], bundle: true, write: false, format: 'esm', plugins: [{ name: 'database-fixture', setup(b) {
  b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'db', namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `export const supabase={from(table){ const q={select(cols,opts){globalThis.calls.push({table,cols,opts});return q},eq(){return q},neq(){return q},or(){return q},then(resolve,reject){return Promise.resolve(globalThis.results[table]).then(resolve,reject)}}; return q;}};` }));
} }] });
const { discoveryCandidates, readDiscoveryUsage } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const day = '2026-10-14', now = Date.parse(day), DAY = 86400000;
const facts = { hasJournal: false, hasFriends: true, hasRelationships: false, hasGarden: false, hasClosedCycle: true, hasCampaign: false, hasUnequippedItem: true, hasEquippedItem: false, hasWisdomThemes: false, gardenEnabled: true };
const tips = discoveryCandidates(facts, 'neutro', now);
assert.equal(tips.length, 7);
for (const tone of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  for (const tip of discoveryCandidates(facts, tone, now)) assert.ok(tip.text && tip.discovery.label && tip.score === 30);
}
assert.equal(discoveryCandidates({ ...facts, lastLevelUpdate: now, hasJournal: true, hasRelationships: true, hasGarden: true, hasCampaign: true, hasEquippedItem: true, hasWisdomThemes: true }, 'neutro', now).length, 0);
assert.ok(!discoveryCandidates({ ...facts, hasClosedCycle: false }, 'neutro', now).some(t => t.discovery.topic === 'campaigns'));
assert.ok(!discoveryCandidates({ ...facts, hasFriends: false }, 'neutro', now).some(t => t.discovery.topic === 'relationships'));
assert.ok(!discoveryCandidates({ ...facts, hasJournal: undefined, hasRelationships: undefined, hasGarden: undefined }, 'neutro', now).some(t => ['journal', 'relationships', 'garden'].includes(t.discovery.topic)));
const choose = (f, history = [], presence = 3) => selectSpeech([...openingCandidates(f, 'neutro', day), ...tips], 'opening', presence, history, now, day).chosen;
assert.ok(choose({ completed: 0, queued: 0, stock: 0, returned: false }).discovery);
for (const [f, subject] of [[{completed:1,queued:0,stock:0,returned:false},'done'], [{completed:0,queued:1,stock:0,returned:false},'planned'], [{completed:0,queued:0,stock:5,returned:false},'stock'], [{completed:0,queued:0,stock:0,returned:true},'return']]) assert.equal(choose(f).subject, subject);
assert.equal(choose({completed:0,queued:0,stock:0,returned:false}, [], 1), null);
const record = (at, extra = {}) => ({id:'discovery:journal',subject:'discovery:journal',at,day:'old',channel:'opening',...extra});
assert.equal(discoveryBlock('garden', [record(now - DAY)], now, day), 'discovery_interval');
assert.equal(discoveryBlock('journal', [record(now - 7*DAY)], now, day), 'discovery_topic_interval');
assert.equal(discoveryBlock('journal', [record(now - 20*DAY, {clickedAt:now-20*DAY})], now, day), 'discovery_clicked');
assert.equal(discoveryBlock('journal', [record(now-50*DAY),record(now-35*DAY),record(now-20*DAY)], now, day), 'discovery_ignored');
assert.equal(discoveryBlock('journal', [record(now-31*DAY,{clickedAt:now-31*DAY})], now, day), null);
assert.equal(discoveryBlock('garden', [{...record(now),subject:'mission',important:true,channel:'reaction',day}], now, day), 'important_today');
assert.equal(selectSpeech(tips,'reaction',3,[],now,day).chosen,null);
const storage = new Map();
globalThis.localStorage = { getItem:k=>storage.get(k)||null, setItem:(k,v)=>storage.set(k,v) };
const journal = tips.find(t => t.discovery.topic === 'journal');
for (let i=3;i>0;i--) rememberEngineSpeech('a',journal,'opening','old',now-i*20*DAY);
for (let i=0;i<160;i++) rememberEngineSpeech('a',{id:`action:${i}`,subject:'action'},'reaction','old',now-2*DAY+i);
assert.equal(discoveryBlock('journal',readEngineMemory('a'),now,day),'discovery_ignored');
assert.equal(readEngineMemory('b').length,0);
rememberDiscoveryClick('a',journal.id,now);
assert.equal(discoveryBlock('journal',readEngineMemory('a'),now,day),'discovery_clicked');
globalThis.calls=[];
globalThis.results={journal_pages:{count:0},friends:{count:1},relationship_links:{count:null,error:{}},user_gardens_3d:{count:1}};
assert.deepEqual(await readDiscoveryUsage('a'),{hasJournal:false,hasFriends:true,hasGarden:true});
assert.ok(globalThis.calls.every(c=>c.opts.head===true && !/content|state/.test(c.cols)));
console.log('Oracle discovery: eligibility, priority, cadence, click, account isolation, memory retention and metadata-only queries passed.');
