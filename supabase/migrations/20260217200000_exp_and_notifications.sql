-- Phase 1.5: EXP System + Notifications

-- ===== 1. EXP HELPER FUNCTION =====
CREATE OR REPLACE FUNCTION public.add_exp(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET cat_exp = cat_exp + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 2. AUTO EXP ON REVIEW =====
-- +5 EXP for reviewer, +10 EXP for target if positive review
CREATE OR REPLACE FUNCTION public.handle_review_exp()
RETURNS TRIGGER AS $$
BEGIN
    -- Reviewer gets +5 EXP
    PERFORM add_exp(NEW.reviewer_id, 5);
    -- Target gets +10 EXP if positive
    IF NEW.rating = 1 THEN
        PERFORM add_exp(NEW.target_id, 10);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_exp
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_exp();

-- ===== 3. NOTIFICATIONS TABLE =====
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('join_request', 'join_accepted', 'join_rejected', 'party_status', 'review_received', 'exp_gained')),
    message TEXT NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ===== 4. NOTIFICATION TRIGGERS =====

-- Notify GM when someone requests to join
CREATE OR REPLACE FUNCTION public.notify_join_request()
RETURNS TRIGGER AS $$
DECLARE
    v_gm_id UUID;
    v_party_title TEXT;
    v_user_nick TEXT;
BEGIN
    SELECT gm_id, title INTO v_gm_id, v_party_title
    FROM parties WHERE id = NEW.party_id;

    SELECT nickname INTO v_user_nick
    FROM profiles WHERE id = NEW.user_id;

    IF NEW.status = 'pending' AND NEW.role = 'PL' THEN
        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (v_gm_id, 'join_request',
            v_user_nick || '님이 "' || v_party_title || '" 파티에 참가 신청했다냥!',
            NEW.party_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_join_request
    AFTER INSERT ON party_members
    FOR EACH ROW EXECUTE FUNCTION public.notify_join_request();

-- Notify PL when accepted/rejected
CREATE OR REPLACE FUNCTION public.notify_join_result()
RETURNS TRIGGER AS $$
DECLARE
    v_party_title TEXT;
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
        SELECT title INTO v_party_title
        FROM parties WHERE id = NEW.party_id;

        IF NEW.status = 'accepted' THEN
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (NEW.user_id, 'join_accepted',
                '"' || v_party_title || '" 파티에 합류했다냥! 환영이다냥!',
                NEW.party_id);
        ELSE
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (NEW.user_id, 'join_rejected',
                '"' || v_party_title || '" 참가가 거절되었다냥... 다른 모험을 찾아보자냥!',
                NEW.party_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_join_result
    AFTER UPDATE ON party_members
    FOR EACH ROW EXECUTE FUNCTION public.notify_join_result();

-- Notify all members when party status changes
CREATE OR REPLACE FUNCTION public.notify_party_status()
RETURNS TRIGGER AS $$
DECLARE
    v_member RECORD;
    v_msg TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'filled' THEN v_msg := '"' || NEW.title || '" 모집이 마감되었다냥!';
            WHEN 'completed' THEN v_msg := '"' || NEW.title || '" 모험이 완료되었다냥! 리뷰를 남겨보자냥!';
            WHEN 'cancelled' THEN v_msg := '"' || NEW.title || '" 모험이 취소되었다냥...';
            ELSE v_msg := '"' || NEW.title || '" 상태가 변경되었다냥!';
        END CASE;

        FOR v_member IN
            SELECT user_id FROM party_members
            WHERE party_id = NEW.id AND status = 'accepted' AND user_id != NEW.gm_id
        LOOP
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (v_member.user_id, 'party_status', v_msg, NEW.id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_party_status_change
    AFTER UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION public.notify_party_status();

-- ===== 5. MISSING: session_logs delete policy =====
CREATE POLICY "Authors can delete own session logs"
    ON session_logs FOR DELETE USING (auth.uid() = author_id);

-- ===== 6. RPC: Mark all notifications as read =====
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = true
    WHERE user_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 7. RPC: Add EXP for party completion (all members) =====
CREATE OR REPLACE FUNCTION public.complete_party_exp(p_party_id UUID)
RETURNS VOID AS $$
DECLARE
    v_member RECORD;
BEGIN
    FOR v_member IN
        SELECT user_id FROM party_members
        WHERE party_id = p_party_id AND status = 'accepted'
    LOOP
        PERFORM add_exp(v_member.user_id, 30);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
