-- ============================================================
-- OptivianAI - Enable Realtime for Dashboard Tables
-- 
-- The Dashboard uses Supabase realtime subscriptions to show
-- live updates for tasks, staff/members, and notifications.
-- These tables must be in the 'supabase_realtime' publication.
-- ============================================================

-- Enable Realtime for tasks (for live task count & status updates)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
END $$;

-- Enable Realtime for notifications (for live notification badges)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Ensure profiles is in the publication (for live staff count & member list)
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
