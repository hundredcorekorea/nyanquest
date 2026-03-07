import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

// Simple in-memory rate limit: max 10 searches per 60s per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { query } = (await request.json()) as { query: string };
  if (!query || query.trim().length < 2) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  const searchTerm = query.trim().slice(0, 20);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, cat_type")
    .ilike("nickname", `%${searchTerm}%`)
    .neq("id", user.id)
    .limit(5);

  return Response.json({ users: users || [] });
}
