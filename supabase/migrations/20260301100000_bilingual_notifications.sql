-- ===== Bilingual Notification Messages =====
-- Store messages as JSON {"ko":"...","en":"..."} so the client can pick by locale.
-- The NotificationBell component parses JSON messages; legacy plain strings still work as fallback.

-- Drop existing functions first to avoid signature conflicts
-- CASCADE drops dependent triggers too — we re-create them at the bottom
DROP FUNCTION IF EXISTS complete_solo_quest(UUID, UUID, INT);
DROP FUNCTION IF EXISTS check_titles(UUID);
DROP FUNCTION IF EXISTS notify_join_request() CASCADE;
DROP FUNCTION IF EXISTS notify_join_result() CASCADE;
DROP FUNCTION IF EXISTS notify_party_status() CASCADE;
DROP FUNCTION IF EXISTS start_party_session(UUID, TEXT);
DROP FUNCTION IF EXISTS advance_turn(UUID);
DROP FUNCTION IF EXISTS complete_party_session(UUID);
DROP FUNCTION IF EXISTS handle_review_exp() CASCADE;
DROP FUNCTION IF EXISTS complete_party_exp(UUID);
DROP FUNCTION IF EXISTS handle_referral_signup(UUID, TEXT);
DROP FUNCTION IF EXISTS handle_referral_premium_reward(UUID);

