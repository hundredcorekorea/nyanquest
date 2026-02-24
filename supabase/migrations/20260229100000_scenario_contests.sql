-- Scenario Contest System

CREATE TABLE scenario_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  genre_filter TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'ended', 'finalized')),
  reward_months INTEGER NOT NULL DEFAULT 1,
  winner_count INTEGER NOT NULL DEFAULT 3,
  like_weight NUMERIC NOT NULL DEFAULT 1.0,
  play_weight NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES scenario_contests(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES community_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rank INTEGER,
  score NUMERIC,
  UNIQUE(contest_id, scenario_id),
  UNIQUE(contest_id, user_id)
);

-- Indexes
CREATE INDEX idx_contest_entries_contest ON contest_entries(contest_id);
CREATE INDEX idx_contest_entries_user ON contest_entries(user_id);
CREATE INDEX idx_scenario_contests_status ON scenario_contests(status);

-- RLS
ALTER TABLE scenario_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can read contests
CREATE POLICY "Anyone can read contests"
  ON scenario_contests FOR SELECT
  USING (true);

-- Everyone can read entries
CREATE POLICY "Anyone can read contest entries"
  ON contest_entries FOR SELECT
  USING (true);

-- Authenticated users can enter contests
CREATE POLICY "Users can enter contests"
  ON contest_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add contest notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_request', 'join_accepted', 'join_rejected',
    'party_status', 'review_received', 'exp_gained',
    'quest_complete', 'gm_assigned',
    'subscription_started', 'subscription_expiring',
    'announcement',
    'referral_signup', 'referral_premium',
    'gift_received',
    'round_your_turn', 'round_all_submitted',
    'contest_winner', 'contest_ended'
  )
);
