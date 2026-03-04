"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SceneBackground {
  url: string;
  photographer: string;
  pexelsUrl: string;
  source?: "freepik" | "pexels";
}

/**
 * Fetches a scene background for the given scenario.
 * Returns the current background + a function to dynamically change it via keywords.
 * Uses sessionStorage cache to avoid repeated API calls.
 */
export function useSceneBackground(
  scenarioId: string,
): {
  sceneBg: SceneBackground | null;
  changeScene: (keywords: string) => void;
} {
  const [bg, setBg] = useState<SceneBackground | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Initial fetch by scenarioId
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
    abortRef.current = controller;

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

  // Dynamic scene change by GM keywords
  const changeScene = useCallback(
    (keywords: string) => {
      // Abort any pending request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const cacheKey = `nq_scene_kw_${keywords}`;

      // Check sessionStorage cache
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setBg(JSON.parse(cached) as SceneBackground);
          return;
        }
      } catch {
        // ignore
      }

      const params = new URLSearchParams({
        keywords,
        scenarioId, // pass scenarioId for genre context
      });

      fetch(`/api/pexels-scene?${params}`, {
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
            // ignore
          }
        })
        .catch(() => {
          // Keep current background on failure
        });
    },
    [scenarioId],
  );

  return { sceneBg: bg, changeScene };
}
