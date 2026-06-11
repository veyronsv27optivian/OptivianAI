-- ============================================================
-- OptivianAI - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

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

-- Drop legacy single-assignee column and add JSONB columns for multi-assignee support
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks DROP COLUMN assigned_to;
  END IF;
END $$;

-- Add JSONB columns for storing assignees directly on the task (no junction table needed)
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

-- 10. (reserved for future use)

-- ============================================================
-- INDEXES
-- ============================================================

-- Enable Realtime for profiles so role changes reflect instantly
-- Safe to run multiple times – checks if the table is already enrolled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
-- idx_tasks_assigned was dropped along with the legacy assigned_to column
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_org ON ai_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_org ON staff_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_email ON staff_credentials(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: owner has full access
DROP POLICY IF EXISTS "org_owner_select" ON organizations;
CREATE POLICY "org_owner_select" ON organizations FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_insert" ON organizations;
CREATE POLICY "org_owner_insert" ON organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_update" ON organizations;
CREATE POLICY "org_owner_update" ON organizations FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "org_owner_delete" ON organizations;
CREATE POLICY "org_owner_delete" ON organizations FOR DELETE USING (auth.uid() = owner_id);

-- Helpers: security definer functions to get current user's org/role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- PROFILES: users can view profiles in their org, edit own. Admins/managers can manage org profiles.
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  organization_id = public.get_user_org_id() OR user_id = auth.uid()
);

-- Allow org owners or admins to insert/update/delete profiles
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT owner_id FROM organizations)
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

-- STAFF CREDENTIALS: only org owner
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

-- TASKS: org members
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

-- CONVERSATIONS: participants
DROP POLICY IF EXISTS "conv_select" ON conversations;
CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE profile_id = public.get_user_profile_id())
);
DROP POLICY IF EXISTS "conv_insert" ON conversations;
CREATE POLICY "conv_insert" ON conversations FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);

-- MESSAGES: participants of the conversation
DROP POLICY IF EXISTS "msg_select" ON messages;
CREATE POLICY "msg_select" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.profile_id
    WHERE p.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "msg_insert" ON messages;
CREATE POLICY "msg_insert" ON messages FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT cp.conversation_id FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- NOTIFICATIONS: users see only their own
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (
  true  -- any authenticated user can create notifications
);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (
  user_id = auth.uid()
);

-- AI ANALYSES: org members
DROP POLICY IF EXISTS "ai_select" ON ai_analyses;
CREATE POLICY "ai_select" ON ai_analyses FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "ai_insert" ON ai_analyses;
CREATE POLICY "ai_insert" ON ai_analyses FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, is_temp_password, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
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
