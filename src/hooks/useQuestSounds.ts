"use client";

import { useCallback, useRef, useState } from "react";
import type { CutInType } from "@/components/NaYangCutIn";

export type SfxGenre = "fantasy" | "horror" | "scifi" | "dark";

const STORAGE_KEY = "nyanquest_sound_enabled";

function getInitialEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "0";
}

/** Synthesize simple sound effects via Web Audio API (no audio files needed) */
export function useQuestSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(getInitialEnabled);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // AudioContext might not be available
      }
    },
    [enabled, getCtx]
  );

  /** Play noise burst (for transition swoosh, wood clatter) */
  const playNoise = useCallback(
    (duration: number, gain = 0.08) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        // Bandpass for a "swoosh" feel
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        source.connect(filter).connect(g).connect(ctx.destination);
        source.start();
        source.stop(ctx.currentTime + duration);
      } catch {
        // ignore
      }
    },
    [enabled, getCtx]
  );

  // ── Genre-aware dice roll ──
  const playDiceRoll = useCallback(
    (genre?: SfxGenre) => {
      if (genre === "horror") {
        // Low resonant rumble
        playTone(100, 0.15, "sine", 0.1);
        setTimeout(() => playTone(150, 0.15, "sine", 0.08), 80);
      } else if (genre === "scifi") {
        // Electronic beeps
        playTone(1200, 0.05, "square", 0.08);
        setTimeout(() => playTone(1400, 0.05, "square", 0.08), 70);
        setTimeout(() => playTone(1600, 0.05, "square", 0.08), 140);
      } else if (genre === "dark") {
        // Muted clicks
        playTone(300, 0.06, "triangle", 0.1);
        setTimeout(() => playTone(250, 0.06, "triangle", 0.1), 100);
        setTimeout(() => playTone(350, 0.06, "triangle", 0.1), 200);
      } else {
        // Fantasy default: wood clatter
        playTone(800, 0.08, "square", 0.1);
        setTimeout(() => playTone(600, 0.08, "square", 0.1), 100);
        setTimeout(() => playTone(900, 0.08, "square", 0.1), 200);
      }
    },
    [playTone]
  );

  // ── Genre-aware success ──
  const playSuccess = useCallback(
    (genre?: SfxGenre) => {
      if (genre === "horror") {
        // Relief sigh — gentle ascending
        playTone(350, 0.2, "sine", 0.08);
        setTimeout(() => playTone(440, 0.25, "sine", 0.08), 180);
      } else if (genre === "scifi") {
        // Electronic approval
        playTone(880, 0.1, "square", 0.08);
        setTimeout(() => playTone(1100, 0.1, "square", 0.08), 100);
        setTimeout(() => playTone(1320, 0.15, "sine", 0.1), 200);
      } else {
        // Fantasy fanfare
        playTone(523, 0.15, "sine", 0.12);
        setTimeout(() => playTone(659, 0.15, "sine", 0.12), 120);
        setTimeout(() => playTone(784, 0.25, "sine", 0.12), 240);
      }
    },
    [playTone]
  );

  // ── Genre-aware failure ──
  const playFailure = useCallback(
    (genre?: SfxGenre) => {
      if (genre === "horror") {
        // Creepy descend
        playTone(300, 0.3, "sawtooth", 0.06);
        setTimeout(() => playTone(180, 0.4, "sawtooth", 0.05), 200);
      } else if (genre === "scifi") {
        // Error buzz
        playTone(200, 0.15, "square", 0.08);
        setTimeout(() => playTone(150, 0.2, "square", 0.06), 150);
      } else {
        // Fantasy descending
        playTone(400, 0.2, "sawtooth", 0.08);
        setTimeout(() => playTone(300, 0.3, "sawtooth", 0.08), 180);
      }
    },
    [playTone]
  );

  /** New message notification */
  const playMessage = useCallback(() => {
    playTone(660, 0.1, "sine", 0.06);
  }, [playTone]);

  // ── Cut-in effect sounds ──
  const playCutIn = useCallback(
    (cutType: CutInType) => {
      if (!enabled) return;
      switch (cutType) {
        case "dice":
          // Impact hit + rising sweep
          playTone(200, 0.05, "square", 0.15);
          setTimeout(() => playTone(400, 0.08, "sine", 0.12), 50);
          setTimeout(() => playTone(800, 0.12, "sine", 0.1), 100);
          break;
        case "critical":
          // Ascending fanfare C5→E5→G5→C6
          playTone(523, 0.08, "sine", 0.12);
          setTimeout(() => playTone(659, 0.08, "sine", 0.12), 80);
          setTimeout(() => playTone(784, 0.08, "sine", 0.12), 160);
          setTimeout(() => playTone(1047, 0.2, "sine", 0.15), 240);
          break;
        case "fumble":
          // Descending dissonance
          playTone(400, 0.15, "sawtooth", 0.08);
          setTimeout(() => playTone(280, 0.2, "sawtooth", 0.06), 120);
          setTimeout(() => playTone(200, 0.3, "sawtooth", 0.05), 250);
          break;
        case "clear":
          // Victory: bright ascending + sustained chord
          playTone(523, 0.1, "sine", 0.12);
          setTimeout(() => playTone(659, 0.1, "sine", 0.12), 80);
          setTimeout(() => playTone(784, 0.1, "sine", 0.12), 160);
          setTimeout(() => {
            playTone(1047, 0.3, "sine", 0.12);
            playTone(784, 0.3, "sine", 0.08);
            playTone(659, 0.3, "sine", 0.06);
          }, 240);
          break;
        case "failed":
          // Somber low tones
          playTone(220, 0.3, "sine", 0.08);
          setTimeout(() => playTone(196, 0.4, "sine", 0.06), 250);
          break;
      }
    },
    [enabled, playTone]
  );

  /** Scene transition swoosh */
  const playTransition = useCallback(() => {
    playNoise(0.2, 0.06);
  }, [playNoise]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return {
    enabled, toggle,
    playDiceRoll, playSuccess, playFailure, playMessage,
    playCutIn, playTransition,
  };
}
