import { createClient } from "@/lib/supabase/server";
import { SCENARIOS } from "@/lib/solo-quest/scenarios";
import { PREMIUM_CONFIG } from "@/lib/premium";
import ScenarioCard from "./ScenarioCard";
import TutorialWrapper from "./TutorialWrapper";
import AbandonQuestButton from "./AbandonQuestButton";
import type { SoloQuest } from "@/types/solo-quest";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SoloQuestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Solo");
  const tDifficulty = await getTranslations("Difficulty");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let inProgressQuest: SoloQuest | null = null;
  let dailyCount = 0;
  let isPremium = false;

  if (user) {
    // Check premium status
    const { data: premiumStatus } = await supabase.rpc("is_premium", {
      p_user_id: user.id,
    });
    isPremium = !!premiumStatus;
    // Check for in-progress quest
    const { data: activeQuest } = await supabase
      .from("solo_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (activeQuest) {
      inProgressQuest = activeQuest as unknown as SoloQuest;
    }

    // Get daily start count (including in-progress, not just completed)
    const { data: count } = await supabase.rpc("get_daily_solo_start_count", {
      p_user_id: user.id,
    });
    dailyCount = count ?? 0;
  }

  const difficultyLabel = {
    easy: { text: tDifficulty("easy"), color: "bg-green-100 text-green-700" },
    normal: { text: tDifficulty("normal"), color: "bg-amber-100 text-amber-700" },
    hard: { text: tDifficulty("hard"), color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      {/* Tutorial for first-time visitors */}
      <TutorialWrapper />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🧙‍♂️🐱</div>
        <h1 className="text-xl font-bold text-gray-900">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-500">
          {t("subtitle")}
        </p>
        {user && (
          <p className="text-xs text-amber-600">
            {isPremium
              ? t("unlimitedTraining")
              : t("dailyCount", { count: dailyCount, limit: PREMIUM_CONFIG.free.dailyQuestLimit })}
          </p>
        )}
      </div>

      {/* Resume in-progress quest */}
      {inProgressQuest && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-amber-700">
              {t("inProgressTitle")}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {(() => { const s = SCENARIOS.find((s) => s.id === inProgressQuest!.scenario_id); return s ? (locale === "ko" ? s.titleKo : s.title) : t("unknownScenario"); })()}{" "}
            — {t("inProgressTurns", { turnCount: inProgressQuest.turn_count })}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/solo/${inProgressQuest.id}`}
              className="inline-block px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
            >
              {t("resumeTraining")}
            </Link>
            <AbandonQuestButton questId={inProgressQuest.id} />
          </div>
        </div>
      )}

      {/* Scenario list */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700">{t("selectScenario")}</h2>
        {SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            difficultyLabel={difficultyLabel[scenario.difficulty]}
            isLoggedIn={!!user}
            dailyLimitReached={!isPremium && dailyCount >= PREMIUM_CONFIG.free.dailyQuestLimit}
            hasActiveQuest={!!inProgressQuest}
            isPremium={isPremium}
          />
        ))}
      </div>

      {/* Not logged in message */}
      {!user && (
        <div className="text-center bg-gray-50 rounded-2xl p-6">
          <p className="text-3xl mb-2">🔒</p>
          <p className="text-sm text-gray-500">
            {t("loginRequiredForTraining")}
          </p>
        </div>
      )}
    </div>
  );
}
