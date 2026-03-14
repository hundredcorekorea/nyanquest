import { createClient } from "@/lib/supabase/server";
export { OPTIONS } from "@/lib/api-cors";
import { corsJson } from "@/lib/api-cors";
import { getScenario } from "@/lib/solo-quest/scenarios";
import { apiMsg, getLocaleFromRequest } from "@/lib/api-messages";
import { NextRequest } from "next/server";

/**
 * POST /api/solo-quest/epilogue
 *
 * Generates "NaYang's Letter" — a shareable epilogue for a completed quest.
 * Uses the cheapest model (flash-lite) since it's a simple creative summary.
 *
 * Request body (QuestEpiloguePayload):
 * {
 *   questId: string;
 *   scenarioId: string;
 *   turnCount: number;
 *   finalStatus: "completed" | "failed";
 *   playerTitle?: string;        // e.g. "전설의 집사"
 *   highlights?: string[];       // key moments from the quest (max 5)
 *   personaId?: string;
 *   locale?: "ko" | "en";
 * }
 *
 * Response:
 * { epilogue: string }           // NaYang's letter in markdown
 */

export interface QuestEpiloguePayload {
  questId: string;
  scenarioId: string;
  turnCount: number;
  finalStatus: "completed" | "failed";
  playerTitle?: string;
  highlights?: string[];
  personaId?: string;
  locale?: "ko" | "en";
}

const EPILOGUE_PROMPT_KO = `너는 마법사 고양이 나양이다. 방금 끝난 모험에 대해 집사(플레이어)에게 보내는 짧은 편지를 써줘.

규칙:
- 반드시 나양의 말투("~냥", "~다냥")를 사용해.
- 200자 이내로 짧고 감성적으로 써.
- 성공한 모험이면 축하와 칭찬을, 실패한 모험이면 위로와 격려를 담아.
- 마지막에 "다음 모험에서 또 만나자냥! 🐾" 같은 재회 약속으로 끝내.
- 하이라이트가 주어지면 1~2개를 자연스럽게 언급해.
- 칭호가 있으면 그 칭호로 불러.
- 마크다운은 사용하지 마. 순수 텍스트만.`;

const EPILOGUE_PROMPT_EN = `You are NaYang, a wizard cat. Write a short letter to the adventurer (player) about the quest that just ended.

Rules:
- Always use NaYang's speech pattern (end sentences with "~nya", "~meow").
- Keep it under 200 characters, short and emotional.
- If the quest succeeded, celebrate and praise. If failed, comfort and encourage.
- End with a reunion promise like "See you on the next adventure, meow! 🐾"
- If highlights are provided, naturally mention 1-2 of them.
- If a title is given, address them by that title.
- Do NOT use markdown. Plain text only.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return corsJson({ error: apiMsg("loginRequired", request) }, { status: 401 });
  }

  const body = (await request.json()) as QuestEpiloguePayload;
  const { questId, scenarioId, turnCount, finalStatus, playerTitle, highlights, locale: bodyLocale } = body;

  if (!questId || !scenarioId || !finalStatus) {
    return corsJson({ error: apiMsg("invalidRequest", request) }, { status: 400 });
  }

  // Verify quest ownership
  const { data: quest } = await supabase
    .from("solo_quests")
    .select("id, user_id, status")
    .eq("id", questId)
    .single();

  if (!quest || quest.user_id !== user.id) {
    return corsJson({ error: apiMsg("questNotFound", request) }, { status: 404 });
  }

  const scenario = getScenario(scenarioId);
  const locale = bodyLocale ?? getLocaleFromRequest(request);
  const isKo = locale === "ko";

  const scenarioTitle = scenario
    ? (isKo ? scenario.titleKo : scenario.title)
    : "알 수 없는 모험";

  const userMessage = [
    `시나리오: ${scenarioTitle}`,
    `결과: ${finalStatus === "completed" ? (isKo ? "성공" : "Success") : (isKo ? "실패" : "Failed")}`,
    `턴 수: ${turnCount}`,
    playerTitle ? `칭호: ${playerTitle}` : null,
    highlights?.length ? `하이라이트: ${highlights.slice(0, 5).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nyanquest.com",
        "X-Title": "nyanQuest Epilogue",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: isKo ? EPILOGUE_PROMPT_KO : EPILOGUE_PROMPT_EN },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Epilogue API error:", response.status, errorText);
      return corsJson({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const epilogue = data.choices?.[0]?.message?.content?.trim() ?? "";

    return corsJson({ epilogue });
  } catch (err) {
    console.error("Epilogue generation error:", err);
    return corsJson({ error: "Internal server error" }, { status: 500 });
  }
}
