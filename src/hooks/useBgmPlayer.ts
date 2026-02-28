"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type BgmCategory =
  | "explore"
  | "battle"
  | "puzzle"
  | "calm"
  | "comedy"
  | "horror"
  | "victory"
  | "defeat";

export interface BgmTrack {
  id: string;
  ko: string;
  en: string;
}

const STORAGE_KEY_ENABLED = "nyanquest_bgm_enabled";
const STORAGE_KEY_VOLUME = "nyanquest_bgm_volume";
const CROSSFADE_DURATION = 2; // seconds
const DEFAULT_VOLUME = 0.3;

/** Category display names */
export const BGM_CATEGORY_LABELS: Record<BgmCategory, { ko: string; en: string }> = {
  explore: { ko: "탐험/이동", en: "Explore" },
  battle: { ko: "전투/긴장", en: "Battle" },
  puzzle: { ko: "퍼즐/미스터리", en: "Puzzle" },
  calm: { ko: "대화/평화", en: "Calm" },
  comedy: { ko: "코미디/일상", en: "Comedy" },
  horror: { ko: "호러/으스스", en: "Horror" },
  victory: { ko: "승리/축하", en: "Victory" },
  defeat: { ko: "실패/좌절", en: "Defeat" },
};

/** BGM track catalog with display names */
export const BGM_CATALOG: Record<BgmCategory, BgmTrack[]> = {
  explore: [
    { id: "explore_01_dungeon_crawl", ko: "던전 탐색", en: "Dungeon Crawl" },
    { id: "explore_02_forest_path", ko: "숲속 오솔길", en: "Forest Path" },
    { id: "explore_03_space_walk", ko: "우주 유영", en: "Space Walk" },
    { id: "explore_04_ancient_ruins", ko: "고대 유적", en: "Ancient Ruins" },
    { id: "explore_05_underground_cave", ko: "지하 동굴", en: "Underground Cave" },
    { id: "explore_06_castle_hall", ko: "성 복도", en: "Castle Hall" },
    { id: "explore_07_desert_journey", ko: "사막 여행", en: "Desert Journey" },
    { id: "explore_08_ocean_voyage", ko: "바다 항해", en: "Ocean Voyage" },
    { id: "explore_09_snowy_mountain", ko: "설산 등반", en: "Snowy Mountain" },
    { id: "explore_10_marketplace", ko: "활기찬 시장", en: "Marketplace" },
  ],
  battle: [
    { id: "battle_01_boss_fight", ko: "보스전", en: "Boss Fight" },
    { id: "battle_02_chase_scene", ko: "추격전", en: "Chase Scene" },
    { id: "battle_03_ambush", ko: "기습", en: "Ambush" },
    { id: "battle_04_duel", ko: "일대일 결투", en: "Duel" },
    { id: "battle_05_space_battle", ko: "우주 전투", en: "Space Battle" },
    { id: "battle_06_stealth", ko: "은밀한 잠입", en: "Stealth" },
    { id: "battle_07_dragon_fight", ko: "용과의 전투", en: "Dragon Fight" },
    { id: "battle_08_escape", ko: "급박한 탈출", en: "Escape" },
    { id: "battle_09_monster_encounter", ko: "몬스터 조우", en: "Monster Encounter" },
    { id: "battle_10_victory_march", ko: "승리의 행진", en: "Victory March" },
  ],
  puzzle: [
    { id: "puzzle_01_riddle", ko: "수수께끼", en: "Riddle" },
    { id: "puzzle_02_investigation", ko: "탐정 추리", en: "Investigation" },
    { id: "puzzle_03_ancient_mechanism", ko: "고대 장치", en: "Ancient Mechanism" },
    { id: "puzzle_04_magic_discovery", ko: "마법 발견", en: "Magic Discovery" },
    { id: "puzzle_05_time_paradox", ko: "시간의 역설", en: "Time Paradox" },
    { id: "puzzle_06_hidden_passage", ko: "비밀 통로", en: "Hidden Passage" },
    { id: "puzzle_07_code_breaking", ko: "암호 해독", en: "Code Breaking" },
    { id: "puzzle_08_library_search", ko: "도서관 탐색", en: "Library Search" },
  ],
  calm: [
    { id: "calm_01_tavern", ko: "주점에서의 대화", en: "Tavern Talk" },
    { id: "calm_02_village", ko: "평화로운 마을", en: "Peaceful Village" },
    { id: "calm_03_campfire", ko: "모닥불 휴식", en: "Campfire Rest" },
    { id: "calm_04_royal_audience", ko: "왕 앞의 알현", en: "Royal Audience" },
    { id: "calm_05_healing", ko: "치유와 회복", en: "Healing" },
    { id: "calm_06_friendship", ko: "동료와의 우정", en: "Friendship" },
    { id: "calm_07_stargazing", ko: "밤하늘 별보기", en: "Stargazing" },
    { id: "calm_08_negotiation", ko: "진지한 협상", en: "Negotiation" },
  ],
  comedy: [
    { id: "comedy_01_cat_kingdom", ko: "고양이 왕국", en: "Cat Kingdom" },
    { id: "comedy_02_clumsy_moment", ko: "어설픈 실수", en: "Clumsy Moment" },
    { id: "comedy_03_cooking", ko: "신나는 요리", en: "Cooking Fun" },
    { id: "comedy_04_shopping", ko: "시장 흥정", en: "Market Shopping" },
    { id: "comedy_05_party", ko: "축하 파티", en: "Celebration Party" },
    { id: "comedy_06_prank", ko: "장난치기", en: "Prank" },
    { id: "comedy_07_race", ko: "우스꽝스러운 경주", en: "Silly Race" },
    { id: "comedy_08_gossip", ko: "속닥속닥 소문", en: "Gossip" },
  ],
  horror: [
    { id: "horror_01_haunted_library", ko: "유령 도서관", en: "Haunted Library" },
    { id: "horror_02_dark_corridor", ko: "어두운 복도", en: "Dark Corridor" },
    { id: "horror_03_ghost_whisper", ko: "유령의 속삭임", en: "Ghost Whisper" },
    { id: "horror_04_curse", ko: "저주 발동", en: "Curse" },
    { id: "horror_05_something_watching", ko: "누군가 지켜보는", en: "Something Watching" },
    { id: "horror_06_nightmare", ko: "악몽", en: "Nightmare" },
  ],
  victory: [
    { id: "victory_01_quest_clear", ko: "퀘스트 클리어", en: "Quest Clear" },
    { id: "victory_02_treasure_found", ko: "보물 발견", en: "Treasure Found" },
    { id: "victory_03_level_up", ko: "레벨 업", en: "Level Up" },
    { id: "victory_04_peace_restored", ko: "평화 회복", en: "Peace Restored" },
    { id: "victory_05_friendship_victory", ko: "동료와의 승리", en: "Victory Together" },
  ],
  defeat: [
    { id: "defeat_01_game_over", ko: "퀘스트 실패", en: "Game Over" },
    { id: "defeat_02_time_up", ko: "시간 초과", en: "Time Up" },
    { id: "defeat_03_betrayal", ko: "배신", en: "Betrayal" },
    { id: "defeat_04_trapped", ko: "함정에 빠짐", en: "Trapped" },
    { id: "defeat_05_retreat", ko: "전략적 후퇴", en: "Retreat" },
  ],
};

function getInitialEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(STORAGE_KEY_ENABLED);
  if (saved === null) return true; // default ON for new users
  return saved === "1";
}

function getInitialVolume(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
  return saved ? parseFloat(saved) : DEFAULT_VOLUME;
}

function pickRandom(tracks: BgmTrack[]): BgmTrack | null {
  if (tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export function useBgmPlayer() {
  const [enabled, setEnabled] = useState(getInitialEnabled);
  const [volume, setVolumeState] = useState(getInitialVolume);
  const [currentCategory, setCurrentCategory] = useState<BgmCategory | null>(null);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<"a" | "b">("a");
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** true when play() was blocked by autoplay policy */
  const blockedRef = useRef(false);
  const playingRef = useRef(false);
  // Use refs to avoid stale closure in the persistent listener
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const categoryRef = useRef(currentCategory);
  categoryRef.current = currentCategory;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startLoopRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioARef.current?.pause();
      audioBRef.current?.pause();
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, []);

  // Apply volume changes to active audio
  useEffect(() => {
    const active = activeRef.current === "a" ? audioARef.current : audioBRef.current;
    if (active) active.volume = volume;
  }, [volume]);

  const getTrackUrl = useCallback((category: BgmCategory): string | null => {
    const tracks = BGM_CATALOG[category];
    const track = pickRandom(tracks);
    if (!track) return null;
    return `/bgm/${category}/${track.id}.mp3`;
  }, []);

  const stopAll = useCallback(() => {
    playingRef.current = false;
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (audioARef.current) {
      audioARef.current.pause();
      audioARef.current.src = "";
    }
    if (audioBRef.current) {
      audioBRef.current.pause();
      audioBRef.current.src = "";
    }
  }, []);

  const startCrossfadeLoop = useCallback(
    (category: BgmCategory) => {
      const url = getTrackUrl(category);
      if (!url) return;

      stopAll();

      const audioA = new Audio(url);
      audioA.volume = volume;
      audioARef.current = audioA;
      audioBRef.current = new Audio();
      activeRef.current = "a";

      audioA.play()
        .then(() => { playingRef.current = true; blockedRef.current = false; })
        .catch(() => { blockedRef.current = true; playingRef.current = false; });

      // Schedule crossfade loop
      const scheduleCrossfade = (current: HTMLAudioElement, label: "a" | "b") => {
        const onTimeUpdate = () => {
          if (!current.duration) return;
          const remaining = current.duration - current.currentTime;

          if (remaining <= CROSSFADE_DURATION && !fadeTimerRef.current) {
            // Start next track
            const nextUrl = getTrackUrl(category);
            if (!nextUrl) return;

            const next = label === "a" ? audioBRef.current! : audioARef.current!;
            next.src = nextUrl;
            next.volume = 0;
            next.play().catch(() => {});

            const fadeStep = 50; // ms
            const steps = (CROSSFADE_DURATION * 1000) / fadeStep;
            let step = 0;

            fadeTimerRef.current = setInterval(() => {
              step++;
              const progress = step / steps;
              current.volume = Math.max(0, volume * (1 - progress));
              next.volume = Math.min(volume, volume * progress);

              if (step >= steps) {
                if (fadeTimerRef.current) {
                  clearInterval(fadeTimerRef.current);
                  fadeTimerRef.current = null;
                }
                current.pause();
                current.removeEventListener("timeupdate", onTimeUpdate);
                activeRef.current = label === "a" ? "b" : "a";
                scheduleCrossfade(next, activeRef.current);
              }
            }, fadeStep);
          }
        };

        current.addEventListener("timeupdate", onTimeUpdate);
      };

      scheduleCrossfade(audioA, "a");
    },
    [volume, getTrackUrl, stopAll]
  );
  startLoopRef.current = startCrossfadeLoop;

  // Resume BGM on any user interaction if autoplay was blocked
  useEffect(() => {
    const resume = () => {
      if (!blockedRef.current || !enabledRef.current || !categoryRef.current) return;
      blockedRef.current = false;
      // Call the full crossfade loop in user gesture context
      startLoopRef.current?.(categoryRef.current);
    };
    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
    };
  }, []);

  /** Play a specific track by category and track id */
  const playTrack = useCallback(
    (category: BgmCategory, trackId: string) => {
      if (!enabled) return;
      stopAll();
      setCurrentCategory(category);

      const url = `/bgm/${category}/${trackId}.mp3`;
      const audioA = new Audio(url);
      audioA.volume = volume;
      audioA.loop = true;
      audioARef.current = audioA;
      activeRef.current = "a";
      audioA.play().catch(() => {});
    },
    [enabled, volume, stopAll]
  );

  /** Switch BGM to match a mood category */
  const playCategory = useCallback(
    (category: BgmCategory) => {
      if (!enabled) {
        setCurrentCategory(category);
        return;
      }
      // Skip only if same category AND actually playing
      if (category === currentCategory && playingRef.current) return;
      setCurrentCategory(category);

      if (BGM_CATALOG[category].length === 0) {
        stopAll();
        return;
      }
      startCrossfadeLoop(category);
    },
    [enabled, currentCategory, stopAll, startCrossfadeLoop]
  );

  /** Toggle BGM on/off */
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY_ENABLED, next ? "1" : "0");
      if (!next) {
        stopAll();
      } else if (currentCategory) {
        startCrossfadeLoop(currentCategory);
      }
      return next;
    });
  }, [currentCategory, stopAll, startCrossfadeLoop]);

  /** Set volume (0-1) */
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toString());
  }, []);

  return {
    enabled,
    volume,
    currentCategory,
    toggle,
    setVolume,
    playCategory,
    playTrack,
    stopAll,
  };
}
