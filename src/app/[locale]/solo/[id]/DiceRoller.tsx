"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rollDice, type ParsedDiceRequest } from "@/lib/solo-quest/dice";
import type { DiceRoll } from "@/types/solo-quest";

interface Props {
  request: ParsedDiceRequest;
  onRoll: (result: DiceRoll) => void;
}

const DICE_EMOJI: Record<string, string> = {
  d4: "🔺",
  d6: "🎲",
  d8: "💎",
  d10: "🔮",
  d12: "⭐",
  d20: "🎲",
  d100: "💯",
};

export default function DiceRoller({ request, onRoll }: Props) {
  const t = useTranslations("SoloQuest");
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<DiceRoll | null>(null);

  function handleRoll() {
    setRolling(true);

    // Animate for 1.2 seconds, then show result
    setTimeout(() => {
      const diceResult = rollDice(request.diceType, request.modifier, request.dc);
      setResult(diceResult);
      setRolling(false);

      // Auto-submit after showing result
      setTimeout(() => {
        onRoll(diceResult);
      }, 800);
    }, 1200);
  }

  if (result) {
    return (
      <div className="flex justify-center animate-bubble-in">
        <div
          className={`rounded-2xl px-6 py-4 text-center ${
            result.success
              ? "bg-green-50 border border-green-200"
              : result.success === false
              ? "bg-red-50 border border-red-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="text-3xl mb-1">
            {DICE_EMOJI[result.type] ?? "🎲"}
          </div>
          <div className="text-xl font-bold text-gray-900">
            {result.result}
            {result.modifier ? ` + ${result.modifier} = ${result.total}` : ""}
          </div>
          {result.dc && (
            <div
              className={`text-sm font-medium mt-1 ${
                result.success ? "text-green-600" : "text-red-500"
              }`}
            >
              vs DC {result.dc} — {result.success ? t("diceSuccessNyan") : t("diceFailNyan")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center animate-bubble-in">
      <button
        onClick={handleRoll}
        disabled={rolling}
        className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl px-8 py-4 text-center hover:from-amber-500 hover:to-orange-500 transition-all active:scale-95 disabled:opacity-70"
      >
        {rolling ? (
          <div className="space-y-1">
            <div className="text-3xl animate-dice-bounce">
              {DICE_EMOJI[request.diceType] ?? "🎲"}
            </div>
            <div className="text-xs font-medium">{t("diceRolling")}</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-3xl">
              {DICE_EMOJI[request.diceType] ?? "🎲"}
            </div>
            <div className="text-sm font-bold">
              {request.diceType}
              {request.modifier > 0 ? `+${request.modifier}` : ""} {t("diceRoll")}
            </div>
            <div className="text-xs opacity-80">
              {t("diceCheck", { label: request.label, dc: request.dc })}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
