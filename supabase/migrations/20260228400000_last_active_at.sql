-- Track user last activity for retention analysis.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing users with their last sign-in from auth.users
UPDATE profiles p
SET last_active_at = COALESCE(u.last_sign_in_at, p.created_at)
FROM auth.users u
WHERE u.id = p.id;
