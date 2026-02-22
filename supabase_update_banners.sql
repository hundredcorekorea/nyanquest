-- 배너 이미지 URL 업데이트 (Vercel에서 public/ 파일은 / 경로로 접근)
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/dreamflow_banner.webp' WHERE app_name = 'DreamFlow';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/jellypocket_banner.webp' WHERE app_name = '젤리포켓';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/realpay_banner.webp' WHERE app_name = 'RealPay';
UPDATE ads_manager SET banner_url = 'https://nyanquest.vercel.app/promo/pilltime_banner.webp' WHERE app_name = 'PillTime';
