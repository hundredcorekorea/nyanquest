import { createClient } from "@/lib/supabase/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson, withCors } from "@/lib/api-cors";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { buildSystemPrompt } from "@/lib/solo-quest/prompts";
import { getSystem } from "@/lib/solo-quest/systems";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { apiMsg, getLocaleFromRequest } from "@/lib/api-messages";
import { checkUserInput } from "@/lib/safety";
import { getJob } from "@/lib/cat-jobs";
import { NextRequest } from "next/server";
import type { QuestMessage } from "@/types/solo-quest";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return corsJson({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = await request.json();
  const {
    questId,
    scenarioId,
    playerMessage,
    diceRoll,
    messages,
    turnCount,
    locale: bodyLocale,
    jobId,
    personaId,
  } = body as {
    questId: string;
    scenarioId: string;
    playerMessage: string;
    diceRoll?: { type: string; result: number; results?: number[]; modifier?: number; total: number; dc?: number; target?: number; skillValue?: number; success?: boolean; tier?: string; successes?: number; difficulty?: number; messyCritical?: boolean };
    messages: QuestMessage[];
    turnCount: number;
    locale?: "ko" | "en";
    jobId?: string;
    personaId?: string;
  };

  // Validate input
  if (!questId || !scenarioId || !playerMessage) {
    return corsJson({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  if (playerMessage.length > 500) {
    return corsJson(
      { error: apiMsg("messageTooLong", request) },
      { status: 400 }
    );
  }

  // Safety filter — block harmful content before sending to AI
  const safetyCheck = checkUserInput(playerMessage, bodyLocale ?? "ko");
  if (!safetyCheck.allowed) {
    return corsJson(
      { error: safetyCheck.reason ?? "Content blocked for safety." },
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
    return corsJson({ error: apiMsg("questNotFound", request) }, { status: 404 });
  }

  if (quest.status !== "in_progress") {
    return corsJson(
      { error: apiMsg("questAlreadyEnded", request) },
      { status: 400 }
    );
  }

  // Load scenario
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return corsJson(
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

  // Detect locale for multilingual AI response
  // Prefer explicit locale from client body (most reliable), fallback to cookie/header detection
  const locale = bodyLocale === "en" || bodyLocale === "ko" ? bodyLocale : getLocaleFromRequest(request);

  // Enforce turn limit (allow 2 extra turns max — AI should have wrapped up by now)
  if (turnCount >= effectiveTotalTurns + 2) {
    // Force complete the quest
    await supabase
      .from("solo_quests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", questId);

    return corsJson(
      { error: locale === "en" ? "Turn limit exceeded, meow!" : apiMsg("turnLimitExceeded", request) },
      { status: 400 }
    );
  }

  // Build system prompt
  const system = getSystem(scenario.system);
  let systemPrompt = buildSystemPrompt(scenario, turnCount, effectiveTotalTurns, config.maxTokens, system, locale, personaId);

  // Inject job/class prompt if selected
  if (jobId) {
    const job = getJob(jobId);
    if (job) {
      const jobPrompt = locale === "en" ? job.promptPrefixEn : job.promptPrefix;
      systemPrompt = `## 플레이어 직업\n${jobPrompt}\n\n${systemPrompt}`;
    }
  }

  // Dice result labels by locale
  const diceL = locale === "en"
    ? { result: "Dice Result", success: "Success", failure: "Failure", critical: "Critical!", fumble: "Fumble!", fullSuccess: "Full Success", partialSuccess: "Partial Success", messyCritical: "Messy Critical!", target: "target", skill: "skill", highest: "highest", successes: "successes", difficulty: "difficulty", vs: "vs" }
    : { result: "주사위 결과", success: "성공", failure: "실패", critical: "크리티컬!", fumble: "펌블!", fullSuccess: "완전 성공", partialSuccess: "부분 성공", messyCritical: "메시 크리티컬!", target: "목표치", skill: "기능치", highest: "최고값", successes: "성공 수", difficulty: "난이도", vs: "vs" };

  // Format dice result for AI context based on system
  function formatDiceForAI(roll: typeof diceRoll): string {
    if (!roll) return "";
    const resultsStr = roll.results ? `[${roll.results.join(",")}]` : String(roll.result);
    const modStr = roll.modifier ? ` + ${roll.modifier}` : "";
    const sf = (s?: boolean) => s ? diceL.success : diceL.failure;

    if (system.id === "insane") {
      return `\n[${diceL.result}: 2d6 = ${resultsStr} = ${roll.total} ${diceL.vs} ${diceL.target} ${roll.target ?? 0} (${sf(roll.success)})]`;
    }
    if (system.id === "coc") {
      let extra = "";
      if (roll.total <= 5) extra = ` ${diceL.critical}`;
      else if (roll.total >= 96) extra = ` ${diceL.fumble}`;
      return `\n[${diceL.result}: d100 = ${roll.total} ${diceL.vs} ${diceL.skill} ${roll.skillValue ?? 0} (${sf(roll.success)})${extra}]`;
    }
    if (system.id === "dungeon-world") {
      const tierLabel = roll.tier === "success" ? diceL.fullSuccess : roll.tier === "partial" ? diceL.partialSuccess : diceL.failure;
      return `\n[${diceL.result}: 2d6 = ${resultsStr}${modStr} = ${roll.total} (${tierLabel})]`;
    }
    if (system.id === "vtm") {
      const resultsDisplay = roll.results ? roll.results.map((r: number) => r >= 6 ? `[${r}✓]` : `[${r}]`).join("") : "";
      const messy = roll.messyCritical ? ` ${diceL.messyCritical}` : "";
      return `\n[${diceL.result}: ${roll.results?.length ?? 0}d10 = ${resultsDisplay} → ${diceL.successes} ${roll.successes ?? 0} ${diceL.vs} ${diceL.difficulty} ${roll.difficulty ?? 0} (${sf(roll.success)})${messy}]`;
    }
    if (system.id === "bitd") {
      const resultsDisplay = roll.results ? roll.results.map((r: number) => `[${r}]`).join("") : "";
      const highest = roll.total;
      const tierLabel = roll.tier === "success" ? diceL.fullSuccess : roll.tier === "partial" ? diceL.partialSuccess : diceL.failure;
      const critical = roll.messyCritical ? ` ${diceL.critical}` : "";
      return `\n[${diceL.result}: ${roll.results?.length ?? 0}d6 = ${resultsDisplay} → ${diceL.highest} ${highest} (${tierLabel})${critical}]`;
    }
    // D&D 5e default
    return `\n[${diceL.result}: ${roll.type} = ${roll.result}${modStr} = ${roll.total}${roll.dc ? ` ${diceL.vs} DC ${roll.dc} (${sf(roll.success)})` : ""}]`;
  }

  // Build messages for OpenRouter (more context = better coherence)
  const contextLimit = isPremium ? 12 : 8;
  const contextMessages = (messages || []).slice(-contextLimit);

  // Build the final player message with optional pacing reminder
  let finalPlayerContent = diceRoll
    ? `${playerMessage}${formatDiceForAI(diceRoll)}`
    : playerMessage;

  // Inject pacing reminder directly into conversation for the last 3 turns
  // This is much harder for the AI to ignore than system prompt alone
  const turnsRemaining = effectiveTotalTurns - turnCount;
  if (turnsRemaining <= 0) {
    finalPlayerContent += locale === "en"
      ? "\n\n[⚠️ GM DIRECTIVE: This is the FINAL turn. You MUST write the ending NOW. Include [Quest Complete] or [Quest Failed]. No choices, no new elements.]"
      : "\n\n[⚠️ GM 지시: 이것이 마지막 턴이다. 지금 당장 엔딩을 써라. [퀘스트 완료] 또는 [퀘스트 실패]를 반드시 포함해라. 선택지 금지, 새로운 요소 금지.]";
  } else if (turnsRemaining <= 2) {
    finalPlayerContent += locale === "en"
      ? `\n\n[⚠️ PACING: Only ${turnsRemaining} turn(s) remain. Do NOT introduce new things to explore. Present only choices that resolve the story's main conflict.]`
      : `\n\n[⚠️ 페이싱: 남은 턴 ${turnsRemaining}턴. 새로운 탐색 요소를 추가하지 마라. 이야기의 핵심 갈등을 해결하는 선택지만 제시하라.]`;
  }

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
      content: finalPlayerContent,
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
            "HTTP-Referer": "https://nyanquest.com",
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
      return corsJson(
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
    return corsJson(
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
          const fallback = locale === "en"
            ? "...NaYang GM paused to think, nya. Adventurer, could you say that again?"
            : "...나양 GM이 잠시 생각에 잠겼다냥. 집사, 다시 한 번 말해줄 수 있겠냥?";
          if (!fullResponse) {
            controller.enqueue(encoder.encode(fallback));
          }
          fullResponse = fullResponse || fallback;
        }

        // Save messages to DB — fetch full history first to avoid dropping older messages
        const { data: currentQuest } = await supabase
          .from("solo_quests")
          .select("messages")
          .eq("id", questId)
          .single();
        const existingMessages = (currentQuest?.messages as QuestMessage[]) || [];
        const newMessages = [
          ...existingMessages,
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

        // Detect quest end state from GM response
        const isFailed = fullResponse.includes("[퀘스트 실패]") || fullResponse.includes("[Quest Failed]");
        let isComplete = fullResponse.includes("[퀘스트 완료]") || fullResponse.includes("[Quest Complete]");

        // If we're past the turn limit and AI didn't include an ending tag, force it
        if (!isFailed && !isComplete && turnCount >= effectiveTotalTurns) {
          const endTag = locale === "en" ? "\n\n[Quest Complete]" : "\n\n[퀘스트 완료]";
          fullResponse += endTag;
          controller.enqueue(encoder.encode(endTag));
          isComplete = true;
        }

        const endStatus = isFailed ? "failed" : isComplete ? "completed" : null;

        supabase
          .from("solo_quests")
          .update({
            messages: newMessages,
            turn_count: turnCount + 1,
            updated_at: new Date().toISOString(),
            ...(endStatus ? { status: endStatus } : {}),
          })
          .eq("id", questId)
          .then(() => {});

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
