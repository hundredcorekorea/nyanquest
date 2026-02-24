import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/scenarios/[id]/like — toggle like
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("toggle_scenario_like", {
    p_user_id: user.id,
    p_scenario_id: id,
  });

  if (error) {
    console.error("[scenarios] Like error:", error);
    return Response.json({ error: "Failed to toggle like" }, { status: 500 });
  }

  return Response.json(data);
}
