import { createClient } from "@/lib/supabase/server";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { apiMsg, getLocaleFromRequest } from "@/lib/api-messages";
import { NextRequest } from "next/server";

const EXTEND_AMOUNT = 3;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const { questId } = body as { questId: string };

  if (!questId) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  // Fetch quest
  const { data: quest } = await supabase
    .from("solo_quests")
    .select("id, user_id, status, scenario_id, turns_extended, total_turns")
    .eq("id", questId)
    .single();

  if (!quest || quest.user_id !== user.id) {
    return Response.json({ error: apiMsg("questNotFound", request) }, { status: 404 });
  }

  if (quest.status !== "in_progress") {
    return Response.json({ error: apiMsg("questAlreadyEnded", request) }, { status: 400 });
  }

  // Only allow one extension per quest
  if (quest.turns_extended) {
    const locale = getLocaleFromRequest(request);
    return Response.json({
      error: locale === "en"
        ? "Already extended turns for this quest, meow!"
        : "이미 이 퀘스트에서 턴을 연장했다냥!",
    }, { status: 400 });
  }

  // Calculate new total turns
  const scenario = getScenario(quest.scenario_id);
  const { data: isPremium } = await supabase.rpc("is_premium", { p_user_id: user.id });
  const config = isPremium ? PREMIUM_CONFIG.premium : PREMIUM_CONFIG.free;
  const baseTurns = quest.total_turns ?? Math.round((scenario?.estimatedTurns ?? 10) * config.turnMultiplier);
  const newTotalTurns = baseTurns + EXTEND_AMOUNT;

  // Update quest
  const { error } = await supabase
    .from("solo_quests")
    .update({
      turns_extended: true,
      total_turns: newTotalTurns,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questId);

  if (error) {
    console.error("[extend-turns] Update error:", error);
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 500 });
  }

  return Response.json({ newTotalTurns, extended: EXTEND_AMOUNT });
}
