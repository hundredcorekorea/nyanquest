-- Rate limit functions for solo quests and multiplayer sessions

-- Count daily solo quest STARTS (not just completed, to prevent bypass)
CREATE OR REPLACE FUNCTION public.get_daily_solo_start_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM solo_quests
    WHERE user_id = p_user_id
      AND created_at >= (NOW() AT TIME ZONE 'Asia/Seoul')::date;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count weekly multiplayer AI GM sessions created/participated
CREATE OR REPLACE FUNCTION public.get_weekly_multi_session_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_week_start TIMESTAMPTZ;
BEGIN
    -- Monday of current week in KST
    v_week_start := date_trunc('week', (NOW() AT TIME ZONE 'Asia/Seoul'))::date;

    SELECT COUNT(DISTINCT ps.id) INTO v_count
    FROM party_sessions ps
    JOIN party_members pm ON pm.party_id = ps.party_id
    WHERE pm.user_id = p_user_id
      AND pm.status = 'accepted'
      AND ps.use_ai_gm = true
      AND ps.created_at >= v_week_start;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
