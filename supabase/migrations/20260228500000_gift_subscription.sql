-- Gift subscription support: allow users to gift premium to others

-- Add gift_to column to payments (who the gift is for)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gift_to UUID REFERENCES profiles(id);

-- Add gifted_by column to subscriptions (who paid for this gift)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES profiles(id);

-- Index for looking up gifts sent/received
CREATE INDEX IF NOT EXISTS idx_payments_gift_to ON payments(gift_to) WHERE gift_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_gifted_by ON subscriptions(gifted_by) WHERE gifted_by IS NOT NULL;

-- Expand notification types to include gift_received
-- Must include ALL existing types from previous migrations
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_request', 'join_accepted', 'join_rejected',
    'party_status', 'review_received', 'exp_gained',
    'quest_complete', 'gm_assigned',
    'subscription_started', 'subscription_expiring',
    'announcement',
    'referral_signup', 'referral_premium',
    'gift_received'
  )
);
