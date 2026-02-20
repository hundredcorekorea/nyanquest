-- Add language column to posts table for locale-based filtering
ALTER TABLE posts ADD COLUMN language TEXT NOT NULL DEFAULT 'ko'
  CHECK (language IN ('ko', 'en'));

-- Index for efficient filtering
CREATE INDEX idx_posts_language ON posts (language);
