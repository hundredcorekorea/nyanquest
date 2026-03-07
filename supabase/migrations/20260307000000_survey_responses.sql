-- Survey responses: post-game feedback
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES solo_quests(id) ON DELETE SET NULL,
    session_id UUID REFERENCES party_sessions(id) ON DELETE SET NULL,
    scenario_id TEXT,
    play_type TEXT NOT NULL CHECK (play_type IN ('solo', 'party')),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    quest_status TEXT, -- 'completed' or 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_survey_user ON survey_responses(user_id);
CREATE INDEX idx_survey_scenario ON survey_responses(scenario_id);
CREATE INDEX idx_survey_created ON survey_responses(created_at DESC);

-- RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own
CREATE POLICY "Users can insert own survey"
    ON survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can read their own
CREATE POLICY "Users can read own surveys"
    ON survey_responses FOR SELECT
    USING (auth.uid() = user_id);

-- Prevent duplicate survey per quest/session
CREATE UNIQUE INDEX idx_survey_unique_quest ON survey_responses(user_id, quest_id) WHERE quest_id IS NOT NULL;
CREATE UNIQUE INDEX idx_survey_unique_session ON survey_responses(user_id, session_id) WHERE session_id IS NOT NULL;
