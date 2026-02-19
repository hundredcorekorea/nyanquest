-- Reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('post', 'comment', 'user', 'session_message')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'cheating', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked users table
CREATE TABLE public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Reports: users can insert their own reports, read their own
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- Blocked users: users can manage their own blocks
CREATE POLICY "Users can block others"
    ON public.blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view own blocks"
    ON public.blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
    ON public.blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- RPC: Check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for fast lookups
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_status ON public.reports(status);