-- 1. complete_solo_quest: "수련 완료! +N EXP"
CREATE FUNCTION complete_solo_quest(
    p_quest_id UUID,
    p_user_id UUID,
    p_exp_amount INT
) RETURNS void AS $$
BEGIN
    UPDATE solo_quests SET status = 'completed', updated_at = NOW() WHERE id = p_quest_id;
    UPDATE profiles SET exp = exp + p_exp_amount, updated_at = NOW() WHERE id = p_user_id;

    INSERT INTO notifications (user_id, type, message)
    VALUES (
        p_user_id,
        'exp_gained',
        jsonb_build_object(
            'ko', '수련 완료! +' || p_exp_amount || ' EXP를 얻었다냥! ✨',
            'en', 'Training complete! +' || p_exp_amount || ' EXP earned, nya! ✨'
        )::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. check_titles: title earned notifications
CREATE FUNCTION check_titles(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_profile RECORD;
    v_new_titles TEXT[] := '{}';
    v_title TEXT;
    v_solo_count INT;
    v_party_count INT;
    v_gm_count INT;
    v_review_count INT;
    v_post_count INT;
    v_party_create_count INT;
BEGIN
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
    IF NOT FOUND THEN RETURN v_new_titles; END IF;

    SELECT COUNT(*) INTO v_solo_count FROM solo_quests WHERE user_id = p_user_id AND status IN ('completed', 'failed');
    SELECT COUNT(DISTINCT pm.party_id) INTO v_party_count FROM party_members pm JOIN parties p ON p.id = pm.party_id WHERE pm.user_id = p_user_id AND pm.status = 'accepted' AND p.status = 'completed';
    SELECT COUNT(*) INTO v_gm_count FROM parties WHERE creator_id = p_user_id AND status = 'completed';
    SELECT COUNT(*) INTO v_review_count FROM reviews WHERE reviewer_id = p_user_id;
    SELECT COUNT(*) INTO v_post_count FROM community_posts WHERE author_id = p_user_id;
    SELECT COUNT(*) INTO v_party_create_count FROM parties WHERE creator_id = p_user_id;

    IF v_solo_count >= 1 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'first_step') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'first_step') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'first_step');
    END IF;
    IF v_solo_count >= 5 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'trainee') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'trainee') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'trainee');
    END IF;
    IF v_solo_count >= 20 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'solo_master') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'solo_master') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'solo_master');
    END IF;
    IF v_party_create_count >= 1 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'party_starter') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'party_starter') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'party_starter');
    END IF;
    IF v_party_count >= 3 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'social_cat') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'social_cat') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'social_cat');
    END IF;
    IF v_party_count >= 10 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'veteran_player') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'veteran_player') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'veteran_player');
    END IF;
    IF v_gm_count >= 1 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'first_gm') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'first_gm') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'first_gm');
    END IF;
    IF v_gm_count >= 5 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'gm_pro') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'gm_pro') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'gm_pro');
    END IF;
    IF v_profile.manner_temp >= 38 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'warm_heart') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'warm_heart') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'warm_heart');
    END IF;
    IF v_profile.manner_temp >= 40 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'hot_cat') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'hot_cat') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'hot_cat');
    END IF;
    IF v_review_count >= 10 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'reviewer') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'reviewer') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'reviewer');
    END IF;
    IF v_post_count >= 5 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'writer') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'writer') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'writer');
    END IF;
    IF v_profile.exp >= 300 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'exp_hunter') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'exp_hunter') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'exp_hunter');
    END IF;
    IF v_profile.exp >= 500 AND NOT EXISTS(SELECT 1 FROM user_titles WHERE user_id = p_user_id AND title_id = 'legend') THEN
        INSERT INTO user_titles (user_id, title_id) VALUES (p_user_id, 'legend') ON CONFLICT DO NOTHING;
        v_new_titles := array_append(v_new_titles, 'legend');
    END IF;

    -- Insert bilingual title notifications
    FOREACH v_title IN ARRAY v_new_titles
    LOOP
        INSERT INTO notifications (user_id, type, message)
        VALUES (p_user_id, 'exp_gained',
            jsonb_build_object(
                'ko', CASE v_title
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
                    ELSE v_title || ' 칭호를 획득했다냥! 🏆'
                END,
                'en', CASE v_title
                    WHEN 'first_step' THEN 'Earned the ''First Step'' title, nya! 🏆'
                    WHEN 'trainee' THEN 'Earned the ''Trainee'' title, nya! 🏆'
                    WHEN 'solo_master' THEN 'Earned the ''Solo Master'' title, nya! 🏆'
                    WHEN 'party_starter' THEN 'Earned the ''Party Pioneer'' title, nya! 🏆'
                    WHEN 'social_cat' THEN 'Earned the ''Social Cat'' title, nya! 🏆'
                    WHEN 'veteran_player' THEN 'Earned the ''Veteran Adventurer'' title, nya! 🏆'
                    WHEN 'first_gm' THEN 'Earned the ''Novice Master'' title, nya! 🏆'
                    WHEN 'gm_pro' THEN 'Earned the ''Pro Master'' title, nya! 🏆'
                    WHEN 'warm_heart' THEN 'Earned the ''Warm Cat'' title, nya! 🏆'
                    WHEN 'hot_cat' THEN 'Earned the ''Hot Cat'' title, nya! 🏆'
                    WHEN 'reviewer' THEN 'Earned the ''Keen Reviewer'' title, nya! 🏆'
                    WHEN 'writer' THEN 'Earned the ''Guild Hall Writer'' title, nya! 🏆'
                    WHEN 'exp_hunter' THEN 'Earned the ''EXP Hunter'' title, nya! 🏆'
                    WHEN 'legend' THEN 'Earned the ''Legendary Butler'' title, nya! 🏆'
                    ELSE 'Earned the ''' || v_title || ''' title, nya! 🏆'
                END
            )::text
        );
    END LOOP;

    RETURN v_new_titles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. notify_join_request (trigger function for party_members INSERT)
CREATE FUNCTION notify_join_request()
RETURNS trigger AS $$
DECLARE
    v_creator_id UUID;
    v_user_nick TEXT;
    v_party_title TEXT;
    v_role_label_ko TEXT;
    v_role_label_en TEXT;
BEGIN
    IF NEW.status = 'pending' THEN
        SELECT creator_id, title INTO v_creator_id, v_party_title FROM parties WHERE id = NEW.party_id;
        SELECT nickname INTO v_user_nick FROM profiles WHERE id = NEW.user_id;

        IF NEW.role = 'GM' THEN
            v_role_label_ko := 'GM으로';
            v_role_label_en := 'as GM';
        ELSE
            v_role_label_ko := 'PL로';
            v_role_label_en := 'as PL';
        END IF;

        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (v_creator_id, 'join_request',
            jsonb_build_object(
                'ko', v_user_nick || '님이 "' || v_party_title || '" 파티에 ' || v_role_label_ko || ' 참가 신청했다냥!',
                'en', v_user_nick || ' requested to join "' || v_party_title || '" ' || v_role_label_en || ', nya!'
            )::text,
            NEW.party_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.notify_join_request() SET search_path = public;

-- 4. notify_join_result (trigger function for party_members UPDATE)
CREATE FUNCTION notify_join_result()
RETURNS trigger AS $$
DECLARE
    v_party_title TEXT;
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
        SELECT title INTO v_party_title FROM parties WHERE id = NEW.party_id;
        IF NEW.status = 'accepted' THEN
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (NEW.user_id, 'join_accepted',
                jsonb_build_object(
                    'ko', '"' || v_party_title || '" 파티에 합류했다냥! 환영이다냥!',
                    'en', 'You joined "' || v_party_title || '", nya! Welcome aboard!'
                )::text,
                NEW.party_id);
        ELSE
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (NEW.user_id, 'join_rejected',
                jsonb_build_object(
                    'ko', '"' || v_party_title || '" 참가가 거절되었다냥... 다른 모험을 찾아보자냥!',
                    'en', 'Your request to join "' || v_party_title || '" was declined, nya... Let''s find another adventure!'
                )::text,
                NEW.party_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.notify_join_result() SET search_path = public;

-- 5. notify_party_status (trigger function for parties UPDATE)
CREATE FUNCTION notify_party_status()
RETURNS trigger AS $$
DECLARE
    v_msg TEXT;
    v_member RECORD;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('recruiting', 'in_progress', 'completed', 'cancelled') THEN
        v_msg := jsonb_build_object(
            'ko', CASE NEW.status
                WHEN 'recruiting' THEN '"' || NEW.title || '" 파티가 다시 모집 중이다냥!'
                WHEN 'in_progress' THEN '"' || NEW.title || '" 파티가 시작되었다냥! 모험 출발이다냥!'
                WHEN 'completed' THEN '"' || NEW.title || '" 파티가 완료되었다냥! 수고했다냥!'
                WHEN 'cancelled' THEN '"' || NEW.title || '" 파티가 취소되었다냥...'
                ELSE ''
            END,
            'en', CASE NEW.status
                WHEN 'recruiting' THEN '"' || NEW.title || '" is recruiting again, nya!'
                WHEN 'in_progress' THEN '"' || NEW.title || '" has started, nya! Adventure time!'
                WHEN 'completed' THEN '"' || NEW.title || '" is complete, nya! Great job!'
                WHEN 'cancelled' THEN '"' || NEW.title || '" has been cancelled, nya...'
                ELSE ''
            END
        )::text;

        FOR v_member IN
            SELECT user_id FROM party_members WHERE party_id = NEW.id AND status = 'accepted'
        LOOP
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (v_member.user_id, 'party_status', v_msg, NEW.id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.notify_party_status() SET search_path = public;

-- 6. start_party_session
CREATE FUNCTION start_party_session(
    p_party_id UUID,
    p_system TEXT DEFAULT 'dnd5e'
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_party RECORD;
    v_members UUID[];
BEGIN
    SELECT * INTO v_party FROM parties WHERE id = p_party_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Party not found'; END IF;

    SELECT array_agg(user_id) INTO v_members
    FROM party_members WHERE party_id = p_party_id AND status = 'accepted' AND role = 'PL';

    INSERT INTO party_sessions (party_id, gm_id, system, status, turn_order)
    VALUES (p_party_id, auth.uid(), p_system, 'active', v_members)
    RETURNING id INTO v_session_id;

    UPDATE parties SET status = 'in_progress' WHERE id = p_party_id;

    INSERT INTO notifications (user_id, type, message, party_id)
    SELECT pm.user_id, 'party_status',
        jsonb_build_object(
            'ko', '세션이 시작되었다냥! 모험을 떠나자냥! 🎲',
            'en', 'The session has started, nya! Let''s go on an adventure! 🎲'
        )::text,
        p_party_id
    FROM party_members pm
    WHERE pm.party_id = p_party_id AND pm.status = 'accepted' AND pm.user_id != auth.uid();

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. advance_turn
CREATE FUNCTION advance_turn(
    p_session_id UUID
) RETURNS void AS $$
DECLARE
    v_session RECORD;
    v_next_index INT;
    v_next_user_id UUID;
BEGIN
    SELECT * INTO v_session FROM party_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;

    v_next_index := v_session.current_turn_index + 1;
    IF v_next_index >= array_length(v_session.turn_order, 1) THEN
        v_next_index := 0;
    END IF;

    UPDATE party_sessions SET current_turn_index = v_next_index WHERE id = p_session_id;

    IF v_session.turn_order IS NOT NULL AND array_length(v_session.turn_order, 1) > 0 THEN
        v_next_user_id := v_session.turn_order[v_next_index + 1];
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (v_next_user_id, 'party_status',
            jsonb_build_object(
                'ko', '네 차례다냥! 행동을 선택해달라냥! ⚔️',
                'en', 'It''s your turn, nya! Choose your action! ⚔️'
            )::text,
            v_session.party_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. complete_party_session
CREATE FUNCTION complete_party_session(
    p_session_id UUID
) RETURNS void AS $$
DECLARE
    v_session RECORD;
BEGIN
    SELECT * INTO v_session FROM party_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;

    UPDATE party_sessions SET status = 'completed', completed_at = NOW() WHERE id = p_session_id;

    UPDATE profiles SET exp = exp + 20, updated_at = NOW()
    WHERE id IN (
        SELECT user_id FROM party_members
        WHERE party_id = v_session.party_id AND status = 'accepted'
    );

    INSERT INTO notifications (user_id, type, message, party_id)
    SELECT pm.user_id, 'quest_complete',
        jsonb_build_object(
            'ko', '멀티 세션이 완료되었다냥! +20 EXP! 🎉',
            'en', 'Multi session complete, nya! +20 EXP! 🎉'
        )::text,
        v_session.party_id
    FROM party_members pm
    WHERE pm.party_id = v_session.party_id AND pm.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. handle_review_exp (trigger function for reviews INSERT)
CREATE FUNCTION handle_review_exp()
RETURNS trigger AS $$
DECLARE
    v_reviewer_nick TEXT;
    v_party_title TEXT;
BEGIN
    SELECT nickname INTO v_reviewer_nick FROM profiles WHERE id = NEW.reviewer_id;
    SELECT title INTO v_party_title FROM parties WHERE id = NEW.party_id;

    INSERT INTO notifications (user_id, type, message, party_id)
    VALUES (
        NEW.target_id,
        'review_received',
        jsonb_build_object(
            'ko', v_reviewer_nick || '님이 "' || v_party_title || '"에서 리뷰를 남겼다냥! ' || CASE WHEN NEW.rating = 1 THEN '👍' ELSE '👎' END,
            'en', v_reviewer_nick || ' left a review in "' || v_party_title || '", nya! ' || CASE WHEN NEW.rating = 1 THEN '👍' ELSE '👎' END
        )::text,
        NEW.party_id
    );

    INSERT INTO notifications (user_id, type, message, party_id)
    VALUES (
        NEW.reviewer_id,
        'exp_gained',
        jsonb_build_object(
            'ko', '리뷰 작성으로 +5 EXP를 얻었다냥! ✨',
            'en', 'Earned +5 EXP for writing a review, nya! ✨'
        )::text,
        NEW.party_id
    );

    IF NEW.rating = 1 THEN
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (
            NEW.target_id,
            'exp_gained',
            jsonb_build_object(
                'ko', '좋은 리뷰를 받아서 +10 EXP를 얻었다냥! ✨',
                'en', 'Earned +10 EXP from a positive review, nya! ✨'
            )::text,
            NEW.party_id
        );
    END IF;

    UPDATE profiles SET exp = exp + 5, updated_at = NOW() WHERE id = NEW.reviewer_id;
    IF NEW.rating = 1 THEN
        UPDATE profiles SET exp = exp + 10, updated_at = NOW() WHERE id = NEW.target_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.handle_review_exp() SET search_path = public;

-- 10. complete_party_exp
CREATE FUNCTION complete_party_exp(p_party_id UUID)
RETURNS void AS $$
DECLARE
    v_member RECORD;
    v_party_title TEXT;
BEGIN
    SELECT title INTO v_party_title FROM parties WHERE id = p_party_id;

    FOR v_member IN
        SELECT user_id FROM party_members WHERE party_id = p_party_id AND status = 'accepted'
    LOOP
        UPDATE profiles SET exp = exp + 30, updated_at = NOW() WHERE id = v_member.user_id;
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (
            v_member.user_id,
            'exp_gained',
            jsonb_build_object(
                'ko', '"' || v_party_title || '" 완료로 +30 EXP를 얻었다냥! 🎉',
                'en', 'Earned +30 EXP for completing "' || v_party_title || '", nya! 🎉'
            )::text,
            p_party_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION public.complete_party_exp(UUID) SET search_path = public;

-- 11. handle_referral_signup
CREATE FUNCTION handle_referral_signup(
    p_referred_id UUID,
    p_referral_code TEXT
) RETURNS void AS $$
DECLARE
    v_referrer_id UUID;
    v_referred_nick TEXT;
BEGIN
    SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = p_referral_code;
    IF NOT FOUND THEN RETURN; END IF;

    SELECT nickname INTO v_referred_nick FROM profiles WHERE id = p_referred_id;

    INSERT INTO referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, p_referred_id, 'signed_up')
    ON CONFLICT (referred_id) DO NOTHING;

    UPDATE profiles SET exp = exp + 100, updated_at = NOW() WHERE id = v_referrer_id;

    INSERT INTO notifications (user_id, type, message, link_path)
    VALUES (
        v_referrer_id,
        'referral_signup',
        jsonb_build_object(
            'ko', v_referred_nick || '님이 초대 링크로 가입했다냥! +100 EXP 획득!',
            'en', v_referred_nick || ' signed up via your invite link, nya! +100 EXP earned!'
        )::text,
        '/my'
    );

    IF NOT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_referred_id AND status = 'active') THEN
        INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, source)
        VALUES (
            p_referred_id, 'monthly', 'active', NOW(), NOW() + INTERVAL '7 days', 'referral_trial'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            expires_at = GREATEST(subscriptions.expires_at, NOW() + INTERVAL '7 days'),
            updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. handle_referral_premium_reward
CREATE FUNCTION handle_referral_premium_reward(
    p_referred_id UUID
) RETURNS void AS $$
DECLARE
    v_referral RECORD;
    v_referred_nick TEXT;
BEGIN
    SELECT * INTO v_referral FROM referrals WHERE referred_id = p_referred_id AND status = 'signed_up';
    IF NOT FOUND THEN RETURN; END IF;

    SELECT nickname INTO v_referred_nick FROM profiles WHERE id = p_referred_id;

    UPDATE referrals SET status = 'premium_converted', converted_at = NOW() WHERE id = v_referral.id;

    INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, source)
    VALUES (
        v_referral.referrer_id, 'monthly', 'active', NOW(), NOW() + INTERVAL '7 days', 'referral_reward'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        expires_at = GREATEST(subscriptions.expires_at, NOW()) + INTERVAL '7 days',
        updated_at = NOW();

    INSERT INTO notifications (user_id, type, message, link_path)
    VALUES (
        v_referral.referrer_id,
        'referral_premium',
        jsonb_build_object(
            'ko', v_referred_nick || '님이 프리미엄에 가입했다냥! 보상으로 7일 프리미엄 추가!',
            'en', v_referred_nick || ' subscribed to Premium, nya! 7 days Premium added as reward!'
        )::text,
        '/my'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Re-create triggers dropped by CASCADE =====
CREATE TRIGGER on_join_request
    AFTER INSERT ON party_members
    FOR EACH ROW EXECUTE FUNCTION public.notify_join_request();

CREATE TRIGGER on_join_result
    AFTER UPDATE ON party_members
    FOR EACH ROW EXECUTE FUNCTION public.notify_join_result();

CREATE TRIGGER on_party_status_change
    AFTER UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION public.notify_party_status();

CREATE TRIGGER on_review_exp
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_exp();
