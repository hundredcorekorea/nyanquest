"use client";

import { useCallback, useRef } from "react";
import type { BgmCategory } from "./useBgmPlayer";

/** Keyword patterns mapped to BGM categories, ordered by priority */
const MOOD_PATTERNS: { category: BgmCategory; keywords: RegExp }[] = [
  // Victory / defeat first (short-lived, high priority)
  {
    category: "victory",
    keywords:
      /퀘스트 완료|승리|성공|클리어|축하|해냈|이겼|victory|success|cleared|congratulations|you did it|you won/i,
  },
  {
    category: "defeat",
    keywords:
      /실패|패배|게임 오버|쓰러|죽|함정|전멸|defeat|game over|you died|you fell|failed|trapped/i,
  },
  // Battle (high energy)
  {
    category: "battle",
    keywords:
      /전투|싸움|공격|방어|적이|몬스터|용|검|활|마법 공격|피해|데미지|HP|체력|전사|추격|쫓|도망|기습|결투|battle|fight|attack|defend|enemy|monster|dragon|sword|damage|combat|chase|ambush|duel|slash|strike/i,
  },
  // Horror
  {
    category: "horror",
    keywords:
      /으스스|공포|유령|저주|어둠|그림자|비명|소름|귀신|악몽|피|horror|ghost|curse|dark|shadow|scream|nightmare|blood|haunted|creepy|whisper/i,
  },
  // Comedy
  {
    category: "comedy",
    keywords:
      /웃|장난|코믹|황당|엉뚱|깡총|귀여|파티|축제|요리|시장|수다|comedy|funny|joke|silly|cute|party|festival|cooking|prank|gossip|laugh/i,
  },
  // Puzzle / mystery
  {
    category: "puzzle",
    keywords:
      /수수께끼|퍼즐|단서|추리|암호|해독|비밀|조사|탐정|puzzle|riddle|clue|mystery|investigate|decode|secret|detective|mechanism|library/i,
  },
  // Calm (conversation, rest)
  {
    category: "calm",
    keywords:
      /대화|휴식|마을|주점|여관|모닥불|치유|회복|친구|동료|협상|평화|calm|rest|village|tavern|inn|campfire|heal|recover|friend|companion|negotiate|peace|stargazing/i,
  },
  // Explore (default adventure)
  {
    category: "explore",
    keywords:
      /탐험|이동|걸|숲|동굴|유적|성|사막|바다|산|시장|던전|explore|walk|forest|cave|ruins|castle|desert|ocean|mountain|dungeon|corridor|path|journey|travel/i,
  },
];

/**
 * Track-level keyword patterns within each category.
 * Ordered by specificity — first match wins.
 * If no track matches, a random track from the category is used.
 */
