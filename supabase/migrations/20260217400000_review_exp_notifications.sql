-- Add missing notification triggers for review_received and exp_gained

-- 1. Notify target when they receive a review + EXP notification
-- Replace handle_review_exp to also send notifications
CREATE OR REPLACE FUNCTION public.handle_review_exp()
RETURNS TRIGGER AS $$
DECLARE
    v_reviewer_nick TEXT;
    v_party_title TEXT;
BEGIN
    -- Reviewer gets +5 EXP
    PERFORM add_exp(NEW.reviewer_id, 5);

    -- Target gets +10 EXP if positive
    IF NEW.rating = 1 THEN
        PERFORM add_exp(NEW.target_id, 10);
    END IF;

    -- Get reviewer nickname and party title for notification message
    SELECT nickname INTO v_reviewer_nick FROM profiles WHERE id = NEW.reviewer_id;
    SELECT title INTO v_party_title FROM parties WHERE id = NEW.party_id;

    -- Notify target about received review
    INSERT INTO notifications (user_id, type, message, party_id)
    VALUES (
        NEW.target_id,
        'review_received',
        v_reviewer_nick || '님이 "' || v_party_title || '"에서 리뷰를 남겼다냥! ' ||
            CASE WHEN NEW.rating = 1 THEN '👍' ELSE '👎' END,
        NEW.party_id
    );

    -- EXP gained notification for reviewer
    INSERT INTO notifications (user_id, type, message, party_id)
    VALUES (
        NEW.reviewer_id,
        'exp_gained',
        '리뷰 작성으로 +5 EXP를 얻었다냥! ✨',
        NEW.party_id
    );

    -- EXP gained notification for target (positive review only)
    IF NEW.rating = 1 THEN
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (
            NEW.target_id,
            'exp_gained',
            '좋은 리뷰를 받아서 +10 EXP를 얻었다냥! ✨',
            NEW.party_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update complete_party_exp to also send EXP notifications
CREATE OR REPLACE FUNCTION public.complete_party_exp(p_party_id UUID)
RETURNS VOID AS $$
DECLARE
    v_member RECORD;
    v_party_title TEXT;
BEGIN
    SELECT title INTO v_party_title FROM parties WHERE id = p_party_id;

    FOR v_member IN
        SELECT user_id FROM party_members
        WHERE party_id = p_party_id AND status = 'accepted'
    LOOP
        PERFORM add_exp(v_member.user_id, 30);

        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (
            v_member.user_id,
            'exp_gained',
            '"' || v_party_title || '" 완료로 +30 EXP를 얻었다냥! 🎉',
            p_party_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
