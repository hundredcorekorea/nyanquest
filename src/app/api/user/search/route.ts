import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { query } = (await request.json()) as { query: string };
  if (!query || query.trim().length < 2) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  const searchTerm = query.trim();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, cat_type")
    .ilike("nickname", `%${searchTerm}%`)
    .neq("id", user.id)
    .limit(5);

  return Response.json({ users: users || [] });
}
