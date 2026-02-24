-- Prevent duplicate subscriptions for the same payment
ALTER TABLE subscriptions
  ADD CONSTRAINT unique_subscription_payment UNIQUE (portone_payment_id);
