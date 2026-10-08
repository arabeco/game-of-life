import assert from 'node:assert/strict';
import { openingCandidates, reactionCandidates, selectSpeech, readProgress } from '../supabase/functions/_shared/oracle-engine-v2.ts';
import { readingFactsFromDatabase } from '../supabase/functions/_shared/oracle-engine-facts.ts';
import { openingFacts, readingFacts, chooseReaction } from '../utils/oracleEngineV2.ts';
import { calculateArenaProgress } from '../utils/progressUtilsEngine.js';

const day = '2026-10-08';
const arena = { id: 'arena', name: 'Leitura' };
const action = { id: 'action', arenaId: 'arena', name: 'Livro', actionType: 'Repetição', repetitions: 5 };
const task = (id, extra = {}) => ({ id, actionId: action.id, date: day, startTime: -1, completed: true, ...extra });
const scope = { actions: [action], arenas: [arena], tasks: [task('1'), task('2'), task('3')], activeCycle: null, today: day };
const fromDb = s => readingFactsFromDatabase({ today: s.today, cycle: s.activeCycle && { start_date: s.activeCycle.startDate, end_date: s.activeCycle.endDate }, resetAt: s.resetAt,
  actions: s.actions.map(a => ({ id: a.id, arena_id: a.arenaId, repetitions: a.repetitions, action_type: a.actionType, source_quest_id: a.sourceQuestId })),
  arenas: s.arenas.map(a => ({ id: a.id, name: a.name, is_archived: a.isArchived, description: a.description })),
  tasks: s.tasks.map(t => ({ id: t.id, action_id: t.actionId, date: t.date, completed: t.completed, completed_at: t.completedAt, created_at: t.createdAt })),
});

// No scheduling is required to count progress, and a free round has no invented deadline.
assert.equal(readingFacts(scope).arenas[0].completed, 3);
assert.match(readProgress(readingFacts(scope)), /3\/5.*Faltam 2/);
assert.doesNotMatch(readProgress(readingFacts(scope)), /dias|%|atras/);
assert.deepEqual(fromDb(scope), readingFacts(scope));
assert.equal(calculateArenaProgress({ arena, actions: [action], tasks: scope.tasks }).totalCompleted, readingFacts(scope).arenas[0].completed);

// Every opening quadrant, including actions completed straight from stock.
assert.deepEqual(openingFacts(scope, null), { completed: 3, queued: 0, stock: 1, returned: false });
assert.equal(openingFacts({ ...scope, tasks: [task('pool', { completed: false })] }, null).queued, 0);
assert.equal(openingFacts({ ...scope, tasks: [task('queue', { completed: false, executionOrder: 0 })] }, null).queued, 1);
assert.equal(openingFacts(scope, '2026-10-01').returned, true);
for (const completed of [0, 2]) for (const queued of [0, 2]) for (const stock of [0, 8]) {
  for (const tone of ['neutro', 'coach', 'reflexivo', 'calmo']) {
    const candidates = openingCandidates({ completed, queued, stock, returned: false }, tone, day);
    assert.ok(candidates.length);
    for (const c of candidates) assert.doesNotMatch(c.text, /\{\w+\}|atrasad|sequência|corte|paus[ae] a arena/i);
    assert.equal(selectSpeech(candidates, 'opening', 1, [], 1e9, day).chosen, null);
    assert.ok(selectSpeech(candidates, 'opening', 2, [], 1e9, day).chosen);
  }
}

const facts = { eventId: '3', action: { id: 'round:action', name: 'Livro', completed: 3, target: 5 }, previousCount: 2, returned: false };
for (const tone of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const candidates = reactionCandidates(facts, tone);
  assert.match(candidates[0].text, /3\/5/);
  assert.equal(selectSpeech(candidates, 'reaction', 0, [], 1e9, day).chosen, null);
  assert.equal(selectSpeech(candidates, 'reaction', 1, [], 1e9, day).chosen, null);
  assert.equal(selectSpeech(candidates, 'reaction', 2, [], 1e9, day).chosen, null);
  assert.ok(selectSpeech(candidates, 'reaction', 3, [], 1e9, day).chosen);
}
const near = reactionCandidates({ ...facts, action: { ...facts.action, completed: 4 }, previousCount: 3 }, 'neutro');
assert.ok(selectSpeech(near, 'reaction', 2, [], 1e9, day).chosen);
assert.equal(selectSpeech(near, 'reaction', 1, [], 1e9, day).chosen, null);
const done = reactionCandidates({ ...facts, action: { ...facts.action, completed: 5 }, previousCount: 4 }, 'neutro');
assert.ok(selectSpeech(done, 'reaction', 1, [], 1e9, day).chosen);

// Mission completion outranks routine action progress; exactly one selected.
const both = reactionCandidates({ ...facts, mission: { id: 'pact', name: 'Estudo', completed: 5, target: 5, previous: 4 } }, 'coach');
const selected = selectSpeech(both, 'reaction', 3, [], 1e9, day);
assert.equal(selected.chosen.subject, 'mission');
assert.equal(selected.rows.filter(r => r.reason === 'selected').length, 1);
const history = [{ ...selected.chosen, channel: 'reaction', day, at: 1e9 }];
assert.equal(selectSpeech(both, 'reaction', 3, history, 1e9 + 100, day).chosen, null);
assert.equal(selectSpeech(done, 'reaction', 3, [{ id: done[0].id, subject: 'action', channel: 'reaction', day, at: 0 }], 1e9, day).chosen, null, 'undo/redo does not celebrate twice');

// Reset boundary and cycle dates agree on server and app, including capped cycle percentages.
const resetScope = { ...scope, resetAt: '2026-10-08T12:00:00Z', tasks: [task('old', { completedAt: '2026-10-08T11:00:00Z' }), task('new', { completedAt: '2026-10-08T13:00:00Z' })] };
assert.equal(readingFacts(resetScope).arenas[0].completed, 1);
assert.deepEqual(fromDb(resetScope), readingFacts(resetScope));
const cycleScope = { ...scope, activeCycle: { id: 'cycle', startDate: '2026-10-06', endDate: '2026-10-13' }, tasks: [...scope.tasks, task('past', { date: '2026-09-01' }), task('future', { date: '2026-10-12' })] };
assert.deepEqual(fromDb(cycleScope), readingFacts(cycleScope));
assert.match(readProgress(readingFacts(cycleScope)), /60%.*Faltam 5 dias/);
assert.match(readProgress(readingFacts({ ...cycleScope, today: '2026-10-13' })), /termina hoje/);
assert.match(readProgress(readingFacts({ ...cycleScope, today: '2026-10-14' })), /prazo terminou/);

// Stored memories are isolated by account; retroactive completion and no-op don't react.
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v) };
assert.ok(chooseReaction(scope, action, scope.tasks[2], scope.tasks.slice(0, 2), null, 'neutro', 3, 'u').chosen);
assert.equal(chooseReaction(scope, action, scope.tasks[2], scope.tasks, null, 'neutro', 3, 'u').chosen, null);
assert.equal(chooseReaction(scope, action, task('old', { date: '2026-10-01' }), [], null, 'neutro', 3, 'u').chosen, null);
console.log('oracle-engine-v2: opening quadrants, voices, presence, priorities, dedupe, unscheduled progress and server/app parity passed');
