"use client";

import { useState } from "react";
import type { ScenarioTheme } from "@/types/solo-quest";

interface SceneBackground {
  url: string;
  photographer: string;
  pexelsUrl: string;
}

interface Props {
  sceneBg: SceneBackground | null;
  theme: ScenarioTheme;
}

export default function ScenePanel({ sceneBg, theme }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {sceneBg ? (
        <div className="relative w-full aspect-[16/7] max-h-[28vh] overflow-hidden rounded-xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sceneBg.url}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          {/* Vignette overlay — no blur, just subtle darkened edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
          {/* Top/bottom edge fade into surrounding panels */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Credit */}
          {loaded && (
            <a
              href={sceneBg.pexelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1.5 right-2 text-[8px] text-white/30 hover:text-white/50 transition-colors z-10"
            >
              📷 {sceneBg.photographer} / Pexels
            </a>
          )}
          {/* Loading skeleton */}
          {!loaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} animate-pulse`} />
          )}
        </div>
      ) : (
        /* No image: theme gradient fallback */
        <div className={`w-full aspect-[16/7] max-h-[28vh] rounded-xl bg-gradient-to-br ${theme.bgGradient} opacity-60`} />
      )}
    </div>
  );
}
