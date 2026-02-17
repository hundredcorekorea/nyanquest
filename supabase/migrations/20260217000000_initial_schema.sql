-- NyanQuest Initial Schema
-- TRPG Party Finder & Archive with Cat Mascot

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRPG Systems master table
CREATE TABLE trpg_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed official systems
INSERT INTO trpg_systems (name, is_official) VALUES
    ('D&D 5e', true),
    ('Call of Cthulhu 7th', true),
    ('Dungeon World', true),
    ('Pathfinder 2e', true),
    ('FATE Core', true),
    ('Blades in the Dark', true),
    ('Vampire: The Masquerade', true),
    ('기타 (직접 입력)', false);

-- 2. User profiles (linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    discord_username TEXT,
    cat_type TEXT DEFAULT 'basic_tabby',
    cat_exp INTEGER DEFAULT 0,
    style_tags JSONB DEFAULT '[]'::jsonb,
    manner_temp DECIMAL(3, 1) DEFAULT 36.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Parties (recruitment posts)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gm_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    system_id UUID REFERENCES trpg_systems(id),
    custom_system_name TEXT,
    max_players INTEGER NOT NULL CHECK (max_players BETWEEN 1 AND 20),
    current_players INTEGER DEFAULT 1,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN ('online', 'offline', 'hybrid')),
    discord_invite_url TEXT,
    location TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'filled', 'completed', 'cancelled')),
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Party members (N:M)
CREATE TABLE party_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('GM', 'PL')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(party_id, user_id)
);

-- 5. Manner reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN -1 AND 1),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reviewer_id, target_id, party_id)
);

-- 6. Session logs (Phase 1: external links only)
CREATE TABLE session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    external_url TEXT,
    summary TEXT,
    session_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX idx_parties_status ON parties(status);
CREATE INDEX idx_parties_system ON parties(system_id);
CREATE INDEX idx_parties_meeting_type ON parties(meeting_type);
CREATE INDEX idx_parties_created_at ON parties(created_at DESC);
CREATE INDEX idx_parties_gm_id ON parties(gm_id);
CREATE INDEX idx_party_members_user ON party_members(user_id);
CREATE INDEX idx_party_members_party ON party_members(party_id);
CREATE INDEX idx_reviews_target ON reviews(target_id);

-- ===== ROW LEVEL SECURITY =====

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Parties (recruitment posts) - public read for SEO
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties are viewable by everyone"
    ON parties FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create parties"
    ON parties FOR INSERT WITH CHECK (auth.uid() = gm_id);

CREATE POLICY "GMs can update own parties"
    ON parties FOR UPDATE USING (auth.uid() = gm_id);

CREATE POLICY "GMs can delete own parties"
    ON parties FOR DELETE USING (auth.uid() = gm_id);

-- Party members
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members are viewable by everyone"
    ON party_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join parties"
    ON party_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
    ON party_members FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.uid() IN (SELECT gm_id FROM parties WHERE id = party_id)
    );

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can write reviews"
    ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Session logs
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session logs are viewable by everyone"
    ON session_logs FOR SELECT USING (true);

CREATE POLICY "Authors can create session logs"
    ON session_logs FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own session logs"
    ON session_logs FOR UPDATE USING (auth.uid() = author_id);

-- ===== FUNCTIONS =====

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, avatar_url, discord_username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'adventurer_' || LEFT(NEW.id::text, 8)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'custom_claims' ->> 'global_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update manner_temp based on reviews
CREATE OR REPLACE FUNCTION public.update_manner_temp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET manner_temp = 36.5 + (
        SELECT COALESCE(AVG(rating) * 5, 0)
        FROM reviews
        WHERE target_id = NEW.target_id
    )
    WHERE id = NEW.target_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_created
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_manner_temp();
