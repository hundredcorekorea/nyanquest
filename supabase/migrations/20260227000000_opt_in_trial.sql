-- Opt-in Free Trial: Replace auto-trial with user-initiated trial
-- Users click "Start Free Trial" → inserts a 7-day trial subscription

-- 1. Add 'trial' to subscriptions plan CHECK constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
    CHECK (plan IN ('monthly', 'yearly', 'trial'));

-- 2. Override is_premium(): only check active subscriptions (trial is now a subscription)
CREATE OR REPLACE FUNCTION public.is_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_premium BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
          AND expires_at > NOW()
    ) INTO v_is_premium;

    RETURN v_is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. start_free_trial(): creates a 7-day trial subscription
--    Fails if user already has any subscription history
CREATE OR REPLACE FUNCTION public.start_free_trial(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_has_sub BOOLEAN;
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Check for any subscription history (including expired trials)
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
    ) INTO v_has_sub;

    IF v_has_sub THEN
        RETURN json_build_object('success', false, 'error', 'already_used');
    END IF;

    v_trial_end := NOW() + INTERVAL '7 days';

    INSERT INTO subscriptions (user_id, plan, status, amount, started_at, expires_at)
    VALUES (p_user_id, 'trial', 'active', 0, NOW(), v_trial_end);

    RETURN json_build_object('success', true, 'expires_at', v_trial_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Override get_trial_info(): check for active trial subscription
CREATE OR REPLACE FUNCTION public.get_trial_info(p_user_id UUID)
RETURNS TABLE(
    is_trial BOOLEAN,
    trial_ends_at TIMESTAMPTZ,
    trial_days_left INTEGER
) AS $$
DECLARE
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Find active trial subscription
    SELECT s.expires_at INTO v_trial_end
    FROM subscriptions s
    WHERE s.user_id = p_user_id
      AND s.plan = 'trial'
      AND s.status = 'active'
      AND s.expires_at > NOW()
    LIMIT 1;

    IF v_trial_end IS NOT NULL THEN
        RETURN QUERY SELECT TRUE, v_trial_end,
            GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_trial_end - NOW())) / 86400)::INTEGER);
    ELSE
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. can_start_trial(): check if user is eligible for trial
CREATE OR REPLACE FUNCTION public.can_start_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
