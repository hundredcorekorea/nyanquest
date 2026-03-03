"use client";

import { useTranslations } from "next-intl";

interface Props {
  currentIndex: number;
  totalTurns: number;
  onNavigate: (index: number) => void;
  disabled: boolean;
}

export default function TurnNav({ currentIndex, totalTurns, onNavigate, disabled }: Props) {
  const t = useTranslations("SoloQuest");

  if (totalTurns <= 1) return null;

  const maxDots = 8;
  const showDots = totalTurns <= maxDots;

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
        disabled={disabled || currentIndex <= 0}
        className="w-6 h-6 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Previous turn"
      >
        ◀
      </button>

      {showDots ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: totalTurns }).map((_, i) => (
            <button
              key={i}
              onClick={() => !disabled && onNavigate(i)}
              disabled={disabled}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-amber-400 w-2.5"
                  : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Turn ${i + 1}`}
            />
          ))}
        </div>
      ) : (
        <span className="text-white/50 tabular-nums">
          {t("turnOf", { current: currentIndex + 1, total: totalTurns })}
        </span>
      )}

      <button
        onClick={() => onNavigate(Math.min(totalTurns - 1, currentIndex + 1))}
        disabled={disabled || currentIndex >= totalTurns - 1}
        className="w-6 h-6 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Next turn"
      >
        ▶
      </button>
    </div>
  );
}
