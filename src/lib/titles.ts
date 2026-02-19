export interface TitleDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: string;
  category: "solo" | "party" | "gm" | "reputation" | "community" | "growth" | "special";
}

export const TITLES: TitleDef[] = [
  // Solo
  { id: "first_step", name: "첫 발걸음", emoji: "🐾", description: "첫 솔로 퀘스트를 완료한 모험가", condition: "솔로 퀘스트 1회 완료", category: "solo" },
  { id: "trainee", name: "수련생", emoji: "🥋", description: "꾸준히 수련하는 견습 모험가", condition: "솔로 퀘스트 5회 완료", category: "solo" },
  { id: "solo_master", name: "고독한 수련가", emoji: "⚔️", description: "홀로 수많은 모험을 헤쳐온 강자", condition: "솔로 퀘스트 20회 완료", category: "solo" },

  // Party
  { id: "party_starter", name: "파티 개척자", emoji: "🚀", description: "첫 파티를 결성한 리더", condition: "파티 1회 생성", category: "party" },
  { id: "social_cat", name: "사교적인 냥이", emoji: "🤝", description: "여러 파티에서 활약한 사교가", condition: "파티 3회 참가", category: "party" },
  { id: "veteran_player", name: "역전의 모험가", emoji: "🏅", description: "수많은 세션을 완주한 베테랑", condition: "파티 10회 완료", category: "party" },

  // GM
  { id: "first_gm", name: "신입 마스터", emoji: "📖", description: "첫 GM을 경험한 이야기꾼", condition: "GM 1회 수행", category: "gm" },
  { id: "gm_pro", name: "프로 마스터", emoji: "🎭", description: "능숙하게 세션을 이끄는 마스터", condition: "GM 5회 완료", category: "gm" },

  // Reputation
  { id: "warm_heart", name: "따뜻한 고양이", emoji: "💛", description: "모두에게 따뜻한 매너의 소유자", condition: "매너온도 38° 이상", category: "reputation" },
  { id: "hot_cat", name: "뜨거운 냥이", emoji: "🔥", description: "넘치는 열정과 매너의 달인", condition: "매너온도 40° 이상", category: "reputation" },

  // Community
  { id: "reviewer", name: "꼼꼼한 리뷰어", emoji: "📝", description: "성실하게 리뷰를 남기는 평론가", condition: "리뷰 10개 작성", category: "community" },
  { id: "writer", name: "길드홀 작가", emoji: "✍️", description: "길드홀에서 활발히 활동하는 작가", condition: "커뮤니티 글 5개 작성", category: "community" },

  // Growth
  { id: "exp_hunter", name: "경험치 사냥꾼", emoji: "💎", description: "경험치를 끊임없이 모으는 사냥꾼", condition: "EXP 300 달성", category: "growth" },
  { id: "legend", name: "전설의 집사님", emoji: "👑", description: "정점에 도달한 전설적 존재", condition: "EXP 500 달성", category: "growth" },

  // Special
  { id: "premium_cat", name: "프리미엄 냥이", emoji: "✨", description: "프리미엄 구독으로 모험을 지원하는 후원자", condition: "프리미엄 구독", category: "special" },
];

export const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));

export function getTitleDef(titleId: string): TitleDef | undefined {
  return TITLE_MAP[titleId];
}
