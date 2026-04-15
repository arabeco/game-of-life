import type { Session } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export const AUTH_SESSION_BACKUP_KEY = 'gol-supabase-auth-backup';

const saveLocalBackup = (session: Session) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_SESSION_BACKUP_KEY, JSON.stringify(session));
};

const clearLocalBackup = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_BACKUP_KEY);
};

export const saveSessionBackup = async (session: Session | null) => {
  if (!session) return;

  try {
    saveLocalBackup(session);
  } catch (error) {
    console.warn('Failed to persist local auth backup:', error);
  }

  if (!isCapacitorNativeRuntime()) return;

  try {
    await Preferences.set({
      key: AUTH_SESSION_BACKUP_KEY,
      value: JSON.stringify(session),
    });
  } catch (error) {
    console.warn('Failed to persist native auth backup:', error);
  }
};

export const clearSessionBackup = async () => {
  try {
    clearLocalBackup();
  } catch (error) {
    console.warn('Failed to clear local auth backup:', error);
  }

  if (!isCapacitorNativeRuntime()) return;

  try {
    await Preferences.remove({ key: AUTH_SESSION_BACKUP_KEY });
  } catch (error) {
    console.warn('Failed to clear native auth backup:', error);
  }
};

export const loadSessionBackup = async (): Promise<Session | null> => {
  if (isCapacitorNativeRuntime()) {
    try {
      const { value } = await Preferences.get({ key: AUTH_SESSION_BACKUP_KEY });
      if (value) return JSON.parse(value) as Session;
    } catch (error) {
      console.warn('Failed to load native auth backup:', error);
    }
  }

  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch (error) {
    console.warn('Failed to load local auth backup:', error);
    return null;
  }
};
