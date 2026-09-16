import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function load(path) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    const js = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022}}).outputText;
    return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const {readDailyFeedSnapshot: read} = await load('../utils/dailyFeedSnapshot.ts');
const {safeDailyActionBackground: background} = await load('../utils/dailyFeedSnapshot.ts');
assert.equal(background('url(https://example.com/image.png)'),undefined);
assert.equal(background('var(--asset-grad-saude, url(https://example.com/a))'),undefined);
assert.equal(background('var(--quest-grad-clan)'), 'var(--quest-grad-clan)');
assert.equal(background('linear-gradient(135deg, #ef4444, #141820)'), 'linear-gradient(135deg, #ef4444, #141820)');
const {dailyComparisonLabel: label} = await load('../utils/dailyComparison.ts');
const snapshot = {version:1,date:'2026-09-14',dateLabel:'14 de setembro',completed:1,total:1,minutes:30,xp:30,bayCount:0,
    actions:[{id:'task',name:'Treino',icon:'🏋️',completed:true}]};
const saved = JSON.parse(JSON.stringify(snapshot));
snapshot.actions[0].name = 'Editado depois';
assert.equal(read(saved).actions[0].name, 'Treino');
for (const invalid of [null, {}, {...saved,version:2}, {...saved,completed:2}, {...saved,xp:NaN},
    {...saved,actions:[{id:'task',name:'Treino',icon:'🏋️',completed:'yes'}]}, {...saved,comparisonLabel:123}]) {
    assert.equal(read(invalid), null);
}
const comparison = {date:'2026-09-14',cohortSize:100,actions:12,xp:60,actionsTopPercent:1,xpTopPercent:5,provisional:true};
assert.match(label(comparison,12,60), /Top 1% em ações.*parcial/);
assert.match(label({...comparison,actionsTopPercent:80,provisional:false},12,60), /Top 5% em XP base/);
for (const change of [{cohortSize:9},{cohortSize:NaN},{actions:11},{xp:59},{actionsTopPercent:100,xpTopPercent:100},
    {actionsTopPercent:100,xpTopPercent:null}]) assert.equal(label({...comparison,...change},12,60),null);
assert.equal(label(null,12,60),null);
console.log('PASS: saved daily snapshot, malformed/legacy posts, minimum cohort, stale counts, ties, XP fallback and provisional label.');

