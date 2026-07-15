-- ================================================================
-- OPTIVIANAI — PRODUCTION DATABASE MIGRATION
-- ================================================================
-- Run this entire script in your Supabase SQL Editor once.
-- It is safe to run multiple times (all statements use IF NOT EXISTS).
--
-- Migration order:
--   1. Base schema (tables, indexes, RLS, triggers)
--   2. Auth & RBAC extensions
--   3. MFA / Email OTP
--   4. Organization management
--   5. AI infrastructure
-- ================================================================

-- ═════════════════════════════════════════════════════════════════
-- PHASE 1 — BASE SCHEMA
-- ═════════════════════════════════════════════════════════════════

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  explanation TEXT,
  website TEXT,
  socials JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_temp_password BOOLEAN DEFAULT false,
  avatar_url TEXT,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STAFF CREDENTIALS (admin-created temp login tokens)
CREATE TABLE IF NOT EXISTS staff_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  is_used BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- 4. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'done', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drop legacy single-assignee column and add JSONB columns for multi-assignee
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks DROP COLUMN assigned_to;
  END IF;
END $$;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_tos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_statuses JSONB DEFAULT '{}'::jsonb;

-- 5. CONVERSATIONS (chat groups / DMs)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_user_ids UUID[] DEFAULT '{}';

-- 8. AI ANALYSES
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  model_used TEXT,
  score NUMERIC,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. STORAGE BUCKET for chat file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_files', 'chat_files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_files_insert" ON storage.objects;
CREATE POLICY "chat_files_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat_files' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "chat_files_select" ON storage.objects;
CREATE POLICY "chat_files_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat_files' AND auth.role() = 'authenticated'
);

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_org ON ai_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_org ON staff_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_email ON staff_credentials(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 12. ENABLE REALTIME
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  END IF;
END $$;

-- 13. ROW LEVEL SECURITY
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- 14. RPC: create_conversation_rpc (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_conversation_rpc(
  p_name TEXT,
  p_is_group BOOLEAN,
  p_participant_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_profile_id UUID;
  v_conv_id UUID;
  v_result JSON;
BEGIN
  SELECT organization_id, id INTO v_org_id, v_profile_id
  FROM public.profiles WHERE user_id = auth.uid();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for this user';
  END IF;

  INSERT INTO public.conversations (organization_id, name, is_group, created_by)
  VALUES (v_org_id, p_name, p_is_group, v_profile_id)
  RETURNING id INTO v_conv_id;

  INSERT INTO public.conversation_participants (conversation_id, profile_id)
  SELECT v_conv_id, unnest(p_participant_ids);

  SELECT json_build_object(
    'id', v_conv_id,
    'organization_id', v_org_id,
    'name', p_name,
    'is_group', p_is_group,
    'created_by', v_profile_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conversation_rpc TO authenticated;

-- 15. Helper functions (SECURITY DEFINER — avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- 16. RLS POLICIES — ORGANIZATIONS
DROP POLICY IF EXISTS "org_owner_select" ON organizations;
CREATE POLICY "org_owner_select" ON organizations FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_insert" ON organizations;
CREATE POLICY "org_owner_insert" ON organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_update" ON organizations;
CREATE POLICY "org_owner_update" ON organizations FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_delete" ON organizations;
CREATE POLICY "org_owner_delete" ON organizations FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_member_select" ON organizations;
CREATE POLICY "org_member_select" ON organizations FOR SELECT USING (
  id = public.get_user_org_id() OR auth.uid() = owner_id
);

-- 17. RLS POLICIES — PROFILES
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  organization_id = public.get_user_org_id() OR user_id = auth.uid()
);
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = user_id OR auth.uid() IN (SELECT owner_id FROM organizations)
);
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR
  (organization_id = public.get_user_org_id() AND public.get_user_role() IN ('admin', 'manager'))
);
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR
  (organization_id = public.get_user_org_id() AND public.get_user_role() IN ('admin', 'manager'))
);

-- 18. RLS POLICIES — STAFF CREDENTIALS
DROP POLICY IF EXISTS "staff_creds_select" ON staff_credentials;
CREATE POLICY "staff_creds_select" ON staff_credentials FOR SELECT USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_creds_insert" ON staff_credentials;
CREATE POLICY "staff_creds_insert" ON staff_credentials FOR INSERT WITH CHECK (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_creds_delete" ON staff_credentials;
CREATE POLICY "staff_creds_delete" ON staff_credentials FOR DELETE USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);

-- 19. RLS POLICIES — TASKS
DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- 20. RLS POLICIES — CONVERSATIONS
CREATE OR REPLACE FUNCTION public.is_conv_participant(conv_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND profile_id = public.get_user_profile_id()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_conv_participant TO authenticated, anon;

DROP POLICY IF EXISTS "conv_select" ON conversations;
CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE profile_id = public.get_user_profile_id())
);
DROP POLICY IF EXISTS "conv_insert" ON conversations;
CREATE POLICY "conv_insert" ON conversations FOR INSERT WITH CHECK (
  organization_id IS NOT NULL AND organization_id = public.get_user_org_id()
);

