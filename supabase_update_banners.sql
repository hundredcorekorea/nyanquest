-- 냥퀘스트 분위기에 맞지 않는 앱 제거
DELETE FROM ads_manager WHERE app_name IN ('Plip', '월세장부');

-- 배너 이미지 URL 업데이트
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/dreamflow_banner.webp' WHERE app_name = 'DreamFlow';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/jellypocket_banner.webp' WHERE app_name = '젤리포켓';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/realpay_banner.webp' WHERE app_name = 'RealPay';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/pilltime_banner.webp' WHERE app_name = 'PillTime';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/singan_banner.webp' WHERE app_name = '신간요정';

-- 커뮤니티 placement 광고 추가 (같은 앱들, 다른 위치)
INSERT INTO ads_manager (app_name, title, description, banner_url, link, placement, priority) VALUES
  ('DreamFlow', 'AI와 함께하는 꿈 일기 & 꿈 해석', 'AI Dream Journal & Dream Analysis', 'https://nyanquest.vercel.app/promo/dreamflow_banner.webp', 'https://play.google.com/store/apps/details?id=com.reaf.dreamflow', 'community', 5),
  ('젤리포켓', '귀여운 젤리와 함께하는 용돈기입장', 'Cute pocket money tracker with Jelly', 'https://nyanquest.vercel.app/promo/jellypocket_banner.webp', 'https://play.google.com/store/apps/details?id=com.reaf.jellypocket', 'community', 3),
  ('RealPay', '실시간 시급 계산기 — 내 진짜 시급은?', 'Real-time hourly pay calculator', 'https://nyanquest.vercel.app/promo/realpay_banner.webp', 'https://play.google.com/store/apps/details?id=com.reaf.realpay', 'community', 3),
  ('PillTime', '영양제 & 약 복용 알림', 'Supplement & medication reminder', 'https://nyanquest.vercel.app/promo/pilltime_banner.webp', 'https://play.google.com/store/apps/details?id=com.reaf.pill_time', 'community', 3),
  ('신간요정', '신간 도서 알림 & 독서 기록', 'New book alerts & reading tracker', 'https://nyanquest.vercel.app/promo/singan_banner.webp', 'https://play.google.com/store/apps/details?id=com.reaf.singanyojeong', 'community', 2);
