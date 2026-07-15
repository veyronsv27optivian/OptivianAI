-- ============================================================
-- OptivianAI - Login History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT DEFAULT 'email',
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_history_select" ON login_history;
CREATE POLICY "login_history_select" ON login_history FOR SELECT USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "login_history_insert" ON login_history;
CREATE POLICY "login_history_insert" ON login_history FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- RPC function for edge functions
-- Drop first to avoid "cannot change name of input parameter" errors
DROP FUNCTION IF EXISTS public.log_login_attempt;

CREATE FUNCTION public.log_login_attempt(
  p_user_id UUID,
  p_provider TEXT DEFAULT 'email',
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.login_history (user_id, provider, success, ip_address, user_agent, failure_reason)
  VALUES (p_user_id, p_provider, p_success, p_ip_address, p_user_agent, p_failure_reason)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_login_attempt TO authenticated, service_role;

-- Auto-cleanup old records
DROP FUNCTION IF EXISTS public.cleanup_old_login_history;

CREATE FUNCTION public.cleanup_old_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.login_history WHERE created_at < now() - interval '90 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_login_history TO service_role;
