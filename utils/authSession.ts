import { Preferences } from '@capacitor/preferences';
import { supabase } from '../supabaseClient';
import { AUTH_SESSION_BACKUP_KEY, clearSessionBackup } from './sessionBackup';
import { appendAuthTrace } from './authTrace';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export const AUTH_STORAGE_KEY = 'gol-supabase-auth';
let intentionalSignOutPending = false;

export const markIntentionalSignOutPending = () => {
  intentionalSignOutPending = true;
};

export const clearIntentionalSignOutPending = () => {
  intentionalSignOutPending = false;
};

export const isIntentionalSignOutPending = () => intentionalSignOutPending;

export const clearSupabaseSessionStorage = (reason = 'unspecified') => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    void appendAuthTrace('auth-storage:clear:local', { reason, key: AUTH_STORAGE_KEY });
  } catch (error) {
    console.error('Failed to clear primary Supabase auth storage key:', error);
    void appendAuthTrace('auth-storage:clear:local:error', {
      reason,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (key === AUTH_STORAGE_KEY || key.startsWith('sb-') || key.includes('supabase.auth.token')) {
      localStorage.removeItem(key);
      void appendAuthTrace('auth-storage:clear:local:extra', { reason, key });
    }
  }
};

export const signOutAndClearSupabaseSession = async (
  scope: 'global' | 'local' = 'local',
  reason = 'unspecified',
) => {
  markIntentionalSignOutPending();
  await appendAuthTrace('auth:signout:start', { scope, reason });
  try {
    await supabase.auth.signOut({ scope });
    await appendAuthTrace('auth:signout:done', { scope, reason });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const message = String((error as { message?: string })?.message || '');
    const isExpectedAfterDelete = status === 403 || message.includes('403') || message.toLowerCase().includes('session');

    if (!isExpectedAfterDelete) {
      console.error('Supabase signOut failed while clearing session:', error);
    }
    await appendAuthTrace('auth:signout:error', { scope, reason, status, message });
  } finally {
    clearSupabaseSessionStorage(reason);
    void clearSessionBackup();

    if (isCapacitorNativeRuntime()) {
      void Preferences.remove({ key: AUTH_STORAGE_KEY })
        .then(() => appendAuthTrace('auth-storage:clear:native', { reason, key: AUTH_STORAGE_KEY }))
        .catch((error) => appendAuthTrace('auth-storage:clear:native:error', {
          reason,
          key: AUTH_STORAGE_KEY,
          message: error instanceof Error ? error.message : String(error),
        }));
      void Preferences.remove({ key: AUTH_SESSION_BACKUP_KEY })
        .then(() => appendAuthTrace('auth-storage:clear:native', { reason, key: AUTH_SESSION_BACKUP_KEY }))
        .catch((error) => appendAuthTrace('auth-storage:clear:native:error', {
          reason,
          key: AUTH_SESSION_BACKUP_KEY,
          message: error instanceof Error ? error.message : String(error),
        }));
    }
  }
};
