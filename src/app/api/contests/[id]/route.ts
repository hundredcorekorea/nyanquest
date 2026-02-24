import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/contests/[id] — contest detail + leaderboard
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contest, error } = await supabase
    .from("scenario_contests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !contest) {
    return Response.json({ error: apiMsg("contestNotFound", request) }, { status: 404 });
  }

  // Fetch entries with scenario + user info
  const { data: entries } = await supabase
    .from("contest_entries")
    .select("*, scenario:community_scenarios(id, title, title_en, play_count, like_count, genre, creator:profiles!community_scenarios_creator_id_fkey(id, nickname, avatar_url, cat_type))")
    .eq("contest_id", id)
    .order("score", { ascending: false, nullsFirst: false });

  // Calculate live scores for active/ended contests
  const scoredEntries = (entries || []).map((entry) => {
    const scenario = entry.scenario as Record<string, number> | null;
    const liveScore = scenario
      ? (scenario.like_count || 0) * contest.like_weight + (scenario.play_count || 0) * contest.play_weight
      : entry.score || 0;
    return { ...entry, score: liveScore };
  });
  scoredEntries.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Check if current user has entered
  const { data: { user } } = await supabase.auth.getUser();
  let myEntry = null;
  if (user) {
    myEntry = scoredEntries.find((e) => e.user_id === user.id) || null;
  }

  return Response.json({
    contest,
    entries: scoredEntries,
    myEntry,
  });
}
