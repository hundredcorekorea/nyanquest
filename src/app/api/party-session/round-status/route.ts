import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("party_sessions")
    .select("party_id, play_mode, use_ai_gm")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return Response.json({ error: apiMsg("sessionNotFound", request) }, { status: 404 });
  }

  // Only relevant for async AI GM sessions
  if (session.play_mode !== "async" || !session.use_ai_gm) {
    return Response.json({ roundBased: false });
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("party_members")
    .select("id")
    .eq("party_id", session.party_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!membership) {
    return Response.json({ error: apiMsg("notPartyMember", request) }, { status: 403 });
  }

  // Get PL members
  const { data: plMembers } = await supabase
    .from("party_members")
    .select("user_id, user:profiles(nickname)")
    .eq("party_id", session.party_id)
    .eq("status", "accepted")
    .eq("role", "PL");

  const totalPLs = plMembers?.length ?? 0;

  // Find last GM message
  const { data: lastGmMsg } = await supabase
    .from("session_messages")
    .select("created_at")
    .eq("session_id", sessionId)
    .eq("role", "gm")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Count unique PL submissions since last GM message
  let roundQuery = supabase
    .from("session_messages")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("role", "player");

  if (lastGmMsg) {
    roundQuery = roundQuery.gt("created_at", lastGmMsg.created_at);
  }

  const { data: roundMessages } = await roundQuery;
  const submittedUserIds = new Set(
    (roundMessages ?? []).map((m) => m.user_id).filter(Boolean)
  );

  const submittedNames = (plMembers ?? [])
    .filter((m) => submittedUserIds.has(m.user_id))
    .map((m) => (m.user as unknown as { nickname: string })?.nickname ?? "모험가");

  const currentUserSubmitted = submittedUserIds.has(user.id);

  return Response.json({
    roundBased: true,
    submitted: submittedUserIds.size,
    total: totalPLs,
    submittedNames,
    currentUserSubmitted,
    allSubmitted: submittedUserIds.size >= totalPLs,
  });
}
