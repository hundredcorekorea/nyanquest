"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rollSystemDice, type ParsedDiceRequest } from "@/lib/solo-quest/dice";
import type { TrpgSystemPreset } from "@/lib/solo-quest/systems";
import type { DiceRoll } from "@/types/solo-quest";

interface Props {
  request: ParsedDiceRequest;
  system: TrpgSystemPreset;
  onRoll: (result: DiceRoll) => void;
  onRolling?: () => void;
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

export default function DiceRoller({ request, system, onRoll, onRolling }: Props) {
  const t = useTranslations("SoloQuest");
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<DiceRoll | null>(null);

  function handleRoll() {
    setRolling(true);
    onRolling?.();

    // Animate for 1.2 seconds, then show result
    setTimeout(() => {
      const diceResult = rollSystemDice(request, system);
      setResult(diceResult);
      setRolling(false);

      // Auto-submit after showing result
      setTimeout(() => {
        onRoll(diceResult);
      }, 800);
    }, 1200);
  }

  // Determine result colors based on tier or success
  function getResultStyle(r: DiceRoll) {
    if (r.tier === "success") return "bg-green-900/40 border border-green-500/30";
    if (r.tier === "partial") return "bg-amber-900/40 border border-amber-500/30";
    if (r.tier === "fail") return "bg-red-900/40 border border-red-500/30";
    if (r.success) return "bg-green-900/40 border border-green-500/30";
    if (r.success === false) return "bg-red-900/40 border border-red-500/30";
    return "bg-white/10 border border-white/20";
  }

  function getResultColor(r: DiceRoll) {
    if (r.tier === "success") return "text-green-400";
    if (r.tier === "partial") return "text-amber-400";
    if (r.tier === "fail") return "text-red-400";
    if (r.success) return "text-green-400";
    if (r.success === false) return "text-red-400";
    return "text-gray-400";
  }

  function getResultLabel(r: DiceRoll) {
    // CoC critical/fumble
    if (system.id === "coc") {
      if (r.total <= 5) return t("diceCriticalNyan");
      if (r.total >= 96) return t("diceFumbleNyan");
    }
    // Dungeon World tiers
    if (r.tier === "success") return t("diceSuccessNyan");
    if (r.tier === "partial") return t("dicePartialNyan");
    if (r.tier === "fail") return t("diceFailNyan");
    // Binary
    if (r.success) return t("diceSuccessNyan");
    if (r.success === false) return t("diceFailNyan");
    return "";
  }

  function getTargetLabel(r: DiceRoll) {
    if (r.dc) return `vs DC ${r.dc}`;
    if (r.target) return `vs ${t("targetValue")} ${r.target}`;
    if (r.skillValue) return `vs ${t("skillValue")} ${r.skillValue}`;
    return "";
  }

  // Dice notation display (e.g., "2d6", "d20", "d100")
  const diceNotation = system.diceCount > 1
    ? `${system.diceCount}${request.diceType}`
    : request.diceType;

  if (result) {
    return (
      <div className="flex justify-center animate-bubble-in">
        <div className={`rounded-2xl px-6 py-4 text-center ${getResultStyle(result)}`}>
          <div className="text-3xl mb-1">
            {system.diceCount > 1 ? (
              <span>{DICE_EMOJI[result.type] ?? "🎲"}{DICE_EMOJI[result.type] ?? "🎲"}</span>
            ) : (
              DICE_EMOJI[result.type] ?? "🎲"
            )}
          </div>
          <div className="text-xl font-bold text-white">
            {result.results ? (
              <>
                [{result.results.join("] [")}]
                {result.modifier ? ` + ${result.modifier}` : ""}
                {" = "}{result.total}
              </>
            ) : (
              <>
                {result.result}
                {result.modifier ? ` + ${result.modifier} = ${result.total}` : ""}
              </>
            )}
          </div>
          {(result.dc || result.target || result.skillValue || result.tier) && (
            <div className={`text-sm font-medium mt-1 ${getResultColor(result)}`}>
              {getTargetLabel(result)}{getTargetLabel(result) ? " — " : ""}{getResultLabel(result)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check label for the button
  function getCheckLabel() {
    if (request.dc) return t("diceCheck", { label: request.label, dc: request.dc });
    if (request.target) return t("diceCheckTarget", { label: request.label, target: request.target });
    if (request.skillValue) return t("diceCheckSkill", { label: request.label, value: request.skillValue });
    return request.label;
  }

  return (
    <div className="flex justify-center animate-bubble-in">
      <button
        onClick={handleRoll}
        disabled={rolling}
        className="bg-linear-to-r from-amber-400 to-orange-400 text-white rounded-2xl px-8 py-4 text-center hover:from-amber-500 hover:to-orange-500 transition-all active:scale-95 disabled:opacity-70"
      >
        {rolling ? (
          <div className="space-y-1">
            <div className="text-3xl animate-dice-bounce">
              {system.diceCount > 1 ? (
                <span>{DICE_EMOJI[request.diceType] ?? "🎲"}{DICE_EMOJI[request.diceType] ?? "🎲"}</span>
              ) : (
                DICE_EMOJI[request.diceType] ?? "🎲"
              )}
            </div>
            <div className="text-xs font-medium">{t("diceRolling")}</div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-3xl">
              {system.diceCount > 1 ? (
                <span>{DICE_EMOJI[request.diceType] ?? "🎲"}{DICE_EMOJI[request.diceType] ?? "🎲"}</span>
              ) : (
                DICE_EMOJI[request.diceType] ?? "🎲"
              )}
            </div>
            <div className="text-sm font-bold">
              {diceNotation}
              {request.modifier > 0 ? `+${request.modifier}` : ""} {t("diceRoll")}
            </div>
            <div className="text-xs opacity-80">
              {getCheckLabel()}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
