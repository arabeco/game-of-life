import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleCycleCoachBrief } from '../utils/oracleCoach.ts';

const baseContext = {
  hasArenas: true,
  totalArenas: 2,
  hasCycle: true,
  cycleName: 'Ciclo curto',
  cycleDayNumber: 3,
  cycleTotalDays: 7,
  cycleDaysRemaining: 4,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 43,
  cyclePace: 'no_ritmo',
  cycleTotalActions: 10,
  cycleCompletedActions: 4,
  cyclePendingActions: 6,
  priorityActionName: 'treinar',
  focusArenaSignal: {
    arenaId: 'arena-health',
    arenaName: 'Saude',
  },
};

const firstArena = buildOracleCycleCoachBrief({
  ...baseContext,
  hasArenas: false,
  totalArenas: 0,
  hasCycle: false,
});
assert.equal(firstArena.id, 'coach:first-arena');
assert.equal(firstArena.quickActions[0]?.kind, 'open_arenas');

const noCycle = buildOracleCycleCoachBrief({
  ...baseContext,
  hasCycle: false,
});
assert.equal(noCycle.id, 'coach:start-cycle');
assert.deepEqual(noCycle.quickActions.map((action) => action.kind), ['open_cycle', 'open_arenas']);

const behind = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 20,
  expectedCycleCompletionPercent: 60,
  cyclePace: 'critico',
});
assert.match(behind.content, /20%/);
assert.match(behind.content, /Saude/);
assert.equal(behind.quickActions[0]?.kind, 'open_arena');
assert.equal(behind.quickActions[0]?.arenaId, 'arena-health');
assert.equal(behind.quickActions[1]?.kind, 'open_planner');

const lastDay = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleDaysRemaining: 0,
  cyclePace: 'atrasado',
  cyclePendingActions: 3,
});
assert.match(lastDay.content, /ultimo dia/);
assert.deepEqual(lastDay.quickActions.map((action) => action.kind), ['open_planner', 'open_cycle']);

const completed = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 100,
  cycleCompletedActions: 10,
  cyclePendingActions: 0,
});
assert.match(completed.content, /Feche este ciclo/i);
assert.equal(completed.quickActions[0]?.kind, 'open_cycle');

const onPace = buildOracleCycleCoachBrief(baseContext);
assert.match(onPace.content, /Que tal treinar hoje/);
assert.equal(onPace.quickActions[0]?.kind, 'open_planner');

const coachSource = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(coachSource, /supabase|fetch\(|invoke\(|hasPremiumAccess/i);

const chatSource = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
assert.match(chatSource, /buildOracleCycleCoachBrief\(operationalContext\)/);
assert.match(chatSource, /case 'open_arena'/);
assert.match(chatSource, /showArenaId: arenaId/);

console.log('Oracle cycle coach regression: local diagnosis and safe navigation are covered.');
