/**
 * ─── Auth Service ──────────────────────────────────────────────────
 * Centralized authentication service that wraps Supabase Auth and
 * provides OAuth (Google, GitHub, Microsoft), session management,
 * password flows, and profile auto-creation.
 *
 * All auth API calls go through this module.
 * AuthContext.jsx uses this service as its data layer.
 */

import { supabase } from '../supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

/**
 * Map provider name to Supabase provider string and display info.
 */
const OAUTH_PROVIDERS = {
  google: {
    provider: 'google',
    label: 'Google',
    icon: null, // Will be set by UI
    color: 'text-red-600',
    bg: 'bg-white',
    border: 'border-slate-300',
  },
  github: {
    provider: 'github',
    label: 'GitHub',
    icon: null,
    color: 'text-slate-900',
    bg: 'bg-slate-900',
    border: 'border-slate-800',
  },
  microsoft: {
    provider: 'azure',
    label: 'Microsoft',
    icon: null,
    color: 'text-blue-600',
    bg: 'bg-white',
    border: 'border-slate-300',
  },
};

/**
 * Sign in with email & password.
 */
export async function signInWithPassword(email, password) {
  if (DEV_MODE) {
    // DEV_MODE handled in AuthContext
    return { data: null, error: null };
  }
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign in with an OAuth provider.
 */
export async function signInWithOAuth(provider) {
  if (DEV_MODE) {
    return { data: null, error: { message: 'OAuth not available in DEV_MODE. Use email/password.' } };
  }

  const oauthConfig = OAUTH_PROVIDERS[provider];
  if (!oauthConfig) {
    return { data: null, error: { message: `Unknown OAuth provider: ${provider}` } };
  }

  // IMPORTANT: redirectTo must point to the bare origin (no hash path) so that
  // the OAuth tokens arrive in the URL hash fragment. HashRouter will consume
  // the hash for routing, so App.jsx has a pre-router guard that detects
  // OAuth callbacks and defers mounting the router until Supabase finishes
  // processing the tokens.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: oauthConfig.provider,
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: provider === 'microsoft' ? {
        tenant: 'common',
      } : undefined,
    },
  });

  return { data, error };
}

/**
 * Sign up a new user with email & password.
 * Options: redirectTo, data (user_metadata)
 */
export async function signUpWithPassword(email, password, options = {}) {
  if (DEV_MODE) {
    return { data: null, error: null };
  }
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/onboarding/verify`,
      data: options.data || {},
      ...options,
    },
  });
}

/**
 * Send password reset email.
 */
export async function resetPassword(email) {
  if (DEV_MODE) {
    return { data: null, error: null };
  }
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/onboarding/update-password`,
  });
}

/**
 * Update password for current user.
 */
export async function updateUserPassword(password) {
  if (DEV_MODE) {
    return { data: null, error: null };
  }
  return supabase.auth.updateUser({ password });
}

/**
 * Update user metadata.
 */
export async function updateUserMetadata(metadata) {
  if (DEV_MODE) {
    return { data: null, error: null };
  }
  return supabase.auth.updateUser({ data: metadata });
}

/**
 * Get the current session (with auto-refresh).
 */
export async function getSession() {
  if (DEV_MODE) {
    return { data: { session: null }, error: null };
  }
  return supabase.auth.getSession();
}

/**
 * Refresh the session manually.
 */
export async function refreshSession() {
  if (DEV_MODE) return { data: { session: null }, error: null };
  const { data, error } = await supabase.auth.refreshSession();
  return { data, error };
}

/**
 * Sign out. If scope = 'others', sign out all other sessions ("logout everywhere").
 * If scope = 'all', sign out everywhere.
 */
export async function signOutUser(scope = 'local') {
  if (DEV_MODE) {
    return { error: null };
  }
  return supabase.auth.signOut({ scope });
}

/**
 * Get the current authenticated user.
 */
export function getCurrentUser() {
  return supabase.auth.getUser();
}

/**
 * Auto-create or sync profile after successful auth.
 * Called on every sign-in.
 */
export async function ensureProfile(user, provider = 'email') {
  if (!user || DEV_MODE) return null;

  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Update last_login and provider if OAuth
      const updates = { last_login: new Date().toISOString() };
      if (provider !== 'email') {
        updates.provider = provider;
        if (user.user_metadata?.avatar_url) {
          updates.avatar_url = user.user_metadata.avatar_url;
        }
        if (user.user_metadata?.full_name) {
          updates.full_name = user.user_metadata.full_name;
        }
      }
      await supabase.from('profiles').update(updates).eq('user_id', user.id);
      return { ...existing, ...updates };
    }

    // Auto-create profile
    const fullName = user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const newProfile = {
      user_id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: user.user_metadata?.avatar_url || null,
      provider: provider,
      role: 'staff',
      last_login: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Failed to auto-create profile:', error);
      // If profile already exists (race condition), fetch it
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        return retry;
      }
      return null;
    }

    return data;
  } catch (err) {
    console.error('ensureProfile error:', err);
    return null;
  }
}

export const authService = {
  signInWithPassword,
  signInWithOAuth,
  signUpWithPassword,
  resetPassword,
  updateUserPassword,
  updateUserMetadata,
  getSession,
  refreshSession,
  signOutUser,
  getCurrentUser,
  ensureProfile,
  OAUTH_PROVIDERS,
};

export { OAUTH_PROVIDERS };
