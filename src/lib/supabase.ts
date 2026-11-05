import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "";
const DEFAULT_SUPABASE_ANON_KEY = "";

export function getValidSupabaseCredentials() {
  let url = process.env.VITE_SUPABASE_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : "") || DEFAULT_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : "") || DEFAULT_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", url);
  console.log("Supabase Key:", key ? "Present" : "Missing");
  return { url, key };
}

export function isConfiguredSupabase(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (!cleanUrl || !cleanKey) return false;
  if (cleanUrl.includes("placeholder") || cleanKey.includes("placeholder")) return false;
  if (cleanUrl.includes("mtodxdlvpsldxwtvtttk")) return false;
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) return false;
  return true;
}

const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

export const isSupabaseConfigured = isConfiguredSupabase(supabaseUrl, supabaseKey);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseKey : "placeholder"
);
