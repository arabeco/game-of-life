export const CAMPAIGN_FREE_QUIZ_COMPLETED_KEY = 'glyph_campaign_quiz_free_completed_v1';

export const hasCompletedFreeCampaignQuiz = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(CAMPAIGN_FREE_QUIZ_COMPLETED_KEY) === '1';
    } catch {
        return false;
    }
};

export const markFreeCampaignQuizCompleted = (): void => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(CAMPAIGN_FREE_QUIZ_COMPLETED_KEY, '1');
    } catch {
        // noop
    }
};
