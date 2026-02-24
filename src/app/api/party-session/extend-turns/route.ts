import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { apiMsg } from "@/lib/api-messages";

const EXTEND_AMOUNT = 10;
const MAX_EXTENDS_PER_SESSION = 3;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const { sessionId } = (await request.json()) as { sessionId: string };
  if (!sessionId) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  // Fetch session
  const { data: session } = await supabase
    .from("party_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return Response.json({ error: apiMsg("sessionNotFound", request) }, { status: 404 });
  }

  if (session.status !== "active") {
    return Response.json({ error: apiMsg("sessionEnded", request) }, { status: 400 });
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

  // Check extend limit (stored in session metadata or count from current total vs original)
  const extendCount = session.extend_count ?? 0;
  if (extendCount >= MAX_EXTENDS_PER_SESSION) {
    return Response.json(
      { error: apiMsg("extendLimitReached", request) },
      { status: 400 }
    );
  }

  // Update session with service role
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  );

  const { error } = await serviceSupabase
    .from("party_sessions")
    .update({
      total_turns: (session.total_turns ?? 25) + EXTEND_AMOUNT,
      extend_count: extendCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.error("[extend-turns] Error:", error);
    return Response.json({ error: "Failed to extend turns" }, { status: 500 });
  }

  return Response.json({
    totalTurns: (session.total_turns ?? 25) + EXTEND_AMOUNT,
    extendCount: extendCount + 1,
    maxExtends: MAX_EXTENDS_PER_SESSION,
  });
}
