-- ============================================================
-- OptivianAI - Auth & RBAC Migration
-- Run this AFTER schema.sql to upgrade the auth system
-- ============================================================

-- ============================================================
-- 1. PROFILE EXTENSIONS
-- ============================================================

-- Add new columns to profiles (safe to run multiple times)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

-- Drop the old role CHECK constraint since we now support many roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'super_admin', 'owner', 'administrator', 'admin', 'director', 'executive',
    'manager', 'assistant_manager', 'team_lead',
    'hr', 'finance', 'marketing', 'sales', 'operations',
    'developer', 'designer', 'qa', 'support',
    'staff', 'intern', 'client', 'guest', 'viewer'
  ));

-- ============================================================
-- 2. USER SESSIONS (for "active sessions" & "logout everywhere")
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- 3. LOGIN HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email',
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ROLE PERMISSIONS (for custom roles & future admin edits)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  actions TEXT[] NOT NULL DEFAULT '{}',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, resource, organization_id)
);

-- ============================================================
-- 5. STORAGE BUCKET for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- ============================================================
-- 6. UPDATE TRIGGER: auto-create profile on signup (expanded)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Detect OAuth provider from raw_app_meta_data
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider',
    'email'
  );

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.profiles (
    user_id, email, full_name, avatar_url, provider, role,
    is_temp_password, organization_id, last_login
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    v_provider,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false),
    (NEW.raw_user_meta_data->>'organization_id')::uuid,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    provider = CASE WHEN profiles.provider = 'email' THEN EXCLUDED.provider ELSE profiles.provider END,
    last_login = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger (safe to run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(provider);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_org ON role_permissions(organization_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- User sessions: users see their own, admins see org sessions
DROP POLICY IF EXISTS "user_sessions_select" ON user_sessions;
CREATE POLICY "user_sessions_select" ON user_sessions FOR SELECT USING (
  user_id = auth.uid() OR
  profile_id IN (
    SELECT id FROM profiles
    WHERE organization_id = public.get_user_org_id()
    AND role IN ('super_admin', 'owner', 'administrator')
  )
);

DROP POLICY IF EXISTS "user_sessions_delete" ON user_sessions;
CREATE POLICY "user_sessions_delete" ON user_sessions FOR DELETE USING (
  user_id = auth.uid() OR
  profile_id IN (
    SELECT id FROM profiles
    WHERE organization_id = public.get_user_org_id()
    AND role IN ('super_admin', 'owner', 'administrator')
  )
);

-- Login history: users see their own, admins see org
DROP POLICY IF EXISTS "login_history_select" ON login_history;
CREATE POLICY "login_history_select" ON login_history FOR SELECT USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT user_id FROM profiles
    WHERE organization_id = public.get_user_org_id()
    AND role IN ('super_admin', 'owner', 'administrator', 'manager')
  )
);

DROP POLICY IF EXISTS "login_history_insert" ON login_history;
CREATE POLICY "login_history_insert" ON login_history FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Role permissions: org members can view, admins manage
DROP POLICY IF EXISTS "role_permissions_select" ON role_permissions;
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT USING (
  organization_id = public.get_user_org_id() OR organization_id IS NULL
);

DROP POLICY IF EXISTS "role_permissions_insert" ON role_permissions;
CREATE POLICY "role_permissions_insert" ON role_permissions FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id() AND
  public.get_user_role() IN ('super_admin', 'owner', 'administrator')
);

DROP POLICY IF EXISTS "role_permissions_update" ON role_permissions;
CREATE POLICY "role_permissions_update" ON role_permissions FOR UPDATE USING (
  organization_id = public.get_user_org_id() AND
  public.get_user_role() IN ('super_admin', 'owner', 'administrator')
);

-- ============================================================
-- 9. REALTIME PUBLICATION
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'user_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'login_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE login_history;
  END IF;
END $$;

-- ============================================================
-- 10. HELPER FUNCTION: Log login attempt
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_user_id UUID,
  p_provider TEXT DEFAULT 'email',
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.login_history (user_id, provider, success, failure_reason, ip_address, user_agent)
  VALUES (p_user_id, p_provider, p_success, p_failure_reason, p_ip_address, p_user_agent)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated, anon;

-- ============================================================
-- 11. HELPER FUNCTION: Cleanup old login history (keep last 90 days)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.login_history WHERE created_at < now() - interval '90 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_login_history TO authenticated;
