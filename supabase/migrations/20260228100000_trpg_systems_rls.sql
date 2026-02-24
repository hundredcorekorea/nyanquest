-- Enable RLS on trpg_systems (fixes Security Advisor warning)
-- This is a read-only public reference table, so allow SELECT for everyone.
ALTER TABLE trpg_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trpg_systems"
    ON trpg_systems FOR SELECT USING (true);
