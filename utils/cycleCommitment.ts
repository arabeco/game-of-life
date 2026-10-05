import type { Action, Arena, ScheduledTask } from '../types';
import { isQuestAction } from './taskDomain.js';

export const CYCLE_SEASON_MISSION_RULE = 'Missões de temporada são extras: o que faltar nelas não reduz a conclusão nem a nota do ciclo.';

/** Season/clan missions have their own targets. A personal SIDEQUESTS arena does not. */
export const isCycleQuestAction = (action: Action, arenas: Arena[]): boolean =>
  Boolean(action.sourceQuestId) || isQuestAction(action, [], arenas);

/** The cycle promises action repetitions, whether or not they have a planner slot. */
export const buildCycleCommitment = ({ actions, arenas, tasks, startDate, endDate }: {
  actions: Action[];
  arenas: Arena[];
  tasks: ScheduledTask[];
  startDate: string;
  endDate: string;
}) => {
  const activeArenaIds = new Set(arenas.filter(arena => !arena.isArchived).map(arena => arena.id));
  const activeActions = actions.filter(action => activeArenaIds.has(action.arenaId));
  const activeActionIds = new Set(activeActions.map(action => action.id));
  const cycleTasks = [...new Map(tasks.filter(task => activeActionIds.has(task.actionId)
    && task.date >= startDate && task.date <= endDate).map(task => [task.id, task])).values()];
  const questIds = new Set(activeActions.filter(action => isCycleQuestAction(action, arenas)).map(action => action.id));
  const plannedActions = activeActions.filter(action => action.actionType !== 'Livre' && !questIds.has(action.id));
  const completedByAction = new Map<string, number>();
  for (const task of cycleTasks) {
    if (task.completed === true) completedByAction.set(task.actionId, (completedByAction.get(task.actionId) || 0) + 1);
  }
  const entries = plannedActions.map(action => {
    const planned = Math.max(1, Math.floor(Number(action.repetitions) || 1));
    return { action, planned, completed: Math.min(planned, completedByAction.get(action.id) || 0) };
  });
  const plannedCount = entries.reduce((sum, entry) => sum + entry.planned, 0);
  const completedCount = entries.reduce((sum, entry) => sum + entry.completed, 0);
  const plannedIds = new Set(plannedActions.map(action => action.id));
  return {
    entries, cycleTasks, plannedCount, completedCount,
    progressPercent: plannedCount > 0 ? completedCount / plannedCount * 100 : 0,
    scoredTasks: cycleTasks.filter(task => plannedIds.has(task.actionId)),
    questTasks: cycleTasks.filter(task => questIds.has(task.actionId)),
  };
};
