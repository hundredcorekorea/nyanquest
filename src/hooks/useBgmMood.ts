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
 * Detect the mood category from GM response text.
 * Returns the highest priority matching category, or "explore" as fallback.
 */
function detectMood(text: string): BgmCategory {
  for (const { category, keywords } of MOOD_PATTERNS) {
    if (keywords.test(text)) {
      return category;
    }
  }
  return "explore";
}

/**
 * Hook that tracks BGM mood based on GM messages.
 * Only triggers category change when mood actually changes.
 */
export function useBgmMood(onCategoryChange: (category: BgmCategory) => void) {
  const lastCategoryRef = useRef<BgmCategory | null>(null);

  const analyzeMessage = useCallback(
    (gmText: string) => {
      const mood = detectMood(gmText);
      if (mood !== lastCategoryRef.current) {
        lastCategoryRef.current = mood;
        onCategoryChange(mood);
      }
    },
    [onCategoryChange]
  );

  return { analyzeMessage, detectMood };
}
