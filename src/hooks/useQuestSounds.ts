"use client";

import { useCallback, useRef, useState } from "react";

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

  /** Dice rolling click sound */
  const playDiceRoll = useCallback(() => {
    playTone(800, 0.08, "square", 0.1);
    setTimeout(() => playTone(600, 0.08, "square", 0.1), 100);
    setTimeout(() => playTone(900, 0.08, "square", 0.1), 200);
  }, [playTone]);

  /** Success jingle (ascending) */
  const playSuccess = useCallback(() => {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 120);
    setTimeout(() => playTone(784, 0.25, "sine", 0.12), 240);
  }, [playTone]);

  /** Failure sound (descending) */
  const playFailure = useCallback(() => {
    playTone(400, 0.2, "sawtooth", 0.08);
    setTimeout(() => playTone(300, 0.3, "sawtooth", 0.08), 180);
  }, [playTone]);

  /** New message notification */
  const playMessage = useCallback(() => {
    playTone(660, 0.1, "sine", 0.06);
  }, [playTone]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return { enabled, toggle, playDiceRoll, playSuccess, playFailure, playMessage };
}
