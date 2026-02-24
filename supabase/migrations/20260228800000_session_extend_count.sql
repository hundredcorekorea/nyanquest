-- Track how many times a session's turns have been extended via ads
ALTER TABLE party_sessions ADD COLUMN IF NOT EXISTS extend_count INTEGER NOT NULL DEFAULT 0;