const TRACK_PATTERNS: Partial<Record<BgmCategory, { trackId: string; keywords: RegExp }[]>> = {
  explore: [
    { trackId: "explore_01_dungeon_crawl", keywords: /던전|지하실|dungeon|underground room/i },
    { trackId: "explore_02_forest_path", keywords: /숲|나무|오솔길|forest|tree|woods|path/i },
    { trackId: "explore_03_space_walk", keywords: /우주|행성|별|space|planet|star|galaxy/i },
    { trackId: "explore_04_ancient_ruins", keywords: /유적|신전|고대|폐허|ruins|temple|ancient/i },
    { trackId: "explore_05_underground_cave", keywords: /동굴|지하|cave|cavern|grotto/i },
    { trackId: "explore_06_castle_hall", keywords: /성|궁전|복도|castle|palace|hall|corridor/i },
    { trackId: "explore_07_desert_journey", keywords: /사막|모래|desert|sand|oasis/i },
    { trackId: "explore_08_ocean_voyage", keywords: /바다|해|항해|배|ocean|sea|ship|sail|voyage/i },
    { trackId: "explore_09_snowy_mountain", keywords: /산|눈|설산|얼음|mountain|snow|ice|peak|summit/i },
    { trackId: "explore_10_marketplace", keywords: /시장|상점|가게|상인|market|shop|merchant|vendor/i },
  ],
  battle: [
    { trackId: "battle_07_dragon_fight", keywords: /용|드래곤|화염|dragon|drake|fire breath|wyrm/i },
    { trackId: "battle_01_boss_fight", keywords: /보스|최종|강력한 적|boss|final|powerful enemy/i },
    { trackId: "battle_02_chase_scene", keywords: /추격|쫓|도주|chase|pursue|run away|flee/i },
    { trackId: "battle_03_ambush", keywords: /기습|습격|매복|ambush|surprise attack|sudden/i },
    { trackId: "battle_04_duel", keywords: /결투|일대일|맞서|duel|one.on.one|face off/i },
    { trackId: "battle_05_space_battle", keywords: /우주 전투|함선|레이저|space battle|starship|laser/i },
    { trackId: "battle_06_stealth", keywords: /잠입|은밀|숨|몰래|stealth|sneak|infiltrate|hide|shadow/i },
    { trackId: "battle_08_escape", keywords: /탈출|도망|무너|escape|flee|collapse|crumble/i },
    { trackId: "battle_09_monster_encounter", keywords: /몬스터|괴물|조우|creature|monster|beast|encounter/i },
    { trackId: "battle_10_victory_march", keywords: /행진|진군|march|advance|charge/i },
  ],
  puzzle: [
    { trackId: "puzzle_01_riddle", keywords: /수수께끼|질문|riddle|question/i },
    { trackId: "puzzle_02_investigation", keywords: /탐정|추리|범인|investigation|detective|crime/i },
    { trackId: "puzzle_03_ancient_mechanism", keywords: /장치|톱니|기계|mechanism|gear|device|machine/i },
    { trackId: "puzzle_04_magic_discovery", keywords: /마법|발견|마나|magic|discover|mana|spell/i },
    { trackId: "puzzle_05_time_paradox", keywords: /시간|역설|과거|미래|time|paradox|past|future/i },
    { trackId: "puzzle_06_hidden_passage", keywords: /비밀 통로|숨겨진|hidden|passage|secret door/i },
    { trackId: "puzzle_07_code_breaking", keywords: /암호|해독|코드|code|cipher|decode|encrypt/i },
    { trackId: "puzzle_08_library_search", keywords: /도서관|책|문서|library|book|scroll|tome/i },
  ],
  calm: [
    { trackId: "calm_01_tavern", keywords: /주점|술집|맥주|tavern|pub|bar|ale|beer/i },
    { trackId: "calm_02_village", keywords: /마을|아침|village|town|morning/i },
    { trackId: "calm_03_campfire", keywords: /모닥불|캠프|야영|campfire|camp|bonfire/i },
    { trackId: "calm_04_royal_audience", keywords: /왕|알현|궁정|king|queen|royal|audience|throne/i },
    { trackId: "calm_05_healing", keywords: /치유|회복|힐|heal|recover|rest|cure|potion/i },
    { trackId: "calm_06_friendship", keywords: /친구|동료|우정|friend|companion|comrade|bond/i },
    { trackId: "calm_07_stargazing", keywords: /별|밤하늘|달|star|night sky|moon|gaze/i },
    { trackId: "calm_08_negotiation", keywords: /협상|거래|외교|negotiat|deal|diplomat|trade/i },
  ],
  comedy: [
    { trackId: "comedy_01_cat_kingdom", keywords: /고양이|냥|cat|meow|kitten|paw/i },
    { trackId: "comedy_02_clumsy_moment", keywords: /실수|넘어|미끄|clumsy|trip|slip|fall/i },
    { trackId: "comedy_03_cooking", keywords: /요리|음식|cook|food|recipe|kitchen/i },
    { trackId: "comedy_04_shopping", keywords: /흥정|사다|구매|haggle|buy|purchase|shop/i },
    { trackId: "comedy_05_party", keywords: /파티|축제|축하|party|festival|celebrat/i },
    { trackId: "comedy_06_prank", keywords: /장난|함정|prank|trick|trap|mischief/i },
    { trackId: "comedy_07_race", keywords: /경주|달리|race|run|sprint|compete/i },
    { trackId: "comedy_08_gossip", keywords: /소문|수다|비밀|gossip|rumor|whisper|secret/i },
  ],
  horror: [
    { trackId: "horror_01_haunted_library", keywords: /도서관|책|유령.*도서|library|haunt.*book/i },
    { trackId: "horror_02_dark_corridor", keywords: /복도|통로|어두운 길|corridor|hallway|dark path/i },
    { trackId: "horror_03_ghost_whisper", keywords: /속삭|유령.*목소리|whisper|ghost.*voice|murmur/i },
    { trackId: "horror_04_curse", keywords: /저주|주문|curse|hex|spell|incantation/i },
    { trackId: "horror_05_something_watching", keywords: /지켜보|시선|눈|watch|stare|eyes|gaze|feeling/i },
    { trackId: "horror_06_nightmare", keywords: /악몽|꿈|nightmare|dream|sleep/i },
  ],
};

export interface MoodResult {
  category: BgmCategory;
  trackId: string | null;
}

/**
 * Detect the mood from GM response text.
 * Returns category + optional specific trackId.
 */
function detectMood(text: string): MoodResult {
  let category: BgmCategory = "explore";

  for (const { category: cat, keywords } of MOOD_PATTERNS) {
    if (keywords.test(text)) {
      category = cat;
      break;
    }
  }

  // Try to match a specific track within the category
  const trackPatterns = TRACK_PATTERNS[category];
  if (trackPatterns) {
    for (const { trackId, keywords } of trackPatterns) {
      if (keywords.test(text)) {
        return { category, trackId };
      }
    }
  }

  return { category, trackId: null };
}

/**
 * Hook that tracks BGM mood based on GM messages.
 * Calls onMoodChange with category + optional trackId.
 */
export function useBgmMood(
  onMoodChange: (category: BgmCategory, trackId: string | null) => void
) {
  const lastKeyRef = useRef<string | null>(null);

  const analyzeMessage = useCallback(
    (gmText: string) => {
      const { category, trackId } = detectMood(gmText);
      // Deduplicate by category+trackId combo
      const key = trackId ? `${category}:${trackId}` : category;
      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        onMoodChange(category, trackId);
      }
    },
    [onMoodChange]
  );

  return { analyzeMessage, detectMood };
}
