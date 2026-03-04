"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  rollSystemDice,
  calcSuccessPercentage,
  calcThresholdPercentage,
  shouldReversal,
  generateFakeTotal,
  DICE_MAX,
  type ParsedDiceRequest,
} from "@/lib/solo-quest/dice";
import type { TrpgSystemPreset } from "@/lib/solo-quest/systems";
import type { DiceRoll } from "@/types/solo-quest";
import type { CutInType } from "@/components/NaYangCutIn";

type ScreenEffect = "critical" | "fumble" | "success" | "fail" | null;
type Phase = "enter" | "rolling" | "result" | "judgment" | "reversal" | "exit";

interface Props {
  request: ParsedDiceRequest;
  system: TrpgSystemPreset;
  onComplete: (result: DiceRoll) => void;
  onRolling?: () => void;
  onScreenEffect?: (effect: ScreenEffect) => void;
  onCutIn?: (type: CutInType) => void;
}

const DICE_EMOJI: Record<string, string> = {
  d4: "\u{1F53A}", d6: "\u{1F3B2}", d8: "\u{1F48E}",
  d10: "\u{1F52E}", d12: "\u2B50", d20: "\u{1F3B2}", d100: "\u{1F4AF}",
};

export default function DiceOverlay({
  request, system, onComplete, onRolling, onScreenEffect, onCutIn,
}: Props) {
  const t = useTranslations("SoloQuest");
  const [phase, setPhase] = useState<Phase>("enter");
  const [displayTotal, setDisplayTotal] = useState<number | null>(null);
  const [pct, setPct] = useState(0);
  const [thresholdPct, setThresholdPct] = useState<number | null>(null);
  const [judgmentLabel, setJudgmentLabel] = useState("");
  const [judgmentColor, setJudgmentColor] = useState("");
  const [isReversal, setIsReversal] = useState(false);
  const [showReversalFlash, setShowReversalFlash] = useState(false);
  const [showReversalText, setShowReversalText] = useState(false);
  const resultRef = useRef<DiceRoll | null>(null);
  const firedRef = useRef(false);

  // Run the entire sequence on mount
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // Pre-calculate the real result
    const realResult = rollSystemDice(request, system);
    resultRef.current = realResult;
    const doReversal = shouldReversal();
    setIsReversal(doReversal);

    // Phase 1: Enter (0-0.3s)
    onRolling?.();
    onCutIn?.("dice");

    const enterTimer = setTimeout(() => {
      setPhase("rolling");
    }, 300);

    // Phase 2: Rolling animation (0.3-2.1s) — dice tumbles for 1.8s
    const rollTimer = setTimeout(() => {
      setPhase("result");

      if (doReversal) {
        // Show fake total first
        const fakeTotal = generateFakeTotal(realResult, request, system);
        setDisplayTotal(fakeTotal);
        // Fake percentage
        const fakeResult = { ...realResult, total: fakeTotal };
        const fakePct = calcSuccessPercentage(fakeResult, request, system);
        setPct(fakePct);
      } else {
        setDisplayTotal(realResult.total);
        setPct(calcSuccessPercentage(realResult, request, system));
      }
      setThresholdPct(calcThresholdPercentage(request, system));
    }, 2100);

    // Phase 3: Judgment (2.6s)
    const judgmentTimer = setTimeout(() => {
      setPhase("judgment");

      if (doReversal) {
        // Show FAKE judgment first (opposite of real)
        const isRealSuccess = realResult.success === true ||
          realResult.tier === "success" || realResult.tier === "partial";
        setJudgmentLabel(isRealSuccess ? getFailLabel() : getSuccessLabel());
        setJudgmentColor(isRealSuccess ? "text-red-400" : "text-green-400");
      } else {
        applyRealJudgment(realResult);
        fireEffects(realResult);
      }
    }, 2600);

    // Phase 4: Reversal (3.4s) or Exit
    if (doReversal) {
      const reversalTimer = setTimeout(() => {
        setPhase("reversal");
        setShowReversalFlash(true);
        setShowReversalText(true);

        // After flash, show real result
        setTimeout(() => {
          setDisplayTotal(realResult.total);
          setPct(calcSuccessPercentage(realResult, request, system));
          applyRealJudgment(realResult);
          fireEffects(realResult);
          setShowReversalFlash(false);
        }, 500);
      }, 3400);

      // Exit after reversal
      const exitTimer = setTimeout(() => {
        setPhase("exit");
        setTimeout(() => onComplete(realResult), 400);
      }, 5000);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(rollTimer);
        clearTimeout(judgmentTimer);
        clearTimeout(reversalTimer);
        clearTimeout(exitTimer);
      };
    } else {
      // No reversal — exit sooner
      const exitTimer = setTimeout(() => {
        setPhase("exit");
        setTimeout(() => onComplete(realResult), 400);
      }, 4000);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(rollTimer);
        clearTimeout(judgmentTimer);
        clearTimeout(exitTimer);
      };
    }

    function getSuccessLabel() {
      if (realResult.tier === "partial") return t("dicePartialNyan");
      return t("diceSuccessNyan");
    }
    function getFailLabel() {
      return t("diceFailNyan");
    }
    function applyRealJudgment(r: DiceRoll) {
      // Special labels
      if (system.id === "vtm" && r.messyCritical) {
        setJudgmentLabel(t("diceMessyCriticalNyan"));
        setJudgmentColor("text-yellow-400");
        return;
      }
      if (system.id === "bitd" && r.messyCritical) {
        setJudgmentLabel(t("diceCriticalBitdNyan"));
        setJudgmentColor("text-yellow-400");
        return;
      }
      if (system.id === "coc" && r.total <= 5) {
        setJudgmentLabel(t("diceCriticalNyan"));
        setJudgmentColor("text-yellow-400");
        return;
      }
      if (system.id === "coc" && r.total >= 96) {
        setJudgmentLabel(t("diceFumbleNyan"));
        setJudgmentColor("text-red-400");
        return;
      }
      // Tier
      if (r.tier === "success") { setJudgmentLabel(t("diceSuccessNyan")); setJudgmentColor("text-green-400"); return; }
      if (r.tier === "partial") { setJudgmentLabel(t("dicePartialNyan")); setJudgmentColor("text-amber-400"); return; }
      if (r.tier === "fail") { setJudgmentLabel(t("diceFailNyan")); setJudgmentColor("text-red-400"); return; }
      // Binary
      if (r.success === true) { setJudgmentLabel(t("diceSuccessNyan")); setJudgmentColor("text-green-400"); return; }
      if (r.success === false) { setJudgmentLabel(t("diceFailNyan")); setJudgmentColor("text-red-400"); return; }
    }
    function fireEffects(r: DiceRoll) {
      const effect = getScreenEffect(r);
      onScreenEffect?.(effect);
      if (effect === "critical") onCutIn?.("critical");
      else if (effect === "fumble") onCutIn?.("fumble");
    }
    function getScreenEffect(r: DiceRoll): ScreenEffect {
      if ((system.id === "coc" && r.total <= 5) || r.messyCritical) return "critical";
      if (system.id === "coc" && r.total >= 96) return "fumble";
      if (r.tier === "success") return "success";
      if (r.tier === "fail") return "fail";
      if (r.success === true) return "success";
      if (r.success === false) return "fail";
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dice notation display
  const isPool = system.judgmentType === "pool-count" || system.judgmentType === "pool-highest";
  const diceCount = isPool ? request.diceCount : (system.diceCount > 1 ? system.diceCount : 1);
  const emoji = DICE_EMOJI[request.diceType] ?? "\u{1F3B2}";

  // Target display
  function getTargetText() {
    if (request.dc) return `vs DC ${request.dc}`;
    if (request.target) return `vs ${t("targetValue")} ${request.target}`;
    if (request.skillValue) return `vs ${t("skillValue")} ${request.skillValue}`;
    if (request.difficulty) return `vs ${t("difficulty")} ${request.difficulty}`;
    return "";
  }

  // Bar color based on percentage
  function getBarColor() {
    if (pct >= 70) return "bg-green-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-red-500";
  }

  const isExiting = phase === "exit";

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center ${
        isExiting ? "animate-dice-overlay-exit" : "animate-dice-overlay-enter"
      }`}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Reversal flash */}
      {showReversalFlash && (
        <div className="absolute inset-0 bg-white animate-reversal-flash z-10" />
      )}

      {/* Content */}
      <div className={`relative z-[5] flex flex-col items-center gap-4 px-6 w-full max-w-sm ${
        phase === "reversal" && showReversalText ? "animate-reversal-shake" : ""
      }`}>

        {/* Check label */}
        <div className="animate-dice-label-enter text-center">
          <div className="text-white/60 text-sm font-medium">{request.label}</div>
          {getTargetText() && (
            <div className="text-white/40 text-xs mt-0.5">{getTargetText()}</div>
          )}
        </div>

        {/* Dice area */}
        <div className="relative h-32 flex items-center justify-center">
          {phase === "rolling" ? (
            /* Rolling dice */
            <div className="flex gap-2">
              {Array.from({ length: Math.min(diceCount, 6) }).map((_, i) => (
                <span
                  key={i}
                  className="text-5xl animate-dice-tumble"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {emoji}
                </span>
              ))}
              {diceCount > 6 && (
                <span className="text-2xl text-white/50 self-center">+{diceCount - 6}</span>
              )}
            </div>
          ) : phase === "enter" ? (
            /* Waiting to roll */
            <div className="flex gap-2">
              {Array.from({ length: Math.min(diceCount, 6) }).map((_, i) => (
                <span key={i} className="text-5xl opacity-40">{emoji}</span>
              ))}
            </div>
          ) : (
            /* Result — settled dice + number */
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: Math.min(diceCount, 6) }).map((_, i) => (
                  <span key={i} className="text-3xl animate-dice-settle opacity-70">{emoji}</span>
                ))}
              </div>
              {displayTotal !== null && (
                <div className="animate-number-reveal">
                  <span className="text-6xl font-black text-white drop-shadow-lg"
                    style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}
                  >
                    {displayTotal}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Percentage bar */}
        {(phase === "result" || phase === "judgment" || phase === "reversal" || phase === "exit") && (
          <div className="w-full space-y-1">
            <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
              {/* Fill */}
              <div
                className={`h-full rounded-full ${getBarColor()} animate-bar-fill`}
                style={{ width: `${pct}%` }}
              />
              {/* Threshold marker */}
              {thresholdPct !== null && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-white/60"
                  style={{ left: `${thresholdPct}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white/50 whitespace-nowrap">
                    {request.dc ? `DC${request.dc}` : request.skillValue ? `${request.skillValue}` : ""}
                  </div>
                </div>
              )}
            </div>
            <div className="text-center text-white/50 text-xs">
              {pct}%
            </div>
          </div>
        )}

        {/* Judgment label */}
        {(phase === "judgment" || phase === "reversal" || phase === "exit") && judgmentLabel && (
          <div className={`animate-judgment-impact text-2xl font-black ${judgmentColor}`}
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {judgmentLabel}
          </div>
        )}

        {/* Pool detail (VtM/BitD) */}
        {(phase === "result" || phase === "judgment" || phase === "reversal" || phase === "exit") &&
         resultRef.current?.results && isPool && (
          <div className="flex flex-wrap justify-center gap-1">
            {resultRef.current.results.map((val, i) => {
              const isHighest = system.judgmentType === "pool-highest";
              const highest = isHighest ? Math.max(...(resultRef.current?.results ?? [])) : 0;
              const colorCls = isHighest
                ? val === highest && val === 6
                  ? "bg-green-400/30 text-green-300 ring-1 ring-green-400/50"
                  : val === highest
                  ? "bg-amber-400/30 text-amber-300"
                  : "bg-white/10 text-gray-400"
                : val === 10
                ? "bg-yellow-400/30 text-yellow-300 ring-1 ring-yellow-400/50"
                : val >= 6
                ? "bg-green-400/20 text-green-300"
                : "bg-white/10 text-gray-400";
              return (
                <span key={i} className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colorCls}`}>
                  {val}
                </span>
              );
            })}
          </div>
        )}

        {/* Reversal text */}
        {showReversalText && phase === "reversal" && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="animate-reversal-text text-4xl font-black text-yellow-400"
              style={{
                textShadow: "0 0 30px rgba(250,204,21,0.6), 0 2px 10px rgba(0,0,0,0.8)",
                WebkitTextStroke: "1px rgba(0,0,0,0.3)",
              }}
            >
              {t("diceReversalNyan")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
