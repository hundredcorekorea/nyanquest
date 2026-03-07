import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { soloChat } from "../lib/api";
import { tossHaptic, tossSubmitScore, tossShare } from "../lib/toss";
import { getScenario } from "../lib/scenarios";
import { checkUserInput, detectCrisisInResponse, CRISIS_HELP_MESSAGE } from "../lib/safety";
import type { Profile, QuestMessage, SoloQuest as SoloQuestType } from "../types";

interface Props {
  profile: Profile | null;
}

export default function SoloQuest({ profile }: Props) {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const scenario = getScenario(scenarioId || "");

  const [quest, setQuest] = useState<SoloQuestType | null>(null);
  const [messages, setMessages] = useState<QuestMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [totalTurns, setTotalTurns] = useState(0);
  const [questStatus, setQuestStatus] = useState<string>("in_progress");
  const [expClaimed, setExpClaimed] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyRating, setSurveyRating] = useState<number | null>(null);
  const [surveyFeedback, setSurveyFeedback] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  // Cancel active stream reader on unmount
  useEffect(() => {
    return () => { readerRef.current?.cancel(); };
  }, []);

  // Create or resume quest
  useEffect(() => {
    if (!profile || !scenarioId) return;
    (async () => {
      // Check for existing in-progress quest
      const { data: existing } = await supabase
        .from("solo_quests")
        .select("*")
        .eq("user_id", profile.id)
        .eq("scenario_id", scenarioId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setQuest(existing);
        setMessages(existing.messages || []);
        setTurnCount(existing.turn_count);
        setTotalTurns(existing.total_turns);
        return;
      }

      // Create new quest
      const turns = 20; // Free tier default
      const { data: newQuest } = await supabase
        .from("solo_quests")
        .insert({
          user_id: profile.id,
          scenario_id: scenarioId,
          status: "in_progress",
          messages: [],
          turn_count: 0,
          total_turns: turns,
          exp_earned: 0,
        })
        .select()
        .single();

      if (newQuest) {
        setQuest(newQuest);
        setTotalTurns(turns);
        // Send initial request to get GM opening message
        await sendMessage("", newQuest);
      }
    })();
  }, [profile, scenarioId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async (playerMsg: string, currentQuest?: SoloQuestType) => {
    const q = currentQuest || quest;
    if (!q || !scenarioId || isStreaming) return;

    const newMessages = playerMsg
      ? [...messages, { role: "player" as const, content: playerMsg, timestamp: new Date().toISOString() }]
      : messages;

    if (playerMsg) {
      setMessages(newMessages);
      setInput("");
      tossHaptic("tap");
    }

    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await soloChat({
        questId: q.id,
        scenarioId,
        playerMessage: playerMsg || "__START__",
        messages: newMessages,
        turnCount: turnCount,
      });

      if (!res.ok) {
        const err = await res.json();
        setStreamingText(`오류: ${err.error || "알 수 없는 오류"}`);
        setIsStreaming(false);
        return;
      }

      // Stream response
      const reader = res.body?.getReader();
      readerRef.current = reader ?? null;
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE format
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || parsed.token || parsed.text || "";
                  fullText += content;
                  setStreamingText(fullText);
                } catch {
                  // SSE text chunk (not JSON)
                  fullText += data;
                  setStreamingText(fullText);
                }
              }
            }
          }
        } finally {
          readerRef.current = null;
        }
      }

      // If no streaming, try JSON response
      if (!fullText) {
        try {
          const text = await res.text();
          const json = JSON.parse(text);
          fullText = json.content || json.message || text;
          setStreamingText(fullText);
        } catch {
          // Already consumed
        }
      }

      // Add GM message
      const gmMsg: QuestMessage = {
        role: "gm",
        content: fullText,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, gmMsg];
      setMessages(updatedMessages);
      setStreamingText("");

      const newTurn = playerMsg ? turnCount + 1 : turnCount;
      setTurnCount(newTurn);

      // Crisis detection in AI response
      if (detectCrisisInResponse(fullText)) {
        setCrisisAlert(true);
      }

      // Check completion
      if (fullText.includes("[퀘스트 완료]") || fullText.includes("[Quest Complete]")) {
        setQuestStatus("completed");
        tossHaptic("success");
      } else if (fullText.includes("[퀘스트 실패]") || fullText.includes("[Quest Failed]")) {
        setQuestStatus("failed");
        tossHaptic("error");
      } else if (newTurn >= totalTurns) {
        setQuestStatus("completed");
      }

      // Save to DB
      await supabase
        .from("solo_quests")
        .update({
          messages: updatedMessages,
          turn_count: newTurn,
          status: questStatus !== "in_progress" ? questStatus : "in_progress",
        })
        .eq("id", q.id);

    } catch (e) {
      console.error("Chat error:", e);
      setStreamingText("네트워크 오류가 발생했다냥...");
    } finally {
      setIsStreaming(false);
    }
  }, [quest, scenarioId, messages, turnCount, totalTurns, isStreaming, questStatus]);

  const [safetyWarning, setSafetyWarning] = useState("");
  const [crisisAlert, setCrisisAlert] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const check = checkUserInput(input.trim());
    if (!check.allowed) {
      setSafetyWarning(check.reason || "");
      tossHaptic("error");
      setTimeout(() => setSafetyWarning(""), 4000);
      return;
    }
    setSafetyWarning("");
    sendMessage(input.trim());
  };

  const handleSuggestion = (action: string) => {
    if (isStreaming) return;
    sendMessage(action);
  };

  const handleClaimExp = async () => {
    if (!quest || !profile || expClaimed) return;
    const expAmount = questStatus === "failed" ? 5 : 15;

    const { error } = await supabase.rpc("complete_solo_quest", {
      p_quest_id: quest.id,
      p_user_id: profile.id,
      p_exp_amount: expAmount,
    });

    if (error) {
      tossHaptic("error");
      return;
    }

    setExpClaimed(true);
    tossHaptic("success");

    // Check survey eligibility
    const { count } = await supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id);
    if (count === 0) setShowSurvey(true);

    // Submit to Toss leaderboard
    const { data: freshProfile } = await supabase
      .from("profiles")
      .select("cat_exp")
      .eq("id", profile.id)
      .maybeSingle();
    if (freshProfile) {
      tossSubmitScore(freshProfile.cat_exp);
    }
  };

  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-screen text-(--tds-text-secondary)">
        시나리오를 찾을 수 없다냥...
      </div>
    );
  }

  // Quest complete screen
  if (questStatus !== "in_progress") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="text-5xl mb-4">{questStatus === "completed" ? "🎉" : "💀"}</div>
        <h2 className="text-xl font-bold text-(--tds-text) mb-2">
          {questStatus === "completed" ? "퀘스트 완료!" : "퀘스트 실패..."}
        </h2>
        <p className="text-(--tds-text-secondary) text-sm mb-6">
          {questStatus === "completed"
            ? `${scenario.titleKo} 시나리오를 클리어했다냥!`
            : "다음에 다시 도전해보라냥!"}
        </p>

        {!expClaimed ? (
          <button
            onClick={handleClaimExp}
            className="px-6 py-3 bg-(--tds-blue) text-(--tds-text) rounded-xl font-medium active:scale-95 transition-transform"
          >
            +{questStatus === "failed" ? 5 : 15} EXP 받기
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-(--tds-green) text-sm">EXP를 획득했다냥! ✨</p>

            {/* Survey */}
            {showSurvey && !surveySubmitted && (
              <div className="w-full max-w-sm bg-(--tds-bg-card) rounded-2xl border border-(--tds-border) p-4 space-y-3 mt-2">
                <p className="text-sm font-bold text-(--tds-text)">오늘 모험 어땠냥? 🐱</p>
                <div className="flex justify-center gap-2">
                  {[
                    { v: 5, e: "😍" }, { v: 4, e: "🙂" }, { v: 3, e: "😐" }, { v: 2, e: "😕" }, { v: 1, e: "😢" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setSurveyRating(o.v)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        surveyRating === o.v ? "bg-(--tds-blue)/20 scale-110 ring-2 ring-(--tds-blue)" : ""
                      }`}
                    >
                      {o.e}
                    </button>
                  ))}
                </div>
                {surveyRating !== null && (
                  <textarea
                    value={surveyFeedback}
                    onChange={(e) => setSurveyFeedback(e.target.value.slice(0, 200))}
                    placeholder="더 알려줄 거 있냥? (선택)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-(--tds-bg) border border-(--tds-border) rounded-xl resize-none text-(--tds-text) placeholder:text-(--tds-text-disabled)"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSurvey(false)}
                    className="flex-1 py-2 text-sm text-(--tds-text-secondary) bg-(--tds-bg) rounded-xl"
                  >
                    건너뛰기
                  </button>
                  {surveyRating !== null && (
                    <button
                      onClick={async () => {
                        if (!profile || !quest || surveyRating === null) return;
                        await supabase.from("survey_responses").insert({
                          user_id: profile.id,
                          quest_id: quest.id,
                          scenario_id: scenarioId,
                          play_type: "solo",
                          rating: surveyRating,
                          feedback: surveyFeedback.trim() || null,
                          quest_status: questStatus,
                        });
                        setSurveySubmitted(true);
                        tossHaptic("success");
                      }}
                      className="flex-1 py-2 text-sm text-(--tds-text) bg-(--tds-blue) rounded-xl font-medium"
                    >
                      보내기
                    </button>
                  )}
                </div>
              </div>
            )}
            {surveySubmitted && (
              <p className="text-xs text-(--tds-text-secondary) mt-1">고마워냥! 🐱</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => tossShare(`냥퀘스트에서 "${scenario.titleKo}" 시나리오를 클리어했다냥! 🐱`)}
                className="px-4 py-2 bg-(--tds-bg-card) text-(--tds-text) rounded-xl text-sm"
              >
                결과 공유
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-(--tds-blue) text-(--tds-text) rounded-xl text-sm"
              >
                홈으로
              </button>
            </div>
          </div>
        )}

        {/* AI 안전 라벨 */}
        <p className="text-[10px] text-(--tds-text-disabled) mt-8">🤖 AI가 생성한 콘텐츠가 포함되어 있습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-(--tds-bg)">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-(--tds-bg-deep-glass) border-b border-(--tds-border)">
        <button onClick={() => navigate("/")} className="text-(--tds-text-secondary) text-sm">← 나가기</button>
        <span className="text-xs text-(--tds-text-secondary) font-medium">{scenario.titleKo}</span>
        <span className="text-xs text-(--tds-text-muted)">{turnCount}/{totalTurns} 턴</span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} scenario={scenario} />
        ))}
        {streamingText && (
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-(--tds-blue-bg) rounded-full flex items-center justify-center text-sm shrink-0">🐱</div>
            <div className="bg-(--tds-bg-card) rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
              <p className="text-sm text-(--tds-text) whitespace-pre-wrap">{streamingText}<span className="typing-cursor" /></p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && scenario.suggestedActions.length > 0 && !isStreaming && (
        <div className="shrink-0 flex gap-2 px-4 py-2 overflow-x-auto hide-scrollbar">
          {scenario.suggestedActions.map((action) => (
            <button
              key={action}
              onClick={() => handleSuggestion(action)}
              className="shrink-0 px-3 py-1.5 bg-(--tds-blue-bg) text-(--tds-blue) text-xs rounded-full border border-(--tds-blue-dim) active:scale-95 transition-transform"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Crisis alert */}
      {crisisAlert && (
        <div className="shrink-0 bg-(--tds-red-bg) border-t border-(--tds-red-bg) px-4 py-2.5">
          <p className="text-xs text-(--tds-red) whitespace-pre-line">{CRISIS_HELP_MESSAGE}</p>
          <button onClick={() => setCrisisAlert(false)} className="text-[10px] text-(--tds-text-muted) mt-1">닫기</button>
        </div>
      )}

      {/* Safety warning */}
      {safetyWarning && (
        <div className="shrink-0 bg-(--tds-yellow-bg) px-4 py-2 text-center">
          <p className="text-xs text-(--tds-yellow)">{safetyWarning}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-2 px-4 py-3 bg-(--tds-bg-deep-glass) border-t border-(--tds-border)">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="행동을 입력하라냥..."
          disabled={isStreaming}
          rows={1}
          className="flex-1 bg-(--tds-bg-card) text-(--tds-text) text-sm rounded-xl px-3.5 py-2.5 resize-none outline-none placeholder:text-(--tds-text-muted) border border-(--tds-border) focus:border-(--tds-blue-dim) disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="shrink-0 w-10 h-10 bg-(--tds-blue) text-(--tds-text) rounded-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
        >
          ▶
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ msg, scenario }: { msg: QuestMessage; scenario: ReturnType<typeof getScenario> }) {
  if (msg.role === "gm") {
    return (
      <div className="flex gap-2">
        <div className="w-7 h-7 bg-(--tds-blue-bg) rounded-full flex items-center justify-center text-sm shrink-0">🐱</div>
        <div className="bg-(--tds-bg-card) rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
          <p className="text-sm text-(--tds-text) whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }
  if (msg.role === "player") {
    return (
      <div className="flex justify-end">
        <div className="bg-(--tds-blue-bg) rounded-2xl rounded-tr-md px-3.5 py-2.5 max-w-[75%]">
          <p className="text-sm text-(--tds-blue-light)">{msg.content}</p>
        </div>
      </div>
    );
  }
  // system
  return (
    <div className="text-center">
      <span className="text-xs text-(--tds-text-muted) bg-(--tds-bg-elevated) px-3 py-1 rounded-full">{msg.content}</span>
    </div>
  );
}
