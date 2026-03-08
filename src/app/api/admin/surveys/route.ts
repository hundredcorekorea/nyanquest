import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // 1) Recent responses (latest 200)
  const { data: responses } = await admin
    .from("survey_responses")
    .select("id, rating, feedback, play_type, quest_status, scenario_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  // 2) Rating distribution
  const { data: allInRange } = await admin
    .from("survey_responses")
    .select("rating, play_type")
    .gte("created_at", since);

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  const byType = { solo: { count: 0, sum: 0 }, party: { count: 0, sum: 0 } };
  for (const r of allInRange || []) {
    dist[r.rating] = (dist[r.rating] || 0) + 1;
    const t = r.play_type as "solo" | "party";
    if (byType[t]) {
      byType[t].count++;
      byType[t].sum += r.rating;
    }
  }

  const total = (allInRange || []).length;
  const avgRating = total > 0 ? (allInRange || []).reduce((s, r) => s + r.rating, 0) / total : 0;

  // 3) Total count (all time)
  const { count: totalAll } = await admin
    .from("survey_responses")
    .select("id", { count: "exact", head: true });

  return Response.json({
    period: { days, since },
    summary: {
      total,
      totalAll: totalAll || 0,
      avgRating: Math.round(avgRating * 100) / 100,
      distribution: dist,
      byType: {
        solo: {
          count: byType.solo.count,
          avg: byType.solo.count > 0 ? Math.round((byType.solo.sum / byType.solo.count) * 100) / 100 : 0,
        },
        party: {
          count: byType.party.count,
          avg: byType.party.count > 0 ? Math.round((byType.party.sum / byType.party.count) * 100) / 100 : 0,
        },
      },
    },
    responses: responses || [],
  });
}
