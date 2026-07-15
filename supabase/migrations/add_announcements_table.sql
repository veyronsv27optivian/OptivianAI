-- ============================================================
-- OptivianAI - Announcements Table Migration
-- Supports admin announcements with create, dismiss, retrieval
-- ============================================================

-- 1. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'alert')),
  link TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);

-- 3. Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active announcements
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (
  active = true OR auth.uid() IN (
    SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Admins can create announcements
DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Admins can update announcements
DROP POLICY IF EXISTS "announcements_update" ON announcements;
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Admins can delete announcements
DROP POLICY IF EXISTS "announcements_delete" ON announcements;
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- 4. Enable Realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;
END $$;
