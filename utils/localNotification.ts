import { LocalNotifications } from '@capacitor/local-notifications';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export type LocalNotificationPermission = NotificationPermission | 'unsupported';

interface LocalNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
}

const APP_NOTIFICATION_ICON = '/logo-diamond.png';
const GLYPH_LOCAL_CHANNEL_ID = 'glyph-local-default';
const GLYPH_LOCAL_CHANNEL_NAME = 'Alertas GLYPH';
const GLYPH_LOCAL_CHANNEL_DESCRIPTION = 'Alertas locais e testes do GLYPH';

let nativeChannelReadyPromise: Promise<void> | null = null;
let nativeActionListenerPromise: Promise<void> | null = null;
let nativeNotificationSequence = 0;

const supportsBrowserLocalNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window;

const normalizeNativePermission = (value: string | undefined): LocalNotificationPermission => {
  if (value === 'granted' || value === 'denied') return value;
  if (value === 'prompt' || value === 'prompt-with-rationale') return 'default';
  return 'unsupported';
};

const navigateToNotificationUrl = (url?: string) => {
  if (typeof window === 'undefined') return;

  const nextUrl = String(url || '').trim();
  if (!nextUrl) return;

  try {
    window.focus();
  } catch (_error) {
    // noop
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(nextUrl)) {
    window.location.href = nextUrl;
    return;
  }

  window.location.href = nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`;
};

const ensureNativeLocalChannel = async () => {
  if (!isCapacitorNativeRuntime()) return;

  if (!nativeChannelReadyPromise) {
    nativeChannelReadyPromise = (async () => {
      try {
        await LocalNotifications.createChannel({
          id: GLYPH_LOCAL_CHANNEL_ID,
          name: GLYPH_LOCAL_CHANNEL_NAME,
          description: GLYPH_LOCAL_CHANNEL_DESCRIPTION,
          importance: 4,
          visibility: 1,
          vibration: true,
        });
      } catch (_error) {
        // Channel may already exist on Android. That's fine.
      }
    })();
  }

  await nativeChannelReadyPromise;
};

const ensureNativeNotificationActionListener = async () => {
  if (!isCapacitorNativeRuntime()) return;

  if (!nativeActionListenerPromise) {
    nativeActionListenerPromise = (async () => {
      await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
        const extra = event.notification.extra as { url?: string } | undefined;
        navigateToNotificationUrl(extra?.url);
      });
    })();
  }

  await nativeActionListenerPromise;
};

const ensureNativeLocalNotificationReady = async () => {
  await Promise.all([
    ensureNativeLocalChannel(),
    ensureNativeNotificationActionListener(),
  ]);
};

const nextNativeNotificationId = () => {
  nativeNotificationSequence = (nativeNotificationSequence + 1) % 10000;
  return Math.floor(Date.now() % 2000000000) + nativeNotificationSequence;
};

const showBrowserLocalNotification = async ({
  title,
  body,
  tag,
  url = '/',
  requireInteraction = false,
  renotify = false,
}: LocalNotificationPayload): Promise<boolean> => {
  if (!supportsBrowserLocalNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: APP_NOTIFICATION_ICON,
    badge: APP_NOTIFICATION_ICON,
    tag,
    requireInteraction,
    data: { url },
  };

  if (renotify) {
    (options as NotificationOptions & { renotify?: boolean }).renotify = true;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, options);
        return true;
      }
    }
  } catch (error) {
    console.warn('Service worker notification failed, falling back:', error);
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      navigateToNotificationUrl(url);
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('Local notification skipped:', error);
    return false;
  }
};

const showNativeLocalNotification = async (
  payload: LocalNotificationPayload,
  delayMs = 0,
): Promise<boolean> => {
  await ensureNativeLocalNotificationReady();

  const now = Date.now();
  const scheduleAt = new Date(now + Math.max(delayMs, 250));

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: nextNativeNotificationId(),
          title: payload.title,
          body: payload.body,
          largeBody: payload.body,
          channelId: GLYPH_LOCAL_CHANNEL_ID,
          autoCancel: true,
          ongoing: Boolean(payload.requireInteraction),
          extra: {
            url: payload.url || '/',
            tag: payload.tag || null,
          },
          group: 'glyph-alerts',
          schedule: {
            at: scheduleAt,
            allowWhileIdle: delayMs > 0,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.warn('Native local notification skipped:', error);
    return false;
  }
};

export const getLocalNotificationPermission = async (): Promise<LocalNotificationPermission> => {
  if (isCapacitorNativeRuntime()) {
    try {
      const permissions = await LocalNotifications.checkPermissions();
      return normalizeNativePermission(permissions.display);
    } catch (_error) {
      return 'unsupported';
    }
  }

  if (!supportsBrowserLocalNotifications()) return 'unsupported';
  return Notification.permission;
};

export const requestLocalNotificationPermission = async (): Promise<LocalNotificationPermission> => {
  if (isCapacitorNativeRuntime()) {
    try {
      const existing = await LocalNotifications.checkPermissions();
      const normalizedExisting = normalizeNativePermission(existing.display);
      if (normalizedExisting === 'granted' || normalizedExisting === 'denied') {
        return normalizedExisting;
      }

      const requested = await LocalNotifications.requestPermissions();
      return normalizeNativePermission(requested.display);
    } catch (error) {
      console.warn('Native notification permission request failed:', error);
      return 'unsupported';
    }
  }

  if (!supportsBrowserLocalNotifications()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.warn('Notification permission request failed:', error);
    return Notification.permission;
  }
};

export const showLocalNotification = async (
  payload: LocalNotificationPayload,
): Promise<boolean> => {
  if (isCapacitorNativeRuntime()) {
    const permission = await getLocalNotificationPermission();
    if (permission !== 'granted') return false;
    return showNativeLocalNotification(payload);
  }

  return showBrowserLocalNotification(payload);
};

export const scheduleLocalNotification = async (
  payload: LocalNotificationPayload,
  delayMs: number,
): Promise<boolean> => {
  const normalizedDelay = Math.max(0, Math.floor(delayMs));

  if (isCapacitorNativeRuntime()) {
    const permission = await getLocalNotificationPermission();
    if (permission !== 'granted') return false;
    return showNativeLocalNotification(payload, normalizedDelay);
  }

  if (!supportsBrowserLocalNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  window.setTimeout(() => {
    void showBrowserLocalNotification(payload);
  }, normalizedDelay);

  return true;
};
