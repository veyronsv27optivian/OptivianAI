-- ============================================================
-- OptivianAI - Fix Profiles Role CHECK Constraint
-- 
-- The original schema.sql has CHECK (role IN ('admin', 'manager', 'staff'))
-- which is too restrictive for the app's roles like 'administrator',
-- 'director', 'developer', etc.
-- 
-- This migration expands the constraint to include ALL roles used
-- by the application (matching the migration from add_auth_rbac.sql).
-- 
-- Run this in your Supabase SQL Editor if you haven't already run
-- the 20260715112702_add_auth_rbac.sql migration.
-- ============================================================

-- Drop the old restrictive CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the expanded constraint that matches the app's role definitions
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'super_admin', 'owner', 'administrator', 'admin', 'director', 'executive',
    'manager', 'assistant_manager', 'team_lead',
    'hr', 'finance', 'marketing', 'sales', 'operations',
    'developer', 'designer', 'qa', 'support',
    'staff', 'intern', 'client', 'guest', 'viewer'
  ));
