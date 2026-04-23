import type { ActionType } from '../types';

export const REST_SCREEN_ACTION_SESSION_EVENT = 'restScreenActionSession:start';
export const REST_SCREEN_ACTION_SESSION_CLEAR_EVENT = 'restScreenActionSession:clear';
export const REST_SCREEN_ACTION_VIEW_REQUEST_EVENT = 'restScreenActionSession:viewAction';
export const PLANNER_OPEN_ACTION_MODAL_EVENT = 'planner:open-action-modal';
export const REST_SCREEN_ACTION_SESSION_STORAGE_PREFIX = 'rest-screen-action-session-v1';
const ACTIVE_ACTION_SESSION_GRACE_MS = 15 * 60 * 1000;
const ACTION_TYPES = new Set<ActionType>(['Marco', 'Compromisso', 'Ação Recorrente', 'Livre']);

export interface RestScreenActionSessionDetail {
  actionId: string;
  actionName: string;
  actionIcon: string;
  durationMinutes: number;
  actionType: ActionType;
  taskId?: string;
  startedAt: string;
}

export interface RestScreenActionViewRequestDetail {
  actionId?: string;
  taskId?: string;
  source?: 'session_timeout' | 'session_return' | 'session_complete' | 'oracle';
  createNew?: boolean;
}

export const createRestScreenActionSession = (
  detail: Omit<RestScreenActionSessionDetail, 'startedAt'>
): RestScreenActionSessionDetail => ({
  ...detail,
  startedAt: new Date().toISOString(),
});

const isRestScreenActionSessionDetail = (value: unknown): value is RestScreenActionSessionDetail => {
  if (!value || typeof value !== 'object') return false;

  const session = value as Record<string, unknown>;
  if (typeof session.actionId !== 'string' || !session.actionId.trim()) return false;
  if (typeof session.actionName !== 'string' || !session.actionName.trim()) return false;
  if (typeof session.actionIcon !== 'string') return false;
  if (typeof session.durationMinutes !== 'number' || !Number.isFinite(session.durationMinutes) || session.durationMinutes <= 0) return false;
  if (typeof session.startedAt !== 'string' || Number.isNaN(Date.parse(session.startedAt))) return false;
  if (typeof session.taskId !== 'undefined' && typeof session.taskId !== 'string') return false;

  return typeof session.actionType === 'string' && ACTION_TYPES.has(session.actionType as ActionType);
};

export const getRestScreenActionSessionStorageKey = (userId: string) =>
  `${REST_SCREEN_ACTION_SESSION_STORAGE_PREFIX}:${userId}`;

export const loadPersistedRestScreenActionSession = (userId: string): RestScreenActionSessionDetail | null => {
  if (typeof window === 'undefined' || !userId) return null;

  const storageKey = getRestScreenActionSessionStorageKey(userId);

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isRestScreenActionSessionDetail(parsed)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load persisted action session:', error);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
};

export const persistRestScreenActionSession = (userId: string, session: RestScreenActionSessionDetail) => {
  if (typeof window === 'undefined' || !userId) return;

  try {
    window.localStorage.setItem(getRestScreenActionSessionStorageKey(userId), JSON.stringify(session));
  } catch (error) {
    console.error('Failed to persist action session:', error);
  }
};

export const clearPersistedRestScreenActionSession = (userId: string) => {
  if (typeof window === 'undefined' || !userId) return;

  try {
    window.localStorage.removeItem(getRestScreenActionSessionStorageKey(userId));
  } catch (error) {
    console.error('Failed to clear persisted action session:', error);
  }
};

export const hasActivePersistedRestScreenActionSession = (now = Date.now()): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(`${REST_SCREEN_ACTION_SESSION_STORAGE_PREFIX}:`)) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!isRestScreenActionSessionDetail(parsed)) continue;

      const startedAtMs = Date.parse(parsed.startedAt);
      const endsAtMs = startedAtMs + (parsed.durationMinutes * 60 * 1000) + ACTIVE_ACTION_SESSION_GRACE_MS;
      if (Number.isFinite(startedAtMs) && endsAtMs > now) {
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to inspect persisted action sessions:', error);
  }

  return false;
};
