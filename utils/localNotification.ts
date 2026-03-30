const APP_NOTIFICATION_ICON = '/logo-diamond.png';

export type LocalNotificationPermission = NotificationPermission | 'unsupported';

interface LocalNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
}

const supportsLocalNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getLocalNotificationPermission = (): LocalNotificationPermission => {
  if (!supportsLocalNotifications()) return 'unsupported';
  return Notification.permission;
};

export const requestLocalNotificationPermission = async (): Promise<LocalNotificationPermission> => {
  if (!supportsLocalNotifications()) return 'unsupported';
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

export const showLocalNotification = async ({
  title,
  body,
  tag,
  url = '/',
  requireInteraction = false,
  renotify = false,
}: LocalNotificationPayload): Promise<boolean> => {
  if (!supportsLocalNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: APP_NOTIFICATION_ICON,
    badge: APP_NOTIFICATION_ICON,
    tag,
    requireInteraction,
    renotify,
    data: { url },
  };

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
      try {
        window.focus();
      } catch (error) {
        console.warn('Window focus failed:', error);
      }

      if (url) {
        window.location.href = url;
      }

      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('Local notification skipped:', error);
    return false;
  }
};
