import { createClient } from "@/lib/supabase/server";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { buildSystemPrompt } from "@/lib/solo-quest/prompts";
import { getSystem } from "@/lib/solo-quest/systems";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { apiMsg } from "@/lib/api-messages";
import { NextRequest } from "next/server";
import type { QuestMessage } from "@/types/solo-quest";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const {
    questId,
    scenarioId,
    playerMessage,
    diceRoll,
    messages,
    turnCount,
  } = body as {
    questId: string;
    scenarioId: string;
    playerMessage: string;
    diceRoll?: { type: string; result: number; results?: number[]; modifier?: number; total: number; dc?: number; target?: number; skillValue?: number; success?: boolean; tier?: string; successes?: number; difficulty?: number; messyCritical?: boolean };
    messages: QuestMessage[];
    turnCount: number;
  };

  // Validate input
  if (!questId || !scenarioId || !playerMessage) {
    return Response.json({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  if (playerMessage.length > 500) {
    return Response.json(
      { error: apiMsg("messageTooLong", request) },
      { status: 400 }
    );
  }

  // Hard turn limit checked after scenario load (see below)

  // Verify quest ownership
  const { data: quest } = await supabase
    .from("solo_quests")
    .select("id, user_id, status")
    .eq("id", questId)
    .single();

  if (!quest || quest.user_id !== user.id) {
    return Response.json({ error: apiMsg("questNotFound", request) }, { status: 404 });
  }

  if (quest.status !== "in_progress") {
    return Response.json(
      { error: apiMsg("questAlreadyEnded", request) },
      { status: 400 }
    );
  }

  // Load scenario
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return Response.json(
      { error: apiMsg("scenarioNotFound", request) },
      { status: 404 }
    );
  }

  // Check premium status
  const { data: isPremium } = await supabase.rpc("is_premium", {
    p_user_id: user.id,
  });
  const config = isPremium ? PREMIUM_CONFIG.premium : PREMIUM_CONFIG.free;

  // Calculate total turns with premium multiplier
  const effectiveTotalTurns = Math.round(scenario.estimatedTurns * config.turnMultiplier);

  // Enforce turn limit (allow 2 extra turns for AI to wrap up)
  if (turnCount >= effectiveTotalTurns + 2) {
    // Force complete the quest
    await supabase
      .from("solo_quests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", questId);

    return Response.json(
      { error: apiMsg("turnLimitExceeded", request) },
      { status: 400 }
    );
  }

  // Build system prompt
  const system = getSystem(scenario.system);
  const systemPrompt = buildSystemPrompt(scenario, turnCount, effectiveTotalTurns, config.maxTokens, system);

  // Format dice result for AI context based on system
  function formatDiceForAI(roll: typeof diceRoll): string {
    if (!roll) return "";
    const resultsStr = roll.results ? `[${roll.results.join(",")}]` : String(roll.result);
    const modStr = roll.modifier ? ` + ${roll.modifier}` : "";

    if (system.id === "insane") {
      return `\n[주사위 결과: 2d6 = ${resultsStr} = ${roll.total} vs 목표치 ${roll.target ?? 0} (${roll.success ? "성공" : "실패"})]`;
    }
    if (system.id === "coc") {
      let extra = "";
      if (roll.total <= 5) extra = " 크리티컬!";
      else if (roll.total >= 96) extra = " 펌블!";
      return `\n[주사위 결과: d100 = ${roll.total} vs 기능치 ${roll.skillValue ?? 0} (${roll.success ? "성공" : "실패"})${extra}]`;
    }
    if (system.id === "dungeon-world") {
      const tierLabel = roll.tier === "success" ? "완전 성공" : roll.tier === "partial" ? "부분 성공" : "실패";
      return `\n[주사위 결과: 2d6 = ${resultsStr}${modStr} = ${roll.total} (${tierLabel})]`;
    }
    if (system.id === "vtm") {
      const resultsDisplay = roll.results ? roll.results.map((r: number) => r >= 6 ? `[${r}✓]` : `[${r}]`).join("") : "";
      const messy = roll.messyCritical ? " 메시 크리티컬!" : "";
      return `\n[주사위 결과: ${roll.results?.length ?? 0}d10 = ${resultsDisplay} → 성공 수 ${roll.successes ?? 0} vs 난이도 ${roll.difficulty ?? 0} (${roll.success ? "성공" : "실패"})${messy}]`;
    }
    if (system.id === "bitd") {
      const resultsDisplay = roll.results ? roll.results.map((r: number) => `[${r}]`).join("") : "";
      const highest = roll.total;
      const tierLabel = roll.tier === "success" ? "완전 성공" : roll.tier === "partial" ? "부분 성공" : "실패";
      const critical = roll.messyCritical ? " 크리티컬!" : "";
      return `\n[주사위 결과: ${roll.results?.length ?? 0}d6 = ${resultsDisplay} → 최고값 ${highest} (${tierLabel})${critical}]`;
    }
    // D&D 5e default
    return `\n[주사위 결과: ${roll.type} = ${roll.result}${modStr} = ${roll.total}${roll.dc ? ` vs DC ${roll.dc} (${roll.success ? "성공" : "실패"})` : ""}]`;
  }

  // Build messages for OpenRouter (more context = better coherence)
  const contextLimit = isPremium ? 12 : 8;
  const contextMessages = (messages || []).slice(-contextLimit);
  const openRouterMessages = [
    { role: "system" as const, content: systemPrompt },
    ...contextMessages.map((m: QuestMessage) => ({
      role: (m.role === "gm" ? "assistant" : "user") as "assistant" | "user",
      content: m.diceRoll
        ? `${m.content}${formatDiceForAI(m.diceRoll)}`
        : m.content,
    })),
    {
      role: "user" as const,
      content: diceRoll
        ? `${playerMessage}${formatDiceForAI(diceRoll)}`
        : playerMessage,
    },
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
            "HTTP-Referer": "https://nyanquest.vercel.app",
            "X-Title": "nyanQuest Solo Quest",
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

      // Retry on 5xx server errors or 429 rate limit
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
      console.error(`[solo-quest] OpenRouter network error:`, err);
      return Response.json(
        { error: apiMsg("aiUnavailable", request) },
        { status: 502 }
      );
    }
  }

  if (!openRouterResponse || !openRouterResponse.ok) {
    const errBody = await openRouterResponse?.text().catch(() => "") ?? "";
    console.error(
      `[solo-quest] OpenRouter ${openRouterResponse?.status}: ${errBody}`
    );
    return Response.json(
      { error: apiMsg("aiUnavailable", request) },
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
          // Keep the last (potentially incomplete) line in buffer
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
          const fallback = "...나양 GM이 잠시 생각에 잠겼다냥. 집사, 다시 한 번 말해줄 수 있겠냥?";
          if (!fullResponse) {
            controller.enqueue(encoder.encode(fallback));
          }
          fullResponse = fullResponse || fallback;
        }

        // Save messages to DB (fire-and-forget)
        const newMessages = [
          ...messages,
          {
            role: "player",
            content: playerMessage,
            timestamp: new Date().toISOString(),
            ...(diceRoll ? { diceRoll } : {}),
          },
          {
            role: "gm",
            content: fullResponse,
            timestamp: new Date().toISOString(),
          },
        ];

        supabase
          .from("solo_quests")
          .update({
            messages: newMessages,
            turn_count: turnCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", questId)
          .then(() => {});

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
