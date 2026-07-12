-- ============================================================
-- OptivianAI - AI Infrastructure Migration
-- Adds tables for conversation memory, request logging, and
-- performance indexes for the AI analytics system.
--
-- Run this in your Supabase SQL Editor after the base schema.
-- ============================================================

-- ============================================================
-- 1. CONVERSATION MEMORY
-- Stores session-based conversation history for AI interactions.
-- Used by the ConversationMemory class in src/services/ai/memory/
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_memory (
  session_id      TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  system_prompt   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Allow upsert by session_id (used by ConversationMemory._saveToSupabase)
-- The PRIMARY KEY on session_id already provides the conflict target.

-- Index for filtering conversations by organization
CREATE INDEX IF NOT EXISTS idx_conv_memory_org ON conversation_memory(organization_id);

-- Index for filtering conversations by profile
CREATE INDEX IF NOT EXISTS idx_conv_memory_profile ON conversation_memory(profile_id);

-- Index for sorting by last update time (active conversations first)
CREATE INDEX IF NOT EXISTS idx_conv_memory_updated ON conversation_memory(updated_at DESC);

-- ============================================================
-- 2. AI REQUEST LOGS
-- Records every AI provider request for analytics, monitoring,
-- and the admin dashboard.
-- Used by the AnalyticsTracker in src/services/ai/analytics/
-- ============================================================
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

-- Index for filtering logs by organization (primary dashboard query)
CREATE INDEX IF NOT EXISTS idx_ai_logs_org ON ai_request_logs(organization_id);

-- Index for filtering by provider (cost breakdown per provider)
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_request_logs(provider);

-- Index for filtering by feature (usage per AI tool)
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_request_logs(feature);

-- Index for sorting by timestamp (default log view: newest first)
CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_request_logs(timestamp DESC);

-- Index for success/failure filtering
CREATE INDEX IF NOT EXISTS idx_ai_logs_success ON ai_request_logs(success);

-- ============================================================
-- 3. ADDITIONAL INDEX ON AI ANALYSES
-- Improves performance for dashboard queries that group by
-- tool type and sort by creation date.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_by ON ai_analyses(created_by);

-- Composite index for the most common dashboard query:
-- "Show me all analyses for my org, filtered by type, sorted by date"
CREATE INDEX IF NOT EXISTS idx_ai_analyses_org_type_created
  ON ai_analyses(organization_id, type, created_at DESC);

-- ============================================================
-- 4. ENABLE REALTIME
-- ============================================================
-- Enable Realtime for the new tables (for live admin dashboard updates)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'conversation_memory'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_memory;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'ai_request_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_request_logs;
  END IF;
END $$;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- ── conversation_memory RLS ──────────────────────────────────
-- Org members can view/insert/update conversations within their org
DROP POLICY IF EXISTS "conv_memory_select" ON conversation_memory;
CREATE POLICY "conv_memory_select" ON conversation_memory FOR SELECT USING (
  organization_id = public.get_user_org_id()
);

DROP POLICY IF EXISTS "conv_memory_insert" ON conversation_memory;
CREATE POLICY "conv_memory_insert" ON conversation_memory FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id()
);

DROP POLICY IF EXISTS "conv_memory_update" ON conversation_memory;
CREATE POLICY "conv_memory_update" ON conversation_memory FOR UPDATE USING (
  organization_id = public.get_user_org_id()
);

DROP POLICY IF EXISTS "conv_memory_delete" ON conversation_memory;
CREATE POLICY "conv_memory_delete" ON conversation_memory FOR DELETE USING (
  organization_id = public.get_user_org_id()
);

-- ── ai_request_logs RLS ─────────────────────────────────────
-- Org members can view logs within their org
DROP POLICY IF EXISTS "ai_logs_select" ON ai_request_logs;
CREATE POLICY "ai_logs_select" ON ai_request_logs FOR SELECT USING (
  organization_id = public.get_user_org_id()
);

-- Only the system/service can insert/update/delete logs
-- (authenticated users can insert via the AnalyticsTracker)
DROP POLICY IF EXISTS "ai_logs_insert" ON ai_request_logs;
CREATE POLICY "ai_logs_insert" ON ai_request_logs FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id() OR organization_id IS NULL
);

-- ============================================================
-- 6. HELPER: Cleanup old request logs
-- Creates a function to archive or delete logs older than N days.
-- This prevents unbounded table growth.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_request_logs
  WHERE timestamp < now() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_ai_logs TO authenticated;
