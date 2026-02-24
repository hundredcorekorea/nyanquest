import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/scenarios/[id] — get scenario detail
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("community_scenarios")
    .select("*, creator:profiles!community_scenarios_creator_id_fkey(id, nickname, avatar_url, cat_type), system:trpg_systems(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: apiMsg("scenarioNotFound", request) }, { status: 404 });
  }

  // Check if current user has liked this scenario
  const { data: { user } } = await supabase.auth.getUser();
  let liked = false;
  if (user) {
    const { data: likeData } = await supabase
      .from("scenario_likes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("scenario_id", id)
      .maybeSingle();
    liked = !!likeData;
  }

  const isOwner = !!user && data.creator_id === user.id;
  return Response.json({ scenario: data, liked, isOwner });
}

// PATCH /api/scenarios/[id] — update scenario (creator only)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("community_scenarios")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (!existing || existing.creator_id !== user.id) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowedFields = ["title", "title_en", "description", "description_en", "genre", "system_id", "difficulty", "estimated_turns", "scenario_data", "scenario_data_en", "tags", "status"];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = field === "estimated_turns" ? Math.min(body[field], 25) : body[field];
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_scenarios")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("[scenarios] Update error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }

  // Re-translate if content fields changed
  const contentFields = ["title", "description", "scenario_data"];
  if (contentFields.some((f) => updates[f] !== undefined)) {
    triggerTranslation(id);
  }

  return Response.json({ ok: true });
}

function triggerTranslation(scenarioId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
  fetch(`${baseUrl}/api/scenarios/${scenarioId}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-translate-secret": process.env.TRANSLATE_SECRET || "",
    },
  }).catch((err) => console.error("[scenarios] Translation trigger failed:", err));
}

// DELETE /api/scenarios/[id] — delete scenario (creator only)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("community_scenarios")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (!existing || existing.creator_id !== user.id) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[scenarios] Delete error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
