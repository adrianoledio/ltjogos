import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://mtodxdlvpsldxwtvtttk.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b2R4ZGx2cHNsZHh3dHZ0dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTg5NjUsImV4cCI6MjEwNTU5NDk2NX0.By1JUfX28vpMSZS1fbItofVcq3X5MoFeT2m_QDhxH_E";

export function getValidSupabaseCredentials() {
  let url = process.env.VITE_SUPABASE_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : "") || DEFAULT_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : "") || DEFAULT_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", url);
  console.log("Supabase Key:", key ? "Present" : "Missing");
  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getValidSupabaseCredentials();

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder"
);
