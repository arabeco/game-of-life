import { supabase } from '../supabaseClient';

export type AppRuntimeEntryMode =
    | 'unknown'
    | 'session_restore'
    | 'signed_in'
    | 'password_recovery'
    | 'oauth_recovery'
    | 'resume_recovery';

type RuntimeEventName = 'shell_ready' | 'boot_error';

type RuntimeEventMetadataValue = string | number | boolean;

type RuntimeEventInsert = {
    user_id: string;
    page_session_id: string;
    event_name: RuntimeEventName;
    duration_ms?: number | null;
    entry_mode?: AppRuntimeEntryMode | null;
    metadata: Record<string, RuntimeEventMetadataValue>;
};

type ShellReadyPayload = {
    userId: string;
    durationMs: number;
    entryMode: AppRuntimeEntryMode;
    renderMode: string | null;
    theme: 'LIGHT' | 'DARK' | null;
};

type BootErrorPayload = {
    userId: string;
    durationMs: number;
    entryMode: AppRuntimeEntryMode;
    renderMode: string | null;
    errorName: string;
    errorMessage: string;
};

const TABLE_NAME = 'app_runtime_events';
const FLUSH_DELAY_MS = 1500;
const MAX_BUFFER_SIZE = 4;
const MAX_STRING_LENGTH = 160;

const getNowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const parseEnvFlag = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const createPageSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `app-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export class AppRuntimeMetricsService {
    private static readonly pageSessionId = createPageSessionId();

    private static readonly enabled =
        !import.meta.env.DEV || parseEnvFlag(import.meta.env.VITE_ENABLE_APP_RUNTIME_METRICS);

    private static buffer: RuntimeEventInsert[] = [];

    private static flushTimer: number | null = null;

    private static flushInFlight: Promise<void> | null = null;

    private static lifecycleAttached = false;

    private static sanitizeString(value: string) {
        return value.trim().slice(0, MAX_STRING_LENGTH);
    }

    private static sanitizeDuration(durationMs: number) {
        if (!Number.isFinite(durationMs)) return null;
        return Math.max(0, Math.round(durationMs));
    }

    private static sanitizeMetadata(
        metadata: Record<string, string | number | boolean | null | undefined>,
    ): Record<string, RuntimeEventMetadataValue> {
        const sanitized: Record<string, RuntimeEventMetadataValue> = {};

        Object.entries(metadata).forEach(([key, value]) => {
            if (value === null || value === undefined) return;

            if (typeof value === 'string') {
                const nextValue = this.sanitizeString(value);
                if (nextValue) sanitized[key] = nextValue;
                return;
            }

            if (typeof value === 'number' && Number.isFinite(value)) {
                sanitized[key] = Math.round(value);
                return;
            }

            if (typeof value === 'boolean') {
                sanitized[key] = value;
            }
        });

        return sanitized;
    }

    private static ensureLifecycleListeners() {
        if (this.lifecycleAttached || typeof window === 'undefined') return;

        const flush = () => {
            void this.flushNow();
        };

        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                void this.flushNow();
            }
        });

        this.lifecycleAttached = true;
    }

    private static scheduleFlush(delayMs = FLUSH_DELAY_MS) {
        if (this.flushTimer !== null) {
            window.clearTimeout(this.flushTimer);
        }

        this.flushTimer = window.setTimeout(() => {
            this.flushTimer = null;
            void this.flushNow();
        }, delayMs);
    }

    private static enqueue(event: RuntimeEventInsert) {
        if (!this.enabled) return;
        if (!event.user_id) return;

        this.ensureLifecycleListeners();
        this.buffer.push(event);

        if (this.buffer.length >= MAX_BUFFER_SIZE) {
            this.scheduleFlush(0);
            return;
        }

        this.scheduleFlush();
    }

    static trackShellReady(payload: ShellReadyPayload) {
        this.enqueue({
            user_id: payload.userId,
            page_session_id: this.pageSessionId,
            event_name: 'shell_ready',
            duration_ms: this.sanitizeDuration(payload.durationMs),
            entry_mode: payload.entryMode,
            metadata: this.sanitizeMetadata({
                render_mode: payload.renderMode || 'default',
                theme: payload.theme || 'DARK',
            }),
        });
    }

    static trackBootError(payload: BootErrorPayload) {
        this.enqueue({
            user_id: payload.userId,
            page_session_id: this.pageSessionId,
            event_name: 'boot_error',
            duration_ms: this.sanitizeDuration(payload.durationMs),
            entry_mode: payload.entryMode,
            metadata: this.sanitizeMetadata({
                render_mode: payload.renderMode || 'default',
                error_name: payload.errorName,
                error_message: payload.errorMessage,
            }),
        });
    }

    static async flushNow() {
        if (!this.enabled) return;
        if (this.flushInFlight || this.buffer.length === 0) return;

        if (this.flushTimer !== null) {
            window.clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        const batch = this.buffer.splice(0, this.buffer.length);
        const startedAt = getNowMs();

        this.flushInFlight = (async () => {
            const { error } = await supabase.from(TABLE_NAME).insert(batch);
            if (error) {
                console.warn('Failed to persist app runtime metrics:', error.message);
            } else {
                const elapsedMs = Math.round(getNowMs() - startedAt);
                if (elapsedMs > 400) {
                    console.info(`App runtime metrics flushed in ${elapsedMs}ms.`);
                }
            }
        })().finally(() => {
            this.flushInFlight = null;
        });

        await this.flushInFlight;
    }
}