-- 21. RLS POLICIES — CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "conv_participants_select" ON conversation_participants;
CREATE POLICY "conv_participants_select" ON conversation_participants FOR SELECT USING (
  profile_id = public.get_user_profile_id() OR public.is_conv_participant(conversation_id)
);
DROP POLICY IF EXISTS "conv_participants_insert" ON conversation_participants;
CREATE POLICY "conv_participants_insert" ON conversation_participants FOR INSERT WITH CHECK (
  profile_id = public.get_user_profile_id() OR
  conversation_id IN (SELECT id FROM conversations WHERE created_by = public.get_user_profile_id())
);

-- 22. RLS POLICIES — MESSAGES
DROP POLICY IF EXISTS "msg_select" ON messages;
CREATE POLICY "msg_select" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.profile_id WHERE p.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "msg_insert" ON messages;
CREATE POLICY "msg_insert" ON messages FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT cp.conversation_id FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.profile_id WHERE p.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "msg_update" ON messages;
CREATE POLICY "msg_update" ON messages FOR UPDATE USING (
  sender_id = public.get_user_profile_id()
);
DROP POLICY IF EXISTS "msg_delete" ON messages;
CREATE POLICY "msg_delete" ON messages FOR DELETE USING (
  sender_id = public.get_user_profile_id()
);

-- 23. RLS POLICIES — NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (user_id = auth.uid());

-- 24. RLS POLICIES — AI ANALYSES
DROP POLICY IF EXISTS "ai_select" ON ai_analyses;
CREATE POLICY "ai_select" ON ai_analyses FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "ai_insert" ON ai_analyses;
CREATE POLICY "ai_insert" ON ai_analyses FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);

-- 25. TRIGGER: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, is_temp_password, organization_id)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE((NEW.raw_user_meta_data->>'temp_password')::boolean, false),
    (NEW.raw_user_meta_data->>'organization_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═════════════════════════════════════════════════════════════════
-- PHASE 2 — AUTH & RBAC EXTENSIONS
-- ═════════════════════════════════════════════════════════════════

-- Profile extensions
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

-- Drop old role CHECK and expand role options
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'super_admin', 'owner', 'administrator', 'admin', 'director', 'executive',
    'manager', 'assistant_manager', 'team_lead',
    'hr', 'finance', 'marketing', 'sales', 'operations',
    'developer', 'designer', 'qa', 'support',
    'staff', 'intern', 'client', 'guest', 'viewer'
  ));

-- USER SESSIONS
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

-- LOGIN HISTORY
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

-- ROLE PERMISSIONS
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

-- Avatar storage bucket
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

