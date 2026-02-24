import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

// POST /api/scenarios/[id]/translate — fire-and-forget translation worker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Simple auth: only allow internal calls with secret
  const authHeader = request.headers.get("x-translate-secret");
  if (authHeader !== process.env.TRANSLATE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch the scenario
  const { data: scenario, error: fetchError } = await admin
    .from("community_scenarios")
    .select("id, language, title, title_en, description, description_en, scenario_data, scenario_data_en")
    .eq("id", id)
    .single();

  if (fetchError || !scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Mark as pending
  await admin
    .from("community_scenarios")
    .update({ translation_status: "pending" })
    .eq("id", id);

  try {
    const isKorean = scenario.language === "ko";
    const sourceLang = isKorean ? "Korean" : "English";
    const targetLang = isKorean ? "English" : "Korean";

    // Prepare fields to translate
    const sourceTitle = isKorean ? scenario.title : scenario.title_en || scenario.title;
    const sourceDescription = isKorean ? scenario.description : scenario.description_en || scenario.description;
    const sourceData = isKorean ? scenario.scenario_data : scenario.scenario_data_en || scenario.scenario_data;

    const prompt = `You are a professional TRPG scenario translator. Translate the following TRPG scenario from ${sourceLang} to ${targetLang}.

Rules:
- Transliterate proper nouns (character names, place names) phonetically
- Keep game mechanics terms as-is: DC, d20, HP, NPC, GM, etc.
- Maintain the tone and atmosphere of the original
- Return ONLY valid JSON, no markdown code blocks

Translate this JSON:
${JSON.stringify({
  title: sourceTitle,
  description: sourceDescription,
  scenario_data: sourceData,
})}

Return format:
{"title": "...", "description": "...", "scenario_data": {"background": "...", "opening": "...", "gmInstructions": "...", "npcs": [...], "keyEvents": [...], "possibleEndings": [...]}}`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`OpenRouter returned ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle potential markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const translated = JSON.parse(jsonStr);

    // Update DB based on language direction
    const updates: Record<string, unknown> = {
      translation_status: "completed",
      updated_at: new Date().toISOString(),
    };

    if (isKorean) {
      // Korean original → translate to English (_en fields)
      updates.title_en = translated.title;
      updates.description_en = translated.description;
      updates.scenario_data_en = translated.scenario_data;
    } else {
      // English original → translate to Korean (main fields)
      updates.title = translated.title;
      updates.description = translated.description;
      updates.scenario_data = translated.scenario_data;
    }

    await admin.from("community_scenarios").update(updates).eq("id", id);

    return Response.json({ ok: true, direction: `${sourceLang} → ${targetLang}` });
  } catch (err) {
    console.error("[translate] Translation failed:", err);
    await admin
      .from("community_scenarios")
      .update({ translation_status: "failed" })
      .eq("id", id);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}
