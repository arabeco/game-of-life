import { medirCicloPrometido, type AcaoDoBanco, type ArenaDoBanco, type TarefaDoBanco } from './oracle-cycle-reading.ts';
import type { ReadingFacts } from './oracle-engine-v2.ts';

export function readingFactsFromDatabase(input: {
  actions: AcaoDoBanco[]; arenas: Array<ArenaDoBanco & { description?: string | null }>;
  tasks: Array<TarefaDoBanco & { completed_at?: string | null; created_at?: string | null }>;
  cycle: null | { start_date: string; end_date: string };
  resetAt?: string | null; today: string;
}): ReadingFacts {
  const { cycle, today } = input;
  const reset = input.resetAt ? Date.parse(input.resetAt) : null;
  const tasks = [...new Map(input.tasks.filter(t => {
    if (cycle) return t.date >= cycle.start_date && t.date <= (today < cycle.end_date ? today : cycle.end_date);
    if (reset === null || !Number.isFinite(reset)) return true;
    // Same precedence as filterTasksAfterFreeProgressReset in the app.
    const anchor = [t.completed_at, t.created_at].find(v => v && Number.isFinite(Date.parse(v)));
    return (anchor ? Date.parse(anchor) : Date.parse(`${t.date}T00:00:00-03:00`)) > reset;
  }).map(t => [t.id, t])).values()];
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const arenas = input.arenas.filter(a => !a.is_archived && !a.description?.includes('[SHARED]') && !normalize(a.name || '').startsWith('clan office')).flatMap(a => {
    const actions = input.actions.filter(x => x.arena_id === a.id);
    if (actions.some(x => x.source_quest_id) || /quests - (season|cla)/.test(normalize(a.name || ''))) return [];
    const measured = actions.filter(x => x.action_type !== 'Livre');
    const ids = new Set(measured.map(x => x.id));
    return [{ id: a.id, name: a.name || 'Arena', target: measured.reduce((sum, x) => sum + Math.max(1, Number(x.repetitions) || 1), 0), completed: tasks.filter(t => t.completed && ids.has(t.action_id)).length }];
  });
  const activeIds = new Set(input.actions.filter(a => input.arenas.some(r => r.id === a.arena_id && !r.is_archived)).map(a => a.id));
  const promise = cycle ? medirCicloPrometido({ acoes: input.actions, arenas: input.arenas, tarefas: tasks, inicio: cycle.start_date, fim: cycle.end_date }) : null;
  return {
    arenas, completed: tasks.filter(t => t.completed && activeIds.has(t.action_id)).length,
    cycle: cycle && cycle.start_date <= today ? { startsToday: cycle.start_date === today, percent: promise!.prometidas ? promise!.feitas / promise!.prometidas * 100 : null, daysLeft: Math.max(0, Math.round((Date.parse(cycle.end_date) - Date.parse(today)) / 86400000)), ended: cycle.end_date < today } : null,
  };
}
