-- ============================================================
-- Run ONLY this in your Supabase SQL Editor
-- Adds JSONB columns to the tasks table for storing assignee data
-- directly on the task (no junction table needed).
-- ============================================================

-- Add JSONB columns for storing assignees directly on the task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_tos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_statuses JSONB DEFAULT '{}'::jsonb;
