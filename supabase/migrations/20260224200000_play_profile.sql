-- Add play profile fields to profiles
ALTER TABLE profiles ADD COLUMN favorite_works JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN preferred_elements TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN avoided_elements TEXT[] NOT NULL DEFAULT '{}';

-- favorite_works structure: [{"title": "...", "reason": "..."}, ...]
COMMENT ON COLUMN profiles.favorite_works IS 'Up to 3 works that represent the user''s taste. [{title, reason}]';
