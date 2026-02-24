import { createClient } from "@/lib/supabase/server";

// GET /api/scenarios/mine — list current user's published scenarios
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ scenarios: [] });
  }

  const { data } = await supabase
    .from("community_scenarios")
    .select("id, title, title_en, genre, status")
    .eq("creator_id", user.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return Response.json({ scenarios: data || [] });
}
