import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/contests/[id]/enter — enter a contest with a scenario
export async function POST(request: NextRequest, { params }: Params) {
  const { id: contestId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const { scenarioId } = body;
  if (!scenarioId) {
    return Response.json({ error: apiMsg("scenarioRequired", request) }, { status: 400 });
  }

  // Verify contest is active
  const { data: contest } = await supabase
    .from("scenario_contests")
    .select("id, status, genre_filter")
    .eq("id", contestId)
    .single();

  if (!contest || contest.status !== "active") {
    return Response.json({ error: apiMsg("contestNotActive", request) }, { status: 400 });
  }

  // Verify scenario ownership
  const { data: scenario } = await supabase
    .from("community_scenarios")
    .select("id, creator_id, genre, status")
    .eq("id", scenarioId)
    .single();

  if (!scenario || scenario.creator_id !== user.id) {
    return Response.json({ error: apiMsg("notScenarioOwner", request) }, { status: 403 });
  }

  // Check genre filter
  if (contest.genre_filter && scenario.genre !== contest.genre_filter) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  // Ensure scenario is published
  if (scenario.status !== "published") {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contest_entries")
    .insert({
      contest_id: contestId,
      scenario_id: scenarioId,
      user_id: user.id,
    });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: apiMsg("alreadyEntered", request) }, { status: 409 });
    }
    console.error("[contests] Enter error:", error);
    return Response.json({ error: "Failed to enter contest" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
