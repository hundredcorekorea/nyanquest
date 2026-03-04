"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

/** Target pixel art resolution (width). Lower = blockier. */
const PIXEL_WIDTH = 48;

/**
 * Full-screen background scene image with pixel art effect.
 * Uses an off-screen canvas to downscale the photo, then renders
 * the tiny result with image-rendering:pixelated for a retro look.
 */
export default function ScenePanel({ sceneBg, theme }: Props) {
  const [pixelSrc, setPixelSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pixelate = useCallback((url: string) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth;
      const w = PIXEL_WIDTH;
      const h = Math.round(w * ratio);

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Increase contrast/saturation slightly for pixel art pop
      ctx.filter = "contrast(1.15) saturate(1.3)";
      ctx.drawImage(img, 0, 0, w, h);
      setPixelSrc(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      // CORS blocked — fall back to original URL with CSS pixelation
      setPixelSrc(url);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    if (sceneBg?.url) {
      setPixelSrc(null);
      pixelate(sceneBg.url);
    }
  }, [sceneBg?.url, pixelate]);

  return (
    <div className="absolute inset-0 z-0">
      {pixelSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pixelSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              imageRendering: "pixelated",
            }}
          />
          {/* Darken overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Bottom gradient for input panels */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
          {/* Top gradient for header */}
          <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/40 to-transparent" />
          {/* Photo credit */}
          {sceneBg && (
            <a
              href={sceneBg.pexelsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-1 left-2 text-[7px] text-white/20 hover:text-white/40 transition-colors z-10"
            >
              📷 {sceneBg.photographer} / Pexels
            </a>
          )}
        </>
      ) : sceneBg ? (
        /* Loading: show theme gradient while pixelating */
        <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient} animate-pulse`} />
      ) : (
        /* No image available */
        <div className={`absolute inset-0 bg-linear-to-br ${theme.bgGradient}`} />
      )}
    </div>
  );
}
