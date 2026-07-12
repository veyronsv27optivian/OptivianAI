-- ============================================================
-- OptivianAI - Organization Management Migration
-- Extended organization fields, branches, activity log, analytics
-- ============================================================

-- 1. Add extended columns to existing organizations table
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

-- 2. Organization Branches (normalized)
CREATE TABLE IF NOT EXISTS organization_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Organization Departments
CREATE TABLE IF NOT EXISTS organization_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES organization_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  head_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Organization Teams
CREATE TABLE IF NOT EXISTS organization_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  lead_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Organization Activity Log
CREATE TABLE IF NOT EXISTS organization_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Organization Monthly Analytics Snapshots
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

-- 7. Extended Profile Fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'freelance', 'temporary'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES organization_teams(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_email_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- 8. Role Permissions Override Table (for custom roles)
CREATE TABLE IF NOT EXISTS role_permission_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  is_custom_role BOOLEAN DEFAULT false,
  custom_role_label TEXT,
  custom_role_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, role_id, resource)
);

-- 9. Permission Templates
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
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

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE organization_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Branches: org members can view
DROP POLICY IF EXISTS "branches_select" ON organization_branches;
CREATE POLICY "branches_select" ON organization_branches FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "branches_insert" ON organization_branches;
CREATE POLICY "branches_insert" ON organization_branches FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "branches_update" ON organization_branches;
CREATE POLICY "branches_update" ON organization_branches FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "branches_delete" ON organization_branches;
CREATE POLICY "branches_delete" ON organization_branches FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- Departments: org members can view
DROP POLICY IF EXISTS "depts_select" ON organization_departments;
CREATE POLICY "depts_select" ON organization_departments FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "depts_insert" ON organization_departments;
CREATE POLICY "depts_insert" ON organization_departments FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "depts_update" ON organization_departments;
CREATE POLICY "depts_update" ON organization_departments FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "depts_delete" ON organization_departments;
CREATE POLICY "depts_delete" ON organization_departments FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- Teams: org members can view
DROP POLICY IF EXISTS "teams_select" ON organization_teams;
CREATE POLICY "teams_select" ON organization_teams FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "teams_insert" ON organization_teams;
CREATE POLICY "teams_insert" ON organization_teams FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "teams_update" ON organization_teams;
CREATE POLICY "teams_update" ON organization_teams FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "teams_delete" ON organization_teams;
CREATE POLICY "teams_delete" ON organization_teams FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- Activity Logs: org members can view
DROP POLICY IF EXISTS "activity_logs_select" ON organization_activity_logs;
CREATE POLICY "activity_logs_select" ON organization_activity_logs FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "activity_logs_insert" ON organization_activity_logs;
CREATE POLICY "activity_logs_insert" ON organization_activity_logs FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);

-- Analytics Snapshots: org members can view
DROP POLICY IF EXISTS "analytics_snapshots_select" ON organization_analytics_snapshots;
CREATE POLICY "analytics_snapshots_select" ON organization_analytics_snapshots FOR SELECT USING (
  organization_id = public.get_user_org_id()
);

-- Role Permission Overrides: org admins manage
DROP POLICY IF EXISTS "role_overrides_select" ON role_permission_overrides;
CREATE POLICY "role_overrides_select" ON role_permission_overrides FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "role_overrides_insert" ON role_permission_overrides;
CREATE POLICY "role_overrides_insert" ON role_permission_overrides FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "role_overrides_update" ON role_permission_overrides;
CREATE POLICY "role_overrides_update" ON role_permission_overrides FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "role_overrides_delete" ON role_permission_overrides;
CREATE POLICY "role_overrides_delete" ON role_permission_overrides FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- Permission Templates: org members can view
DROP POLICY IF EXISTS "perm_templates_select" ON permission_templates;
CREATE POLICY "perm_templates_select" ON permission_templates FOR SELECT USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "perm_templates_insert" ON permission_templates;
CREATE POLICY "perm_templates_insert" ON permission_templates FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "perm_templates_update" ON permission_templates;
CREATE POLICY "perm_templates_update" ON permission_templates FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);
DROP POLICY IF EXISTS "perm_templates_delete" ON permission_templates;
CREATE POLICY "perm_templates_delete" ON permission_templates FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- Update RLS for organizations to allow org members to view
DROP POLICY IF EXISTS "org_member_select" ON organizations;
CREATE POLICY "org_member_select" ON organizations FOR SELECT USING (
  id = public.get_user_org_id() OR auth.uid() = owner_id
);

-- ============================================================
-- FUNCTION: log organization activity
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_org_activity(
  p_organization_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid();
  
  INSERT INTO public.organization_activity_logs (
    organization_id, actor_id, action, resource_type, resource_id, details, severity
  ) VALUES (
    p_organization_id, v_profile_id, p_action, p_resource_type, p_resource_id, p_details, p_severity
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_org_activity TO authenticated;

-- ============================================================
-- FUNCTION: calculate organization health score
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_org_health_score(p_organization_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_staff INTEGER;
  v_active_staff INTEGER;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_overdue_tasks INTEGER;
  v_recent_activity INTEGER;
  v_score NUMERIC;
BEGIN
  -- Staff metrics (30 points max)
  SELECT COUNT(*) INTO v_total_staff FROM public.profiles WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_active_staff FROM public.profiles WHERE organization_id = p_organization_id AND is_active = true AND is_suspended = false;
  
  -- Task metrics (40 points max)
  SELECT COUNT(*) INTO v_total_tasks FROM public.tasks WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_completed_tasks FROM public.tasks WHERE organization_id = p_organization_id AND status IN ('done', 'completed');
  SELECT COUNT(*) INTO v_overdue_tasks FROM public.tasks WHERE organization_id = p_organization_id AND status NOT IN ('done', 'completed') AND due_date < NOW();
  
  -- Activity (30 points max)
  SELECT COUNT(*) INTO v_recent_activity FROM public.organization_activity_logs 
    WHERE organization_id = p_organization_id AND created_at > NOW() - INTERVAL '30 days';
  
  -- Calculate weighted score
  v_score := 0;
  
  -- Staff health: active ratio (15 pts) + total staff (15 pts)
  IF v_total_staff > 0 THEN
    v_score := v_score + LEAST(15, (v_active_staff::NUMERIC / v_total_staff) * 15);
    v_score := v_score + LEAST(15, v_total_staff * 0.5);
  END IF;
  
  -- Task health: completion rate (25 pts) - overdue penalty (15 pts max)
  IF v_total_tasks > 0 THEN
    v_score := v_score + LEAST(25, (v_completed_tasks::NUMERIC / v_total_tasks) * 25);
    v_score := v_score - LEAST(15, (v_overdue_tasks::NUMERIC / GREATEST(v_total_tasks, 1)) * 30);
  ELSE
    v_score := v_score + 10; -- No tasks = neutral
  END IF;
  
  -- Activity health (30 pts)
  v_score := v_score + LEAST(30, v_recent_activity * 0.5);
  
  -- Ensure between 0 and 100
  RETURN GREATEST(0, LEAST(100, ROUND(v_score)));
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_org_health_score TO authenticated;

-- Enable Realtime for new tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'organization_activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organization_activity_logs;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'organization_branches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organization_branches;
  END IF;
END $$;
