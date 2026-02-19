-- Fix handle_new_user trigger:
-- 1. Fix JSONB syntax error (->>' then ->> on TEXT is invalid)
-- 2. Handle Google OAuth avatar (uses 'picture' instead of 'avatar_url')
-- 3. Handle duplicate nicknames (UNIQUE constraint)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _nickname TEXT;
BEGIN
    _nickname := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'adventurer_' || LEFT(NEW.id::text, 8)
    );

    -- Handle duplicate nicknames by appending random suffix
    IF EXISTS (SELECT 1 FROM public.profiles WHERE nickname = _nickname) THEN
        _nickname := _nickname || '_' || LEFT(gen_random_uuid()::text, 4);
    END IF;

    INSERT INTO public.profiles (id, nickname, avatar_url, discord_username)
    VALUES (
        NEW.id,
        _nickname,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        NEW.raw_user_meta_data->'custom_claims'->>'global_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
