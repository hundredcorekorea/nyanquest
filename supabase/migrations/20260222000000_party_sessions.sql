-- Party Sessions & Session Messages for multiplayer in-app TRPG

-- Add AI GM and play mode columns to parties
ALTER TABLE parties ADD COLUMN IF NOT EXISTS use_ai_gm BOOLEAN DEFAULT false;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS play_mode TEXT DEFAULT 'realtime'
  CHECK (play_mode IN ('realtime', 'async'));

-- Party sessions table
CREATE TABLE IF NOT EXISTS party_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    scenario_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    turn_order UUID[] DEFAULT '{}',
    current_turn_index INTEGER DEFAULT 0,
    turn_count INTEGER DEFAULT 0,
    total_turns INTEGER DEFAULT 20,
    use_ai_gm BOOLEAN DEFAULT false,
    play_mode TEXT DEFAULT 'realtime' CHECK (play_mode IN ('realtime', 'async')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session messages table (Supabase Realtime broadcasts on INSERT)
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES party_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id),  -- NULL = AI GM
    role TEXT NOT NULL CHECK (role IN ('gm', 'player', 'system')),
    player_name TEXT,
    content TEXT NOT NULL,
    dice_roll JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_party_sessions_party_id ON party_sessions(party_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON session_messages(session_id, created_at);

-- Enable Realtime for session_messages
ALTER PUBLICATION supabase_realtime ADD TABLE session_messages;

-- RLS policies for party_sessions
ALTER TABLE party_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view sessions for parties they belong to
CREATE POLICY "Party members can view sessions"
    ON party_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM party_members
            WHERE party_members.party_id = party_sessions.party_id
              AND party_members.user_id = auth.uid()
              AND party_members.status = 'accepted'
        )
    );

-- Party creator can create sessions
CREATE POLICY "Party creator can create sessions"
    ON party_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = party_sessions.party_id
              AND parties.creator_id = auth.uid()
        )
    );

-- Party creator can update sessions (pause/resume/complete)
CREATE POLICY "Party creator can update sessions"
    ON party_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = party_sessions.party_id
              AND parties.creator_id = auth.uid()
        )
    );

-- RLS policies for session_messages
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Party members can view messages
CREATE POLICY "Party members can view session messages"
    ON session_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM party_sessions ps
            JOIN party_members pm ON pm.party_id = ps.party_id
            WHERE ps.id = session_messages.session_id
              AND pm.user_id = auth.uid()
              AND pm.status = 'accepted'
        )
    );

-- Party members can insert messages (their own)
CREATE POLICY "Party members can send messages"
    ON session_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM party_sessions ps
            JOIN party_members pm ON pm.party_id = ps.party_id
            WHERE ps.id = session_messages.session_id
              AND pm.user_id = auth.uid()
              AND pm.status = 'accepted'
              AND ps.status = 'active'
        )
    );

-- Service role can insert AI GM messages (user_id IS NULL)
-- This is handled via the API route using service role client

-- RPC: Create a new session for a party
CREATE OR REPLACE FUNCTION create_party_session(
    p_party_id UUID,
    p_scenario_id TEXT DEFAULT NULL,
    p_total_turns INTEGER DEFAULT 20,
    p_use_ai_gm BOOLEAN DEFAULT false,
    p_play_mode TEXT DEFAULT 'realtime'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_party RECORD;
    v_turn_order UUID[];
BEGIN
    -- Verify caller is party creator
    SELECT * INTO v_party FROM parties WHERE id = p_party_id AND creator_id = auth.uid();
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Not party creator';
    END IF;

    -- Check no active session exists
    IF EXISTS (SELECT 1 FROM party_sessions WHERE party_id = p_party_id AND status = 'active') THEN
        RAISE EXCEPTION 'Active session already exists';
    END IF;

    -- Build turn order from accepted members
    SELECT ARRAY_AGG(user_id ORDER BY created_at)
    INTO v_turn_order
    FROM party_members
    WHERE party_id = p_party_id AND status = 'accepted' AND role = 'PL';

    IF v_turn_order IS NULL THEN
        v_turn_order := '{}';
    END IF;

    -- Create session
    INSERT INTO party_sessions (party_id, scenario_id, total_turns, use_ai_gm, play_mode, turn_order)
    VALUES (p_party_id, p_scenario_id, p_total_turns, p_use_ai_gm, p_play_mode, v_turn_order)
    RETURNING id INTO v_session_id;

    -- Update party status
    UPDATE parties SET status = 'filled', updated_at = NOW() WHERE id = p_party_id;

    -- Notify all party members
    INSERT INTO notifications (user_id, type, message, party_id)
    SELECT pm.user_id, 'party_status', '세션이 시작되었다냥! 모험을 떠나자냥! 🎲', p_party_id
    FROM party_members pm
    WHERE pm.party_id = p_party_id AND pm.status = 'accepted' AND pm.user_id != auth.uid();

    RETURN v_session_id;
END;
$$;

-- RPC: Advance turn in async mode
CREATE OR REPLACE FUNCTION advance_session_turn(
    p_session_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_next_index INTEGER;
    v_next_user_id UUID;
BEGIN
    SELECT * INTO v_session FROM party_sessions WHERE id = p_session_id AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not active';
    END IF;

    -- Verify caller is a party member
    IF NOT EXISTS (
        SELECT 1 FROM party_members
        WHERE party_id = v_session.party_id AND user_id = auth.uid() AND status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'Not a party member';
    END IF;

    -- Calculate next turn index
    IF array_length(v_session.turn_order, 1) IS NULL OR array_length(v_session.turn_order, 1) = 0 THEN
        RETURN;
    END IF;

    v_next_index := (v_session.current_turn_index + 1) % array_length(v_session.turn_order, 1);

    UPDATE party_sessions
    SET current_turn_index = v_next_index,
        turn_count = turn_count + 1,
        updated_at = NOW()
    WHERE id = p_session_id;

    -- Notify next player (async mode)
    IF v_session.play_mode = 'async' THEN
        v_next_user_id := v_session.turn_order[v_next_index + 1]; -- PostgreSQL arrays are 1-indexed
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (v_next_user_id, 'party_status', '네 차례다냥! 행동을 선택해달라냥! ⚔️', v_session.party_id);
    END IF;
END;
$$;

-- RPC: Complete a session
CREATE OR REPLACE FUNCTION complete_party_session(
    p_session_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM party_sessions WHERE id = p_session_id AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not active';
    END IF;

    -- Verify caller is party creator
    IF NOT EXISTS (
        SELECT 1 FROM parties
        WHERE id = v_session.party_id AND creator_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not party creator';
    END IF;

    -- Mark session as completed
    UPDATE party_sessions SET status = 'completed', updated_at = NOW() WHERE id = p_session_id;

    -- Grant EXP to all party members (+20 base)
    UPDATE profiles
    SET cat_exp = cat_exp + 20, updated_at = NOW()
    WHERE id IN (
        SELECT user_id FROM party_members
        WHERE party_id = v_session.party_id AND status = 'accepted'
    );

    -- Notify all members
    INSERT INTO notifications (user_id, type, message, party_id)
    SELECT pm.user_id, 'quest_complete', '멀티 세션이 완료되었다냥! +20 EXP! 🎉', v_session.party_id
    FROM party_members pm
    WHERE pm.party_id = v_session.party_id AND pm.status = 'accepted';
END;
$$;
