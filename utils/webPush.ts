import { supabase } from '../supabaseClient';

const WEB_PUSH_PUBLIC_KEY = (import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined)?.trim() || '';

type WebPushSyncStatus =
    | 'ok'
    | 'unsupported'
    | 'missing_public_key'
    | 'permission_denied'
    | 'not_signed_in'
    | 'invoke_failed'
    | 'subscribe_failed';

export interface WebPushSyncResult {
    ok: boolean;
    status: WebPushSyncStatus;
    hasSubscription: boolean;
    detail?: string;
}

const supportsWebPush = () =>
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

const decodeBase64Url = (value: string): Uint8Array => {
    const normalized = value
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(value.length / 4) * 4, '=');
    const raw = window.atob(normalized);
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!supportsWebPush()) return null;
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return navigator.serviceWorker.ready;
};

const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
};

const getCurrentAccessToken = async (): Promise<string | null> => {
    const { data: authData } = await supabase.auth.getSession();
    return authData.session?.access_token || null;
};

const isSubscriptionRegisteredRemotely = async (subscription: PushSubscription | null): Promise<boolean> => {
    if (!subscription?.endpoint) return false;

    try {
        const { data, error } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .is('disabled_at', null)
            .limit(1);

        if (error) {
            return false;
        }

        return Array.isArray(data) && data.length > 0;
    } catch (_error) {
        return false;
    }
};

const ensurePushSubscription = async (): Promise<PushSubscription | null> => {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;

    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    if (!WEB_PUSH_PUBLIC_KEY) {
        throw new Error('missing_public_key');
    }

    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(WEB_PUSH_PUBLIC_KEY),
    });
};

export const isRemoteWebPushConfigured = (): boolean => WEB_PUSH_PUBLIC_KEY.length > 0;

export const getRemoteWebPushSupport = () => ({
    supported: supportsWebPush(),
    configured: isRemoteWebPushConfigured(),
});

export const hasRemotePushSubscription = async (): Promise<boolean> => {
    const subscription = await getCurrentSubscription();
    return isSubscriptionRegisteredRemotely(subscription);
};

export const syncRemotePushSubscription = async (): Promise<WebPushSyncResult> => {
    if (!supportsWebPush()) {
        return { ok: false, status: 'unsupported', hasSubscription: false };
    }

    const accessToken = await getCurrentAccessToken();
    if (!accessToken) {
        return { ok: false, status: 'not_signed_in', hasSubscription: false };
    }

    if (!WEB_PUSH_PUBLIC_KEY) {
        return { ok: false, status: 'missing_public_key', hasSubscription: false };
    }

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return { ok: false, status: 'permission_denied', hasSubscription: false };
    }

    try {
        const subscription = await ensurePushSubscription();
        if (!subscription) {
            return { ok: false, status: 'subscribe_failed', hasSubscription: false };
        }

        const { data, error } = await supabase.functions.invoke('web-push', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: {
                action: 'register',
                subscription: subscription.toJSON(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                deviceLabel: 'glyph-web',
            },
        });

        if (error || data?.error) {
            return {
                ok: false,
                status: 'invoke_failed',
                hasSubscription: true,
                detail: error?.message || String(data?.error || 'register_failed'),
            };
        }

        return { ok: true, status: 'ok', hasSubscription: true };
    } catch (error) {
        return {
            ok: false,
            status: 'subscribe_failed',
            hasSubscription: false,
            detail: error instanceof Error ? error.message : String(error),
        };
    }
};

export const disableRemotePushSubscription = async (): Promise<WebPushSyncResult> => {
    if (!supportsWebPush()) {
        return { ok: false, status: 'unsupported', hasSubscription: false };
    }

    const subscription = await getCurrentSubscription();
    if (!subscription) {
        return { ok: true, status: 'ok', hasSubscription: false };
    }

    try {
        const accessToken = await getCurrentAccessToken();
        await supabase.functions.invoke('web-push', {
            headers: accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                }
                : undefined,
            body: {
                action: 'unregister',
                endpoint: subscription.endpoint,
            },
        });
    } catch (error) {
        console.warn('Remote push unregister failed:', error);
    }

    try {
        await subscription.unsubscribe();
    } catch (error) {
        console.warn('Browser push unsubscribe failed:', error);
    }

    return { ok: true, status: 'ok', hasSubscription: false };
};
