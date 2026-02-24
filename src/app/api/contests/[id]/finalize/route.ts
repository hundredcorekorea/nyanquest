import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/contests/[id]/finalize — admin-only: calculate winners and grant rewards
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  const { id: contestId } = await params;

  // Admin auth via secret header
  const secret = request.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch contest
  const { data: contest, error: contestError } = await admin
    .from("scenario_contests")
    .select("*")
    .eq("id", contestId)
    .single();

  if (contestError || !contest) {
    return Response.json({ error: "Contest not found" }, { status: 404 });
  }

  if (contest.status !== "ended") {
    return Response.json({ error: "Contest must be in 'ended' status to finalize" }, { status: 400 });
  }

  // Fetch all entries with scenario data
  const { data: entries } = await admin
    .from("contest_entries")
    .select("*, scenario:community_scenarios(id, play_count, like_count)")
    .eq("contest_id", contestId);

  if (!entries || entries.length === 0) {
    return Response.json({ error: "No entries to finalize" }, { status: 400 });
  }

  // Calculate scores
  const scored = entries.map((entry) => {
    const scenario = entry.scenario as Record<string, number> | null;
    const score = scenario
      ? (scenario.like_count || 0) * contest.like_weight + (scenario.play_count || 0) * contest.play_weight
      : 0;
    return { ...entry, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks and update entries
  const winners = scored.slice(0, contest.winner_count);
  for (let i = 0; i < scored.length; i++) {
    await admin
      .from("contest_entries")
      .update({ rank: i + 1, score: scored[i].score })
      .eq("id", scored[i].id);
  }

  // Reward winners with premium subscription
  const now = new Date();
  for (const winner of winners) {
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + contest.reward_months);

    // Expire existing active subscriptions
    await admin
      .from("subscriptions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("user_id", winner.user_id)
      .eq("status", "active");

    // Create reward subscription
    await admin.from("subscriptions").insert({
      user_id: winner.user_id,
      plan: "monthly",
      status: "active",
      portone_payment_id: `contest_reward_${contestId}_${winner.user_id}`,
      amount: 0,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // Mark winning scenario as premium (official)
    await admin
      .from("community_scenarios")
      .update({ is_premium: true })
      .eq("id", winner.scenario_id);

    // Send notification
    await admin.from("notifications").insert({
      user_id: winner.user_id,
      type: "contest_winner",
      message: `contest:${contest.title}:rank${winner.rank || (winners.indexOf(winner) + 1)}`,
    });
  }

  // Update contest status to finalized
  await admin
    .from("scenario_contests")
    .update({ status: "finalized" })
    .eq("id", contestId);

  return Response.json({
    ok: true,
    winners: winners.map((w) => ({
      userId: w.user_id,
      scenarioId: w.scenario_id,
      rank: w.rank || (winners.indexOf(w) + 1),
      score: w.score,
    })),
  });
}
