-- Fix "RLS Policy Always True" warning on public.notifications.
-- The INSERT policy "System can insert notifications" used WITH CHECK (true),
-- which is overly permissive. All notification inserts happen inside
-- SECURITY DEFINER functions or via admin client, so they bypass RLS anyway.
-- Dropping this policy prevents any client-side direct INSERT.

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
