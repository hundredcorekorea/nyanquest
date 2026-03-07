-- Add 'chat' role to session_messages for player-to-player chat
-- Chat messages are separate from game actions and excluded from AI GM context

ALTER TABLE session_messages DROP CONSTRAINT IF EXISTS session_messages_role_check;
ALTER TABLE session_messages ADD CONSTRAINT session_messages_role_check
  CHECK (role IN ('gm', 'player', 'system', 'chat'));

-- Index for efficient filtering by role (chat vs game messages)
CREATE INDEX IF NOT EXISTS idx_session_messages_role
  ON session_messages(session_id, role, created_at);
