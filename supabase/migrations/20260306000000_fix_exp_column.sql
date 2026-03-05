-- Fix: complete_solo_quest was using wrong column name "exp" instead of "cat_exp"
-- Also fixes: missing exp_earned update, missing user_id check, double-claim guard

DROP FUNCTION IF EXISTS complete_solo_quest(UUID, UUID, INT);

CREATE FUNCTION complete_solo_quest(
    p_quest_id UUID,
    p_user_id UUID,
    p_exp_amount INT DEFAULT 15
) RETURNS void AS $$
BEGIN
    -- Update quest status + exp_earned (with user_id check for security)
    -- Guard: only award EXP if not already claimed (exp_earned = 0 or NULL)
    UPDATE solo_quests
    SET status = 'completed',
        exp_earned = p_exp_amount,
        completed_at = COALESCE(completed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_quest_id
      AND user_id = p_user_id
      AND (exp_earned IS NULL OR exp_earned = 0);

    -- Only add EXP to profile if the quest was actually updated (not already claimed)
    IF FOUND THEN
        UPDATE profiles
        SET cat_exp = cat_exp + p_exp_amount,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- Bilingual notification
        INSERT INTO notifications (user_id, type, message)
        VALUES (
            p_user_id,
            'exp_gained',
            jsonb_build_object(
                'ko', '수련 완료! +' || p_exp_amount || ' EXP를 얻었다냥! ✨',
                'en', 'Training complete! +' || p_exp_amount || ' EXP earned, nya! ✨'
            )::text
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION complete_solo_quest(UUID, UUID, INT) SET search_path = public;
