-- Referral/Invite System
-- Users can invite friends via referral code. Both sides get rewards.

-- ===== 1. Add referral_code to profiles =====
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Backfill existing users
UPDATE profiles
SET referral_code = UPPER(LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 8))
WHERE referral_code IS NULL;

ALTER TABLE profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN referral_code
    SET DEFAULT UPPER(LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 8));

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- ===== 2. Create referrals table =====
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    signup_rewarded BOOLEAN DEFAULT false,
    premium_rewarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT USING (auth.uid() = referrer_id);

-- ===== 3. Add notification types =====
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'join_request', 'join_accepted', 'join_rejected',
        'party_status', 'review_received', 'exp_gained',
        'quest_complete', 'gm_assigned', 'subscription_started',
        'announcement', 'referral_signup', 'referral_premium'
    ));

-- ===== 4. Update handle_new_user to generate referral_code =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _nickname TEXT;
  _referral_code TEXT;
BEGIN
    _nickname := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'adventurer_' || LEFT(NEW.id::text, 8)
    );

    IF EXISTS (SELECT 1 FROM public.profiles WHERE nickname = _nickname) THEN
        _nickname := _nickname || '_' || LEFT(gen_random_uuid()::text, 4);
    END IF;

    _referral_code := UPPER(LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 8));
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _referral_code) LOOP
        _referral_code := UPPER(LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 8));
    END LOOP;

    INSERT INTO public.profiles (id, nickname, avatar_url, discord_username, referral_code)
    VALUES (
        NEW.id,
        _nickname,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        NEW.raw_user_meta_data->'custom_claims'->>'global_name',
        _referral_code
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 5. process_referral: called after new user signup =====
CREATE OR REPLACE FUNCTION public.process_referral(
    p_referred_id UUID,
    p_referral_code TEXT
)
RETURNS JSON AS $$
DECLARE
    v_referrer_id UUID;
    v_referrer_nick TEXT;
    v_referred_nick TEXT;
BEGIN
    SELECT id, nickname INTO v_referrer_id, v_referrer_nick
    FROM profiles
    WHERE referral_code = UPPER(p_referral_code);

    IF v_referrer_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'invalid_code');
    END IF;

    IF v_referrer_id = p_referred_id THEN
        RETURN json_build_object('success', false, 'error', 'self_referral');
    END IF;

    IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
        RETURN json_build_object('success', false, 'error', 'already_referred');
    END IF;

    INSERT INTO referrals (referrer_id, referred_id, signup_rewarded)
    VALUES (v_referrer_id, p_referred_id, true);

    -- Reward referrer: +100 EXP
    PERFORM add_exp(v_referrer_id, 100);

    SELECT nickname INTO v_referred_nick FROM profiles WHERE id = p_referred_id;

    -- Notify referrer
    INSERT INTO notifications (user_id, type, message, link_path)
    VALUES (
        v_referrer_id,
        'referral_signup',
        v_referred_nick || '님이 초대 링크로 가입했다냥! +100 EXP 획득!',
        '/my'
    );

    -- Give referred user 7-day trial (if no prior subscription)
    IF NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = p_referred_id) THEN
        INSERT INTO subscriptions (user_id, plan, status, amount, started_at, expires_at)
        VALUES (p_referred_id, 'trial', 'active', 0, NOW(), NOW() + INTERVAL '7 days');
    END IF;

    RETURN json_build_object('success', true, 'referrer_nickname', v_referrer_nick);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 6. reward_referrer_premium: called when referred user buys premium =====
CREATE OR REPLACE FUNCTION public.reward_referrer_premium(p_referred_id UUID)
RETURNS VOID AS $$
DECLARE
    v_referral RECORD;
    v_referred_nick TEXT;
    v_active_sub RECORD;
BEGIN
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_id = p_referred_id
      AND premium_rewarded = false;

    IF v_referral IS NULL THEN
        RETURN;
    END IF;

    SELECT nickname INTO v_referred_nick FROM profiles WHERE id = p_referred_id;

    UPDATE referrals SET premium_rewarded = true WHERE id = v_referral.id;

    -- Extend or create 7-day premium for referrer
    SELECT * INTO v_active_sub
    FROM subscriptions
    WHERE user_id = v_referral.referrer_id
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF v_active_sub IS NOT NULL THEN
        UPDATE subscriptions
        SET expires_at = expires_at + INTERVAL '7 days'
        WHERE id = v_active_sub.id;
    ELSE
        INSERT INTO subscriptions (user_id, plan, status, amount, started_at, expires_at)
        VALUES (v_referral.referrer_id, 'trial', 'active', 0, NOW(), NOW() + INTERVAL '7 days');
    END IF;

    INSERT INTO notifications (user_id, type, message, link_path)
    VALUES (
        v_referral.referrer_id,
        'referral_premium',
        v_referred_nick || '님이 프리미엄에 가입했다냥! 보상으로 7일 프리미엄 추가!',
        '/my'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 7. get_my_referral_stats: for /my page =====
CREATE OR REPLACE FUNCTION public.get_my_referral_stats(p_user_id UUID)
RETURNS TABLE(
    referral_code TEXT,
    total_referrals BIGINT,
    signup_rewards BIGINT,
    premium_rewards BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.referral_code,
        COUNT(r.id) AS total_referrals,
        COUNT(r.id) FILTER (WHERE r.signup_rewarded) AS signup_rewards,
        COUNT(r.id) FILTER (WHERE r.premium_rewarded) AS premium_rewards
    FROM profiles p
    LEFT JOIN referrals r ON r.referrer_id = p.id
    WHERE p.id = p_user_id
    GROUP BY p.referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
