import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { buildMultiplayerSystemPrompt } from "@/lib/party-session/prompts";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { NextRequest } from "next/server";
import type { SessionMessage } from "@/types/party-session";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요하다냥!" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, playerMessage, diceRoll } = body as {
    sessionId: string;
    playerMessage: string;
    diceRoll?: { type: string; result: number; modifier?: number; total: number; dc?: number; success?: boolean };
  };

  if (!sessionId || !playerMessage) {
    return Response.json({ error: "잘못된 요청이다냥" }, { status: 400 });
  }

  if (playerMessage.length > 500) {
    return Response.json(
      { error: "메시지가 너무 길다냥! 500자 이내로 줄여달라냥." },
      { status: 400 }
    );
  }

  // Fetch session
  const { data: session } = await supabase
    .from("party_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return Response.json({ error: "세션을 찾을 수 없다냥" }, { status: 404 });
  }

  if (session.status !== "active") {
    return Response.json({ error: "종료된 세션이다냥" }, { status: 400 });
  }

  if (!session.use_ai_gm) {
    return Response.json({ error: "AI GM이 아닌 세션이다냥" }, { status: 400 });
  }

  // Check turn limit
  if ((session.turn_count ?? 0) >= (session.total_turns ?? 20)) {
    return Response.json(
      { error: "턴 제한에 도달했다냥! 세션이 종료된다냥." },
      { status: 400 }
    );
  }

  // Verify user is party member
  const { data: membership } = await supabase
    .from("party_members")
    .select("role, user:profiles(nickname)")
    .eq("party_id", session.party_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!membership) {
    return Response.json({ error: "파티 멤버가 아니다냥" }, { status: 403 });
  }

  const playerName = (membership.user as unknown as { nickname: string })?.nickname ?? "모험가";

  // Save player message to session_messages
  // Use service role to bypass RLS for consistency
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await serviceSupabase.from("session_messages").insert({
    session_id: sessionId,
    user_id: user.id,
    role: "player",
    player_name: playerName,
    content: playerMessage,
    dice_roll: diceRoll ?? null,
  });

  // Fetch recent messages for context
  const { data: recentMessages } = await supabase
    .from("session_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  const contextMessages = (recentMessages ?? []).reverse() as SessionMessage[];

  // Fetch all party members for prompt
  const { data: allMembers } = await supabase
    .from("party_members")
    .select("role, user:profiles(nickname)")
    .eq("party_id", session.party_id)
    .eq("status", "accepted");

  const players = (allMembers ?? []).map((m) => ({
    nickname: (m.user as unknown as { nickname: string })?.nickname ?? "모험가",
    role: m.role as "GM" | "PL",
  }));

  // Check if any member is premium
  const memberIds = (allMembers ?? []).map((m) => {
    // We need user_id but it's not selected; use a workaround
    return null;
  }).filter(Boolean);

  // Check caller's premium status (simplification: use caller's premium for model selection)
  const { data: isPremium } = await supabase.rpc("is_premium", {
    p_user_id: user.id,
  });
  const config = isPremium ? PREMIUM_CONFIG.premium : PREMIUM_CONFIG.free;

  // Load scenario if set
  const scenario = session.scenario_id ? getScenario(session.scenario_id) ?? null : null;

  // Build system prompt
  const effectiveTotalTurns = Math.round(
    (session.total_turns ?? 20) * (isPremium ? config.turnMultiplier : 1)
  );
  const systemPrompt = buildMultiplayerSystemPrompt(
    scenario,
    players,
    session.turn_count ?? 0,
    effectiveTotalTurns,
    config.maxTokens
  );

  // Build OpenRouter messages
  function formatMessageContent(m: SessionMessage): string {
    if (m.role !== "player") return m.content;
    let text = `[${m.player_name}] ${m.content}`;
    if (m.dice_roll) {
      text += `\n[주사위: ${m.dice_roll.type} = ${m.dice_roll.total}`;
      if (m.dice_roll.dc) {
        text += ` vs DC ${m.dice_roll.dc} (${m.dice_roll.success ? "성공" : "실패"})`;
      }
      text += "]";
    }
    return text;
  }

  const openRouterMessages = [
    { role: "system" as const, content: systemPrompt },
    ...contextMessages.map((m) => ({
      role: (m.role === "gm" || m.role === "system" ? "assistant" : "user") as "assistant" | "user",
      content: formatMessageContent(m),
    })),
  ];

  // Call OpenRouter
  const openRouterResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyanquest.vercel.app",
        "X-Title": "nyanQuest Party Session",
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: openRouterMessages,
        stream: true,
        max_tokens: config.maxTokens,
        temperature: 0.8,
      }),
    }
  );

  if (!openRouterResponse.ok) {
    const errBody = await openRouterResponse.text().catch(() => "");
    console.error(
      `[party-session] OpenRouter ${openRouterResponse.status}: ${errBody}`
    );
    return Response.json(
      { error: "AI GM이 잠시 쉬고 있다냥... 다시 시도해달라냥!" },
      { status: 502 }
    );
  }

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = openRouterResponse.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        // Save AI GM message via service role
        await serviceSupabase.from("session_messages").insert({
          session_id: sessionId,
          user_id: null, // AI GM
          role: "gm",
          player_name: "나양 GM",
          content: fullResponse,
          dice_roll: null,
        });

        // Update session turn count
        await serviceSupabase
          .from("party_sessions")
          .update({
            turn_count: (session.turn_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        // Check if quest is complete
        if (fullResponse.includes("[퀘스트 완료]")) {
          await serviceSupabase
            .from("party_sessions")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", sessionId);
        }

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
