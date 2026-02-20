-- Public aggregate stats (no RLS needed, returns only counts)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'users', (SELECT count(*) FROM profiles),
    'quests_completed', (SELECT count(*) FROM solo_quests WHERE status = 'completed'),
    'active_parties', (SELECT count(*) FROM parties WHERE status = 'recruiting'),
    'total_turns', (SELECT coalesce(sum(turn_count), 0) FROM solo_quests)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
