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
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      {sceneBg ? (
        <div className="relative w-full aspect-16/7 max-h-[28vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sceneBg.url}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
          {/* Edge fades */}
          <div className="absolute inset-x-0 top-0 h-4 bg-linear-to-b from-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-4 bg-linear-to-t from-black/30 to-transparent" />
          {/* Credit */}
          {loaded && (
            <a
              href={sceneBg.pexelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1 right-2 text-[8px] text-white/25 hover:text-white/50 transition-colors z-10"
            >
              📷 {sceneBg.photographer} / Pexels
            </a>
          )}
          {/* Loading skeleton */}
          {!loaded && (
            <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient} animate-pulse`} />
          )}
        </div>
      ) : (
        <div className={`w-full aspect-16/7 max-h-[28vh] bg-linear-to-br ${theme.bgGradient} opacity-50`} />
      )}
    </div>
  );
}
