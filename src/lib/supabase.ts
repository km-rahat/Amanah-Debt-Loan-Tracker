import { createClient } from '@supabase/supabase-js';

// Accessing public VITE_ environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseAnonKey?.substring(0, 20));
// Validate keys without breaking startup module evaluation
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'AMANAH CONFIGURATION WARNING: Supabase URL or Anon Key is not defined in the environment. ' +
    'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or secrets.'
  );
}

/**
 * Shared Supabase Client instance for the React application.
 * Falls back to placeholder strings during building or before environment variable configuration
 * to prevent startup crashes.
 */
export const supabase = createClient(
  supabaseUrl || 'https://missing-supabase-url.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

/**
 * Utility to verify if Supabase is properly configured.
 */
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://missing-supabase-url.supabase.co';
}
