-- Solo Quest: AI-powered single-player TRPG mode

-- 1. Solo quests table
CREATE TABLE solo_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    scenario_id TEXT NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    messages JSONB DEFAULT '[]'::jsonb,
    turn_count INTEGER DEFAULT 0,
    total_turns INTEGER DEFAULT 10,
    exp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_solo_quests_user ON solo_quests(user_id);
CREATE INDEX idx_solo_quests_user_status ON solo_quests(user_id, status);
CREATE INDEX idx_solo_quests_created ON solo_quests(created_at DESC);

-- 2. RLS
ALTER TABLE solo_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own solo quests"
    ON solo_quests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own solo quests"
    ON solo_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own solo quests"
    ON solo_quests FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own solo quests"
    ON solo_quests FOR DELETE USING (auth.uid() = user_id);

-- 3. Daily quest limit (KST)
CREATE OR REPLACE FUNCTION public.get_daily_quest_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM solo_quests
    WHERE user_id = p_user_id
      AND status = 'completed'
      AND completed_at >= (NOW() AT TIME ZONE 'Asia/Seoul')::date;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Complete solo quest + award EXP
CREATE OR REPLACE FUNCTION public.complete_solo_quest(
    p_quest_id UUID,
    p_user_id UUID,
    p_exp_amount INTEGER DEFAULT 15
)
RETURNS VOID AS $$
BEGIN
    UPDATE solo_quests
    SET status = 'completed',
        exp_earned = p_exp_amount,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_quest_id AND user_id = p_user_id;

    PERFORM add_exp(p_user_id, p_exp_amount);

    INSERT INTO notifications (user_id, type, message)
    VALUES (
        p_user_id,
        'exp_gained',
        '수련 완료! +' || p_exp_amount || ' EXP를 얻었다냥! ✨'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Expand notification type check to include quest_complete
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('join_request', 'join_accepted', 'join_rejected', 'party_status', 'review_received', 'exp_gained', 'quest_complete'));
