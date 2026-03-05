/**
 * Cat Rank System — EXP-based progression tiers
 *
 * Displayed prominently on profile, leaderboard, and share cards.
 * Separate from achievement titles (lib/titles.ts) — this is the "main rank".
 */

export interface CatRank {
  tier: number;
  minExp: number;
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  color: string; // tailwind text color
  bgColor: string; // tailwind bg color for badge
}

export const CAT_RANKS: CatRank[] = [
  { tier: 0,  minExp: 0,    id: "stray",           name: "동네 백수 냥이",         nameEn: "Stray Alley Cat",           emoji: "🐱", color: "text-gray-400",   bgColor: "bg-gray-100" },
  { tier: 1,  minExp: 30,   id: "curious",          name: "호기심 냥이",           nameEn: "Curious Kitten",            emoji: "😺", color: "text-gray-500",   bgColor: "bg-gray-200" },
  { tier: 2,  minExp: 80,   id: "apprentice",       name: "초보 모험냥",           nameEn: "Apprentice Adventurer",     emoji: "🐾", color: "text-green-500",  bgColor: "bg-green-100" },
  { tier: 3,  minExp: 150,  id: "wanderer",         name: "떠돌이 냥검사",         nameEn: "Wandering Cat Swordsman",   emoji: "⚔️", color: "text-green-600",  bgColor: "bg-green-100" },
  { tier: 4,  minExp: 250,  id: "dungeon_cat",      name: "던전 탐험냥",           nameEn: "Dungeon Explorer Cat",      emoji: "🗝️", color: "text-blue-500",   bgColor: "bg-blue-100" },
  { tier: 5,  minExp: 400,  id: "shadow_walker",    name: "어둠을 걷는 그림자 냥", nameEn: "Shadow Walking Cat",        emoji: "🌑", color: "text-blue-600",   bgColor: "bg-blue-100" },
  { tier: 6,  minExp: 600,  id: "beast_tamer",      name: "마수를 다스리는 냥이",   nameEn: "Beast Tamer Cat",           emoji: "🐲", color: "text-purple-500", bgColor: "bg-purple-100" },
  { tier: 7,  minExp: 850,  id: "storm_claw",       name: "폭풍의 발톱",           nameEn: "Storm Claw",                emoji: "⚡", color: "text-purple-600", bgColor: "bg-purple-100" },
  { tier: 8,  minExp: 1200, id: "dragon_slayer",    name: "드래곤 슬레이어 냥",     nameEn: "Dragon Slayer Cat",         emoji: "🔥", color: "text-orange-500", bgColor: "bg-orange-100" },
  { tier: 9,  minExp: 1600, id: "archmage_cat",     name: "대마법냥",              nameEn: "Archmage Cat",              emoji: "🧙", color: "text-orange-600", bgColor: "bg-orange-100" },
  { tier: 10, minExp: 2200, id: "mythic_guardian",   name: "신화의 수호냥",         nameEn: "Mythic Guardian Cat",       emoji: "🛡️", color: "text-red-500",    bgColor: "bg-red-100" },
  { tier: 11, minExp: 3000, id: "celestial",        name: "천상의 냥신",           nameEn: "Celestial Cat God",         emoji: "✨", color: "text-red-600",    bgColor: "bg-red-100" },
  { tier: 12, minExp: 4000, id: "dimensional",      name: "차원을 넘는 냥이",      nameEn: "Dimensional Cat",           emoji: "🌀", color: "text-pink-500",   bgColor: "bg-pink-100" },
  { tier: 13, minExp: 5500, id: "eternal",          name: "영겁의 전설냥",         nameEn: "Eternal Legend Cat",         emoji: "👑", color: "text-amber-500",  bgColor: "bg-amber-100" },
  { tier: 14, minExp: 8000, id: "transcendent",     name: "초월자 냥",            nameEn: "Transcendent Cat",           emoji: "💫", color: "text-amber-600",  bgColor: "bg-amber-200" },
];

/**
 * Get the current rank for a given EXP amount.
 */
export function getCatRank(exp: number): CatRank {
  for (let i = CAT_RANKS.length - 1; i >= 0; i--) {
    if (exp >= CAT_RANKS[i].minExp) return CAT_RANKS[i];
  }
  return CAT_RANKS[0];
}

/**
 * Get the next rank to work toward (or null if max).
 */
export function getNextRank(exp: number): CatRank | null {
  for (const rank of CAT_RANKS) {
    if (exp < rank.minExp) return rank;
  }
  return null;
}

/**
 * Calculate progress percentage toward next rank.
 */
export function getRankProgress(exp: number): number {
  const current = getCatRank(exp);
  const next = getNextRank(exp);
  if (!next) return 100;
  return Math.min(((exp - current.minExp) / (next.minExp - current.minExp)) * 100, 100);
}

/**
 * Get share text for the user's current rank.
 */
export function getRankShareText(exp: number, locale: "ko" | "en"): string {
  const rank = getCatRank(exp);
  if (locale === "ko") {
    return `나는 냥퀘스트에서 "${rank.name}" ${rank.emoji} (EXP ${exp}) 냥이다! 🐱`;
  }
  return `I'm a "${rank.nameEn}" ${rank.emoji} (EXP ${exp}) in nyanQuest! 🐱`;
}
