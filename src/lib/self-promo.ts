export interface SelfPromo {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  emoji: string;
  link: string;
}

const PROMO_APPS: SelfPromo[] = [
  {
    id: "dreamflow",
    nameKo: "DreamFlow",
    nameEn: "DreamFlow",
    descKo: "AI와 함께하는 꿈 일기 & 꿈 해석",
    descEn: "AI Dream Journal & Dream Analysis",
    emoji: "🌙",
    link: "https://play.google.com/store/apps/details?id=com.reaf.dreamflow",
  },
  {
    id: "jellypocket",
    nameKo: "젤리포켓",
    nameEn: "JellyPocket",
    descKo: "귀여운 젤리와 함께하는 용돈기입장",
    descEn: "Cute pocket money tracker with Jelly",
    emoji: "🍬",
    link: "https://play.google.com/store/apps/details?id=com.reaf.jellypocket",
  },
  {
    id: "realpay",
    nameKo: "RealPay",
    nameEn: "RealPay",
    descKo: "실시간 시급 계산기 — 내 진짜 시급은?",
    descEn: "Real-time hourly pay calculator",
    emoji: "💰",
    link: "https://play.google.com/store/apps/details?id=com.reaf.realpay",
  },
  {
    id: "pilltime",
    nameKo: "PillTime",
    nameEn: "PillTime",
    descKo: "영양제 & 약 복용 알림",
    descEn: "Supplement & medication reminder",
    emoji: "💊",
    link: "https://play.google.com/store/apps/details?id=com.reaf.pill_time",
  },
  {
    id: "plip",
    nameKo: "Plip",
    nameEn: "Plip",
    descKo: "작은 습관이 큰 변화를 만드는 식물 관리",
    descEn: "Small habits, big changes — plant care",
    emoji: "🌱",
    link: "https://play.google.com/store/apps/details?id=com.lyuft.plant_care_app",
  },
  {
    id: "wolse",
    nameKo: "월세장부",
    nameEn: "Wolse Ledger",
    descKo: "월세 & 전세 관리 장부",
    descEn: "Rent & deposit management ledger",
    emoji: "🏠",
    link: "https://play.google.com/store/apps/details?id=com.reaf.wolseledger",
  },
  {
    id: "singanyojeong",
    nameKo: "신간요정",
    nameEn: "Book Fairy",
    descKo: "신간 도서 알림 & 독서 기록",
    descEn: "New book alerts & reading tracker",
    emoji: "📚",
    link: "https://play.google.com/store/apps/details?id=com.reaf.singanyojeong",
  },
];

export function getRandomPromo(): SelfPromo {
  const idx = Math.floor(Math.random() * PROMO_APPS.length);
  return PROMO_APPS[idx];
}
