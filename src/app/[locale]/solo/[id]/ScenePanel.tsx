"use client";

import { useState, useEffect } from "react";
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

/**
 * Shrink a Pexels image URL to a tiny resolution.
 * When displayed with image-rendering: pixelated, this creates
 * a pixel art effect from any photograph.
 */
function toPixelArtUrl(url: string, width = 80): string {
  try {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.delete("h");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Full-screen background scene image with pixel art effect.
 * Rendered as absolute layer behind all UI overlays.
 */
export default function ScenePanel({ sceneBg, theme }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [pixelUrl, setPixelUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sceneBg?.url) {
      setPixelUrl(toPixelArtUrl(sceneBg.url, 80));
    }
  }, [sceneBg?.url]);

  return (
    <div className="absolute inset-0 z-0">
      {pixelUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pixelUrl}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: "pixelated" }}
          />
          {/* Darken overlay so text is readable */}
          <div className="absolute inset-0 bg-black/35" />
          {/* Bottom gradient for input panels readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
          {/* Top gradient for header readability */}
          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/40 to-transparent" />
          {/* Credit */}
          {loaded && sceneBg && (
            <a
              href={sceneBg.pexelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1 left-2 text-[7px] text-white/20 hover:text-white/40 transition-colors z-10"
            >
              📷 {sceneBg.photographer} / Pexels
            </a>
          )}
          {/* Loading skeleton */}
          {!loaded && (
            <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient}`} />
          )}
        </>
      ) : (
        /* No image: theme gradient as bg */
        <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient}`} />
      )}
    </div>
  );
}
