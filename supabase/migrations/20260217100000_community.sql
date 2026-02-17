-- NyanQuest Community: Posts, Comments, Likes

-- 1. Community posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('free', 'tip', 'gallery', 'qna')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    system_id UUID REFERENCES trpg_systems(id),
    view_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Likes (꾹꾹이)
CREATE TABLE post_likes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- ===== INDEXES =====
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_system ON posts(system_id);
CREATE INDEX idx_posts_likes ON posts(likes_count DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);

-- ===== RLS =====

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
    ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
    ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
    ON posts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
    ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
    ON comments FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
    ON post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
    ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
    ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

-- Auto-update comments_count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- Auto-update likes_count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Auto-increment view_count function (called from client)
CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
