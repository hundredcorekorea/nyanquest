"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/Toast";
import type { ScenarioTheme } from "@/types/solo-quest";

interface Props {
  questId: string;
  remainingTurns: number;
  isPremium: boolean;
  turnsExtended: boolean;
  theme: ScenarioTheme;
  onExtended: (newTotalTurns: number) => void;
}

export default function TurnExtendBanner({
  questId,
  remainingTurns,
  isPremium,
  turnsExtended,
  theme,
  onExtended,
}: Props) {
  const t = useTranslations("SoloQuest");
  const { toast } = useToast();
  const [extending, setExtending] = useState(false);

  // Don't show if already extended or not at the threshold
  if (turnsExtended || remainingTurns > 2 || isPremium) return null;

  async function handleExtend() {
    if (extending) return;
    setExtending(true);
    try {
      const res = await fetch("/api/solo-quest/extend-turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      toast(t("turnExtended"), "success");
      onExtended(data.newTotalTurns);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("turnExtendAdNotReady"), "error");
    } finally {
      setExtending(false);
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] ${theme.bubbleColor} border-b border-white/5`}>
      <span className="text-amber-400 shrink-0">⚡</span>
      <span className="text-gray-300 truncate">
        {t("turnExtendTitle", { remaining: remainingTurns })}
      </span>
      <button
        onClick={handleExtend}
        disabled={extending}
        className="ml-auto shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full bg-purple-500/80 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
      >
        {extending ? "..." : t("turnExtendAd")}
      </button>
    </div>
  );
}
