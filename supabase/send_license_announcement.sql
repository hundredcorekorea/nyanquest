-- Send license/copyright notice announcement to ALL existing users.
-- Run this ONCE in Supabase SQL Editor after deploying the migration.
-- Make sure 20260225200000_announcement_notification_type.sql has been applied first.

INSERT INTO notifications (user_id, type, message, link_path)
SELECT
    id AS user_id,
    'announcement',
    '📋 TRPG 룰북 저작권 관련 안내가 추가되었다냥! 냥퀘스트의 라이선스 정책을 확인해보라냥~',
    '/licenses'
FROM profiles;
