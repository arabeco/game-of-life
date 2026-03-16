export const CLOSED_BETA_GOOGLE_REDIRECT_KEY = '__closed_beta_google_redirect_v1';
export const CLOSED_BETA_GOOGLE_SIGNUP_INTENT_KEY = '__closed_beta_google_signup_intent_v1';
const CLOSED_BETA_GOOGLE_GRANTED_PREFIX = '__closed_beta_google_granted_v1__';

export type ClosedBetaGoogleRedirectMode = 'login' | 'signup';

export interface ClosedBetaGoogleRedirectState {
    mode: ClosedBetaGoogleRedirectMode;
    email?: string;
    message: string;
}

export interface ClosedBetaGoogleSignupIntent {
    inviteCode: string;
    nickname?: string;
    acceptedLegal: boolean;
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

export const saveClosedBetaGoogleSignupIntent = (state: ClosedBetaGoogleSignupIntent) => {
    try {
        sessionStorage.setItem(CLOSED_BETA_GOOGLE_SIGNUP_INTENT_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Failed to persist closed beta google signup intent:', error);
    }
};

export const readClosedBetaGoogleSignupIntent = (): ClosedBetaGoogleSignupIntent | null => {
    try {
        const raw = sessionStorage.getItem(CLOSED_BETA_GOOGLE_SIGNUP_INTENT_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<ClosedBetaGoogleSignupIntent> | null;
        if (!parsed?.inviteCode || parsed.acceptedLegal !== true) {
            return null;
        }

        return {
            inviteCode: parsed.inviteCode,
            nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
            acceptedLegal: true,
        };
    } catch (error) {
        console.warn('Failed to restore closed beta google signup intent:', error);
        return null;
    }
};

export const clearClosedBetaGoogleSignupIntent = () => {
    try {
        sessionStorage.removeItem(CLOSED_BETA_GOOGLE_SIGNUP_INTENT_KEY);
    } catch (error) {
        console.warn('Failed to clear closed beta google signup intent:', error);
    }
};

export const rememberClosedBetaGoogleAccess = (userId?: string | null, email?: string | null) => {
    if (!userId) return;

    try {
        localStorage.setItem(`${CLOSED_BETA_GOOGLE_GRANTED_PREFIX}${userId}`, JSON.stringify({
            email: email || '',
            rememberedAt: new Date().toISOString(),
        }));
    } catch (error) {
        console.warn('Failed to persist closed beta granted access:', error);
    }
};

export const hasRememberedClosedBetaGoogleAccess = (userId?: string | null): boolean => {
    if (!userId) return false;

    try {
        return !!localStorage.getItem(`${CLOSED_BETA_GOOGLE_GRANTED_PREFIX}${userId}`);
    } catch (error) {
        console.warn('Failed to read closed beta granted access:', error);
        return false;
    }
};

export const clearRememberedClosedBetaGoogleAccess = (userId?: string | null) => {
    if (!userId) return;

    try {
        localStorage.removeItem(`${CLOSED_BETA_GOOGLE_GRANTED_PREFIX}${userId}`);
    } catch (error) {
        console.warn('Failed to clear closed beta granted access:', error);
    }
};
