import { supabase } from '../supabaseClient';

export const AUTH_STORAGE_KEY = 'gol-supabase-auth';

export const clearSupabaseSessionStorage = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear primary Supabase auth storage key:', error);
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (key === AUTH_STORAGE_KEY || key.startsWith('sb-') || key.includes('supabase.auth.token')) {
      localStorage.removeItem(key);
    }
  }
};

export const signOutAndClearSupabaseSession = async (scope: 'global' | 'local' = 'local') => {
  try {
    await supabase.auth.signOut({ scope });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const message = String((error as { message?: string })?.message || '');
    const isExpectedAfterDelete = status === 403 || message.includes('403') || message.toLowerCase().includes('session');

    if (!isExpectedAfterDelete) {
      console.error('Supabase signOut failed while clearing session:', error);
    }
  } finally {
    clearSupabaseSessionStorage();
  }
};
