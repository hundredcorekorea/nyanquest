"use client";

import { useState, useEffect } from "react";

interface SceneBackground {
  url: string;
  photographer: string;
  pexelsUrl: string;
}

/**
 * Fetches a Pexels scene background for the given scenario.
 * Uses sessionStorage cache to avoid repeated API calls within the same browser session.
 * Returns null while loading or if the fetch fails (graceful gradient fallback).
 */
export function useSceneBackground(
  scenarioId: string,
): SceneBackground | null {
  const [bg, setBg] = useState<SceneBackground | null>(null);

  useEffect(() => {
    const cacheKey = `nq_scene_bg_${scenarioId}`;

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setBg(JSON.parse(cached) as SceneBackground);
        return;
      }
    } catch {
      // sessionStorage might be unavailable
    }

    const controller = new AbortController();

    fetch(`/api/pexels-scene?scenarioId=${encodeURIComponent(scenarioId)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not OK");
        return res.json();
      })
      .then((data: SceneBackground) => {
        setBg(data);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {
          // Ignore storage errors
        }
      })
      .catch(() => {
        // Silently fail — gradient fallback is fine
      });

    return () => controller.abort();
  }, [scenarioId]);

  return bg;
}
