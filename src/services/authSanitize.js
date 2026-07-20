/**
 * Runs before the Supabase client is created to avoid doomed refresh attempts
 * when a previous session was invalidated server-side.
 *
 * Import this module first in main.jsx (before AuthContext / supabase).
 */

const INVALID_REFRESH_FLAG = 'optivian_supabase_refresh_invalid';

function getSupabaseAuthStorageKey() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || typeof window === 'undefined') return null;

  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;

  const storageKey = getSupabaseAuthStorageKey();
  if (storageKey) {
    localStorage.removeItem(storageKey);
  }

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  }

  localStorage.removeItem(INVALID_REFRESH_FLAG);
}

export function markSupabaseRefreshInvalid() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INVALID_REFRESH_FLAG, '1');
  }
}

export function sanitizeSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;

  if (localStorage.getItem(INVALID_REFRESH_FLAG) === '1') {
    clearSupabaseAuthStorage();
    return;
  }

  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) return;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    const session = JSON.parse(raw);
    if (!session?.refresh_token || !session?.access_token) {
      localStorage.removeItem(storageKey);
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

export { clearSupabaseAuthStorage, INVALID_REFRESH_FLAG };

// Run immediately on import so it executes before supabase.js createClient().
sanitizeSupabaseAuthStorage();
