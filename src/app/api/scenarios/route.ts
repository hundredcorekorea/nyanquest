import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

// GET /api/scenarios — list published scenarios
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const genre = searchParams.get("genre");
  const language = searchParams.get("lang") || "all";
  const sort = searchParams.get("sort") || "popular";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("community_scenarios")
    .select("*, creator:profiles!community_scenarios_creator_id_fkey(id, nickname, avatar_url, cat_type), system:trpg_systems(*)")
    .eq("status", "published");

  if (genre && genre !== "all") {
    query = query.eq("genre", genre);
  }
  if (language !== "all") {
    query = query.eq("language", language);
  }

  if (sort === "popular") {
    query = query.order("play_count", { ascending: false });
  } else if (sort === "liked") {
    query = query.order("like_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("[scenarios] List error:", error);
    return Response.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }

  return Response.json({ scenarios: data || [], hasMore: (data?.length || 0) === limit });
}

// POST /api/scenarios — create a scenario
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const { title, titleEn, description, descriptionEn, genre, systemId, language, difficulty, estimatedTurns, scenarioData, tags, status } = body;

  if (!title || !description || !genre || !scenarioData?.background || !scenarioData?.opening || !scenarioData?.gmInstructions) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("community_scenarios")
    .insert({
      creator_id: user.id,
      title,
      title_en: titleEn || null,
      description,
      description_en: descriptionEn || null,
      genre,
      system_id: systemId || null,
      language: language || "ko",
      difficulty: difficulty || "normal",
      estimated_turns: estimatedTurns || 20,
      scenario_data: scenarioData,
      tags: tags || [],
      status: status || "published",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[scenarios] Create error:", error);
    return Response.json({ error: "Failed to create scenario" }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
