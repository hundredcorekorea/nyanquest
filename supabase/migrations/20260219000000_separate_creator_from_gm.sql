-- Separate party creator (파티장) from GM (게임 진행자)
-- Creator = admin who manages the party
-- GM = game facilitator, recruitable separately

-- ===== 1. SCHEMA CHANGES =====

-- Add creator_id column
ALTER TABLE parties ADD COLUMN creator_id UUID REFERENCES profiles(id);

-- Backfill: all existing parties have creator = gm
UPDATE parties SET creator_id = gm_id;

-- Make creator_id NOT NULL after backfill
ALTER TABLE parties ALTER COLUMN creator_id SET NOT NULL;

-- Make gm_id nullable (party can exist without a GM)
ALTER TABLE parties ALTER COLUMN gm_id DROP NOT NULL;

-- Add looking_for_gm convenience boolean
ALTER TABLE parties ADD COLUMN looking_for_gm BOOLEAN DEFAULT false;

-- Backfill: existing parties all have GMs
UPDATE parties SET looking_for_gm = (gm_id IS NULL);

-- Indexes
CREATE INDEX idx_parties_creator_id ON parties(creator_id);
CREATE INDEX idx_parties_looking_for_gm ON parties(looking_for_gm) WHERE looking_for_gm = true;

-- ===== 2. RLS POLICY UPDATES =====

-- Drop old gm_id-based policies
DROP POLICY "Authenticated users can create parties" ON parties;
DROP POLICY "GMs can update own parties" ON parties;
DROP POLICY "GMs can delete own parties" ON parties;
DROP POLICY "Users can update own membership" ON party_members;

-- New creator_id-based policies
CREATE POLICY "Authenticated users can create parties"
    ON parties FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own parties"
    ON parties FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own parties"
    ON parties FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Users can update own membership or creator can manage"
    ON party_members FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() IN (SELECT creator_id FROM parties WHERE id = party_id)
    );

-- ===== 3. TRIGGER: sync looking_for_gm =====

CREATE OR REPLACE FUNCTION public.sync_looking_for_gm()
RETURNS TRIGGER AS $$
BEGIN
    NEW.looking_for_gm := (NEW.gm_id IS NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_looking_for_gm_trigger
    BEFORE INSERT OR UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION public.sync_looking_for_gm();

-- ===== 4. UPDATE NOTIFICATION TRIGGERS =====

-- notify_join_request: send to creator instead of gm
-- Also allow GM applicants (remove role='PL' filter)
CREATE OR REPLACE FUNCTION public.notify_join_request()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_id UUID;
    v_party_title TEXT;
    v_user_nick TEXT;
    v_role_label TEXT;
BEGIN
    SELECT creator_id, title INTO v_creator_id, v_party_title
    FROM parties WHERE id = NEW.party_id;

    SELECT nickname INTO v_user_nick
    FROM profiles WHERE id = NEW.user_id;

    IF NEW.status = 'pending' THEN
        IF NEW.role = 'GM' THEN
            v_role_label := 'GM으로';
        ELSE
            v_role_label := 'PL로';
        END IF;

        INSERT INTO notifications (user_id, type, message, party_id)
        VALUES (v_creator_id, 'join_request',
            v_user_nick || '님이 "' || v_party_title || '" 파티에 ' || v_role_label || ' 참가 신청했다냥!',
            NEW.party_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- notify_party_status: exclude creator from self-notifications
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
            WHERE party_id = NEW.id AND status = 'accepted' AND user_id != NEW.creator_id
        LOOP
            INSERT INTO notifications (user_id, type, message, party_id)
            VALUES (v_member.user_id, 'party_status', v_msg, NEW.id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5. EXPAND NOTIFICATION TYPES =====

ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'join_request', 'join_accepted', 'join_rejected',
        'party_status', 'review_received', 'exp_gained',
        'quest_complete', 'gm_assigned'
    ));
