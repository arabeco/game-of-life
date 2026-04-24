export type ArenaAttentionPhase = 'populate' | 'celebrate';

export interface ArenaAttentionPayload {
    arenaIds: string[];
    campaignId?: string | null;
    focusArenaId?: string | null;
    phase: ArenaAttentionPhase;
    navigateToArenas?: boolean;
    timestamp: number;
}

export interface AppNavigatePayload {
    view: 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';
    openSitrep?: boolean;
}

export const ARENA_ATTENTION_EVENT = 'glyph:arena-attention';
export const APP_NAVIGATE_EVENT = 'glyph:navigate-view';

const ARENA_ATTENTION_STORAGE_KEY = '__glyph_arena_attention_v1';

const isBrowser = () => typeof window !== 'undefined';

export const emitArenaAttention = (
    payload: Omit<ArenaAttentionPayload, 'timestamp'>,
) => {
    if (!isBrowser()) return;

    const detail: ArenaAttentionPayload = {
        ...payload,
        timestamp: Date.now(),
    };

    try {
        sessionStorage.setItem(ARENA_ATTENTION_STORAGE_KEY, JSON.stringify(detail));
    } catch (error) {
        console.warn('Failed to persist arena attention payload:', error);
    }

    window.dispatchEvent(new CustomEvent<ArenaAttentionPayload>(ARENA_ATTENTION_EVENT, { detail }));

    if (detail.navigateToArenas) {
        window.dispatchEvent(new CustomEvent<AppNavigatePayload>(APP_NAVIGATE_EVENT, {
            detail: { view: 'arenas' },
        }));
    }
};

export const consumeArenaAttention = (): ArenaAttentionPayload | null => {
    if (!isBrowser()) return null;

    try {
        const raw = sessionStorage.getItem(ARENA_ATTENTION_STORAGE_KEY);
        if (!raw) return null;

        sessionStorage.removeItem(ARENA_ATTENTION_STORAGE_KEY);
        const parsed = JSON.parse(raw) as Partial<ArenaAttentionPayload> | null;
        if (!parsed?.phase || !Array.isArray(parsed.arenaIds)) return null;

        return {
            arenaIds: parsed.arenaIds,
            campaignId: parsed.campaignId ?? null,
            focusArenaId: parsed.focusArenaId ?? null,
            phase: parsed.phase,
            navigateToArenas: parsed.navigateToArenas ?? false,
            timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        };
    } catch (error) {
        console.warn('Failed to restore arena attention payload:', error);
        return null;
    }
};
