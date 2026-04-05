import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token as CapacitorPushToken,
  PermissionStatus as CapacitorPushPermissionStatus,
} from '@capacitor/push-notifications';
import { getLocalNotificationPermission, requestLocalNotificationPermission } from './localNotification';
import {
  disableRemotePushSubscription,
  getRemoteWebPushSupport,
  hasRemotePushSubscription,
  syncRemotePushSubscription,
  type WebPushSyncResult,
} from './webPush';
import { isCapacitorNativeRuntime } from './runtimePlatform';
import { supabase } from '../supabaseClient';

export type AppPushPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export type AppPushSyncStatus =
  | WebPushSyncResult['status']
  | 'native_ok'
  | 'native_register_failed'
  | 'native_backend_register_failed'
  | 'native_permission_prompt'
  | 'native_permission_denied'
  | 'native_remote_pending';

export interface AppPushSyncResult {
  ok: boolean;
  status: AppPushSyncStatus;
  hasSubscription: boolean;
  isNative: boolean;
  remoteDeliveryReady: boolean;
  detail?: string;
  token?: string | null;
}

export type NativePushPlatform = 'android' | 'ios';

const NATIVE_PUSH_TOKEN_STORAGE_KEY = 'glyph_native_push_token';
const NATIVE_PUSH_REMOTE_READY_STORAGE_KEY = 'glyph_native_push_remote_ready';
const NATIVE_PUSH_DEVICE_ID_STORAGE_KEY = 'glyph_native_push_device_id';
const SUPABASE_FUNCTIONS_URL = `${((import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '').replace(/\/+$/, '')}/functions/v1/web-push`;

type AppPushFunctionResponse = {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

const getStoredNativePushToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(NATIVE_PUSH_TOKEN_STORAGE_KEY);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const setStoredNativePushToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token && token.trim().length > 0) {
    window.localStorage.setItem(NATIVE_PUSH_TOKEN_STORAGE_KEY, token.trim());
    return;
  }

  window.localStorage.removeItem(NATIVE_PUSH_TOKEN_STORAGE_KEY);
};

const getStoredNativePushRemoteReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(NATIVE_PUSH_REMOTE_READY_STORAGE_KEY) === '1';
};

