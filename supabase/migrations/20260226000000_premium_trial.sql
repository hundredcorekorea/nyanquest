-- Premium Trial System: 7-day free trial for new users
-- Trial = profile created within 7 days AND no subscription history

-- 1. Override is_premium() to include trial check
CREATE OR REPLACE FUNCTION public.is_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_premium BOOLEAN;
    v_has_subscription_history BOOLEAN;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- Check 1: Active paid subscription (existing logic)
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
          AND expires_at > NOW()
    ) INTO v_is_premium;

    IF v_is_premium THEN
        RETURN TRUE;
    END IF;

    -- Check 2: Any subscription history = no re-trial
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
    ) INTO v_has_subscription_history;

    IF v_has_subscription_history THEN
        RETURN FALSE;
    END IF;

    -- Check 3: Profile created within 7 days = trial
    SELECT p.created_at INTO v_created_at
    FROM profiles p
    WHERE p.id = p_user_id;

    IF v_created_at IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (v_created_at + INTERVAL '7 days') > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. New function: get trial status and days remaining
CREATE OR REPLACE FUNCTION public.get_trial_info(p_user_id UUID)
RETURNS TABLE(
    is_trial BOOLEAN,
    trial_ends_at TIMESTAMPTZ,
    trial_days_left INTEGER
) AS $$
DECLARE
    v_created_at TIMESTAMPTZ;
    v_has_sub BOOLEAN;
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Any subscription history = no trial
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
    ) INTO v_has_sub;

    IF v_has_sub THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
        RETURN;
    END IF;

    -- Get profile creation date
    SELECT p.created_at INTO v_created_at
    FROM profiles p
    WHERE p.id = p_user_id;

    IF v_created_at IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
        RETURN;
    END IF;

    v_trial_end := v_created_at + INTERVAL '7 days';

    IF v_trial_end > NOW() THEN
        RETURN QUERY SELECT TRUE, v_trial_end,
            GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_trial_end - NOW())) / 86400)::INTEGER);
    ELSE
        RETURN QUERY SELECT FALSE, v_trial_end, 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
