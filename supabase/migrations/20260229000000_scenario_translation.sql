-- Auto-translation support for community scenarios
ALTER TABLE community_scenarios
  ADD COLUMN IF NOT EXISTS scenario_data_en JSONB,
  ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT 'none';

-- Add check constraint for translation_status
ALTER TABLE community_scenarios
  ADD CONSTRAINT community_scenarios_translation_status_check
  CHECK (translation_status IN ('none', 'pending', 'completed', 'failed'));
