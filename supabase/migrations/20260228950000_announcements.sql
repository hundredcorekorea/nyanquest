-- Announcements table for guild hall bulletin board
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'update' CHECK (category IN ('update', 'event', 'maintenance', 'tip')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Everyone can read, only service role can insert/update/delete
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT USING (true);

-- Index for ordering
CREATE INDEX idx_announcements_pinned_date ON announcements(is_pinned DESC, created_at DESC);
