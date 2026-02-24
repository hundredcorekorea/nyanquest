-- Community Scenario Marketplace (Phase 1: Free sharing)

CREATE TABLE community_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL,
  description_en TEXT,
  genre TEXT NOT NULL DEFAULT 'fantasy',
  system_id UUID REFERENCES trpg_systems(id),
  language TEXT NOT NULL DEFAULT 'ko',
  difficulty TEXT NOT NULL DEFAULT 'normal',
  estimated_turns INTEGER NOT NULL DEFAULT 20,
  scenario_data JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published',
  play_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT community_scenarios_genre_check CHECK (
    genre IN ('fantasy', 'horror', 'comedy', 'scifi', 'mystery', 'romance', 'historical', 'modern', 'other')
  ),
  CONSTRAINT community_scenarios_difficulty_check CHECK (
    difficulty IN ('easy', 'normal', 'hard')
  ),
  CONSTRAINT community_scenarios_status_check CHECK (
    status IN ('draft', 'published', 'hidden')
  ),
  CONSTRAINT community_scenarios_language_check CHECK (
    language IN ('ko', 'en')
  )
);

CREATE INDEX idx_community_scenarios_creator ON community_scenarios(creator_id);
CREATE INDEX idx_community_scenarios_genre ON community_scenarios(genre) WHERE status = 'published';
CREATE INDEX idx_community_scenarios_language ON community_scenarios(language) WHERE status = 'published';
CREATE INDEX idx_community_scenarios_popular ON community_scenarios(play_count DESC) WHERE status = 'published';
CREATE INDEX idx_community_scenarios_recent ON community_scenarios(created_at DESC) WHERE status = 'published';

-- Likes table
CREATE TABLE scenario_likes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES community_scenarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, scenario_id)
);

-- RLS
ALTER TABLE community_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_likes ENABLE ROW LEVEL SECURITY;

-- community_scenarios: everyone can read published, creator can manage own
CREATE POLICY "Anyone can read published scenarios"
  ON community_scenarios FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create scenarios"
  ON community_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own scenarios"
  ON community_scenarios FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete own scenarios"
  ON community_scenarios FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- scenario_likes: authenticated users manage own likes
CREATE POLICY "Anyone can read likes"
  ON scenario_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like scenarios"
  ON scenario_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike scenarios"
  ON scenario_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function: increment play count
CREATE OR REPLACE FUNCTION increment_scenario_play_count(p_scenario_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_scenarios
  SET play_count = play_count + 1, updated_at = NOW()
  WHERE id = p_scenario_id AND status = 'published';
END;
$$;

-- Function: toggle like (returns new like_count)
CREATE OR REPLACE FUNCTION toggle_scenario_like(p_user_id UUID, p_scenario_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM scenario_likes WHERE user_id = p_user_id AND scenario_id = p_scenario_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM scenario_likes WHERE user_id = p_user_id AND scenario_id = p_scenario_id;
    UPDATE community_scenarios SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
    WHERE id = p_scenario_id;
  ELSE
    INSERT INTO scenario_likes (user_id, scenario_id) VALUES (p_user_id, p_scenario_id);
    UPDATE community_scenarios SET like_count = like_count + 1, updated_at = NOW()
    WHERE id = p_scenario_id;
  END IF;

  SELECT like_count INTO v_count FROM community_scenarios WHERE id = p_scenario_id;

  RETURN json_build_object('liked', NOT v_exists, 'likeCount', v_count);
END;
$$;
