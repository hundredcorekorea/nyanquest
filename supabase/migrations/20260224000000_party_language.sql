-- Add language column to parties table for locale-based filtering
ALTER TABLE parties ADD COLUMN language TEXT NOT NULL DEFAULT 'ko'
  CHECK (language IN ('ko', 'en'));

-- Index for efficient filtering
CREATE INDEX idx_parties_language ON parties (language);
