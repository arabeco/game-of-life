import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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

export const supabase = supabaseConfig.enabled ? createClient(supabaseUrl, supabaseAnonKey) : null;
