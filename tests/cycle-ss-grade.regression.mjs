import assert from 'node:assert/strict';
import {getScoreGrade, getLegacyCycleGrade} from '../utils/cycleGrade.js';
import {buildFairScoreFromTasks, applyFairScoreToReport} from '../utils/fairScoreUtils.js';

const evidence = {measurementStatus:'scored',historyConfidence:'stable',honoredLoadUnits:8,planLoadRatio:.55,scoreBreakdown:{metaPts:15}};
for (const [score,expected] of [[0,'E'],[39,'E'],[40,'D'],[54,'D'],[55,'C'],[69,'C'],[70,'B'],[83,'B'],[84,'A'],[91,'A'],[92,'S'],[99,'S'],[99.99,'S'],[100,'SS']]) {
    assert.equal(getScoreGrade(score,evidence).grade,expected,`Boundary ${score}`);
}
for(const change of [{measurementStatus:'low_signal'},{historyConfidence:'seeded'},{historyConfidence:'fallback'},{honoredLoadUnits:7.99},{planLoadRatio:.54},{scoreBreakdown:{metaPts:14}}]) {
    assert.equal(getScoreGrade(100,{...evidence,...change}).grade,'A','Missing quality gate must block both S and SS');
}
assert.equal(getScoreGrade(100).grade,'S','No new award from missing evidence');
assert.equal(getScoreGrade(100,null).grade,'S');
assert.notEqual(getScoreGrade(Infinity,evidence).grade,'SS');
assert.notEqual(getScoreGrade(101,evidence).grade,'SS');
assert.equal(getLegacyCycleGrade({score:100,grade:'SS'}).grade,'SS','Export retains measured SS');
assert.equal(getLegacyCycleGrade({score:100,grade:'A'}).grade,'A','Export must not bypass quality cap');
assert.equal(getLegacyCycleGrade({score:100}).grade,'S','Old snapshot without grade remains supported');

// A perfect measured plan at 115% of a stable baseline reaches all 100 points.
const previousReports = [1,2].map(()=>({metrics:{fairness:{measurementStatus:'scored',honoredLoadUnits:10,activeDays:2}}}));
const tasks = Array.from({length:4},(_,i)=>({id:`t${i}`,actionId:'a',arenaId:'arena',date:`2026-09-${10+i}`,durationMinutes:86.25,completed:true}));
const result = buildFairScoreFromTasks({tasks,previousReports,durationDays:4});
assert.equal(result.fairScore,100);
assert.equal(result.grade,'SS');
assert.equal(result.fairness.grade,'SS');
assert.equal(getScoreGrade(result.fairScore,result.fairness).grade,result.grade,'Calculation and display agree');
const seeded = buildFairScoreFromTasks({tasks,durationDays:4});
assert.equal(seeded.grade,'A','Perfect execution alone cannot skip history requirement');

// Old measured reports can be re-evaluated without changing their earned rewards.
const old = {id:'old',startDate:'2026-09-10',endDate:'2026-09-13',performanceScore:100,expGained:777,metrics:{expGained:777,goldGained:42,weeklyAtlas:[{days:tasks.map(t=>({date:t.date,scheduledItems:[{...t,taskId:t.id}]}))}],fairness:{...result.fairness,grade:'S'}}};
const migrated = applyFairScoreToReport(old,previousReports).report;
assert.equal(migrated.metrics.fairness.grade,'SS');
assert.equal(migrated.performanceScore,old.performanceScore);
assert.equal(migrated.expGained,old.expGained);
assert.equal(migrated.metrics.goldGained,old.metrics.goldGained);
console.log('PASS: SS boundaries, all quality gates, shared classifier, legacy grades, measured old cycle and unchanged rewards.');
