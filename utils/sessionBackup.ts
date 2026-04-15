import type { Session } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { appendAuthTrace } from './authTrace';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export const AUTH_SESSION_BACKUP_KEY = 'gol-supabase-auth-backup';
export const AUTH_SESSION_RESCUE_KEY = 'gol-supabase-auth-rescue';

type SessionRescuePayload = {
  access_token: string;
  refresh_token: string;
  user_id?: string | null;
};

const saveLocalBackup = (session: Session) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_SESSION_BACKUP_KEY, JSON.stringify(session));
};

const saveLocalRescue = (session: Session) => {
  if (typeof window === 'undefined') return;
  const rescue: SessionRescuePayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user_id: session.user?.id ?? null,
  };
  window.localStorage.setItem(AUTH_SESSION_RESCUE_KEY, JSON.stringify(rescue));
};

const clearLocalBackup = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_SESSION_BACKUP_KEY);
  window.localStorage.removeItem(AUTH_SESSION_RESCUE_KEY);
};

export const saveSessionBackup = async (session: Session | null) => {
  if (!session) return;

  try {
    saveLocalBackup(session);
    saveLocalRescue(session);
    await appendAuthTrace('backup:save:local', {
      userId: session.user?.id ?? null,
      hasRefreshToken: !!session.refresh_token,
    });
  } catch (error) {
    console.warn('Failed to persist local auth backup:', error);
    await appendAuthTrace('backup:save:local:error', String(error instanceof Error ? error.message : error));
  }

  if (!isCapacitorNativeRuntime()) return;

  try {
    const rescue: SessionRescuePayload = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: session.user?.id ?? null,
    };
    await Promise.all([
      Preferences.set({
        key: AUTH_SESSION_BACKUP_KEY,
        value: JSON.stringify(session),
      }),
      Preferences.set({
        key: AUTH_SESSION_RESCUE_KEY,
        value: JSON.stringify(rescue),
      }),
    ]);
    await appendAuthTrace('backup:save:native', {
      userId: session.user?.id ?? null,
      hasRefreshToken: !!session.refresh_token,
    });
  } catch (error) {
    console.warn('Failed to persist native auth backup:', error);
    await appendAuthTrace('backup:save:native:error', String(error instanceof Error ? error.message : error));
  }
};

export const clearSessionBackup = async () => {
  try {
    clearLocalBackup();
    await appendAuthTrace('backup:clear:local');
  } catch (error) {
    console.warn('Failed to clear local auth backup:', error);
    await appendAuthTrace('backup:clear:local:error', String(error instanceof Error ? error.message : error));
  }

  if (!isCapacitorNativeRuntime()) return;

  try {
    await Promise.all([
      Preferences.remove({ key: AUTH_SESSION_BACKUP_KEY }),
      Preferences.remove({ key: AUTH_SESSION_RESCUE_KEY }),
    ]);
    await appendAuthTrace('backup:clear:native');
  } catch (error) {
    console.warn('Failed to clear native auth backup:', error);
    await appendAuthTrace('backup:clear:native:error', String(error instanceof Error ? error.message : error));
  }
};

export const loadSessionBackup = async (): Promise<Session | null> => {
  if (isCapacitorNativeRuntime()) {
    try {
      const { value: fullValue } = await Preferences.get({ key: AUTH_SESSION_BACKUP_KEY });
      if (fullValue) {
        const parsed = JSON.parse(fullValue) as Session;
        await appendAuthTrace('backup:load:native', {
          found: true,
          userId: parsed.user?.id ?? null,
        });
        return parsed;
      }

      const { value: rescueValue } = await Preferences.get({ key: AUTH_SESSION_RESCUE_KEY });
      if (rescueValue) {
        const parsed = JSON.parse(rescueValue) as SessionRescuePayload;
        await appendAuthTrace('backup:load:native:rescue', {
          found: true,
          userId: parsed.user_id ?? null,
        });
        return {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        } as Session;
      }

      await appendAuthTrace('backup:load:native', { found: false });
    } catch (error) {
      console.warn('Failed to load native auth backup:', error);
      await appendAuthTrace('backup:load:native:error', String(error instanceof Error ? error.message : error));
    }
  }

  if (typeof window === 'undefined') return null;

  try {
    const fullRaw = window.localStorage.getItem(AUTH_SESSION_BACKUP_KEY);
    if (fullRaw) {
      const parsed = JSON.parse(fullRaw) as Session;
      await appendAuthTrace('backup:load:local', {
        found: true,
        userId: parsed.user?.id ?? null,
      });
      return parsed;
    }

    const rescueRaw = window.localStorage.getItem(AUTH_SESSION_RESCUE_KEY);
    if (!rescueRaw) {
      await appendAuthTrace('backup:load:local', { found: false });
      return null;
    }

    const parsed = JSON.parse(rescueRaw) as SessionRescuePayload;
    await appendAuthTrace('backup:load:local:rescue', {
      found: true,
      userId: parsed.user_id ?? null,
    });
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    } as Session;
  } catch (error) {
    console.warn('Failed to load local auth backup:', error);
    await appendAuthTrace('backup:load:local:error', String(error instanceof Error ? error.message : error));
    return null;
  }
};
