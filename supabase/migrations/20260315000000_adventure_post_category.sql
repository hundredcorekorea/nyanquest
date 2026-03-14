-- Add 'adventure' to posts category constraint for quest log sharing
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts ADD CONSTRAINT posts_category_check CHECK (category IN ('free', 'tip', 'gallery', 'qna', 'adventure'));
