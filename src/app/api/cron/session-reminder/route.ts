import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * GET /api/cron/session-reminder
 *
 * Vercel Cron Job — runs daily.
 * Finds active async party sessions with no progress for 24+ hours,
 * then sends a push notification to members who haven't submitted.
 */
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find active async sessions where last message was 24+ hours ago
  const { data: staleSessions, error: sessionError } = await admin
    .from("party_sessions")
    .select(`
      id,
      party_id,
      play_mode,
      parties!inner(title)
    `)
    .eq("status", "active")
    .eq("play_mode", "async")
    .eq("use_ai_gm", true);

  if (sessionError || !staleSessions || staleSessions.length === 0) {
    return Response.json({ ok: true, reminded: 0, reason: "no active async sessions" });
  }

  let totalReminded = 0;

  for (const session of staleSessions) {
    // Get the last message time for this session
    const { data: lastMsg } = await admin
      .from("session_messages")
      .select("created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastMsg) continue;

    const lastMsgTime = new Date(lastMsg.created_at).getTime();
    const hoursSinceLastMsg = (Date.now() - lastMsgTime) / (1000 * 60 * 60);

    // Only remind if 24+ hours with no activity
    if (hoursSinceLastMsg < 24) continue;

    // Find the last GM message to determine who hasn't submitted this round
    const { data: lastGmMsg } = await admin
      .from("session_messages")
      .select("created_at")
      .eq("session_id", session.id)
      .eq("role", "gm")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get PL members
    const { data: plMembers } = await admin
      .from("party_members")
      .select("user_id")
      .eq("party_id", session.party_id)
      .eq("status", "accepted")
      .eq("role", "PL");

    if (!plMembers || plMembers.length <= 1) continue;

    // Find who already submitted since last GM message
    let roundQuery = admin
      .from("session_messages")
      .select("user_id")
      .eq("session_id", session.id)
      .eq("role", "player");

    if (lastGmMsg) {
      roundQuery = roundQuery.gt("created_at", lastGmMsg.created_at);
    }

    const { data: roundMessages } = await roundQuery;
    const submittedIds = new Set(
      (roundMessages ?? []).map((m) => m.user_id).filter(Boolean)
    );

    // Send reminder to members who haven't submitted
    const unsubmitted = plMembers.filter((m) => !submittedIds.has(m.user_id));
    if (unsubmitted.length === 0) continue;

    const partyTitle = (session.parties as unknown as { title: string })?.title || "Party";
    const submitted = plMembers.length - unsubmitted.length;

    for (const member of unsubmitted) {
      // Insert notification
      await admin.from("notifications").insert({
        user_id: member.user_id,
        type: "round_your_turn",
        message: JSON.stringify({ ko: `[${partyTitle}] 모험이 기다린다냥! (${submitted}/${plMembers.length}) 파티원이 행동을 기다리고 있다냥!`, en: `[${partyTitle}] Adventure awaits, nya! (${submitted}/${plMembers.length}) Your party is waiting for your action!` }),
        party_id: session.party_id,
        link_path: `/party/${session.party_id}/play`,
      });

      // Send push
      sendPushToUser(member.user_id, {
        title: "nyanQuest ⏰",
        body: `[${partyTitle}] Your party awaits, nya! Time to act!`,
        url: `/party/${session.party_id}/play`,
      });

      totalReminded++;
    }
  }

  return Response.json({ ok: true, reminded: totalReminded });
}
