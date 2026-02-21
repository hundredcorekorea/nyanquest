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

const STORAGE_KEY_ENABLED = "nyanquest_bgm_enabled";
const STORAGE_KEY_VOLUME = "nyanquest_bgm_volume";
const CROSSFADE_DURATION = 2; // seconds
const DEFAULT_VOLUME = 0.3;

/** BGM track catalog - maps category to available track filenames */
const BGM_CATALOG: Record<BgmCategory, string[]> = {
  explore: [
    "explore_01_dungeon_crawl",
    "explore_02_forest_path",
    "explore_03_space_walk",
    "explore_04_ancient_ruins",
    "explore_05_underground_cave",
    "explore_06_castle_hall",
    "explore_07_desert_journey",
    "explore_08_ocean_voyage",
    "explore_09_snowy_mountain",
    "explore_10_marketplace",
  ],
  battle: [
    "battle_01_boss_fight",
    "battle_02_chase_scene",
    "battle_03_ambush",
    "battle_04_duel",
    "battle_05_space_battle",
    "battle_06_stealth",
    "battle_07_dragon_fight",
    "battle_08_escape",
    "battle_09_monster_encounter",
    "battle_10_victory_march",
  ],
  puzzle: [
    "puzzle_01_riddle",
    "puzzle_02_investigation",
    "puzzle_03_ancient_mechanism",
    "puzzle_04_magic_discovery",
    "puzzle_05_time_paradox",
    "puzzle_06_hidden_passage",
    "puzzle_07_code_breaking",
  ],
  calm: [],
  comedy: [],
  horror: [],
  victory: [],
  defeat: [],
};

function getInitialEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_ENABLED) === "1";
}

function getInitialVolume(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
  return saved ? parseFloat(saved) : DEFAULT_VOLUME;
}

function pickRandom(tracks: string[]): string | null {
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
    return `/bgm/${category}/${track}.mp3`;
  }, []);

  const stopAll = useCallback(() => {
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

      audioA.play().catch(() => {});

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

  /** Switch BGM to match a mood category */
  const playCategory = useCallback(
    (category: BgmCategory) => {
      if (!enabled) {
        setCurrentCategory(category);
        return;
      }
      if (category === currentCategory) return;
      setCurrentCategory(category);
      startCrossfadeLoop(category);
    },
    [enabled, currentCategory, startCrossfadeLoop]
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
    stopAll,
  };
}
