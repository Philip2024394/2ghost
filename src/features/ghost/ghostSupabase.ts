import { createClient } from '@supabase/supabase-js';

const GHOST_URL = import.meta.env.VITE_GHOST_SUPABASE_URL as string;
const GHOST_KEY = import.meta.env.VITE_GHOST_SUPABASE_ANON_KEY as string;

if (!GHOST_URL || !GHOST_KEY) {
  console.warn('[2Ghost] Missing VITE_GHOST_SUPABASE_URL or VITE_GHOST_SUPABASE_ANON_KEY in .env');
}

/**
 * Supabase client dedicated to the 2Ghost project.
 * Project: czlfqasujfdfumelzjbp (2dateme.com@gmail.com account)
 *
 * Usage:
 *   import { ghostSupabase } from '@/features/ghost/ghostSupabase';
 */
export const ghostSupabase = createClient(GHOST_URL, GHOST_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'ghost_auth_session',   // separate key so it doesn't clash with main app auth
  },
});
