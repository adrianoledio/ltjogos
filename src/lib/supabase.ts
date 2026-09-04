import { createClient } from "@supabase/supabase-js";

export function getValidSupabaseCredentials() {
  let url = "";
  let key = "";

  // Server-side
  if (typeof process !== "undefined" && process.env) {
    url = process.env.VITE_SUPABASE_URL || "";
    key = process.env.VITE_SUPABASE_ANON_KEY || "";
  }

  // Client-side fallback
  if (!url || !key) {
    try {
      // Avoid syntax errors in non-Vite/SSR environments
      url = (import.meta.env?.VITE_SUPABASE_URL) || "";
      key = (import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";
    } catch (e) {
      // Ignore
    }
  }

  // Validate URL format to prevent Supabase Client from crashing the server/app
  const isHttpUrl = url && (url.startsWith("http://") || url.startsWith("https://"));
  if (!isHttpUrl) {
    if (url) {
      console.warn("Invalid VITE_SUPABASE_URL format detected. Falling back to offline placeholder.");
    }
    url = "";
    key = "";
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);