const getOrCreateNativePushDeviceId = (): string => {
  if (typeof window === 'undefined') return 'unknown-device';

  const existing = window.localStorage.getItem(NATIVE_PUSH_DEVICE_ID_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }

  const nextId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `device-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

  window.localStorage.setItem(NATIVE_PUSH_DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
};

const getNativePushDeviceLabel = (platform: string): string =>
  `glyph-${platform}-native-${getOrCreateNativePushDeviceId()}`;

export const getNativePushPlatform = (): NativePushPlatform => {
  try {
    const platform = String(Capacitor.getPlatform?.() || '').trim().toLowerCase();
    if (platform === 'ios') return 'ios';
  } catch (_error) {
    // noop
  }

  return 'android';
};

export const getNativePushProviderLabel = (): string =>
  getNativePushPlatform() === 'ios' ? 'APNs / Apple' : 'FCM / Google';

export const getAppPushSetupHint = (): string => {
  if (!isCapacitorNativeRuntime()) {
    return 'No navegador, o push continua preso ao service worker e ao browser do usuario.';
  }

  return getNativePushPlatform() === 'ios'
    ? 'No iPhone, este toggle vai seguir por APNs. Quando o projeto abrir no Xcode, vamos ligar capability, credencial Apple e backend sem trocar esta tela.'
    : 'No Android, este toggle segue por FCM. O aparelho registra o token nativo e o backend faz a entrega remota quando a trilha Firebase esta pronta.';
};

const setStoredNativePushRemoteReady = (ready: boolean) => {
  if (typeof window === 'undefined') return;
  if (ready) {
    window.localStorage.setItem(NATIVE_PUSH_REMOTE_READY_STORAGE_KEY, '1');
    return;
  }

  window.localStorage.removeItem(NATIVE_PUSH_REMOTE_READY_STORAGE_KEY);
};

const getCurrentAccessToken = async (): Promise<string | null> => {
  const { data: authData } = await supabase.auth.getSession();
  return authData.session?.access_token || null;
};

const invokeAppPushFunction = async (
  accessToken: string | null,
  body: Record<string, unknown>,
): Promise<AppPushFunctionResponse> => {
  if (!SUPABASE_FUNCTIONS_URL || SUPABASE_FUNCTIONS_URL.startsWith('/functions/v1/web-push')) {
    return {
      ok: false,
      status: 0,
      error: 'missing_supabase_url',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  if (anonKey) {
    headers.apikey = anonKey;
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(SUPABASE_FUNCTIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let parsed: any = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (_error) {
        parsed = { error: rawText };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: parsed,
        error: String(parsed?.error || parsed?.message || rawText || `http_${response.status}`),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const mapNativePermission = (permission: CapacitorPushPermissionStatus['receive']): AppPushPermission => {
  if (permission === 'granted') return 'granted';
  if (permission === 'denied') return 'denied';
  if (permission === 'prompt' || permission === 'prompt-with-rationale') return 'prompt';
  return 'unsupported';
};

const waitForNativePushRegistration = async (): Promise<CapacitorPushToken> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = async () => {
      try {
        await registrationHandle.remove();
      } catch (_error) {
        // noop
      }

      try {
        await registrationErrorHandle.remove();
      } catch (_error) {
        // noop
      }
    };

    const finishResolve = async (token: CapacitorPushToken) => {
      if (settled) return;
      settled = true;
      await cleanup();
      resolve(token);
    };

    const finishReject = async (error: unknown) => {
      if (settled) return;
      settled = true;
      await cleanup();
      reject(error);
    };

    const registrationHandle = PushNotifications.addListener('registration', (token) => {
      void finishResolve(token);
    });

    const registrationErrorHandle = PushNotifications.addListener('registrationError', (error) => {
      void finishReject(error);
    });

    void PushNotifications.register().catch((error) => {
      void finishReject(error);
    });
  });
};

export const getAppPushSupport = () => {
  if (isCapacitorNativeRuntime()) {
    return {
      isNative: true,
      nativePlatform: getNativePushPlatform(),
      supported: true,
      configured: true,
      remoteDeliveryReady: false,
    };
  }

  const webSupport = getRemoteWebPushSupport();
  return {
    isNative: false,
    nativePlatform: null,
    supported: webSupport.supported,
    configured: webSupport.configured,
    remoteDeliveryReady: webSupport.supported && webSupport.configured,
  };
};

export const getAppPushPermission = async (): Promise<AppPushPermission> => {
  if (!isCapacitorNativeRuntime()) {
    return await getLocalNotificationPermission();
  }

  try {
    const permissions = await PushNotifications.checkPermissions();
    return mapNativePermission(permissions.receive);
  } catch (_error) {
    return 'unsupported';
  }
};

export const requestAppPushPermission = async (): Promise<AppPushPermission> => {
  if (!isCapacitorNativeRuntime()) {
    return requestLocalNotificationPermission();
  }

  try {
    const existing = await PushNotifications.checkPermissions();
    if (existing.receive === 'granted' || existing.receive === 'denied') {
      return mapNativePermission(existing.receive);
    }

    const requested = await PushNotifications.requestPermissions();
    return mapNativePermission(requested.receive);
  } catch (_error) {
    return 'unsupported';
  }
};

export const hasAppPushRegistration = async (): Promise<boolean> => {
  if (!isCapacitorNativeRuntime()) {
    return hasRemotePushSubscription();
  }

  return Boolean(getStoredNativePushToken());
};

export const hasAppPushRemoteDeliveryReady = async (): Promise<boolean> => {
  if (!isCapacitorNativeRuntime()) {
    return hasRemotePushSubscription();
  }

  return getStoredNativePushRemoteReady();
};

export const syncAppPushRegistration = async (): Promise<AppPushSyncResult> => {
  if (!isCapacitorNativeRuntime()) {
    const result = await syncRemotePushSubscription();
    return {
      ...result,
      isNative: false,
      remoteDeliveryReady: result.ok,
    };
  }

  const permission = await requestAppPushPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      status: permission === 'denied' ? 'native_permission_denied' : 'native_permission_prompt',
      hasSubscription: false,
      isNative: true,
      remoteDeliveryReady: false,
    };
  }

  try {
    const nativePlatform = getNativePushPlatform();
    const token = await waitForNativePushRegistration();
    const nativeToken = String(token?.value || '').trim();

    if (!nativeToken) {
      return {
        ok: false,
        status: 'native_register_failed',
        hasSubscription: false,
        isNative: true,
        remoteDeliveryReady: false,
        detail: 'empty_native_token',
      };
    }

    setStoredNativePushToken(nativeToken);
    setStoredNativePushRemoteReady(false);

    const accessToken = await getCurrentAccessToken();
    const backendRegistration = await invokeAppPushFunction(accessToken, {
      action: 'register_native',
      token: nativeToken,
      platform: nativePlatform,
      deviceLabel: getNativePushDeviceLabel(nativePlatform),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });

    if (!backendRegistration.ok || backendRegistration.data?.error) {
      return {
        ok: false,
        status: 'native_backend_register_failed',
        hasSubscription: true,
        isNative: true,
        remoteDeliveryReady: false,
        token: nativeToken,
        detail: backendRegistration.status > 0
          ? `${backendRegistration.status}: ${backendRegistration.error || String(backendRegistration.data?.error || 'native_backend_register_failed')}`
          : (backendRegistration.error || String(backendRegistration.data?.error || 'native_backend_register_failed')),
      };
    }

    const delivery = String(backendRegistration.data?.delivery || '').trim().toLowerCase();
    const remoteDeliveryReady = delivery === 'fcm_ready';
    setStoredNativePushRemoteReady(remoteDeliveryReady);

    return {
      ok: true,
      status: remoteDeliveryReady ? 'native_ok' : 'native_remote_pending',
      hasSubscription: true,
      isNative: true,
      remoteDeliveryReady,
      token: nativeToken,
      detail: remoteDeliveryReady
        ? `${getNativePushProviderLabel()} token acquired and backend delivery is ready.`
        : `${getNativePushProviderLabel()} token acquired locally. Backend delivery still depends on store/provider configuration.`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'native_register_failed',
      hasSubscription: false,
      isNative: true,
      remoteDeliveryReady: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

export const disableAppPushRegistration = async (): Promise<AppPushSyncResult> => {
  if (!isCapacitorNativeRuntime()) {
    const result = await disableRemotePushSubscription();
    return {
      ...result,
      isNative: false,
      remoteDeliveryReady: false,
    };
  }

  const currentToken = getStoredNativePushToken();
  const accessToken = await getCurrentAccessToken();
  const nativePlatform = getNativePushPlatform();

  if (currentToken) {
    try {
      await invokeAppPushFunction(accessToken, {
        action: 'unregister_native',
        token: currentToken,
        platform: nativePlatform,
        deviceLabel: getNativePushDeviceLabel(nativePlatform),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });
    } catch (_error) {
      // noop
    }
  }

  setStoredNativePushToken(null);
  setStoredNativePushRemoteReady(false);

  return {
    ok: true,
    status: 'native_ok',
    hasSubscription: false,
    isNative: true,
    remoteDeliveryReady: false,
  };
};
