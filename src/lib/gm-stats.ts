import type { GmStats } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

function buildStats(
  parties: { id: string; status: string; system: { name: string } | null }[],
  reviews: { rating: number }[]
): GmStats {
  const totalSessions = parties.length;
  const completedSessions = parties.filter(
    (p) => p.status === "completed"
  ).length;

  const systemCounts: Record<string, number> = {};
  for (const p of parties) {
    const name = p.system?.name ?? "Other";
    systemCounts[name] = (systemCounts[name] ?? 0) + 1;
  }
  const systems = Object.entries(systemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalGmReviews = reviews.length;
  const positiveCount = reviews.filter((r) => r.rating === 1).length;
  const positiveRate =
    totalGmReviews > 0 ? Math.round((positiveCount / totalGmReviews) * 100) : 0;

  return { totalSessions, completedSessions, systems, positiveRate, totalGmReviews };
}

/** 단일 유저 GM 통계 */
export async function fetchGmStats(
  supabase: SupabaseClient,
  userId: string
): Promise<GmStats> {
  const { data: gmParties } = await supabase
    .from("parties")
    .select("id, status, system:trpg_systems(name)")
    .eq("gm_id", userId);

  const parties = (gmParties ?? []) as unknown as {
    id: string;
    status: string;
    system: { name: string } | null;
  }[];

  const completedIds = parties
    .filter((p) => p.status === "completed")
    .map((p) => p.id);

  let reviews: { rating: number }[] = [];
  if (completedIds.length > 0) {
    const { data } = await supabase
      .from("reviews")
      .select("rating")
      .eq("target_id", userId)
      .in("party_id", completedIds);
    reviews = data ?? [];
  }

  return buildStats(parties, reviews);
}

/** 여러 유저 GM 통계 일괄 조회 (쿼리 2개) */
export async function fetchGmStatsBatch(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Record<string, GmStats>> {
  if (userIds.length === 0) return {};

  const { data: allParties } = await supabase
    .from("parties")
    .select("id, gm_id, status, system:trpg_systems(name)")
    .in("gm_id", userIds);

  const parties = (allParties ?? []) as unknown as {
    id: string;
    gm_id: string;
    status: string;
    system: { name: string } | null;
  }[];

  const completedIds = parties
    .filter((p) => p.status === "completed")
    .map((p) => p.id);

  let allReviews: { target_id: string; party_id: string; rating: number }[] = [];
  if (completedIds.length > 0) {
    const { data } = await supabase
      .from("reviews")
      .select("target_id, party_id, rating")
      .in("target_id", userIds)
      .in("party_id", completedIds);
    allReviews = data ?? [];
  }

  const result: Record<string, GmStats> = {};
  for (const uid of userIds) {
    const userParties = parties.filter((p) => p.gm_id === uid);
    const userReviews = allReviews.filter((r) => r.target_id === uid);
    result[uid] = buildStats(userParties, userReviews);
  }

  return result;
}
