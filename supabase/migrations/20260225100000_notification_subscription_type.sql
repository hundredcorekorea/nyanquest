-- Add subscription_started to notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'join_request', 'join_accepted', 'join_rejected',
        'party_status', 'review_received', 'exp_gained',
        'quest_complete', 'gm_assigned', 'subscription_started'
    ));
