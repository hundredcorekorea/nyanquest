"use client";

import { useState } from "react";
import type { ScenarioTheme } from "@/types/solo-quest";

interface SceneBackground {
  url: string;
  photographer: string;
  pexelsUrl: string;
  source?: "freepik" | "pexels";
}

interface Props {
  sceneBg: SceneBackground | null;
  theme: ScenarioTheme;
}

/**
 * Full-screen background scene image.
 * Rendered as absolute layer behind all UI overlays.
 * Freepik pixel art: displayed with pixelated rendering.
 * Pexels photos: displayed with cinematic color grading.
 */
export default function ScenePanel({ sceneBg, theme }: Props) {
  const [loaded, setLoaded] = useState(false);
  const isPixelArt = sceneBg?.source === "freepik";

  return (
    <div className="absolute inset-0 z-0">
      {sceneBg ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sceneBg.url}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            style={isPixelArt ? { imageRendering: "pixelated" } : undefined}
          />
          {/* Cinematic color grading for photos */}
          {!isPixelArt && (
            <div
              className="absolute inset-0 mix-blend-soft-light opacity-30"
              style={{
                background: "linear-gradient(135deg, rgba(20,30,80,0.6) 0%, rgba(80,20,40,0.4) 50%, rgba(20,60,80,0.5) 100%)",
              }}
            />
          )}
          {/* Darken overlay for text readability */}
          <div className="absolute inset-0 bg-black/35" />
          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
            }}
          />
          {/* Bottom gradient for input panels */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent" />
          {/* Top gradient for header */}
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent" />
          {/* Photo credit */}
          {loaded && (
            <a
              href={sceneBg.pexelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1 left-2 text-[7px] text-white/20 hover:text-white/40 transition-colors z-10"
            >
              📷 {sceneBg.photographer} / {isPixelArt ? "Freepik" : "Pexels"}
            </a>
          )}
          {/* Loading skeleton */}
          {!loaded && (
            <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient} animate-pulse`} />
          )}
        </>
      ) : (
        /* No image: theme gradient as bg */
        <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient}`} />
      )}
    </div>
  );
}
