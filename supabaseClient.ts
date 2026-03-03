import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas nas variáveis de ambiente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'gol-supabase-auth', // Custom key to avoid collisions
        flowType: 'pkce'
    }
});
