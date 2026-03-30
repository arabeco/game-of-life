const ACTIVE_MEDIA_HINT_STORAGE_KEY = 'gol-active-media-hint-v1';
const ACTIVE_MEDIA_HINT_MAX_AGE_MS = 30 * 60 * 1000;

type ActiveMediaHint = {
  kind: 'focus-audio';
  playing: boolean;
  updatedAt: number;
};

const isActiveMediaHint = (value: unknown): value is ActiveMediaHint => {
  if (!value || typeof value !== 'object') return false;

  const hint = value as Record<string, unknown>;
  return (
    hint.kind === 'focus-audio' &&
    typeof hint.playing === 'boolean' &&
    typeof hint.updatedAt === 'number' &&
    Number.isFinite(hint.updatedAt)
  );
};

export const persistActiveMediaHint = (kind: ActiveMediaHint['kind']) => {
  if (typeof window === 'undefined') return;

  const payload: ActiveMediaHint = {
    kind,
    playing: true,
    updatedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(ACTIVE_MEDIA_HINT_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist active media hint:', error);
  }
};

export const clearActiveMediaHint = (kind?: ActiveMediaHint['kind']) => {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(ACTIVE_MEDIA_HINT_STORAGE_KEY);
    if (!raw) return;

    if (!kind) {
      window.localStorage.removeItem(ACTIVE_MEDIA_HINT_STORAGE_KEY);
      return;
    }

    const parsed = JSON.parse(raw);
    if (isActiveMediaHint(parsed) && parsed.kind === kind) {
      window.localStorage.removeItem(ACTIVE_MEDIA_HINT_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear active media hint:', error);
  }
};

export const hasRecentActiveMediaHint = (maxAgeMs = ACTIVE_MEDIA_HINT_MAX_AGE_MS, now = Date.now()): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(ACTIVE_MEDIA_HINT_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!isActiveMediaHint(parsed)) return false;

    return parsed.playing && (now - parsed.updatedAt) <= maxAgeMs;
  } catch (error) {
    console.error('Failed to inspect active media hint:', error);
    return false;
  }
};
