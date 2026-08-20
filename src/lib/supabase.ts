import { createClient } from '@supabase/supabase-js';

export function parseJwtRef(token: string): string | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = typeof window !== 'undefined' && (window as any).atob
        ? (window as any).atob(base64)
        : typeof Buffer !== 'undefined'
          ? Buffer.from(base64, 'base64').toString('utf-8')
          : '';
      if (jsonPayload) {
        const payload = JSON.parse(jsonPayload);
        if (payload?.ref) return payload.ref;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function getValidSupabaseCredentials(customUrl?: string, customKey?: string) {
  let url = (
    customUrl ||
    (typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : '') ||
    (import.meta.env ? (import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL) : '') ||
    ''
  ).trim();

  let key = (
    customKey ||
    (typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY) : '') ||
    (import.meta.env ? (import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_PUBLISHABLE_KEY) : '') ||
    ''
  ).trim();

  // If url is a JWT token and key is an http URL, swap them
  if (url.startsWith('eyJ') && key.startsWith('http')) {
    const temp = url;
    url = key;
    key = temp;
  }

  // If url is a JWT token (e.g. key was pasted in URL variable)
  if (url.startsWith('eyJ')) {
    const ref = parseJwtRef(url);
    if (!key || key.startsWith('http')) {
      key = url;
    }
    if (ref) {
      url = `https://${ref}.supabase.co`;
    } else {
      url = 'https://izsolrtvzkrpmtpmzok.supabase.co';
    }
  }

  // Ensure prefix
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Check validity
  let isValid = false;
  try {
    const parsed = new URL(url);
    isValid = (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    isValid = false;
  }

  if (!isValid) {
    url = 'https://izsolrtvzkrpmtpmzok.supabase.co';
  }

  if (!key) {
    key = 'placeholder-key';
  }

  return { url, key, isValid };
}

const { url: supabaseUrl, key: supabaseAnonKey } = getValidSupabaseCredentials();

export { supabaseUrl, supabaseAnonKey };
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder-key' &&
  !supabaseUrl.includes('izsolrtvzkrpmtpmzok.supabase.co') &&
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length > 20)
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured
    }
  }
);