-- Upgrade the handle_new_user trigger (replaces Phase 1 version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
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
  ) VALUES (
    NEW.id, NEW.email, v_full_name, v_avatar_url, v_provider,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auth indexes
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

-- Auth RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_select" ON user_sessions;
CREATE POLICY "user_sessions_select" ON user_sessions FOR SELECT USING (
  user_id = auth.uid() OR
  profile_id IN (SELECT id FROM profiles WHERE organization_id = public.get_user_org_id() AND role IN ('super_admin', 'owner', 'administrator'))
);
DROP POLICY IF EXISTS "user_sessions_delete" ON user_sessions;
CREATE POLICY "user_sessions_delete" ON user_sessions FOR DELETE USING (
  user_id = auth.uid() OR
  profile_id IN (SELECT id FROM profiles WHERE organization_id = public.get_user_org_id() AND role IN ('super_admin', 'owner', 'administrator'))
);

DROP POLICY IF EXISTS "login_history_select" ON login_history;
CREATE POLICY "login_history_select" ON login_history FOR SELECT USING (
  user_id = auth.uid() OR
  user_id IN (SELECT user_id FROM profiles WHERE organization_id = public.get_user_org_id() AND role IN ('super_admin', 'owner', 'administrator', 'manager'))
);
DROP POLICY IF EXISTS "login_history_insert" ON login_history;
CREATE POLICY "login_history_insert" ON login_history FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "role_permissions_select" ON role_permissions;
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT USING (
  organization_id = public.get_user_org_id() OR organization_id IS NULL
);
DROP POLICY IF EXISTS "role_permissions_insert" ON role_permissions;
CREATE POLICY "role_permissions_insert" ON role_permissions FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id() AND public.get_user_role() IN ('super_admin', 'owner', 'administrator')
);
DROP POLICY IF EXISTS "role_permissions_update" ON role_permissions;
CREATE POLICY "role_permissions_update" ON role_permissions FOR UPDATE USING (
  organization_id = public.get_user_org_id() AND public.get_user_role() IN ('super_admin', 'owner', 'administrator')
);

-- Auth Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'login_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE login_history;
  END IF;
END $$;

-- Helper: log login attempt
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_user_id UUID, p_provider TEXT DEFAULT 'email', p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.login_history (user_id, provider, success, failure_reason, ip_address, user_agent)
  VALUES (p_user_id, p_provider, p_success, p_failure_reason, p_ip_address, p_user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated, anon;

-- Helper: cleanup old login history
CREATE OR REPLACE FUNCTION public.cleanup_login_history()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.login_history WHERE created_at < now() - interval '90 days';
END;
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_login_history TO authenticated;


-- ═════════════════════════════════════════════════════════════════
-- PHASE 3 — MFA / EMAIL OTP
-- ═════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_email_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS mfa_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT DEFAULT 0,
  max_attempts SMALLINT DEFAULT 3,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mfa_otps_user ON mfa_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_otps_expires ON mfa_otps(expires_at);

ALTER TABLE mfa_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mfa_otps_insert" ON mfa_otps;
CREATE POLICY "mfa_otps_insert" ON mfa_otps FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "mfa_otps_select" ON mfa_otps;
CREATE POLICY "mfa_otps_select" ON mfa_otps FOR SELECT USING (user_id = auth.uid() AND expires_at > now());
DROP POLICY IF EXISTS "mfa_otps_update" ON mfa_otps;
CREATE POLICY "mfa_otps_update" ON mfa_otps FOR UPDATE USING (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════
-- PHASE 4 — ORGANIZATION MANAGEMENT
-- ═════════════════════════════════════════════════════════════════

-- Extended organization columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branches JSONB DEFAULT '[]'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Branches
CREATE TABLE IF NOT EXISTS organization_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT, city TEXT, state TEXT, country TEXT, phone TEXT, email TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Departments
CREATE TABLE IF NOT EXISTS organization_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES organization_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL, description TEXT,
  head_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS organization_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL, description TEXT,
  lead_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS organization_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  ip_address TEXT, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS organization_analytics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  staff_count INTEGER DEFAULT 0,
  active_staff_count INTEGER DEFAULT 0,
  new_staff_count INTEGER DEFAULT 0,
  departed_staff_count INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  completed_task_count INTEGER DEFAULT 0,
  overdue_task_count INTEGER DEFAULT 0,
  department_count INTEGER DEFAULT 0,
  ai_request_count INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  activity_count INTEGER DEFAULT 0,
  health_score NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, month)
);

-- Extra profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'freelance', 'temporary'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES organization_teams(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS attendance_summary JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- Role permission overrides
CREATE TABLE IF NOT EXISTS role_permission_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role_id TEXT NOT NULL, resource TEXT NOT NULL, actions TEXT[] DEFAULT '{}',
  is_custom_role BOOLEAN DEFAULT false,
  custom_role_label TEXT, custom_role_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, role_id, resource)
);

-- Permission templates
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Org management indexes
CREATE INDEX IF NOT EXISTS idx_org_branches_org ON organization_branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_depts_org ON organization_departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_depts_branch ON organization_departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_org_depts_parent ON organization_departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_org ON organization_teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_dept ON organization_teams(department_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_org ON organization_activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_created ON organization_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_org_analytics_org ON organization_analytics_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_overrides_org ON role_permission_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_perm_templates_org ON permission_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);

