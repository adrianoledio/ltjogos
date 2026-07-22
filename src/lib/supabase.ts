import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_PUBLISHABLE_KEY || '';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-key';

if (!isValidUrl(rawUrl) || !rawKey) {
  console.warn('Supabase URL or Key is missing or invalid. Using fallback placeholder to prevent app crash.');
}

export const isSupabaseConfigured = isValidUrl(rawUrl) && Boolean(rawKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
