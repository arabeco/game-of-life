import { Preferences } from '@capacitor/preferences';
import { AUTH_STORAGE_KEY } from './authSession';
import { AUTH_SESSION_BACKUP_KEY, AUTH_SESSION_RESCUE_KEY } from './sessionBackup';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export type AuthTraceEntry = {
    ts: string;
    label: string;
    detail: string;
};

const AUTH_TRACE_KEY = 'gol-supabase-auth-trace';
const AUTH_TRACE_LIMIT = 80;

const safeSerialize = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;

    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(error instanceof Error ? error.message : value);
    }
};

const parseEntries = (raw: string | null | undefined): AuthTraceEntry[] => {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((entry): entry is AuthTraceEntry => (
                typeof entry === 'object' &&
                entry !== null &&
                typeof (entry as AuthTraceEntry).ts === 'string' &&
                typeof (entry as AuthTraceEntry).label === 'string' &&
                typeof (entry as AuthTraceEntry).detail === 'string'
            ))
            .slice(0, AUTH_TRACE_LIMIT);
    } catch {
        return [];
    }
};

const readBrowserTrace = (): AuthTraceEntry[] => {
    if (typeof window === 'undefined') return [];
    return parseEntries(window.localStorage.getItem(AUTH_TRACE_KEY));
};

const writeBrowserTrace = (entries: AuthTraceEntry[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTH_TRACE_KEY, JSON.stringify(entries));
};

export const loadAuthTrace = async (): Promise<AuthTraceEntry[]> => {
    if (isCapacitorNativeRuntime()) {
        try {
            const { value } = await Preferences.get({ key: AUTH_TRACE_KEY });
            const nativeEntries = parseEntries(value);
            if (nativeEntries.length > 0) {
                return nativeEntries;
            }
        } catch {
            // Fall back to browser storage below.
        }
    }

    return readBrowserTrace();
};

const persistAuthTrace = async (entries: AuthTraceEntry[]) => {
    writeBrowserTrace(entries);

    if (!isCapacitorNativeRuntime()) return;

    try {
        await Preferences.set({
            key: AUTH_TRACE_KEY,
            value: JSON.stringify(entries),
        });
    } catch {
        // Best-effort debug trace only.
    }
};

export const appendAuthTrace = async (label: string, detail?: unknown) => {
    const entry: AuthTraceEntry = {
        ts: new Date().toISOString(),
        label,
        detail: safeSerialize(detail),
    };

    console.info(`[auth-trace] ${entry.ts} ${label}`, entry.detail);

    const existing = await loadAuthTrace();
    const next = [entry, ...existing].slice(0, AUTH_TRACE_LIMIT);
    await persistAuthTrace(next);
    return next;
};

export const snapshotAuthStorageState = async (label: string) => {
    const browserAuth = typeof window !== 'undefined' ? !!window.localStorage.getItem(AUTH_STORAGE_KEY) : false;
    const browserBackup = typeof window !== 'undefined' ? !!window.localStorage.getItem(AUTH_SESSION_BACKUP_KEY) : false;
    const browserRescue = typeof window !== 'undefined' ? !!window.localStorage.getItem(AUTH_SESSION_RESCUE_KEY) : false;

    let nativeAuth = false;
    let nativeBackup = false;
    let nativeRescue = false;

    if (isCapacitorNativeRuntime()) {
        try {
            const [{ value: authValue }, { value: backupValue }, { value: rescueValue }] = await Promise.all([
                Preferences.get({ key: AUTH_STORAGE_KEY }),
                Preferences.get({ key: AUTH_SESSION_BACKUP_KEY }),
                Preferences.get({ key: AUTH_SESSION_RESCUE_KEY }),
            ]);
            nativeAuth = !!authValue;
            nativeBackup = !!backupValue;
            nativeRescue = !!rescueValue;
        } catch {
            // Best-effort debug trace only.
        }
    }

    return appendAuthTrace(label, {
        browserAuth,
        browserBackup,
        browserRescue,
        nativeAuth,
        nativeBackup,
        nativeRescue,
    });
};
