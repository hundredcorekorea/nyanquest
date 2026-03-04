"use client";

import { useTranslations } from "next-intl";
import type { ParsedDiceRequest } from "@/lib/solo-quest/dice";
import type { TrpgSystemPreset } from "@/lib/solo-quest/systems";

interface Props {
  request: ParsedDiceRequest;
  system: TrpgSystemPreset;
  onTrigger: () => void;
}

const DICE_EMOJI: Record<string, string> = {
  d4: "\u{1F53A}", d6: "\u{1F3B2}", d8: "\u{1F48E}",
  d10: "\u{1F52E}", d12: "\u2B50", d20: "\u{1F3B2}", d100: "\u{1F4AF}",
};

export default function DiceRoller({ request, system, onTrigger }: Props) {
  const t = useTranslations("SoloQuest");

  const isPool = system.judgmentType === "pool-count" || system.judgmentType === "pool-highest";
  const emoji = DICE_EMOJI[request.diceType] ?? "\u{1F3B2}";
  const diceNotation = isPool
    ? `${request.diceCount}${request.diceType}`
    : system.diceCount > 1
    ? `${system.diceCount}${request.diceType}`
    : request.diceType;
  const diceCount = isPool ? request.diceCount : (system.diceCount > 1 ? system.diceCount : 1);

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
        onClick={onTrigger}
        className="bg-linear-to-r from-amber-400 to-orange-400 text-white rounded-2xl px-8 py-4 text-center hover:from-amber-500 hover:to-orange-500 transition-all active:scale-95"
      >
        <div className="space-y-1">
          <div className="flex justify-center gap-1">
            {Array.from({ length: Math.min(diceCount, 6) }).map((_, i) => (
              <span key={i} className="text-3xl">{emoji}</span>
            ))}
            {diceCount > 6 && <span className="text-lg self-center text-white/60">+{diceCount - 6}</span>}
          </div>
          <div className="text-sm font-bold">
            {diceNotation}
            {request.modifier > 0 ? `+${request.modifier}` : ""} {t("diceRoll")}
          </div>
          <div className="text-xs opacity-80">
            {getCheckLabel()}
          </div>
        </div>
      </button>
    </div>
  );
}
