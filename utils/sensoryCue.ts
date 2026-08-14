export type AppSensoryCue =
    | 'task_complete'
    | 'daily_streak'
    | 'daily_panel_closed'
    | 'arena_complete'
    | 'campaign_complete'
    | 'cycle_seal_start'
    | 'report_chapter'
    | 'report_verdict'
    | 'report_reward'
    | 'cycle_complete';

export interface AppSensoryCuePayload {
    cue: AppSensoryCue;
    timestamp: number;
}

export const APP_SENSORY_CUE_EVENT = 'glyph:sensory-cue';

export const emitAppSensoryCue = (cue: AppSensoryCue) => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent<AppSensoryCuePayload>(APP_SENSORY_CUE_EVENT, {
        detail: {
            cue,
            timestamp: Date.now(),
        },
    }));
};
