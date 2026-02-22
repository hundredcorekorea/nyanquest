-- ads_manager 테이블 생성
CREATE TABLE IF NOT EXISTS ads_manager (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  img_url TEXT,
  banner_url TEXT,
  link TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'home' CHECK (placement IN ('home', 'adgate', 'solo', 'community')),
  priority INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE ads_manager ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (공개 광고)
CREATE POLICY "Anyone can read active ads"
  ON ads_manager FOR SELECT
  USING (active = true);

-- 초기 프로모 데이터 삽입
INSERT INTO ads_manager (app_name, title, description, img_url, banner_url, link, placement, priority) VALUES
  ('DreamFlow', 'AI와 함께하는 꿈 일기 & 꿈 해석', 'AI Dream Journal & Dream Analysis', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.dreamflow', 'home', 5),
  ('젤리포켓', '귀여운 젤리와 함께하는 용돈기입장', 'Cute pocket money tracker with Jelly', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.jellypocket', 'home', 3),
  ('RealPay', '실시간 시급 계산기 — 내 진짜 시급은?', 'Real-time hourly pay calculator', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.realpay', 'home', 3),
  ('PillTime', '영양제 & 약 복용 알림', 'Supplement & medication reminder', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.pill_time', 'home', 3),
  ('Plip', '작은 습관이 큰 변화를 만드는 식물 관리', 'Small habits, big changes — plant care', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.lyuft.plant_care_app', 'home', 3),
  ('월세장부', '월세 & 전세 관리 장부', 'Rent & deposit management ledger', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.wolseledger', 'home', 2),
  ('신간요정', '신간 도서 알림 & 독서 기록', 'New book alerts & reading tracker', NULL, NULL, 'https://play.google.com/store/apps/details?id=com.reaf.singanyojeong', 'home', 2);
