-- Announcements table for guild hall bulletin board
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'update' CHECK (category IN ('update', 'event', 'maintenance', 'tip')),
  language TEXT NOT NULL DEFAULT 'ko',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Everyone can read, only service role can insert/update/delete
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT USING (true);

-- Index for ordering
CREATE INDEX idx_announcements_pinned_date ON announcements(is_pinned DESC, created_at DESC);
CREATE INDEX idx_announcements_language ON announcements(language);

-- Initial announcements (Korean)
INSERT INTO announcements (title, content, category, language, is_pinned) VALUES
(
  '냥퀘스트에 오신 것을 환영한다냥! 🐱',
  '모험자 여러분, 냥퀘스트 길드홀에 오신 것을 환영한다냥!

이곳에서는 다양한 TRPG 모험을 즐길 수 있다냥:
• 솔로 퀘스트: AI GM과 함께 혼자서도 모험을 떠날 수 있다냥
• 파티 모집: 다른 모험자들과 함께 파티를 꾸려 던전에 도전하라냥
• AI GM 멀티플레이: AI가 진행하는 비동기 파티 세션을 즐겨보라냥
• 시나리오 마켓: 다른 모험자들이 만든 시나리오로 플레이할 수 있다냥
• 커뮤니티: 길드홀에서 다른 모험자들과 이야기를 나눠보라냥

프로필을 꾸미고 고양이 동료와 함께 모험을 시작하라냥!',
  'update',
  'ko',
  true
),
(
  '비동기 AI GM 멀티플레이 업데이트! ⚔️',
  '새로운 기능이 추가되었다냥!

🎲 라운드 기반 비동기 멀티플레이
파티원 전원이 행동을 제출하면 AI GM이 종합 내러티브를 진행한다냥.
각자 편한 시간에 행동을 입력하면 되니까 시간 맞추기 어려운 모험자들도 함께 플레이할 수 있다냥!

📜 알림 시스템
아직 행동을 제출하지 않은 파티원에게 알림이 간다냥. 내 차례를 놓치지 마라냥!

🏰 길드홀 게시판
바로 이 게시판이다냥! 공지사항과 업데이트 소식을 확인할 수 있다냥.',
  'update',
  'ko',
  false
),
(
  '시나리오 마켓 오픈! 📚',
  '드디어 시나리오 마켓이 열렸다냥!

이제 모험자들이 직접 시나리오를 만들고 공유할 수 있다냥:
• 나만의 시나리오를 작성해서 공유하라냥
• 다른 모험자가 만든 시나리오로 플레이할 수 있다냥
• 좋아요와 플레이 수로 인기 시나리오를 확인하라냥

판타지, 호러, 코미디, SF 등 다양한 장르의 시나리오를 즐겨보라냥!',
  'event',
  'ko',
  false
);

-- Initial announcements (English)
INSERT INTO announcements (title, content, category, language, is_pinned) VALUES
(
  'Welcome to NyanQuest, nya! 🐱',
  'Welcome to the NyanQuest Guild Hall, adventurers!

Here you can enjoy various TRPG adventures, nya:
• Solo Quests: Embark on adventures alone with an AI GM, nya
• Party Recruitment: Form parties with other adventurers and challenge dungeons, nya
• AI GM Multiplayer: Enjoy async party sessions run by AI, nya
• Scenario Market: Play scenarios created by other adventurers, nya
• Community: Chat with fellow adventurers in the Guild Hall, nya

Customize your profile and start your adventure with your cat companion, nya!',
  'update',
  'en',
  true
),
(
  'Async AI GM Multiplayer Update! ⚔️',
  'New features have arrived, nya!

🎲 Round-based Async Multiplayer
When all party members submit their actions, the AI GM weaves them into a combined narrative, nya.
Everyone can input actions at their own pace — perfect for adventurers with busy schedules, nya!

📜 Notification System
Party members who haven''t submitted their actions will receive notifications, nya. Don''t miss your turn!

🏰 Guild Hall Bulletin Board
This very board right here, nya! Check announcements and update news here.',
  'update',
  'en',
  false
),
(
  'Scenario Market is Open! 📚',
  'The Scenario Market has finally opened, nya!

Adventurers can now create and share their own scenarios:
• Write your own scenarios and share them with the world, nya
• Play scenarios created by other adventurers, nya
• Check popular scenarios by likes and play count, nya

Enjoy scenarios across various genres — fantasy, horror, comedy, sci-fi, and more, nya!',
  'event',
  'en',
  false
);
