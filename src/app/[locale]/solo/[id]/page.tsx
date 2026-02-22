import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { PREMIUM_CONFIG } from "@/lib/premium";
import type { SoloQuest } from "@/types/solo-quest";
import QuestChat from "./QuestChat";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SoloQuestPlayPage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: quest } = await supabase
    .from("solo_quests")
    .select("*")
    .eq("id", id)
    .single();

  if (!quest || quest.user_id !== user.id) notFound();

  const typedQuest = quest as unknown as SoloQuest;
  const scenario = getScenario(typedQuest.scenario_id);
  if (!scenario) notFound();

  // Check premium status
  const { data: premiumStatus } = await supabase.rpc("is_premium", {
    p_user_id: user.id,
  });
  const isPremium = !!premiumStatus;
  const effectiveTurns = Math.round(
    scenario.estimatedTurns *
      (isPremium
        ? PREMIUM_CONFIG.premium.turnMultiplier
        : PREMIUM_CONFIG.free.turnMultiplier)
  );

  return (
    <QuestChat
      quest={typedQuest}
      scenarioTitle={locale === "ko" ? scenario.titleKo : scenario.title}
      scenarioId={scenario.id}
      totalTurns={effectiveTurns}
      suggestedActions={scenario.suggestedActions}
      isPremium={isPremium}
      theme={scenario.theme}
      systemId={scenario.system}
    />
  );
}
