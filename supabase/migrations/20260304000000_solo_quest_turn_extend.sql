-- Add turn extension tracking to solo_quests
ALTER TABLE solo_quests
ADD COLUMN IF NOT EXISTS turns_extended boolean DEFAULT false;

-- Add total_turns column to allow per-quest overrides (for ad-based extension)
ALTER TABLE solo_quests
ADD COLUMN IF NOT EXISTS total_turns integer;

COMMENT ON COLUMN solo_quests.turns_extended IS 'Whether the player has used ad-based turn extension for this quest';
COMMENT ON COLUMN solo_quests.total_turns IS 'Override total turns for this quest (null = use scenario default)';
