export type DailyCompletionPromptKind = 'task' | 'sitrep';

export interface DailyCompletionPromptPayload {
    kind: DailyCompletionPromptKind;
    actionName?: string | null;
    date?: string | null;
    score?: number | null;
    expDeposited?: number | null;
    timestamp: number;
}

export const DAILY_COMPLETION_PROMPT_EVENT = 'glyph:daily-completion-prompt';

export const emitDailyCompletionPrompt = (
    payload: Omit<DailyCompletionPromptPayload, 'timestamp'>,
) => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent<DailyCompletionPromptPayload>(DAILY_COMPLETION_PROMPT_EVENT, {
        detail: {
            ...payload,
            timestamp: Date.now(),
        },
    }));
};
