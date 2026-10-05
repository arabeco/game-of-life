import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCycleCommitment } from '../utils/cycleCommitment.ts';
import { buildCyclePaceMetrics } from '../utils/coreLoopUtils.js';
import { applyFairScoreToReport, buildFairScoreFromTasks } from '../utils/fairScoreUtils.js';

// October incident: repetitions are promises even without scheduled days.
const counts = [20,20,20,3,1,12,12,28,20,20,4,28,28,20,8,2,12];
const arenas = [{id:'personal',name:'Rotina'}, {id:'side',name:'SIDEQUESTS'},
  {id:'archived',name:'Antiga',isArchived:true}, {id:'season',name:'Jornada'}];
const actions = counts.map((repetitions,i) => ({id:`a${i}`,name:`Ação ${i}`,arenaId:i===13||i===14?'side':'personal',
  actionType:i===4?'Marco':'Ação Recorrente', repetitions,duration:30}));
actions.push({id:'free',arenaId:'personal',actionType:'Livre',repetitions:1,duration:30},
  {id:'old',arenaId:'archived',repetitions:500,duration:30},
  {id:'quest',arenaId:'season',sourceQuestId:'season-walk',repetitions:28,duration:30});
const window = {startDate:'2026-10-05',endDate:'2026-11-01'};
const build = tasks => buildCycleCommitment({actions,arenas,tasks,...window});
const empty = build([]);
assert.equal(empty.plannedCount,258);
assert.equal(empty.completedCount,0);
assert.equal(empty.progressPercent,0);
const tasks = Array.from({length:7},(_,i)=>({id:`t${i}`,actionId:`a${i}`,date:'2026-10-05',startTime:600,duration:30,completed:i<2}));
let result=build(tasks);
assert.equal(result.plannedCount,258,'seven appointments cannot replace the full target');
assert.equal(result.completedCount,2);
assert.equal(result.progressPercent,2/258*100);
assert.equal(build(tasks.map(t=>({...t,startTime:-1}))).plannedCount,258,'moving to stock cannot shrink the cycle');
assert.equal(build(tasks.map(t=>({...t,completed:false}))).completedCount,0,'undo removes completion');
assert.equal(build([...tasks,tasks[0]]).completedCount,2,'duplicate ids do not count twice');
assert.equal(build([...tasks,{...tasks[0],id:'outside',date:'2026-10-04'}]).completedCount,2);
const repeated = Array.from({length:30},(_,i)=>({...tasks[0],id:`repeat${i}`}));
assert.equal(build(repeated).completedCount,20,'extra repetitions cannot pay another action target');
assert.equal(result.entries.find(e=>e.action.id==='a13').planned,20,'SIDEQUESTS is a personal arena');
assert.ok(!result.entries.some(e=>['quest','old','free'].includes(e.action.id)));
const questDone={id:'quest-task',actionId:'quest',date:'2026-10-06',completed:true,duration:30,startTime:600};
result=build([...tasks,questDone]);
assert.equal(result.questTasks.length,1,'season mission retained separately');
assert.equal(result.plannedCount,258);
const pace=buildCyclePaceMetrics(result.scoredTasks,window.startDate,'2026-10-06',window.endDate,result.questTasks,result);
assert.equal(pace.executionRatePct,Math.round(2/258*100));
assert.equal(pace.consistencyDays,2,'season completion still counts as presence');
const fair=buildFairScoreFromTasks({tasks:result.cycleTasks,actions,arenas,plannedEntries:result.entries,durationDays:28});
assert.equal(fair.plannedTaskCount,258);
assert.equal(fair.fairness.sealedMetas,0,'two completed appointments cannot seal the whole planned arena');
assert.equal(fair.fairness.plannedMetas,2);
assert.equal(fair.fairness.planLoadUnits,258);
// A season longer than the cycle must never create debt in that cycle.
const pendingSeason = Array.from({length:40},(_,i)=>({id:`season-pending-${i}`,actionId:'quest',
  date:i<20?'2026-10-12':'2026-11-12',startTime:600,duration:30,completed:false}));
const withLongSeason = build([...tasks,questDone,...pendingSeason]);
assert.equal(withLongSeason.plannedCount,result.plannedCount);
assert.equal(withLongSeason.completedCount,result.completedCount);
assert.equal(withLongSeason.progressPercent,result.progressPercent);
const fairWithPendingSeason = buildFairScoreFromTasks({tasks:withLongSeason.cycleTasks,actions,arenas,
  plannedEntries:withLongSeason.entries,durationDays:28});
assert.equal(fairWithPendingSeason.fairScore,fair.fairScore,'unfinished season actions cannot lower score');
assert.equal(fairWithPendingSeason.fairness.plannedMetas,fair.fairness.plannedMetas);
assert.equal(fairWithPendingSeason.fairness.sealedMetas,fair.fairness.sealedMetas);
const sealed = {startDate:window.startDate,endDate:window.endDate,performanceScore:fair.fairScore,
  metrics:{scoreModelVersion:'fair_v2_2_repetitions',totalPlannedActions:258,actionsCompleted:2,fairness:fair.fairness,weeklyAtlas:[]}};
assert.equal(applyFairScoreToReport(sealed).changed,false);
assert.equal(applyFairScoreToReport(sealed).report,sealed,'reopening history must preserve the sealed repetition-based score');
for(const file of ['views/AssetsView.tsx','utils/widgetSnapshots.ts','contexts/GameContext.tsx','views/ReportsView.tsx']) {
  assert.match(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),/buildCycleCommitment\(/,`${file} must use the shared rule`);
}
console.log('PASS October: 258 planned, 7 appointments, 2 completions; archived/free/season exclusions; SIDEQUESTS included; undo, date range, duplicates, per-action caps, pace and fair score.');