-- Org management RLS
ALTER TABLE organization_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Branches policies
DROP POLICY IF EXISTS "branches_select" ON organization_branches;
CREATE POLICY "branches_select" ON organization_branches FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "branches_insert" ON organization_branches;
CREATE POLICY "branches_insert" ON organization_branches FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "branches_update" ON organization_branches;
CREATE POLICY "branches_update" ON organization_branches FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "branches_delete" ON organization_branches;
CREATE POLICY "branches_delete" ON organization_branches FOR DELETE USING (organization_id = public.get_user_org_id());

-- Departments policies
DROP POLICY IF EXISTS "depts_select" ON organization_departments;
CREATE POLICY "depts_select" ON organization_departments FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "depts_insert" ON organization_departments;
CREATE POLICY "depts_insert" ON organization_departments FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "depts_update" ON organization_departments;
CREATE POLICY "depts_update" ON organization_departments FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "depts_delete" ON organization_departments;
CREATE POLICY "depts_delete" ON organization_departments FOR DELETE USING (organization_id = public.get_user_org_id());

-- Teams policies
DROP POLICY IF EXISTS "teams_select" ON organization_teams;
CREATE POLICY "teams_select" ON organization_teams FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "teams_insert" ON organization_teams;
CREATE POLICY "teams_insert" ON organization_teams FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "teams_update" ON organization_teams;
CREATE POLICY "teams_update" ON organization_teams FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "teams_delete" ON organization_teams;
CREATE POLICY "teams_delete" ON organization_teams FOR DELETE USING (organization_id = public.get_user_org_id());

-- Activity logs policies
DROP POLICY IF EXISTS "activity_logs_select" ON organization_activity_logs;
CREATE POLICY "activity_logs_select" ON organization_activity_logs FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "activity_logs_insert" ON organization_activity_logs;
CREATE POLICY "activity_logs_insert" ON organization_activity_logs FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- Analytics snapshots policies
DROP POLICY IF EXISTS "analytics_snapshots_select" ON organization_analytics_snapshots;
CREATE POLICY "analytics_snapshots_select" ON organization_analytics_snapshots FOR SELECT USING (organization_id = public.get_user_org_id());

-- Role overrides policies
DROP POLICY IF EXISTS "role_overrides_select" ON role_permission_overrides;
CREATE POLICY "role_overrides_select" ON role_permission_overrides FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "role_overrides_insert" ON role_permission_overrides;
CREATE POLICY "role_overrides_insert" ON role_permission_overrides FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "role_overrides_update" ON role_permission_overrides;
CREATE POLICY "role_overrides_update" ON role_permission_overrides FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "role_overrides_delete" ON role_permission_overrides;
CREATE POLICY "role_overrides_delete" ON role_permission_overrides FOR DELETE USING (organization_id = public.get_user_org_id());

-- Permission templates policies
DROP POLICY IF EXISTS "perm_templates_select" ON permission_templates;
CREATE POLICY "perm_templates_select" ON permission_templates FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "perm_templates_insert" ON permission_templates;
CREATE POLICY "perm_templates_insert" ON permission_templates FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "perm_templates_update" ON permission_templates;
CREATE POLICY "perm_templates_update" ON permission_templates FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "perm_templates_delete" ON permission_templates;
CREATE POLICY "perm_templates_delete" ON permission_templates FOR DELETE USING (organization_id = public.get_user_org_id());

-- Org management Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'organization_activity_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organization_activity_logs;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'organization_branches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organization_branches;
  END IF;
END $$;

