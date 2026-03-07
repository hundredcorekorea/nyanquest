-- Add scenario_id to parties table for AI GM scenario selection
ALTER TABLE parties ADD COLUMN IF NOT EXISTS scenario_id TEXT;
