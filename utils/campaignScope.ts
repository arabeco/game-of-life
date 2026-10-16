import type { Action, ScheduledTask } from '../types';

/** Installed content has a lifetime independent of the personal cycle. */
export const campaignAwareTasks = (tasks: ScheduledTask[], cycleTasks: ScheduledTask[], actions: Action[]) => {
  const campaignActionIds = new Set(actions.filter(action => Boolean(action.originCodexId)).map(action => action.id));
  const scopedIds = new Set(cycleTasks.map(task => task.id));
  return tasks.filter(task => campaignActionIds.has(task.actionId) || scopedIds.has(task.id));
};
