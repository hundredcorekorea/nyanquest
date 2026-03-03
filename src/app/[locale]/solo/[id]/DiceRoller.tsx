"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rollSystemDice, type ParsedDiceRequest } from "@/lib/solo-quest/dice";
import type { TrpgSystemPreset } from "@/lib/solo-quest/systems";
import type { DiceRoll } from "@/types/solo-quest";

type ScreenEffect = "critical" | "fumble" | "success" | "fail" | null;

interface Props {
  request: ParsedDiceRequest;
  system: TrpgSystemPreset;
  onRoll: (result: DiceRoll) => void;
  onRolling?: () => void;
  onScreenEffect?: (effect: ScreenEffect) => void;
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

export default function DiceRoller({ request, system, onRoll, onRolling, onScreenEffect }: Props) {
  const t = useTranslations("SoloQuest");
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<DiceRoll | null>(null);

  function getScreenEffect(r: DiceRoll): ScreenEffect {
    // CoC critical (≤5) or messy critical
    if ((system.id === "coc" && r.total <= 5) || r.messyCritical) return "critical";
    // CoC fumble (≥96)
    if (system.id === "coc" && r.total >= 96) return "fumble";
    // Tier-based
    if (r.tier === "success") return "success";
    if (r.tier === "fail") return "fail";
    // Binary
    if (r.success === true) return "success";
    if (r.success === false) return "fail";
    return null;
  }

  function handleRoll() {
    setRolling(true);
    onRolling?.();

    // Animate for 1.2 seconds, then show result
    setTimeout(() => {
      const diceResult = rollSystemDice(request, system);
      setResult(diceResult);
      setRolling(false);

      // Trigger screen effect
      const effect = getScreenEffect(diceResult);
      onScreenEffect?.(effect);

      // Dramatic pause: critical/fumble show longer before auto-submit
      const isCriticalOrFumble = effect === "critical" || effect === "fumble";
      const submitDelay = isCriticalOrFumble ? 1500 : 800;

      setTimeout(() => {
        onRoll(diceResult);
      }, submitDelay);
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
    // VtM messy critical
    if (system.id === "vtm" && r.messyCritical) return t("diceMessyCriticalNyan");
    // Blades critical
    if (system.id === "bitd" && r.messyCritical) return t("diceCriticalBitdNyan");
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
    if (r.difficulty) return `vs ${t("difficulty")} ${r.difficulty}`;
    return "";
  }

  // Dice notation display
  const isPool = system.judgmentType === "pool-count" || system.judgmentType === "pool-highest";
  const diceNotation = isPool
    ? `${request.diceCount}${request.diceType}`
    : system.diceCount > 1
    ? `${system.diceCount}${request.diceType}`
    : request.diceType;

  // Pool dice emoji display (multiple d10 icons)
  function renderPoolEmoji(count: number, animate?: boolean) {
    const emoji = DICE_EMOJI[request.diceType] ?? "🎲";
    return (
      <div className={`flex flex-wrap justify-center gap-1 ${animate ? "animate-dice-bounce" : ""}`}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <span key={i} className="text-2xl">{emoji}</span>
        ))}
        {count > 8 && <span className="text-lg self-center text-white/60">+{count - 8}</span>}
      </div>
    );
  }

  // Pool result display: each die colored by success/fail
  function renderPoolResult(r: DiceRoll) {
    if (!r.results) return null;
    const isHighest = system.judgmentType === "pool-highest";
    const highest = isHighest ? Math.max(...r.results) : 0;
    return (
      <div className="flex flex-wrap justify-center gap-1 mb-1">
        {r.results.map((val, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
              isHighest
                ? val === highest && val === 6
                  ? "bg-green-400/30 text-green-300 ring-1 ring-green-400/50"
                  : val === highest
                  ? "bg-amber-400/30 text-amber-300 ring-1 ring-amber-400/50"
                  : "bg-white/10 text-gray-400"
                : val === 10
                ? "bg-yellow-400/30 text-yellow-300 ring-1 ring-yellow-400/50"
                : val >= 6
                ? "bg-green-400/20 text-green-300"
                : "bg-white/10 text-gray-400"
            }`}
          >
            {val}
          </span>
        ))}
      </div>
    );
  }

  if (result) {
    // Pool result display (VtM pool-count / Blades pool-highest)
    if (isPool) {
      const isHighestPool = system.judgmentType === "pool-highest";
      return (
        <div className="flex justify-center animate-result-impact">
          <div className={`rounded-2xl px-6 py-4 text-center max-w-xs ${getResultStyle(result)}`}>
            {renderPoolResult(result)}
            {isHighestPool ? (
              <>
                <div className="text-xl font-bold text-white">
                  {t("poolHighest", { value: result.total })}
                </div>
                {result.messyCritical && (
                  <div className="text-xs text-yellow-400 font-medium mt-0.5">
                    ⚡ {t("diceCriticalBitd")}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-white">
                  {t("poolSuccesses", { count: result.successes ?? 0 })}
                </div>
                {result.messyCritical && (
                  <div className="text-xs text-yellow-400 font-medium mt-0.5">
                    ⚡ {t("messyCritical")}
                  </div>
                )}
              </>
            )}
            <div className={`text-sm font-medium mt-1 ${getResultColor(result)}`}>
              {getTargetLabel(result)}{getTargetLabel(result) ? " — " : ""}{getResultLabel(result)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center animate-result-impact">
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
    if (request.difficulty) return t("diceCheckPool", { label: request.label, pool: request.diceCount, difficulty: request.difficulty });
    if (system.judgmentType === "pool-highest") return t("diceCheckBitd", { label: request.label, pool: request.diceCount });
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
            {isPool ? (
              renderPoolEmoji(request.diceCount, true)
            ) : (
              <div className="text-3xl animate-dice-bounce">
                {system.diceCount > 1 ? (
                  <span>{DICE_EMOJI[request.diceType] ?? "🎲"}{DICE_EMOJI[request.diceType] ?? "🎲"}</span>
                ) : (
                  DICE_EMOJI[request.diceType] ?? "🎲"
                )}
              </div>
            )}
            <div className="text-xs font-medium">{t("diceRolling")}</div>
          </div>
        ) : (
          <div className="space-y-1">
            {isPool ? (
              renderPoolEmoji(request.diceCount)
            ) : (
              <div className="text-3xl">
                {system.diceCount > 1 ? (
                  <span>{DICE_EMOJI[request.diceType] ?? "🎲"}{DICE_EMOJI[request.diceType] ?? "🎲"}</span>
                ) : (
                  DICE_EMOJI[request.diceType] ?? "🎲"
                )}
              </div>
            )}
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
