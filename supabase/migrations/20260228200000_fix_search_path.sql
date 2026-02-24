-- Fix "Function Search Path Mutable" warnings from Supabase Security Advisor.
-- All SECURITY DEFINER functions need an explicit search_path to prevent
-- potential search_path manipulation attacks.

-- initial_schema
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_manner_temp() SET search_path = public;

-- exp_and_notifications
ALTER FUNCTION public.add_exp(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.handle_review_exp() SET search_path = public;
ALTER FUNCTION public.notify_join_request() SET search_path = public;
ALTER FUNCTION public.notify_join_result() SET search_path = public;
ALTER FUNCTION public.notify_party_status() SET search_path = public;
ALTER FUNCTION public.mark_notifications_read(UUID) SET search_path = public;
ALTER FUNCTION public.complete_party_exp(UUID) SET search_path = public;

-- community
ALTER FUNCTION public.update_comments_count() SET search_path = public;
ALTER FUNCTION public.update_likes_count() SET search_path = public;
ALTER FUNCTION public.increment_view_count(UUID) SET search_path = public;

-- solo_quests
ALTER FUNCTION public.get_daily_quest_count(UUID) SET search_path = public;
ALTER FUNCTION public.complete_solo_quest(UUID, UUID, INTEGER) SET search_path = public;

-- premium
ALTER FUNCTION public.is_premium(UUID) SET search_path = public;
ALTER FUNCTION public.get_active_subscription(UUID) SET search_path = public;

-- party_sessions
ALTER FUNCTION public.create_party_session(UUID, TEXT, INTEGER, BOOLEAN, TEXT) SET search_path = public;
ALTER FUNCTION public.advance_session_turn(UUID) SET search_path = public;
ALTER FUNCTION public.complete_party_session(UUID) SET search_path = public;

-- reports_and_blocks
ALTER FUNCTION public.is_blocked(UUID, UUID) SET search_path = public;

-- rate_limits
ALTER FUNCTION public.get_daily_solo_start_count(UUID) SET search_path = public;
ALTER FUNCTION public.get_weekly_multi_session_count(UUID) SET search_path = public;

-- separate_creator_from_gm
ALTER FUNCTION public.sync_looking_for_gm() SET search_path = public;

-- platform_stats
ALTER FUNCTION public.get_platform_stats() SET search_path = public;

-- avatars_and_titles
ALTER FUNCTION public.check_titles(UUID) SET search_path = public;

-- premium_trial
ALTER FUNCTION public.get_trial_info(UUID) SET search_path = public;
ALTER FUNCTION public.can_start_trial(UUID) SET search_path = public;
ALTER FUNCTION public.start_free_trial(UUID) SET search_path = public;

-- referral_system
ALTER FUNCTION public.process_referral(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.reward_referrer_premium(UUID) SET search_path = public;
ALTER FUNCTION public.get_my_referral_stats(UUID) SET search_path = public;
