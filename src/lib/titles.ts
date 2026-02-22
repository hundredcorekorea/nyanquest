export interface TitleDef {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  condition: string;
  conditionEn: string;
  category: "solo" | "party" | "gm" | "reputation" | "community" | "growth" | "special";
}

export const TITLES: TitleDef[] = [
  // Solo
  { id: "first_step", name: "첫 발걸음", nameEn: "First Step", emoji: "🐾", description: "첫 솔로 퀘스트를 완료한 모험가", descriptionEn: "Adventurer who completed their first solo quest", condition: "솔로 퀘스트 1회 완료", conditionEn: "Complete 1 solo quest", category: "solo" },
  { id: "trainee", name: "수련생", nameEn: "Trainee", emoji: "🥋", description: "꾸준히 수련하는 견습 모험가", descriptionEn: "Apprentice adventurer in steady training", condition: "솔로 퀘스트 5회 완료", conditionEn: "Complete 5 solo quests", category: "solo" },
  { id: "solo_master", name: "고독한 수련가", nameEn: "Solo Master", emoji: "⚔️", description: "홀로 수많은 모험을 헤쳐온 강자", descriptionEn: "Mighty warrior who conquered countless adventures alone", condition: "솔로 퀘스트 20회 완료", conditionEn: "Complete 20 solo quests", category: "solo" },

  // Party
  { id: "party_starter", name: "파티 개척자", nameEn: "Party Pioneer", emoji: "🚀", description: "첫 파티를 결성한 리더", descriptionEn: "Leader who formed their first party", condition: "파티 1회 생성", conditionEn: "Create 1 party", category: "party" },
  { id: "social_cat", name: "사교적인 냥이", nameEn: "Social Cat", emoji: "🤝", description: "여러 파티에서 활약한 사교가", descriptionEn: "Socialite who excelled in multiple parties", condition: "파티 3회 참가", conditionEn: "Join 3 parties", category: "party" },
  { id: "veteran_player", name: "역전의 모험가", nameEn: "Veteran Adventurer", emoji: "🏅", description: "수많은 세션을 완주한 베테랑", descriptionEn: "Veteran who completed countless sessions", condition: "파티 10회 완료", conditionEn: "Complete 10 parties", category: "party" },

  // GM
  { id: "first_gm", name: "신입 마스터", nameEn: "Novice Master", emoji: "📖", description: "첫 GM을 경험한 이야기꾼", descriptionEn: "Storyteller who experienced their first GM role", condition: "GM 1회 수행", conditionEn: "GM 1 session", category: "gm" },
  { id: "gm_pro", name: "프로 마스터", nameEn: "Pro Master", emoji: "🎭", description: "능숙하게 세션을 이끄는 마스터", descriptionEn: "Master who skillfully leads sessions", condition: "GM 5회 완료", conditionEn: "Complete 5 GM sessions", category: "gm" },

  // Reputation
  { id: "warm_heart", name: "따뜻한 고양이", nameEn: "Warm Cat", emoji: "💛", description: "모두에게 따뜻한 매너의 소유자", descriptionEn: "Owner of warm manners loved by all", condition: "매너온도 38° 이상", conditionEn: "Manner temp 38°+", category: "reputation" },
  { id: "hot_cat", name: "뜨거운 냥이", nameEn: "Hot Cat", emoji: "🔥", description: "넘치는 열정과 매너의 달인", descriptionEn: "Master of overflowing passion and manners", condition: "매너온도 40° 이상", conditionEn: "Manner temp 40°+", category: "reputation" },

  // Community
  { id: "reviewer", name: "꼼꼼한 리뷰어", nameEn: "Keen Reviewer", emoji: "📝", description: "성실하게 리뷰를 남기는 평론가", descriptionEn: "Diligent critic who leaves thorough reviews", condition: "리뷰 10개 작성", conditionEn: "Write 10 reviews", category: "community" },
  { id: "writer", name: "길드홀 작가", nameEn: "Guild Hall Writer", emoji: "✍️", description: "길드홀에서 활발히 활동하는 작가", descriptionEn: "Active writer in the guild hall", condition: "커뮤니티 글 5개 작성", conditionEn: "Write 5 community posts", category: "community" },

  // Growth
  { id: "exp_hunter", name: "경험치 사냥꾼", nameEn: "EXP Hunter", emoji: "💎", description: "경험치를 끊임없이 모으는 사냥꾼", descriptionEn: "Hunter who endlessly gathers experience", condition: "EXP 300 달성", conditionEn: "Reach 300 EXP", category: "growth" },
  { id: "legend", name: "전설의 집사님", nameEn: "Legendary Butler", emoji: "👑", description: "정점에 도달한 전설적 존재", descriptionEn: "A legendary being who reached the pinnacle", condition: "EXP 500 달성", conditionEn: "Reach 500 EXP", category: "growth" },

  // Special
  { id: "premium_cat", name: "프리미엄 냥이", nameEn: "Premium Cat", emoji: "✨", description: "프리미엄 구독으로 모험을 지원하는 후원자", descriptionEn: "Patron who supports adventures with premium", condition: "프리미엄 구독", conditionEn: "Premium subscription", category: "special" },
  { id: "first_explorer", name: "최초의 탐험가", nameEn: "First Explorer", emoji: "🌟", description: "냥퀘스트의 첫 번째 모험가. 전설의 시작.", descriptionEn: "The very first adventurer of nyanQuest. Where the legend began.", condition: "냥퀘스트 1호 유저", conditionEn: "nyanQuest User #1", category: "special" },
];

export const TITLE_MAP = Object.fromEntries(TITLES.map((t) => [t.id, t]));

export function getTitleDef(titleId: string): TitleDef | undefined {
  return TITLE_MAP[titleId];
}
