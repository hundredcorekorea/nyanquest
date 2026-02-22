"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { rollDice, rollMultiDice } from "@/lib/solo-quest/dice";
import type { DiceRoll, DiceType } from "@/types/solo-quest";

const DICE_TYPES: { type: DiceType; label: string; emoji: string }[] = [
  { type: "d4", label: "d4", emoji: "🔺" },
  { type: "d6", label: "d6", emoji: "🎲" },
  { type: "d8", label: "d8", emoji: "💎" },
  { type: "d10", label: "d10", emoji: "🔮" },
  { type: "d12", label: "d12", emoji: "⭐" },
  { type: "d20", label: "d20", emoji: "🎲" },
  { type: "d100", label: "d100", emoji: "💯" },
];

interface Props {
  onRoll: (result: DiceRoll) => void;
  disabled?: boolean;
}

export default function DiceRollButton({ onRoll, disabled }: Props) {
  const t = useTranslations("PartyPlay");
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleRoll(type: DiceType) {
    let result: DiceRoll;

    if (count > 1) {
      const { results, total } = rollMultiDice(type, count, modifier);
      result = {
        type,
        result: results.reduce((a, b) => a + b, 0),
        results,
        modifier: modifier || undefined,
        total,
      };
    } else {
      result = rollDice(type, modifier);
    }

    setOpen(false);
    setCount(1);
    setModifier(0);
    onRoll(result);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Dice panel */}
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-lg border border-gray-200 p-3 w-64 animate-bubble-in z-50">
          <p className="text-xs font-bold text-gray-500 mb-2">{t("diceQuickRoll")}</p>

          {/* Quick dice buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {DICE_TYPES.map(({ type, label, emoji }) => (
              <button
                key={type}
                onClick={() => handleRoll(type)}
                className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-amber-50 active:bg-amber-100 transition-colors border border-gray-100"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-[10px] font-bold text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Count & Modifier */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">{t("diceCount")}</span>
              <button
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
              >
                -
              </button>
              <span className="w-5 text-center font-bold text-gray-700">{count}</span>
              <button
                onClick={() => setCount((c) => Math.min(10, c + 1))}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">{t("diceModifier")}</span>
              <button
                onClick={() => setModifier((m) => Math.max(-10, m - 1))}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
              >
                -
              </button>
              <span className="w-5 text-center font-bold text-gray-700">
                {modifier >= 0 ? `+${modifier}` : modifier}
              </span>
              <button
                onClick={() => setModifier((m) => Math.min(10, m + 1))}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={`px-3 py-2.5 rounded-xl text-lg transition-colors flex-shrink-0 ${
          open
            ? "bg-amber-100 text-amber-600"
            : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-500"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={t("diceRoll")}
      >
        🎲
      </button>
    </div>
  );
}
