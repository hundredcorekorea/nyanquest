"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { PREMIUM_CONFIG } from "@/lib/premium";
import AdGate from "@/components/AdGate";
import type { Scenario } from "@/types/solo-quest";

interface Props {
  scenario: Scenario;
  difficultyLabel: { text: string; color: string };
  isLoggedIn: boolean;
  dailyLimitReached: boolean;
  hasActiveQuest: boolean;
  isPremium: boolean;
}

export default function ScenarioCard({
  scenario,
  difficultyLabel,
  isLoggedIn,
  dailyLimitReached,
  hasActiveQuest,
  isPremium,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tSolo = useTranslations("Solo");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);

  const isLocked = scenario.isPremium && !isPremium;
  const effectiveTurns = Math.round(
    scenario.estimatedTurns *
      (isPremium
        ? PREMIUM_CONFIG.premium.turnMultiplier
        : PREMIUM_CONFIG.free.turnMultiplier)
  );

  function handleClick() {
    if (isLocked) {
      router.push("/premium");
      return;
    }
    if (!isLoggedIn) {
      toast(tCommon("loginRequired"), "error");
      return;
    }
    if (dailyLimitReached) {
      toast(tSolo("dailyLimitReached"), "error");
      return;
    }
    if (hasActiveQuest) {
      toast(tSolo("finishActiveFirst"), "error");
      return;
    }

    // Premium users skip ad gate
    if (isPremium) {
      startQuest();
    } else {
      setShowAdGate(true);
    }
  }

  async function startQuest() {
    setShowAdGate(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Server-side daily limit check
      const { data: dailyStartCount } = await supabase.rpc("get_daily_solo_start_count", {
        p_user_id: user.id,
      });
      const { data: premiumStatus } = await supabase.rpc("is_premium", {
        p_user_id: user.id,
      });
      const limit = premiumStatus
        ? PREMIUM_CONFIG.premium.dailyQuestLimit
        : PREMIUM_CONFIG.free.dailyQuestLimit;
      if ((dailyStartCount ?? 0) >= limit) {
        toast(tSolo("dailyLimitReached"), "error");
        return;
      }

      // Create quest with opening message
      const { data: quest, error } = await supabase
        .from("solo_quests")
        .insert({
          user_id: user.id,
          scenario_id: scenario.id,
          total_turns: effectiveTurns,
          messages: [
            {
              role: "gm",
              content: scenario.openingMessage,
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .select("id")
        .single();

      if (error || !quest) {
        toast(tSolo("questCreateFailed"), "error");
        return;
      }

      router.push(`/solo/${quest.id}`);
    } catch {
      toast(tCommon("errorOccurred"), "error");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    (!isLocked && (!isLoggedIn || dailyLimitReached || hasActiveQuest)) || loading;

  return (
    <div
      className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow ${
        isLocked ? "border-purple-200 opacity-80" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">{scenario.thumbnailEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-sm">
              {locale === "ko" ? scenario.titleKo : scenario.title}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${difficultyLabel.color}`}
            >
              {difficultyLabel.text}
            </span>
            {scenario.isPremium && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">{locale === "ko" ? scenario.description : scenario.descriptionEn}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>🎭 {locale === "ko" ? scenario.genre : scenario.genreEn}</span>
            <span>🎲 ~{effectiveTurns} {tCommon("turns")}</span>
          </div>
        </div>
      </div>
      <AdGate
        open={showAdGate}
        onComplete={startQuest}
        onCancel={() => setShowAdGate(false)}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isLocked
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            : disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        {loading
          ? tSolo("preparing")
          : isLocked
          ? tSolo("premiumScenario")
          : tSolo("startTraining")}
      </button>
    </div>
  );
}
