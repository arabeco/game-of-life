const RUNTIME_SESSION_ID_KEY = 'glyph:runtime-session-id';
const NATIVE_BACKGROUND_HINT_KEY = 'glyph:native-background-splash-hint';
const NATIVE_BACKGROUND_HINT_MAX_AGE_MS = 10 * 60 * 1000;

type NativeBackgroundSplashHint = {
  sessionId: string;
  backgroundedAt: number;
};

const isNativeBackgroundSplashHint = (value: unknown): value is NativeBackgroundSplashHint => {
  if (!value || typeof value !== 'object') return false;

  const hint = value as Record<string, unknown>;
  return (
    typeof hint.sessionId === 'string' &&
    hint.sessionId.length > 0 &&
    typeof hint.backgroundedAt === 'number' &&
    Number.isFinite(hint.backgroundedAt)
  );
};

export const getOrCreateRuntimeSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const current = window.sessionStorage.getItem(RUNTIME_SESSION_ID_KEY);
    if (current) return current;

    const nextId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `runtime-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    window.sessionStorage.setItem(RUNTIME_SESSION_ID_KEY, nextId);
    return nextId;
  } catch (error) {
    console.error('Failed to read runtime session id:', error);
    return null;
  }
};

export const markNativeBackgroundSplashHint = (backgroundedAt = Date.now()) => {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateRuntimeSessionId();
  if (!sessionId) return;

  const payload: NativeBackgroundSplashHint = {
    sessionId,
    backgroundedAt,
  };

  try {
    window.localStorage.setItem(NATIVE_BACKGROUND_HINT_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist native background splash hint:', error);
  }
};

export const consumeNativeBackgroundSplashHint = (
  maxAgeMs = NATIVE_BACKGROUND_HINT_MAX_AGE_MS,
  now = Date.now(),
): boolean => {
  if (typeof window === 'undefined') return false;

  const sessionId = getOrCreateRuntimeSessionId();
  if (!sessionId) return false;

  try {
    const raw = window.localStorage.getItem(NATIVE_BACKGROUND_HINT_KEY);
    if (!raw) return false;

    window.localStorage.removeItem(NATIVE_BACKGROUND_HINT_KEY);

    const parsed = JSON.parse(raw);
    if (!isNativeBackgroundSplashHint(parsed)) return false;
    if (parsed.sessionId !== sessionId) return false;

    return now - parsed.backgroundedAt <= maxAgeMs;
  } catch (error) {
    console.error('Failed to consume native background splash hint:', error);
    return false;
  }
};
