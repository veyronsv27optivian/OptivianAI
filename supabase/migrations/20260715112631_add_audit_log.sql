-- ============================================================
-- OptivianAI - Audit Log Table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

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
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
  v_id UUID;
BEGIN
  SELECT id INTO v_actor_id FROM public.profiles WHERE user_id = auth.uid();
  INSERT INTO public.audit_log (organization_id, actor_id, action, resource_type, resource_id, details, severity)
  VALUES (p_organization_id, v_actor_id, p_action, p_resource_type, p_resource_id, p_details, p_severity)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_org_activity TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.audit_log WHERE created_at < now() - interval '365 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO service_role;
