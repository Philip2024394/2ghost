import { createClient } from '@supabase/supabase-js';

const GHOST_URL = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
const GHOST_KEY = import.meta.env.VITE_GHOST_SUPABASE_ANON_KEY as string | undefined;

if (!GHOST_URL || !GHOST_KEY) {
  console.warn('[2Ghost] Missing VITE_GHOST_SUPABASE_URL or VITE_GHOST_SUPABASE_ANON_KEY in .env — running in offline/mock mode');
}

/**
 * Supabase client dedicated to the 2Ghost project.
 * Falls back to a no-op placeholder when env vars are absent so the app
 * can run in mock/demo mode without a real Supabase project connected.
 */
export const ghostSupabase = GHOST_URL && GHOST_KEY
  ? createClient(GHOST_URL, GHOST_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'ghost_auth_session',
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        storage: localStorage,
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'ghost_auth_session',
      },
    });
