-- ==============================================
-- Avatar Storage + Title System
-- ==============================================

-- 1. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Storage RLS: authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Add active_title column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_title TEXT;

-- 3. Create user_titles table
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, title_id)
);

-- RLS for user_titles
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view titles"
ON user_titles FOR SELECT
USING (true);

CREATE POLICY "System can insert titles"
ON user_titles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 4. check_titles RPC: checks all conditions and grants new titles
CREATE OR REPLACE FUNCTION public.check_titles(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_new_titles TEXT[] := '{}';
    v_title TEXT;
    v_profile RECORD;
    v_solo_count INTEGER;
    v_party_created INTEGER;
    v_party_joined INTEGER;
    v_party_completed INTEGER;
    v_gm_count INTEGER;
    v_gm_completed INTEGER;
    v_review_count INTEGER;
    v_post_count INTEGER;
    v_is_premium BOOLEAN;
BEGIN
    -- Fetch profile
    SELECT cat_exp, manner_temp INTO v_profile
    FROM profiles WHERE id = p_user_id;

    IF NOT FOUND THEN RETURN v_new_titles; END IF;

    -- Solo quests completed
    SELECT COUNT(*) INTO v_solo_count
    FROM solo_quests WHERE user_id = p_user_id AND status = 'completed';

    -- Parties created
    SELECT COUNT(*) INTO v_party_created
    FROM parties WHERE creator_id = p_user_id;

    -- Parties joined (accepted PL)
    SELECT COUNT(*) INTO v_party_joined
    FROM party_members WHERE user_id = p_user_id AND status = 'accepted';

    -- Parties completed (as member)
    SELECT COUNT(*) INTO v_party_completed
    FROM party_members pm
    JOIN parties p ON p.id = pm.party_id
    WHERE pm.user_id = p_user_id AND pm.status = 'accepted' AND p.status = 'completed';

    -- GM sessions
    SELECT COUNT(*) INTO v_gm_count
    FROM parties WHERE gm_id = p_user_id;

    SELECT COUNT(*) INTO v_gm_completed
    FROM parties WHERE gm_id = p_user_id AND status = 'completed';

    -- Reviews written
    SELECT COUNT(*) INTO v_review_count
    FROM reviews WHERE reviewer_id = p_user_id;

    -- Posts written
    SELECT COUNT(*) INTO v_post_count
    FROM posts WHERE author_id = p_user_id;

    -- Premium check
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id AND status = 'active' AND expires_at > NOW()
    ) INTO v_is_premium;

    -- Check each title condition
    -- Solo titles
    IF v_solo_count >= 1 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'first_step') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'first_step'); END IF;
    END IF;

    IF v_solo_count >= 5 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'trainee') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'trainee'); END IF;
    END IF;

    IF v_solo_count >= 20 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'solo_master') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'solo_master'); END IF;
    END IF;

    -- Party titles
    IF v_party_created >= 1 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'party_starter') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'party_starter'); END IF;
    END IF;

    IF v_party_joined >= 3 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'social_cat') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'social_cat'); END IF;
    END IF;

    IF v_party_completed >= 10 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'veteran_player') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'veteran_player'); END IF;
    END IF;

    -- GM titles
    IF v_gm_count >= 1 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'first_gm') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'first_gm'); END IF;
    END IF;

    IF v_gm_completed >= 5 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'gm_pro') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'gm_pro'); END IF;
    END IF;

    -- Manner temp titles
    IF v_profile.manner_temp >= 38.0 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'warm_heart') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'warm_heart'); END IF;
    END IF;

    IF v_profile.manner_temp >= 40.0 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'hot_cat') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'hot_cat'); END IF;
    END IF;

    -- Community titles
    IF v_review_count >= 10 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'reviewer') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'reviewer'); END IF;
    END IF;

    IF v_post_count >= 5 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'writer') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'writer'); END IF;
    END IF;

    -- EXP titles
    IF v_profile.cat_exp >= 300 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'exp_hunter') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'exp_hunter'); END IF;
    END IF;

    IF v_profile.cat_exp >= 500 THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'legend') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'legend'); END IF;
    END IF;

    -- Premium title
    IF v_is_premium THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'premium_cat') ON CONFLICT DO NOTHING;
        IF FOUND THEN v_new_titles := array_append(v_new_titles, 'premium_cat'); END IF;
    END IF;

    -- Create notifications for new titles
    FOR v_title IN SELECT unnest(v_new_titles)
    LOOP
        INSERT INTO notifications (user_id, type, message)
        VALUES (p_user_id, 'exp_gained',
            CASE v_title
                WHEN 'first_step' THEN '''첫 발걸음'' 칭호를 획득했다냥! 🏆'
                WHEN 'trainee' THEN '''수련생'' 칭호를 획득했다냥! 🏆'
                WHEN 'solo_master' THEN '''고독한 수련가'' 칭호를 획득했다냥! 🏆'
                WHEN 'party_starter' THEN '''파티 개척자'' 칭호를 획득했다냥! 🏆'
                WHEN 'social_cat' THEN '''사교적인 냥이'' 칭호를 획득했다냥! 🏆'
                WHEN 'veteran_player' THEN '''역전의 모험가'' 칭호를 획득했다냥! 🏆'
                WHEN 'first_gm' THEN '''신입 마스터'' 칭호를 획득했다냥! 🏆'
                WHEN 'gm_pro' THEN '''프로 마스터'' 칭호를 획득했다냥! 🏆'
                WHEN 'warm_heart' THEN '''따뜻한 고양이'' 칭호를 획득했다냥! 🏆'
                WHEN 'hot_cat' THEN '''뜨거운 냥이'' 칭호를 획득했다냥! 🏆'
                WHEN 'reviewer' THEN '''꼼꼼한 리뷰어'' 칭호를 획득했다냥! 🏆'
                WHEN 'writer' THEN '''길드홀 작가'' 칭호를 획득했다냥! 🏆'
                WHEN 'exp_hunter' THEN '''경험치 사냥꾼'' 칭호를 획득했다냥! 🏆'
                WHEN 'legend' THEN '''전설의 집사님'' 칭호를 획득했다냥! 🏆'
                WHEN 'premium_cat' THEN '''프리미엄 냥이'' 칭호를 획득했다냥! 🏆'
                ELSE '새 칭호를 획득했다냥! 🏆'
            END
        );
    END LOOP;

    -- Auto-set first title if none active
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND active_title IS NOT NULL) THEN
        IF array_length(v_new_titles, 1) > 0 THEN
            UPDATE profiles SET active_title = v_new_titles[1] WHERE id = p_user_id;
        END IF;
    END IF;

    RETURN v_new_titles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
