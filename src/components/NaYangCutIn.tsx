"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type CutInType = "dice" | "critical" | "fumble" | "clear" | "failed";

interface Props {
  type: CutInType;
  text: string;
  onComplete?: () => void;
}

const ACCENT_COLORS: Record<CutInType, { bg: string; text: string; line: string }> = {
  dice:     { bg: "from-amber-600/90 to-amber-900/90",   text: "text-amber-200",  line: "rgba(251,191,36,0.3)" },
  critical: { bg: "from-green-600/90 to-green-900/90",   text: "text-green-200",  line: "rgba(74,222,128,0.3)" },
  fumble:   { bg: "from-red-700/90 to-red-950/90",       text: "text-red-200",    line: "rgba(248,113,113,0.3)" },
  clear:    { bg: "from-yellow-500/90 to-amber-700/90",  text: "text-yellow-100", line: "rgba(253,224,71,0.4)" },
  failed:   { bg: "from-gray-600/90 to-gray-900/90",     text: "text-gray-300",   line: "rgba(156,163,175,0.25)" },
};

export default function NaYangCutIn({ type, text, onComplete }: Props) {
  const [visible, setVisible] = useState(true);
  const colors = ACCENT_COLORS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-cut-in-container"
      aria-live="assertive"
    >
      {/* Speed-line background */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            ${colors.line} 8px,
            ${colors.line} 10px
          )`,
          animation: "speed-lines 0.3s linear infinite",
        }}
      />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Accent band across center */}
      <div className={`absolute inset-x-0 h-28 sm:h-32 bg-gradient-to-r ${colors.bg} top-1/2 -translate-y-1/2 flex items-center`}>
        {/* NaYang portrait — slides from left */}
        <div className="animate-cut-in-portrait ml-4 sm:ml-8 shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-white/30 overflow-hidden bg-black/40 shadow-lg">
            <Image
              src="/images/nayang/neutral.svg"
              alt="NaYang"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Text — impacts from right */}
        <div className="animate-cut-in-text flex-1 text-center px-4">
          <span
            className={`text-2xl sm:text-4xl font-black ${colors.text} drop-shadow-lg`}
            style={{
              WebkitTextStroke: "1px rgba(0,0,0,0.5)",
              textShadow: "2px 2px 4px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.15)",
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
