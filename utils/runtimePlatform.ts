import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export const isCapacitorNativeRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    if (typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }

    if (typeof Capacitor?.getPlatform === 'function') {
      const platform = String(Capacitor.getPlatform() || '').toLowerCase();
      if (platform === 'ios' || platform === 'android') {
        return true;
      }
    }

    if (typeof window.Capacitor?.isNativePlatform === 'function') {
      return Boolean(window.Capacitor.isNativePlatform());
    }

    if (typeof window.Capacitor?.getPlatform === 'function') {
      const platform = String(window.Capacitor.getPlatform() || '').toLowerCase();
      return platform === 'ios' || platform === 'android';
    }
  } catch (_error) {
    return false;
  }

  return false;
};

export const shouldUseBrowserServiceWorker = (): boolean =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && !isCapacitorNativeRuntime();

export const shouldUsePwaInstallPrompt = (): boolean =>
  typeof window !== 'undefined'
  && !isCapacitorNativeRuntime();
