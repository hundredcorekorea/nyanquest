import { createClient } from "@/lib/supabase/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson } from "@/lib/api-cors";
import { NextRequest } from "next/server";

/**
 * GET /api/leaderboard?limit=50&offset=0
 *
 * Returns top users ranked by cumulative EXP.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = await createClient();

  // Get current user for "my rank" highlight
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Top N by EXP
  const { data: leaders, error } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, cat_exp, cat_type, active_title")
    .order("cat_exp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return corsJson({ error: error.message }, { status: 500 });
  }

  // Get my rank if logged in
  let myRank: number | null = null;
  let myProfile = null;

  if (user) {
    const { data: myData } = await supabase
      .from("profiles")
      .select("id, nickname, avatar_url, cat_exp, active_title")
      .eq("id", user.id)
      .single();

    if (myData) {
      myProfile = myData;
      // Count how many users have more EXP than me
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("cat_exp", myData.cat_exp);
      myRank = (count ?? 0) + 1;
    }
  }

  return corsJson({
    leaders: leaders ?? [],
    myRank,
    myProfile,
    total: leaders?.length ?? 0,
  });
}
