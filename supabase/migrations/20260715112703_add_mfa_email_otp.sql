-- ============================================================
-- OptivianAI - Email OTP for 2FA
-- Run this AFTER add_auth_rbac.sql
-- ============================================================

-- 1. Add mfa_email_enabled flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_email_enabled BOOLEAN DEFAULT false;

-- 2. OTP codes table
CREATE TABLE IF NOT EXISTS mfa_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,               -- SHA-256 hash of the 6-digit code
  expires_at TIMESTAMPTZ NOT NULL,       -- code expires after 5 minutes
  attempts SMALLINT DEFAULT 0,           -- failed attempts counter
  max_attempts SMALLINT DEFAULT 3,       -- max failed attempts before lockout
  is_used BOOLEAN DEFAULT false,         -- consumed after successful verification
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_mfa_otps_user ON mfa_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_otps_expires ON mfa_otps(expires_at);

-- Enable RLS
ALTER TABLE mfa_otps ENABLE ROW LEVEL SECURITY;

-- User can insert their own OTP records
DROP POLICY IF EXISTS "mfa_otps_insert" ON mfa_otps;
CREATE POLICY "mfa_otps_insert" ON mfa_otps FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- User can read their own unexpired OTP records (for verification)
DROP POLICY IF EXISTS "mfa_otps_select" ON mfa_otps;
CREATE POLICY "mfa_otps_select" ON mfa_otps FOR SELECT USING (
  user_id = auth.uid() AND expires_at > now()
);

-- User can update their own OTP records (mark as used, increment attempts)
DROP POLICY IF EXISTS "mfa_otps_update" ON mfa_otps;
CREATE POLICY "mfa_otps_update" ON mfa_otps FOR UPDATE USING (
  user_id = auth.uid()
);
