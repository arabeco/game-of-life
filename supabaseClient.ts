import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import { isCapacitorNativeRuntime } from './utils/runtimePlatform';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas nas variaveis de ambiente');
}

const browserStorage = {
    getItem: async (key: string) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
    },
};

const nativeStorage = {
    getItem: async (key: string) => {
        try {
            const { value } = await Preferences.get({ key });
            return value ?? null;
        } catch {
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await Preferences.set({ key, value });
        } catch {
            // Ignore native storage write failures and fall back to browser storage.
        }
    },
    removeItem: async (key: string) => {
        try {
            await Preferences.remove({ key });
        } catch {
            // Ignore native storage removal failures and fall back to browser storage.
        }
    },
};

const authStorage = {
    getItem: async (key: string) => {
        const nativeValue = await nativeStorage.getItem(key);
        if (nativeValue !== null) return nativeValue;
        return browserStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        await nativeStorage.setItem(key, value);
        await browserStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        await nativeStorage.removeItem(key);
        await browserStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'gol-supabase-auth',
        flowType: 'pkce',
        storage: authStorage,
    }
});
