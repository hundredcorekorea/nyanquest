import { createClient } from "@/lib/supabase/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson, withCors } from "@/lib/api-cors";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { buildMultiplayerSystemPrompt } from "@/lib/party-session/prompts";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { NextRequest } from "next/server";
import type { SessionMessage } from "@/types/party-session";
import { apiMsg } from "@/lib/api-messages";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return corsJson({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, playerMessage, diceRoll, isOpening, forceRound } = body as {
    sessionId: string;
    playerMessage?: string;
    diceRoll?: { type: string; result: number; results?: number[]; modifier?: number; total: number; dc?: number; target?: number; skillValue?: number; success?: boolean; tier?: string; successes?: number; difficulty?: number; messyCritical?: boolean };
    isOpening?: boolean;
    forceRound?: boolean;
  };

  if (!sessionId || (!playerMessage && !isOpening && !forceRound)) {
    return corsJson({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  if (playerMessage && playerMessage.length > 500) {
    return corsJson(
      { error: apiMsg("messageTooLong", request) },
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
    return corsJson({ error: apiMsg("sessionNotFound", request) }, { status: 404 });
  }

  if (session.status !== "active") {
    return corsJson({ error: apiMsg("sessionEnded", request) }, { status: 400 });
  }

  if (!session.use_ai_gm) {
    return corsJson({ error: apiMsg("notAiGmSession", request) }, { status: 400 });
  }

  // Check turn limit
  if ((session.turn_count ?? 0) >= (session.total_turns ?? 20)) {
    return corsJson(
      { error: apiMsg("turnLimitReached", request) },
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
    return corsJson({ error: apiMsg("notPartyMember", request) }, { status: 403 });
  }

  const playerName = (membership.user as unknown as { nickname: string })?.nickname ?? "모험가";

  // Validate forceRound: only the party creator can force a round
  if (forceRound) {
    const { data: party } = await supabase
      .from("parties")
      .select("creator_id")
      .eq("id", session.party_id)
      .single();
    if (party?.creator_id !== user.id) {
      return corsJson({ error: apiMsg("notPartyMember", request) }, { status: 403 });
    }
  }

  // Use service role to bypass RLS for consistency
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  );

  // Save player message (skip for opening — GM starts first)
  if (!isOpening && playerMessage) {
    await serviceSupabase.from("session_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      role: "player",
      player_name: playerName,
      content: playerMessage,
      dice_roll: diceRoll ?? null,
    });
  }

  // --- Round-based logic for async AI GM sessions ---
  // In async mode, wait for ALL PL members to submit before triggering AI.
  // The "round" is defined as all player messages since the last GM message.
  const isAsyncAiGm = session.play_mode === "async" && session.use_ai_gm && !isOpening;

  if (isAsyncAiGm && !forceRound) {
    // Get all PL members (exclude GM role)
    const { data: plMembers } = await supabase
      .from("party_members")
      .select("user_id, user:profiles(nickname)")
      .eq("party_id", session.party_id)
      .eq("status", "accepted")
      .eq("role", "PL");

    const totalPLs = plMembers?.length ?? 0;

    if (totalPLs > 1) {
      // Find the last GM message timestamp to define the current round
      const { data: lastGmMsg } = await serviceSupabase
        .from("session_messages")
        .select("created_at")
        .eq("session_id", sessionId)
        .eq("role", "gm")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Count unique PL submissions since last GM message
      let roundQuery = serviceSupabase
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
      const submitted = submittedUserIds.size;

      // Build submitted names for display
      const submittedNames = (plMembers ?? [])
        .filter((m) => submittedUserIds.has(m.user_id))
        .map((m) => (m.user as unknown as { nickname: string })?.nickname ?? "모험가");

      if (submitted < totalPLs) {
        // Notify PL members who haven't submitted yet
        const unsubmittedMembers = (plMembers ?? []).filter(
          (m) => !submittedUserIds.has(m.user_id)
        );
        if (unsubmittedMembers.length > 0 && submitted >= 1) {
          const notifications = unsubmittedMembers.map((m) => ({
            user_id: m.user_id,
            type: "round_your_turn",
            message: JSON.stringify({ ko: `${playerName}님이 행동을 제출했다냥! (${submitted}/${totalPLs}) 당신의 차례다냥!`, en: `${playerName} submitted an action, nya! (${submitted}/${totalPLs}) It's your turn!` }),
            party_id: session.party_id,
            link_path: `/party/${session.party_id}/play`,
          }));
          await serviceSupabase.from("notifications").insert(notifications);
          // Send push to each unsubmitted member
          for (const m of unsubmittedMembers) {
            sendPushToUser(m.user_id, {
              title: "nyanQuest ⚔️",
              body: `${playerName} submitted an action, nya! Your turn!`,
              url: `/party/${session.party_id}/play`,
            });
          }
        }

        // Not all PL members submitted — return waiting status (JSON, not stream)
        return corsJson({
          waiting: true,
          submitted,
          total: totalPLs,
          submittedNames,
        });
      }
      // All submitted — fall through to AI call
    }
  }

  // Fetch recent messages for context (exclude chat messages from AI context)
  const { data: recentMessages } = await supabase
    .from("session_messages")
    .select("*")
    .eq("session_id", sessionId)
    .neq("role", "chat")
    .order("created_at", { ascending: false })
    .limit(10);

  const contextMessages = (recentMessages ?? []).reverse() as SessionMessage[];

  // Fetch all party members with profile details for prompt
  const { data: allMembers } = await supabase
    .from("party_members")
    .select("role, user:profiles(nickname, style_tags, preferred_elements, avoided_elements)")
    .eq("party_id", session.party_id)
    .eq("status", "accepted");

  type MemberProfile = { nickname: string; style_tags: string[]; preferred_elements: string[]; avoided_elements: string[] };
  const players = (allMembers ?? []).map((m) => {
    const u = m.user as unknown as MemberProfile | null;
    return {
      nickname: u?.nickname ?? "모험가",
      role: m.role as "GM" | "PL",
      styleTags: u?.style_tags ?? [],
      preferredElements: u?.preferred_elements ?? [],
      avoidedElements: u?.avoided_elements ?? [],
    };
  });

  // Fetch party description
  const { data: partyInfo } = await supabase
    .from("parties")
    .select("content, title")
    .eq("id", session.party_id)
    .single();

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
    config.maxTokens,
    partyInfo?.content ?? null
  );

  // Build OpenRouter messages
  function formatMessageContent(m: SessionMessage): string {
    if (m.role !== "player") return m.content;
    let text = `[${m.player_name}] ${m.content}`;
    if (m.dice_roll) {
      const roll = m.dice_roll;
      const resultsStr = roll.results ? `[${roll.results.join(",")}]` : String(roll.result);
      const modStr = roll.modifier ? ` + ${roll.modifier}` : "";

      if (roll.successes !== undefined) {
        // Pool-count (VtM)
        const resultsDisplay = roll.results ? roll.results.map((r: number) => r >= 6 ? `[${r}✓]` : `[${r}]`).join("") : "";
        const messy = roll.messyCritical ? " 메시 크리티컬!" : "";
        text += `\n[주사위: ${roll.results?.length ?? 0}d10 = ${resultsDisplay} → 성공 수 ${roll.successes} vs 난이도 ${roll.difficulty ?? 0} (${roll.success ? "성공" : "실패"})${messy}]`;
      } else if (roll.tier) {
        // Tier (Dungeon World / Blades)
        const tierLabel = roll.tier === "success" ? "완전 성공" : roll.tier === "partial" ? "부분 성공" : "실패";
        const critical = roll.messyCritical ? " 크리티컬!" : "";
        text += `\n[주사위: ${resultsStr}${modStr} = ${roll.total} (${tierLabel})${critical}]`;
      } else if (roll.skillValue) {
        // CoC
        let extra = "";
        if (roll.total <= 5) extra = " 크리티컬!";
        else if (roll.total >= 96) extra = " 펌블!";
        text += `\n[주사위: d100 = ${roll.total} vs 기능치 ${roll.skillValue} (${roll.success ? "성공" : "실패"})${extra}]`;
      } else if (roll.target) {
        // Insane
        text += `\n[주사위: ${resultsStr}${modStr} = ${roll.total} vs 목표치 ${roll.target} (${roll.success ? "성공" : "실패"})]`;
      } else {
        // D&D / generic
        text += `\n[주사위: ${roll.type} = ${roll.result}${modStr} = ${roll.total}`;
        if (roll.dc) {
          text += ` vs DC ${roll.dc} (${roll.success ? "성공" : "실패"})`;
        }
        text += "]";
      }
    }
    return text;
  }

  const openRouterMessages = [
    { role: "system" as const, content: systemPrompt },
    ...(isOpening
      ? [{ role: "user" as const, content: "[세션 시작] 모험가들이 모였다. 모험의 시작을 알려줘. 장면을 묘사하고 첫 번째 선택지를 제시해." }]
      : contextMessages.map((m) => ({
          role: (m.role === "gm" || m.role === "system" ? "assistant" : "user") as "assistant" | "user",
          content: formatMessageContent(m),
        }))),
  ];

  // Call OpenRouter with retry logic
  const MAX_RETRIES = 2;
  let openRouterResponse: Response | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nyanquest.com",
            "X-Title": "nyanQuest Party Session",
          },
          body: JSON.stringify({
            model: config.aiModel,
            messages: openRouterMessages,
            stream: true,
            max_tokens: config.maxTokens,
            temperature: 0.7,
          }),
        }
      );

      if (openRouterResponse.ok) break;

      const status = openRouterResponse.status;
      if (attempt < MAX_RETRIES && (status >= 500 || status === 429)) {
        const delay = (attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }
      console.error(`[party-session] OpenRouter network error:`, err);
      return corsJson(
        { error: apiMsg("aiGmUnavailable", request) },
        { status: 502 }
      );
    }
  }

  if (!openRouterResponse || !openRouterResponse.ok) {
    const errBody = await openRouterResponse?.text().catch(() => "") ?? "";
    console.error(
      `[party-session] OpenRouter ${openRouterResponse?.status}: ${errBody}`
    );
    return corsJson(
      { error: apiMsg("aiGmUnavailable", request) },
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
        // Fallback if AI returned empty/too-short response
        if (!fullResponse || fullResponse.trim().length < 10) {
          const fallback = "...나양 GM이 잠시 생각에 잠겼다냥. 모험가들, 다시 한 번 말해줄 수 있겠냥?";
          if (!fullResponse) {
            controller.enqueue(encoder.encode(fallback));
          }
          fullResponse = fullResponse || fallback;
        }

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
    headers: withCors({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    }),
  });
}
