import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { authService } from './auth/authService';
import { hasPermission } from './auth/permissions';
import { getRoleInfo } from './auth/roles';
import {
  sendOtp,
  verifyOtp,
  isEmailMfaEnabled,
  toggleEmailMfa,
} from './emailOtpService';

const AuthContext = createContext(null);

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

// ─── Dev mode localStorage helpers ──────────────────────────────
const DEV_KEYS = {
  users: 'optivian_dev_users',
  session: 'optivian_dev_session',
  profiles: 'optivian_dev_profiles',
  organizations: 'optivian_dev_orgs',
};

function getDev(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function saveDev(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getDevSession() {
  try { return JSON.parse(localStorage.getItem(DEV_KEYS.session)); }
  catch { return null; }
}

function saveDevSession(session) {
  if (session) localStorage.setItem(DEV_KEYS.session, JSON.stringify(session));
  else localStorage.removeItem(DEV_KEYS.session);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const listenersRef = useRef(new Set());
  const userRef = useRef(null);
  const profileRef = useRef(null);

  // Safety timeout: force loading to false after 5s to prevent infinite spinner
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Keep refs in sync
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const notifyListeners = useCallback((event, session) => {
    listenersRef.current.forEach(cb => {
      try { cb(event, session); } catch {}
    });
  }, []);

  // ─── Fetch or create profile ──────────────────────────────────
  const syncProfile = useCallback(async (currentUser, provider = 'email') => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      let p = profiles.find(pr => pr.user_id === currentUser.id);
      if (!p) {
        p = {
          id: uid(),
          user_id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          provider: provider,
          role: currentUser.user_metadata?.role || 'staff',
          phone: '',
          designation: '',
          last_login: new Date().toISOString(),
          is_active: true,
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        profiles.push(p);
        saveDev(DEV_KEYS.profiles, profiles);
      } else {
        p.last_login = new Date().toISOString();
        p.provider = provider;
        if (currentUser.user_metadata?.avatar_url) p.avatar_url = currentUser.user_metadata.avatar_url;
        if (currentUser.user_metadata?.name) p.full_name = currentUser.user_metadata.name;
        saveDev(DEV_KEYS.profiles, profiles);
      }
      // Sync role from profile to user metadata
      if (p.role && p.role !== currentUser.user_metadata?.role) {
        setUser(prev => prev ? {
          ...prev,
          user_metadata: { ...prev.user_metadata, role: p.role },
        } : prev);
      }
      setProfile(p);
      return p;
    }

    // Real Supabase mode
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (data) {
      // Update last_login
      await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('user_id', currentUser.id);
      // Sync role from profile to user metadata if different
      if (data.role && data.role !== currentUser.user_metadata?.role) {
        supabase.auth.updateUser({ data: { role: data.role } });
      }
      setProfile(data);
      return data;
    }

    // Auto-create profile
    const fullName = currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email?.split('@')[0] || 'User';

    const newProfile = {
      user_id: currentUser.id,
      email: currentUser.email,
      full_name: fullName,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      provider: provider,
      role: currentUser.user_metadata?.role || 'staff',
      last_login: new Date().toISOString(),
      is_active: true,
    };

    const { data: created } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (created) {
      setProfile(created);
      return created;
    }

    return null;
  }, []);

  // ─── Initialize auth state ────────────────────────────────────
  useEffect(() => {
    if (DEV_MODE) {
      const saved = getDevSession();
      if (saved) {
        setSession(saved);
        setUser(saved.user);
        syncProfile(saved.user, 'email');
      }
      setLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          syncProfile(session.user, session.user.app_metadata?.provider || 'email');
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider || 'email';
          await syncProfile(session.user, provider);

          // Log login history
          try {
            await supabase.rpc('log_login_attempt', {
              p_user_id: session.user.id,
              p_provider: provider,
              p_success: true,
            });
          } catch {}
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }

        if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // ─── Watch for profile changes (realtime) ─────────────────────
  useEffect(() => {
    if (!user?.id || DEV_MODE) return;

    let mountKey = Date.now();
    let channel;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      channel = supabase
        .channel(`profile-changes-${session.user.id}-${mountKey}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new);
              if (payload.new.role && payload.new.role !== userRef.current?.user_metadata?.role) {
                supabase.auth.updateUser({ data: { role: payload.new.role } });
              }
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ─── Profile polling fallback ─────────────────────────────────
  useEffect(() => {
    if (!user?.id || DEV_MODE) return;
    const interval = setInterval(async () => {
      const uid = userRef.current?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();
      if (data) {
        setProfile(data);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // ─── Auth Methods ─────────────────────────────────────────────

  const signUp = useCallback(async ({ email, password, ...metadata }) => {
    if (DEV_MODE) {
      const users = getDev(DEV_KEYS.users);
      if (users.find(u => u.email === email)) {
        return { error: { message: 'An account with this email already exists.' } };
      }

      const id = uid();
      const newUser = {
        id,
        email,
        password,
        user_metadata: { ...metadata, email, role: metadata.role || 'admin' },
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      saveDev(DEV_KEYS.users, users);

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
      await syncProfile(devSession.user, 'email');
      notifyListeners('SIGNED_IN', devSession);
      return { data: { user: devSession.user, session: devSession }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ...metadata } },
    });

    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      await syncProfile(data.session.user, 'email');
      notifyListeners('SIGNED_IN', data.session);
    }

    return { data, error };
  }, [notifyListeners, syncProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    if (DEV_MODE) {
      const users = getDev(DEV_KEYS.users);
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) {
        return { error: { message: 'Invalid email or password.' } };
      }

      const devSession = {
        access_token: `dev_token_${found.id}`,
        refresh_token: `dev_refresh_${found.id}`,
        user: {
          id: found.id,
          email: found.email,
          user_metadata: found.user_metadata,
          aud: 'authenticated',
          role: 'authenticated',
        },
        expires_at: Date.now() + (rememberMe ? 86400000 * 30 : 86400000),
      };

      saveDevSession(devSession);
      setSession(devSession);
      setUser(devSession.user);
      await syncProfile(devSession.user, 'email');
      notifyListeners('SIGNED_IN', devSession);
      return { data: { user: devSession.user, session: devSession }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      await syncProfile(data.session.user, 'email');
      notifyListeners('SIGNED_IN', data.session);
    }

    return { data, error };
  }, [notifyListeners, syncProfile, rememberMe]);

  const signInWithOAuth = useCallback(async (provider) => {
    if (DEV_MODE) {
      return { error: { message: 'OAuth not available in DEV_MODE.' } };
    }

    const { data, error } = await authService.signInWithOAuth(provider);
    if (error) return { error };

    // OAuth redirects the browser — we'll handle the callback via onAuthStateChange
    return { data, error: null };
  }, []);

  const signOut = useCallback(async (scope = 'local') => {
    if (DEV_MODE) {
      saveDevSession(null);
      setSession(null);
      setUser(null);
      setProfile(null);
      notifyListeners('SIGNED_OUT', null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut({ scope });
    if (!error) {
      setProfile(null);
    }
    return { error };
  }, [notifyListeners]);

  const updatePassword = useCallback(async ({ password, metadata }) => {
    if (DEV_MODE) {
      const users = getDev(DEV_KEYS.users);
      const idx = users.findIndex(u => u.id === user?.id);
      if (idx === -1) return { error: { message: 'User not found.' } };

      users[idx].password = password;
      if (metadata) {
        users[idx].user_metadata = { ...users[idx].user_metadata, ...metadata };
      }
      saveDev(DEV_KEYS.users, users);

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
      // Update dev profile
      const profiles = getDev(DEV_KEYS.profiles);
      const pIdx = profiles.findIndex(p => p.user_id === user?.id);
      if (pIdx !== -1) {
        profiles[pIdx].updated_at = new Date().toISOString();
        saveDev(DEV_KEYS.profiles, profiles);
      }
      return { data: { user: users[idx] }, error: null };
    }

    const updates = { password };
    if (metadata) updates.data = metadata;
    const { data, error } = await supabase.auth.updateUser(updates);
    if (!error) {
      // Update profile last_password_change
      await supabase.from('profiles').update({ last_password_change: new Date().toISOString() }).eq('user_id', user?.id);
    }
    return { data, error };
  }, [user, session, notifyListeners]);

  const resetPassword = useCallback(async (email) => {
    if (DEV_MODE) return { error: null };
    return authService.resetPassword(email);
  }, []);

  // ─── Profile update ───────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      const idx = profiles.findIndex(p => p.user_id === user.id);
      if (idx === -1) return { error: { message: 'Profile not found.' } };

      profiles[idx] = { ...profiles[idx], ...updates, updated_at: new Date().toISOString() };
      saveDev(DEV_KEYS.profiles, profiles);
      setProfile(profiles[idx]);

      // Sync role and name to user metadata
      if (updates.role || updates.full_name) {
        const users = getDev(DEV_KEYS.users);
        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
          if (updates.role) users[uIdx].user_metadata = { ...users[uIdx].user_metadata, role: updates.role };
          if (updates.full_name) users[uIdx].user_metadata = { ...users[uIdx].user_metadata, name: updates.full_name };
          saveDev(DEV_KEYS.users, users);
        }
      }
      return { data: profiles[idx], error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      // Sync role to auth metadata
      if (updates.role) {
        supabase.auth.updateUser({ data: { role: updates.role } });
      }
    }

    return { data, error };
  }, [user]);

  // ─── Upload avatar ────────────────────────────────────────────
  const uploadAvatar = useCallback(async (file) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const reader = new FileReader();
      const url = await new Promise((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result);
        reader.readAsDataURL(file);
      });
      const { error } = await updateProfile({ avatar_url: url });
      return { data: { url }, error };
    }

    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl;

      await updateProfile({ avatar_url: url });
      // Also update auth metadata
      await supabase.auth.updateUser({ data: { avatar_url: url } });

      return { data: { url }, error: null };
    } catch (err) {
      return { error: err };
    }
  }, [user, updateProfile]);

  // ─── Organization ─────────────────────────────────────────────
  const createOrganization = useCallback(async (orgData, sessionUser) => {
    let currentUser = sessionUser || user;
    if (!currentUser) {
      if (DEV_MODE) {
        const s = getDevSession();
        currentUser = s?.user ?? null;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user ?? null;
      }
    }
    if (!currentUser) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      const orgs = getDev(DEV_KEYS.organizations);

      const newOrg = {
        id: uid(),
        owner_id: currentUser.id,
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
      saveDev(DEV_KEYS.organizations, orgs);

      const myProfileIdx = profiles.findIndex(p => p.user_id === currentUser.id);
      if (myProfileIdx !== -1) {
        profiles[myProfileIdx].organization_id = newOrg.id;
        profiles[myProfileIdx].role = 'owner';
        profiles[myProfileIdx].updated_at = new Date().toISOString();
        saveDev(DEV_KEYS.profiles, profiles);
        setProfile(profiles[myProfileIdx]);
      }

      return { data: { profile: profiles.find(p => p.user_id === currentUser.id), organization: newOrg }, error: null };
    }

    const { error: orgError } = await supabase.from('organizations').insert({
      owner_id: currentUser.id,
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
    if (orgError) return { error: orgError };

    const { data: orgResult } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    await supabase
      .from('profiles')
      .update({ role: 'owner', organization_id: orgResult?.id, updated_at: new Date().toISOString() })
      .eq('user_id', currentUser.id);

    // Refresh profile
    await syncProfile(currentUser);

    return { error: null };
  }, [user, syncProfile]);

  // ─── Staff Management ─────────────────────────────────────────
  const getStaffMembers = useCallback(async () => {
    if (!user) return [];

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      const myProfile = profiles.find(p => p.user_id === user.id);
      const orgId = myProfile?.organization_id;
      if (!orgId) return [];

      return profiles
        .filter(p => p.organization_id === orgId && p.user_id !== user.id)
        .map(p => ({
          ...p,
          profileId: p.id,
          user_id: p.user_id,
        }));
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!myProfile?.organization_id) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', myProfile.organization_id)
      .neq('user_id', user.id);
    if (error) throw error;
    return data || [];
  }, [user]);

  const createStaffMember = useCallback(async ({ email, password, role }) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const users = getDev(DEV_KEYS.users);
      if (users.find(u => u.email === email)) {
        return { error: { message: 'A user with this email already exists.' } };
      }

      const profiles = getDev(DEV_KEYS.profiles);
      const myProfile = profiles.find(p => p.user_id === user.id);
      const orgId = myProfile?.organization_id;

      const id = uid();
      const newUser = {
        id,
        email,
        password,
        user_metadata: { email, role: role || 'staff', temp_password: true },
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      saveDev(DEV_KEYS.users, users);

      if (orgId) {
        profiles.push({
          id: uid(),
          user_id: id,
          email,
          full_name: email.split('@')[0],
          role: role || 'staff',
          organization_id: orgId,
          provider: 'email',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        saveDev(DEV_KEYS.profiles, profiles);
      }

      return { data: newUser, error: null };
    }

    const currentAccessToken = session?.access_token;
    const currentRefreshToken = session?.refresh_token;

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
          organization_id: organizationId,
        },
      },
    });

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

    if (data?.user && organizationId) {
      await supabase
        .from('profiles')
        .update({ organization_id: organizationId, role: role || 'staff' })
        .eq('user_id', data.user.id);
    }

    return { data, error };
  }, [user, session]);

  const removeStaffMember = useCallback(async (memberId, userId) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const users = getDev(DEV_KEYS.users);
      saveDev(DEV_KEYS.users, users.filter(u => u.id !== memberId));
      const profiles = getDev(DEV_KEYS.profiles);
      saveDev(DEV_KEYS.profiles, profiles.filter(p => p.user_id !== memberId));
      return { error: null };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId);
    if (profileError) return { error: profileError };

    if (userId) {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );
      const result = await res.json();
      if (result.error) return { error: result.error };
    }

    return { error: null };
  }, [user]);

  const updateStaffRole = useCallback(async (memberProfileId, newRole) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      const idx = profiles.findIndex(p => p.id === memberProfileId);
      if (idx === -1) return { error: { message: 'User not found.' } };
      profiles[idx].role = newRole;
      profiles[idx].updated_at = new Date().toISOString();
      saveDev(DEV_KEYS.profiles, profiles);

      if (profiles[idx].user_id === user.id) {
        setProfile(profiles[idx]);
        setUser(prev => prev ? {
          ...prev,
          user_metadata: { ...prev.user_metadata, role: newRole },
        } : prev);
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberProfileId);
    return { error };
  }, [user]);

  const suspendMember = useCallback(async (memberProfileId, suspend = true) => {
    if (!user) return { error: { message: 'Not authenticated.' } };

    if (DEV_MODE) {
      const profiles = getDev(DEV_KEYS.profiles);
      const idx = profiles.findIndex(p => p.id === memberProfileId);
      if (idx === -1) return { error: { message: 'User not found.' } };
      profiles[idx].is_suspended = suspend;
      profiles[idx].is_active = !suspend;
      profiles[idx].suspended_at = suspend ? new Date().toISOString() : null;
      profiles[idx].suspended_by = suspend ? user.id : null;
      profiles[idx].updated_at = new Date().toISOString();
      saveDev(DEV_KEYS.profiles, profiles);
      return { error: null };
    }

    const updates = {
      is_suspended: suspend,
      is_active: !suspend,
      suspended_at: suspend ? new Date().toISOString() : null,
      suspended_by: suspend ? user.id : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', memberProfileId);
    return { error };
  }, [user]);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    await syncProfile(user);
  }, [user, syncProfile]);

  // ─── RBAC Helpers ──────────────────────────────────────────────
  const userRole = profile?.role || user?.user_metadata?.role || 'staff';

  const can = useCallback((resource, action) => {
    return hasPermission(userRole, resource, action);
  }, [userRole]);

  const isAdmin = useCallback(() => {
    const adminRoles = ['super_admin', 'owner', 'administrator', 'director', 'manager'];
    return adminRoles.includes(userRole);
  }, [userRole]);

  // ─── Context value ─────────────────────────────────────────────
  const value = {
    // Auth state
    user,
    session,
    profile,
    loading,
    isDevMode: DEV_MODE,
    rememberMe,
    setRememberMe,

    // Auth methods
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updatePassword,
    resetPassword,

    // Profile
    updateProfile,
    uploadAvatar,
    syncProfile,

    // Organization
    createOrganization,

    // Staff management
    getStaffMembers,
    createStaffMember,
    removeStaffMember,
    updateStaffRole,
    suspendMember,
    refreshUserProfile,

    // Email-based 2FA
    sendOtp,
    verifyOtp,
    isEmailMfaEnabled,
    toggleEmailMfa,

    // RBAC
    userRole,
    can,
    isAdmin,
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
