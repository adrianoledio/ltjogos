import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://mtodxdlvpsldxwtvtttk.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b2R4ZGx2cHNsZHh3dHZ0dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg5NjUsImV4cCI6MjEwNTU5NDk2NX0.By1JUfX28vpMSZS1fbItofVcq3X5MoFeT2m_QDhxH_E";

export function getValidSupabaseCredentials() {
  let url = "";
  let key = "";

  // Server-side / Node / Serverless environment
  if (typeof process !== "undefined" && process?.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  }

  // Client-side Vite environment
  if (!url || !key) {
    try {
      const meta = import.meta as any;
      if (meta && meta.env) {
        url = meta.env.VITE_SUPABASE_URL || "";
        key = meta.env.VITE_SUPABASE_ANON_KEY || "";
      }
    } catch (e) {
      // Ignore
    }
  }

  // Fallback to project defaults if not provided via environment
  if (!url || !key) {
    url = DEFAULT_SUPABASE_URL;
    key = DEFAULT_SUPABASE_ANON_KEY;
  }

  // Auto-recover if the user accidentally pasted the JWT into VITE_SUPABASE_URL
  if (url && url.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(url.split(".")[1]));
      if (payload && payload.ref) {
        url = `https://${payload.ref}.supabase.co`;
        console.log("Auto-recovered Supabase URL from JWT:", url);
      }
    } catch (e) {
      console.warn("Failed to decode JWT to recover Supabase URL");
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
