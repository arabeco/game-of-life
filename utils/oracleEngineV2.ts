import type { Action, Arena, Cycle, ScheduledTask } from '../types';
import { calculateArenaProgress } from './progressUtilsEngine.js';
import { getArenaPresentationTasks } from './arenaProgressPresentation.ts';
import { buildCycleCommitment, isCycleQuestAction } from './cycleCommitment.ts';
import { isSharedArena, isTaskInPool } from './taskDomain.js';
import { getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';
import { isActionInPactScope, measurePactProgress, resolvePactArena, type ArenaPact } from './arenaPacts.ts';
import { openingCandidates, reactionCandidates, selectSpeech, type Channel, type OpeningFacts, type ReadingFacts, type Spoken, type Voice, type Candidate } from '../supabase/functions/_shared/oracle-engine-v2.ts';
export { ORACLE_ENGINE_V2 } from '../supabase/functions/_shared/oracle-engine-v2.ts';

export interface Scope { actions: Action[]; arenas: Arena[]; tasks: ScheduledTask[]; activeCycle: Cycle | null; resetAt?: string | null; today: string }
const unique = (tasks: ScheduledTask[]) => [...new Map(tasks.map(t => [t.id, t])).values()];
export const scopedOracleTasks = (s: Scope) => unique(getArenaPresentationTasks(s.tasks, s.activeCycle, s.resetAt, s.today));
export function readingFacts(s: Scope): ReadingFacts {
  const tasks = scopedOracleTasks(s);
  const arenas = s.arenas.filter(a => !a.isArchived && !isSharedArena(a)).flatMap(arena => {
    const actions = s.actions.filter(a => a.arenaId === arena.id);
    if (actions.some(a => isCycleQuestAction(a, s.arenas))) return [];
    const p = calculateArenaProgress({ arena, actions, tasks });
    return [{ id: arena.id, name: arena.name, completed: p.totalCompleted, target: p.totalPlanned }];
  });
  let cycle: ReadingFacts['cycle'] = null;
  if (s.activeCycle && s.activeCycle.startDate <= s.today) {
    const p = buildCycleCommitment({ ...s, tasks, startDate: s.activeCycle.startDate, endDate: s.activeCycle.endDate });
    cycle = { startsToday: s.activeCycle.startDate === s.today, percent: p.plannedCount ? p.progressPercent : null, daysLeft: Math.max(0, Math.round((Date.parse(s.activeCycle.endDate) - Date.parse(s.today)) / 86400000)), ended: s.activeCycle.endDate < s.today };
  }
  const activeIds = new Set(s.actions.filter(a => s.arenas.some(r => r.id === a.arenaId && !r.isArchived)).map(a => a.id));
  return { cycle, arenas, completed: tasks.filter(t => t.completed && activeIds.has(t.actionId)).length };
}

export function openingFacts(s: Scope, lastOpen: string | null): OpeningFacts {
  const activeIds = new Set(s.actions.filter(a => s.arenas.some(r => r.id === a.arenaId && !r.isArchived)).map(a => a.id));
  const tasks = unique(s.tasks).filter(t => activeIds.has(t.actionId));
  const today = tasks.filter(t => taskMatchesOperationalDate(t, s.today));
  // Count available action TYPES, never call the stock a list of obligations.
  const poolScope = s.activeCycle ? tasks.filter(t => t.date >= s.activeCycle!.startDate && t.date <= s.activeCycle!.endDate) : today;
  const stock = s.actions.filter(a => activeIds.has(a.id) && a.actionType !== 'Marco').filter(a => {
    if (a.actionType === 'Livre') return true;
    const used = poolScope.filter(t => t.actionId === a.id && (t.completed || !isTaskInPool(t) || t.executionOrder != null)).length;
    return used < Math.max(1, a.repetitions || 1);
  }).length;
  return { completed: today.filter(t => t.completed).length, queued: today.filter(t => !t.completed && (!isTaskInPool(t) || t.executionOrder != null)).length,
    stock, returned: Boolean(lastOpen && (Date.parse(s.today) - Date.parse(lastOpen)) / 86400000 >= 3) };
}

const key = (userId: string) => `glyph:oracle-v2:${userId}`;
export function readEngineMemory(userId: string): Spoken[] {
  try {
    const data = JSON.parse(localStorage.getItem(key(userId)) || '[]');
    return Array.isArray(data) ? data.filter(h => h && typeof h.id === 'string' && typeof h.at === 'number' && (h.channel === 'opening' || h.channel === 'reaction')) : [];
  } catch { return []; }
}
export function rememberEngineSpeech(userId: string, candidate: Candidate, channel: Channel, day: string, now = Date.now()) {
  try { localStorage.setItem(key(userId), JSON.stringify([...readEngineMemory(userId), { id: candidate.id, subject: candidate.subject, at: now, day, channel }].slice(-120))); } catch { /* private browsing */ }
}
export function chooseOpening(s: Scope, lastOpen: string | null, tone: Voice, presence: number, userId: string) {
  return selectSpeech(openingCandidates(openingFacts(s, lastOpen), tone, s.today), 'opening', presence, readEngineMemory(userId), Date.now(), s.today);
}
export function chooseReaction(s: Scope, action: Action, completedTask: ScheduledTask, previousTasks: ScheduledTask[], pact: ArenaPact | null, tone: Voice, presence: number, userId: string) {
  const empty = { chosen: null, rows: [] };
  if (!completedTask.completed || !taskMatchesOperationalDate(completedTask, s.today)) return empty;
  if (isCycleQuestAction(action, s.arenas) || isSharedArena(s.arenas.find(a => a.id === action.arenaId) || {} as Arena)) return empty;
  const next = scopedOracleTasks(s);
  const previous = scopedOracleTasks({ ...s, tasks: previousTasks });
  const count = (ts: ScheduledTask[]) => ts.filter(t => t.actionId === action.id && t.completed).length;
  const before = count(previous), after = count(next);
  if (after <= before) return empty;
  const last = unique(previousTasks).filter(t => t.completed && t.actionId === action.id).map(t => t.date).sort().at(-1);
  const arena = readingFacts(s).arenas.find(a => a.id === action.arenaId);
  const arenaBefore = readingFacts({ ...s, tasks: previousTasks }).arenas.find(a => a.id === action.arenaId);
  let mission;
  if (pact && isActionInPactScope(pact, action, s.arenas)) {
    const pactArena = resolvePactArena(pact, s.arenas, s.actions);
    const p = measurePactProgress(pact, pactArena, s.actions, s.tasks, s.today);
    const prev = measurePactProgress(pact, pactArena, s.actions, previousTasks, s.today);
    if (!p.windowEnded || p.completed) mission = { id: pact.id, name: pact.title, completed: p.current, target: p.goal, previous: prev.current };
  }
  const scopeId = s.activeCycle?.id || s.resetAt || 'round';
  const candidates = reactionCandidates({ eventId: completedTask.id, action: { id: `${scopeId}:${action.id}`, name: action.name, completed: after, target: action.actionType === 'Livre' ? 0 : Math.max(1, action.repetitions || 1) }, previousCount: before,
    arena: arena && arena.completed > (arenaBefore?.completed || 0) ? { ...arena, id: `${scopeId}:${arena.id}` } : undefined, mission,
    returned: Boolean(last && (Date.parse(s.today) - Date.parse(last)) / 86400000 >= 3),
  }, tone);
  return selectSpeech(candidates, 'reaction', presence, readEngineMemory(userId), Date.now(), s.today);
}
