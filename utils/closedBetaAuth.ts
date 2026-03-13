export const CLOSED_BETA_GOOGLE_REDIRECT_KEY = '__closed_beta_google_redirect_v1';

export type ClosedBetaGoogleRedirectMode = 'login' | 'signup';

export interface ClosedBetaGoogleRedirectState {
    mode: ClosedBetaGoogleRedirectMode;
    email?: string;
    message: string;
}

export const saveClosedBetaGoogleRedirect = (state: ClosedBetaGoogleRedirectState) => {
    try {
        sessionStorage.setItem(CLOSED_BETA_GOOGLE_REDIRECT_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Failed to persist closed beta redirect state:', error);
    }
};

export const consumeClosedBetaGoogleRedirect = (): ClosedBetaGoogleRedirectState | null => {
    try {
        const raw = sessionStorage.getItem(CLOSED_BETA_GOOGLE_REDIRECT_KEY);
        if (!raw) return null;

        sessionStorage.removeItem(CLOSED_BETA_GOOGLE_REDIRECT_KEY);
        const parsed = JSON.parse(raw) as Partial<ClosedBetaGoogleRedirectState> | null;
        if (!parsed?.message || (parsed.mode !== 'login' && parsed.mode !== 'signup')) {
            return null;
        }

        return {
            mode: parsed.mode,
            email: typeof parsed.email === 'string' ? parsed.email : '',
            message: parsed.message,
        };
    } catch (error) {
        console.warn('Failed to restore closed beta redirect state:', error);
        return null;
    }
};

export const clearClosedBetaGoogleRedirect = () => {
    try {
        sessionStorage.removeItem(CLOSED_BETA_GOOGLE_REDIRECT_KEY);
    } catch (error) {
        console.warn('Failed to clear closed beta redirect state:', error);
    }
};
