-- 냥퀘스트 분위기에 맞지 않는 앱 제거
DELETE FROM ads_manager WHERE app_name IN ('Plip', '월세장부');

-- 배너 이미지 URL 업데이트
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/dreamflow_banner.webp' WHERE app_name = 'DreamFlow';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/jellypocket_banner.webp' WHERE app_name = '젤리포켓';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/realpay_banner.webp' WHERE app_name = 'RealPay';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/pilltime_banner.webp' WHERE app_name = 'PillTime';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/singan_banner.webp' WHERE app_name = '신간요정';
