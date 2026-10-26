import type { Action, Arena, Cycle, ScheduledTask } from '../types';
import { calculateArenaProgress } from './progressUtilsEngine.js';
import { getArenaPresentationTasks } from './arenaProgressPresentation.ts';
import { buildCycleCommitment, isCycleQuestAction } from './cycleCommitment.ts';
import { isSharedArena, isTaskInPool } from './taskDomain.js';
import { getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';
import { isActionInPactScope, measurePactProgress, resolvePactArena, type ArenaPact } from './arenaPacts.ts';
import { ritmoEsperado } from '../supabase/functions/_shared/oracle-cycle-reading.ts';
import { openingCandidates, reactionCandidates, selectSpeech, type Channel, type OpeningFacts, type ReadingFacts, type Spoken, type Voice, type Candidate } from '../supabase/functions/_shared/oracle-engine-v2.ts';
export { ORACLE_ENGINE_V2 } from '../supabase/functions/_shared/oracle-engine-v2.ts';
export type { Candidate } from '../supabase/functions/_shared/oracle-engine-v2.ts';

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
  const arenaProgress = s.arenas.filter(arena => !arena.isArchived && !isSharedArena(arena)).flatMap(arena => {
    const arenaActions = s.actions.filter(action => action.arenaId === arena.id);
    if (arenaActions.some(action => isCycleQuestAction(action, s.arenas))) return [];
    const progress = calculateArenaProgress({ arena, actions: arenaActions, tasks });
    return [{ id: arena.id, name: arena.name, completed: progress.totalCompleted, target: progress.totalPlanned }];
  });
  const today = tasks.filter(t => taskMatchesOperationalDate(t, s.today));
  // Count available action TYPES, never call the stock a list of obligations.
  const poolScope = s.activeCycle ? tasks.filter(t => t.date >= s.activeCycle!.startDate && t.date <= s.activeCycle!.endDate) : today;
  const stock = s.actions.filter(a => activeIds.has(a.id) && a.actionType !== 'Marco').filter(a => {
    if (a.actionType === 'Livre') return true;
    const used = poolScope.filter(t => t.actionId === a.id && (t.completed || !isTaskInPool(t) || t.executionOrder != null)).length;
    return used < Math.max(1, a.repetitions || 1);
  }).length;
  let cycle: OpeningFacts['cycle'];
  if (s.activeCycle && s.activeCycle.startDate <= s.today && s.activeCycle.endDate >= s.today) {
    const commitment = buildCycleCommitment({ ...s, tasks, startDate: s.activeCycle.startDate, endDate: s.activeCycle.endDate });
    if (commitment.plannedCount > 0) {
      const totalDays = Math.max(1, Math.round((Date.parse(s.activeCycle.endDate) - Date.parse(s.activeCycle.startDate)) / 86400000) + 1);
      const dayNumber = Math.max(1, Math.min(totalDays, Math.round((Date.parse(s.today) - Date.parse(s.activeCycle.startDate)) / 86400000) + 1));
      const percent = Math.round(commitment.progressPercent);
      const expected = Math.round(ritmoEsperado(dayNumber, totalDays));
      const delta = percent - expected;
      const pace = delta >= 10 ? 'adiantado' : delta >= -10 ? 'no_ritmo' : delta >= -25 ? 'atrasado' : 'critico';
      const focusArenas = arenaProgress
        .map((arena) => ({ ...arena, percent: arena.target > 0 ? Math.round((arena.completed / arena.target) * 100) : 0 }))
        .filter((arena) => arena.target > 0 && arena.completed < arena.target)
        .map((arena) => ({ ...arena, delta: arena.percent - expected }))
        .filter((arena) => arena.delta <= -10)
        .sort((left, right) => left.delta - right.delta || left.name.localeCompare(right.name))
        .slice(0, 2)
        .map((arena) => arena.name);
      cycle = {
        percent,
        daysLeft: Math.max(0, Math.round((Date.parse(s.activeCycle.endDate) - Date.parse(s.today)) / 86400000)),
        pace,
        focusArenas,
      };
    }
  }
  return { completed: today.filter(t => t.completed).length, queued: today.filter(t => !t.completed && (!isTaskInPool(t) || t.executionOrder != null)).length,
    stock, returned: Boolean(lastOpen && (Date.parse(s.today) - Date.parse(lastOpen)) / 86400000 >= 3), cycle };
}

const key = (userId: string) => `glyph:oracle-v2:${userId}`;
export function readEngineMemory(userId: string): Spoken[] {
  try {
    const data = JSON.parse(localStorage.getItem(key(userId)) || '[]');
    return Array.isArray(data) ? data.filter(h => h && typeof h.id === 'string' && typeof h.subject === 'string' && typeof h.at === 'number' && (h.channel === 'opening' || h.channel === 'reaction')) : [];
  } catch { return []; }
}
export function rememberEngineSpeech(userId: string, candidate: Candidate, channel: Channel, day: string, now = Date.now()) {
  const all = [...readEngineMemory(userId), { id: candidate.id, subject: candidate.subject, at: now, day, channel, important: candidate.important }];
  // Ordinary activity must not erase the three ignored suggestions or a recent click.
  const tips = all.filter(h => h.subject.startsWith('discovery:'));
  const retained = [...new Set(tips.map(h => h.subject))].flatMap(subject => {
    const own = tips.filter(h => h.subject === subject);
    return [...own.filter(h => !h.clickedAt).slice(-3), ...own.filter(h => h.clickedAt).slice(-1)];
  });
  try { localStorage.setItem(key(userId), JSON.stringify([...all.filter(h => !h.subject.startsWith('discovery:')).slice(-90), ...retained])); } catch { /* private browsing */ }
}
export function rememberDiscoveryClick(userId: string, id: string, now = Date.now()) {
  const history = readEngineMemory(userId);
  const latest = history.filter(h => h.id === id).sort((a, b) => b.at - a.at)[0];
  if (latest) latest.clickedAt = now;
  try { localStorage.setItem(key(userId), JSON.stringify(history)); } catch { /* private browsing */ }
}
export function chooseOpening(s: Scope, lastOpen: string | null, tone: Voice, presence: number, userId: string, discoveries: Candidate[] = []) {
  return selectSpeech([...openingCandidates(openingFacts(s, lastOpen), tone, s.today), ...discoveries], 'opening', presence, readEngineMemory(userId), Date.now(), s.today);
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
