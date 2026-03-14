import type { ActionType } from '../types';

export const REST_SCREEN_ACTION_SESSION_EVENT = 'restScreenActionSession:start';

export interface RestScreenActionSessionDetail {
  actionId: string;
  actionName: string;
  actionIcon: string;
  durationMinutes: number;
  actionType: ActionType;
  taskId?: string;
  startedAt: string;
}

export const createRestScreenActionSession = (
  detail: Omit<RestScreenActionSessionDetail, 'startedAt'>
): RestScreenActionSessionDetail => ({
  ...detail,
  startedAt: new Date().toISOString(),
});
