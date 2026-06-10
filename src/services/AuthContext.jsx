import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

// --- Dev mode localStorage helpers ---
const DEV_KEYS = {
  users: 'optivian_dev_users',
  session: 'optivian_dev_session',
  profiles: 'optivian_dev_profiles',
  organizations: 'optivian_dev_orgs',
};

function getDevUsers() {
  try { return JSON.parse(localStorage.getItem(DEV_KEYS.users) || '[]'); }
  catch { return []; }
}

function saveDevUsers(users) {
  localStorage.setItem(DEV_KEYS.users, JSON.stringify(users));
}

function getDevSession() {
  try { return JSON.parse(localStorage.getItem(DEV_KEYS.session)); }
  catch { return null; }
}

function saveDevSession(session) {
  if (session) localStorage.setItem(DEV_KEYS.session, JSON.stringify(session));
  else localStorage.removeItem(DEV_KEYS.session);
}

function getDevProfiles() {
  try { return JSON.parse(localStorage.getItem(DEV_KEYS.profiles) || '[]'); }
  catch { return []; }
}

function saveDevProfiles(profiles) {
  localStorage.setItem(DEV_KEYS.profiles, JSON.stringify(profiles));
}

function getDevOrgs() {
  try { return JSON.parse(localStorage.getItem(DEV_KEYS.organizations) || '[]'); }
  catch { return []; }
}

function saveDevOrgs(orgs) {
  localStorage.setItem(DEV_KEYS.organizations, JSON.stringify(orgs));
}