-- Helper: log org activity
CREATE OR REPLACE FUNCTION public.log_org_activity(
  p_organization_id UUID, p_action TEXT, p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL, p_details JSONB DEFAULT '{}'::jsonb, p_severity TEXT DEFAULT 'info'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID; v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();
  INSERT INTO public.organization_activity_logs (organization_id, actor_id, action, resource_type, resource_id, details, severity)
  VALUES (p_organization_id, v_profile_id, p_action, p_resource_type, p_resource_id, p_details, p_severity)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_org_activity TO authenticated;

-- Helper: calculate org health score
CREATE OR REPLACE FUNCTION public.calculate_org_health_score(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_staff INTEGER; v_active_staff INTEGER;
  v_total_tasks INTEGER; v_completed_tasks INTEGER; v_overdue_tasks INTEGER;
  v_recent_activity INTEGER; v_score NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_staff FROM public.profiles WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_active_staff FROM public.profiles WHERE organization_id = p_organization_id AND is_active = true AND is_suspended = false;
  SELECT COUNT(*) INTO v_total_tasks FROM public.tasks WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_completed_tasks FROM public.tasks WHERE organization_id = p_organization_id AND status IN ('done', 'completed');
  SELECT COUNT(*) INTO v_overdue_tasks FROM public.tasks WHERE organization_id = p_organization_id AND status NOT IN ('done', 'completed') AND due_date < NOW();
  SELECT COUNT(*) INTO v_recent_activity FROM public.organization_activity_logs WHERE organization_id = p_organization_id AND created_at > NOW() - INTERVAL '30 days';

  v_score := 0;
  IF v_total_staff > 0 THEN
    v_score := v_score + LEAST(15, (v_active_staff::NUMERIC / v_total_staff) * 15);
    v_score := v_score + LEAST(15, v_total_staff * 0.5);
  END IF;
  IF v_total_tasks > 0 THEN
    v_score := v_score + LEAST(25, (v_completed_tasks::NUMERIC / v_total_tasks) * 25);
    v_score := v_score - LEAST(15, (v_overdue_tasks::NUMERIC / GREATEST(v_total_tasks, 1)) * 30);
  ELSE
    v_score := v_score + 10;
  END IF;
  v_score := v_score + LEAST(30, v_recent_activity * 0.5);
  RETURN GREATEST(0, LEAST(100, ROUND(v_score)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.calculate_org_health_score TO authenticated;


-- ═════════════════════════════════════════════════════════════════
-- PHASE 5 — AI INFRASTRUCTURE
-- ═════════════════════════════════════════════════════════════════

-- Conversation memory
CREATE TABLE IF NOT EXISTS conversation_memory (
  session_id      TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  system_prompt   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_memory_org ON conversation_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_conv_memory_profile ON conversation_memory(profile_id);
CREATE INDEX IF NOT EXISTS idx_conv_memory_updated ON conversation_memory(updated_at DESC);

-- AI request logs
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  latency         BIGINT NOT NULL DEFAULT 0,
  success         BOOLEAN NOT NULL DEFAULT true,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID,
  feature         TEXT,
  token_usage     JSONB DEFAULT '{}'::jsonb,
  error_code      TEXT,
  error_message   TEXT,
  request_id      TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_org ON ai_request_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_request_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_request_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_request_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON ai_request_logs(success);

-- Additional AI analyses indexes
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_by ON ai_analyses(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_org_type_created ON ai_analyses(organization_id, type, created_at DESC);

-- AI Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_memory') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_memory;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ai_request_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_request_logs;
  END IF;
END $$;

-- AI RLS
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_memory_select" ON conversation_memory;
CREATE POLICY "conv_memory_select" ON conversation_memory FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "conv_memory_insert" ON conversation_memory;
CREATE POLICY "conv_memory_insert" ON conversation_memory FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "conv_memory_update" ON conversation_memory;
CREATE POLICY "conv_memory_update" ON conversation_memory FOR UPDATE USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "conv_memory_delete" ON conversation_memory;
CREATE POLICY "conv_memory_delete" ON conversation_memory FOR DELETE USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "ai_logs_select" ON ai_request_logs;
CREATE POLICY "ai_logs_select" ON ai_request_logs FOR SELECT USING (organization_id = public.get_user_org_id());
DROP POLICY IF EXISTS "ai_logs_insert" ON ai_request_logs;
CREATE POLICY "ai_logs_insert" ON ai_request_logs FOR INSERT WITH CHECK (organization_id = public.get_user_org_id() OR organization_id IS NULL);

-- Helper: cleanup old AI logs
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_request_logs WHERE timestamp < now() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_old_ai_logs TO authenticated;


-- ═════════════════════════════════════════════════════════════════
-- DONE — All migrations applied successfully
-- ═════════════════════════════════════════════════════════════════
-- Next steps:
--   1. Go to your Supabase Dashboard → SQL Editor
--   2. Paste and run this entire script
--   3. Deploy edge functions: see supabase/functions/README.md
-- ═════════════════════════════════════════════════════════════════
