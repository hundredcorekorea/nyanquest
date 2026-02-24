import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/contests — list contests (with on-demand status transition)
export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // On-demand status transitions
  await admin
    .from("scenario_contests")
    .update({ status: "active" })
    .eq("status", "upcoming")
    .lte("start_date", now)
    .gt("end_date", now);

  await admin
    .from("scenario_contests")
    .update({ status: "ended" })
    .eq("status", "active")
    .lte("end_date", now);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenario_contests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[contests] List error:", error);
    return Response.json({ error: "Failed to fetch contests" }, { status: 500 });
  }

  return Response.json({ contests: data || [] });
}