// Generate a simple unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const listenersRef = useRef(new Set());

  // Notify all listeners of auth state changes
  const notifyListeners = useCallback((event, session) => {
    listenersRef.current.forEach(cb => {
      try { cb(event, session); } catch {}
    });
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (DEV_MODE) {
      // Dev mode: restore session from localStorage
      const saved = getDevSession();
      if (saved) {
        setSession(saved);
        setUser(saved.user);
      }
      setLoading(false);
    } else {
      // Real Supabase: check existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signUp = useCallback(async ({ email, password, ...metadata }) => {
    if (DEV_MODE) {
      const users = getDevUsers();
      if (users.find(u => u.email === email)) {
        return { error: { message: 'An account with this email already exists.' } };
      }

      const id = uid();
      const newUser = {
        id,
        email,
        password, // stored hashed-like for dev only
        user_metadata: { ...metadata, email, role: metadata.role || 'admin' },
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      saveDevUsers(users);

      const devSession = {
        access_token: `dev_token_${id}`,
        refresh_token: `dev_refresh_${id}`,
        user: {
          id,
          email: newUser.email,
          user_metadata: newUser.user_metadata,
          aud: 'authenticated',
          role: 'authenticated',
        },
        expires_at: Date.now() + 86400000,
      };

      saveDevSession(devSession);
      setSession(devSession);
      setUser(devSession.user);
      notifyListeners('SIGNED_IN', devSession);
      return { data: { user: devSession.user, session: devSession }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ...metadata } },
    });

    // If Supabase returns a session (email verification is off), update local state immediately
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      notifyListeners('SIGNED_IN', data.session);
    }

    return { data, error };
  }, [notifyListeners]);

  const signIn = useCallback(async ({ email, password }) => {
    if (DEV_MODE) {
      const users = getDevUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return { error: { message: 'Invalid email or password.' } };
      }

      const devSession = {
        access_token: `dev_token_${user.id}`,
        refresh_token: `dev_refresh_${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          aud: 'authenticated',
          role: 'authenticated',
        },
        expires_at: Date.now() + 86400000,
      };

      saveDevSession(devSession);
      setSession(devSession);
      setUser(devSession.user);
      notifyListeners('SIGNED_IN', devSession);
      return { data: { user: devSession.user, session: devSession }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Update local state on successful sign in
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      notifyListeners('SIGNED_IN', data.session);
    }

    return { data, error };
  }, [notifyListeners]);

  const signOut = useCallback(async () => {
    if (DEV_MODE) {
      saveDevSession(null);
      setSession(null);
      setUser(null);
      notifyListeners('SIGNED_OUT', null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  }, [notifyListeners]);

  const updatePassword = useCallback(async ({ password, metadata }) => {
    if (DEV_MODE) {
      const users = getDevUsers();
      const idx = users.findIndex(u => u.id === user?.id);
      if (idx === -1) return { error: { message: 'User not found.' } };

      users[idx].password = password;
      if (metadata) {
        users[idx].user_metadata = { ...users[idx].user_metadata, ...metadata };
      }
      saveDevUsers(users);

      // Update session with new metadata
      if (session) {
        const updatedSession = {
          ...session,
          user: {
            ...session.user,
            user_metadata: users[idx].user_metadata,
          },
        };
        saveDevSession(updatedSession);
        setSession(updatedSession);
        setUser(updatedSession.user);
      }
      return { data: { user: users[idx] }, error: null };
    }

    const updates = { password };
    if (metadata) updates.data = metadata;
    const { data, error } = await supabase.auth.updateUser(updates);
    return { data, error };
  }, [user, session, notifyListeners]);

  // Dev profile/org storage helpers (for Create Org flow)
  const createOrganization = useCallback(async (orgData) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const profiles = getDevProfiles();
      const orgs = getDevOrgs();

      const newProfile = {
        id: uid(),
        user_id: user.id,
        email: user.email,
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      profiles.push(newProfile);
      saveDevProfiles(profiles);

      const newOrg = {
        id: uid(),
        owner_id: user.id,
        name: orgData.name,
        type: orgData.type,
        explanation: orgData.explanation,
        website: orgData.website,
        socials: {
          instagram: orgData.instagram,
          twitter: orgData.twitter,
          telegram: orgData.telegram,
        },
        created_at: new Date().toISOString(),
      };
      orgs.push(newOrg);
      saveDevOrgs(orgs);

      return { data: { profile: newProfile, organization: newOrg }, error: null };
    }

    // Real Supabase mode
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: user.id,
      email: user.email,
      role: 'admin',
    });
    if (profileError) return { error: profileError };

    const { error: orgError } = await supabase.from('organizations').insert({
      owner_id: user.id,
      name: orgData.name,
      type: orgData.type,
      explanation: orgData.explanation,
      website: orgData.website,
      socials: {
        instagram: orgData.instagram,
        twitter: orgData.twitter,
        telegram: orgData.telegram,
      },
    });
    return { error: orgError };
  }, [user]);

  // ─── Staff Management (Dev Mode) ───────────────────────────────
  const getStaffMembers = useCallback(async () => {
    if (!user) return [];

    if (DEV_MODE) {
      const allUsers = getDevUsers();
      return allUsers
        .filter(u => u.id !== user.id)
        .map(u => ({
          id: u.id,
          email: u.email,
          role: u.user_metadata?.role || 'staff',
          isTempPassword: u.user_metadata?.temp_password === true,
          createdAt: u.created_at,
        }));
    }

    // Real Supabase: query profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id);
    if (error) throw error;
    return data || [];
  }, [user]);

  const createStaffMember = useCallback(async ({ email, password, role }) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const users = getDevUsers();
      if (users.find(u => u.email === email)) {
        return { error: { message: 'A user with this email already exists.' } };
      }

      const id = uid();
      const newUser = {
        id,
        email,
        password,
        user_metadata: { email, role: role || 'staff', temp_password: true },
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      saveDevUsers(users);
      return { data: newUser, error: null };
    }

    // Real Supabase: create auth user + profile
    // Save admin session first because supabase.auth.signUp may trigger
    // onAuthStateChange and overwrite the admin's session!
    const currentAccessToken = session?.access_token;
    const currentRefreshToken = session?.refresh_token;

    // Fetch the admin's organization_id
    let organizationId = null;
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();
      
    if (myProfile?.organization_id) {
      organizationId = myProfile.organization_id;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          role: role || 'staff', 
          temp_password: true,
          organization_id: organizationId
        },
      },
    });

    // Restore admin's session (signUp may have triggered an auth state change
    // that logged the admin out and into the new user's session)
    if (currentAccessToken && currentRefreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: currentAccessToken,
          refresh_token: currentRefreshToken,
        });
      } catch (e) {
        console.error('Failed to restore admin session after staff creation:', e);
      }
    }

    // Try to update the profile directly just in case the trigger didn't pick up the organization_id
    if (data?.user && organizationId) {
      await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('user_id', data.user.id);
    }

    return { data, error };
  }, [user]);

  const removeStaffMember = useCallback(async (memberId) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const users = getDevUsers();
      const filtered = users.filter(u => u.id !== memberId);
      saveDevUsers(filtered);
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId);
    return { error };
  }, [user]);

  const updateStaffRole = useCallback(async (memberId, newRole) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const users = getDevUsers();
      const idx = users.findIndex(u => u.id === memberId);
      if (idx === -1) return { error: { message: 'User not found.' } };
      users[idx].user_metadata = { ...users[idx].user_metadata, role: newRole };
      saveDevUsers(users);
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId);
    return { error };
  }, [user]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    createOrganization,
    getStaffMembers,
    createStaffMember,
    removeStaffMember,
    updateStaffRole,
    isDevMode: DEV_MODE,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
