const supabaseUrl =
  (typeof localStorage !== "undefined" ? localStorage.getItem("game_of_life.supabase_url") : undefined) ||
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
  window.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  (typeof localStorage !== "undefined" ? localStorage.getItem("game_of_life.supabase_anon") : undefined) ||
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  enabled: Boolean(supabaseUrl && supabaseAnonKey),
};

// Usar window.supabase.createClient se disponível (carregado no bootstrap.js)
// Caso contrário, o app funcionará sem Supabase (modo offline)
const createClient =
  typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function"
    ? window.supabase.createClient
    : null;

export const supabase =
  supabaseConfig.enabled && createClient ? createClient(supabaseUrl, supabaseAnonKey) : null;
