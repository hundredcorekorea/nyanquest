import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { partyChat } from "../lib/api";
import { tossHaptic, tossSubmitScore, tossShare } from "../lib/toss";
import { checkUserInput, CRISIS_HELP_MESSAGE } from "../lib/safety";
import type { Profile, PartySession, SessionMessage, PartyMember } from "../types";

/* ── Party Tutorial (hardcoded KR) ── */
const PARTY_TUTORIAL_KEY = "nyanquest_party_tutorial_seen";

const TUTORIAL_STEPS = [
  { speaker: "🧙‍♂️🐱", text: "파티 플레이에 오신 것을 환영하라냥! 함께 모험을 떠나볼까냥?" },
  { speaker: "🧙‍♂️🐱", text: "파티 플레이에서는 여러 플레이어가 함께 하나의 이야기를 만들어 나간다냥! AI GM이 이야기를 진행하고, 각자의 행동으로 결과가 바뀐다냥!" },
  { speaker: "⌨️", text: "아래 입력창에 캐릭터의 행동을 적어서 보내면 된다냥! 예: \"횃불을 들고 동굴 안을 살펴본다\"", highlight: "action" as const },
  { speaker: "💬", text: "💬 버튼을 눌러 파티원들과 자유롭게 대화할 수 있다냥! 작전 회의, 잡담, 리액션 뭐든 OK다냥~", highlight: "chat" as const },
  { speaker: "⏳", text: "비동기 라운드에서는 모든 파티원이 행동을 제출하면 AI GM이 한꺼번에 결과를 알려준다냥!" },
  { speaker: "🎉", text: "준비가 됐다면 모험을 시작하라냥! 파티원들과 최고의 이야기를 만들어보라냥~!" },
];

function usePartyTutorial() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(PARTY_TUTORIAL_KEY);
  });
  const dismiss = useCallback(() => {
    localStorage.setItem(PARTY_TUTORIAL_KEY, "1");
    setShow(false);
  }, []);
  return { showTutorial: show, dismissTutorial: dismiss };
}

interface Props {
  profile: Profile | null;
}

export default function PartyPlay({ profile }: Props) {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<PartySession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [roundSubmitted, setRoundSubmitted] = useState(0);
  const [roundTotal, setRoundTotal] = useState(0);
  const [currentUserSubmitted, setCurrentUserSubmitted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>("active");
  const [expClaimed, setExpClaimed] = useState(false);
  const [partyTitle, setPartyTitle] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat panel
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [lastSeenChatCount, setLastSeenChatCount] = useState(0);
  const chatPanelEndRef = useRef<HTMLDivElement>(null);

  // Tutorial
  const { showTutorial, dismissTutorial } = usePartyTutorial();
  const [openingTriggered, setOpeningTriggered] = useState(false);

  // Load session, members, messages
  useEffect(() => {
    if (!partyId || !profile) return;

    (async () => {
      const [{ data: partyData }, { data: sessionData }, { data: membersData }] = await Promise.all([
        supabase.from("parties").select("title, creator_id").eq("id", partyId).single(),
        supabase
          .from("party_sessions")
          .select("*")
          .eq("party_id", partyId)
          .in("status", ["active", "paused"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("party_members")
          .select("*, user:profiles!party_members_user_id_fkey(nickname, avatar_url, cat_type)")
          .eq("party_id", partyId)
          .eq("status", "accepted"),
      ]);

      setPartyTitle(partyData?.title || "");
      setMembers(membersData || []);

      if (sessionData) {
        setSession(sessionData);
        setSessionStatus(sessionData.status);

        // Load existing messages
        const { data: msgs } = await supabase
          .from("session_messages")
          .select("*, user:profiles!session_messages_user_id_fkey(nickname, avatar_url, cat_type)")
          .eq("session_id", sessionData.id)
          .order("created_at", { ascending: true });

        setMessages(msgs || []);

        // If no messages yet (new session), trigger AI GM opening (delayed if tutorial showing)
        if (!msgs || msgs.length === 0) {
          if (!showTutorial) {
            await sendChat("__OPEN__", sessionData.id);
            setOpeningTriggered(true);
          }
        } else {
          setOpeningTriggered(true);
        }
      }
    })();
  }, [partyId, profile]);

  // Trigger opening after tutorial dismissed
  useEffect(() => {
    if (!showTutorial && !openingTriggered && session && messages.length === 0) {
      setOpeningTriggered(true);
      sendChat("__OPEN__", session.id);
    }
  }, [showTutorial, openingTriggered, session, messages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SessionMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Haptic for GM messages
          if (newMsg.role === "gm") {
            tossHaptic("tap");
          }

          // Check completion
          if (newMsg.content?.includes("[퀘스트 완료]") || newMsg.content?.includes("[Quest Complete]")) {
            setSessionStatus("completed");
            tossHaptic("success");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Auto-scroll (main)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-scroll (chat panel)
  useEffect(() => {
    if (chatOpen) chatPanelEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // Update last seen chat count when panel opens
  useEffect(() => {
    if (chatOpen) {
      setLastSeenChatCount(messages.filter((m) => m.role === "chat").length);
    }
  }, [chatOpen, messages]);

  // Derived
  const chatMessages = messages.filter((m) => m.role === "chat");
  const gameMessages = messages.filter((m) => m.role !== "chat");
  const unreadChat = chatMessages.length - lastSeenChatCount;

  const sendChat = useCallback(async (content: string, sessionId?: string) => {
    const sid = sessionId || session?.id;
    if (!sid || isStreaming) return;

    setIsStreaming(true);
    setStreamingText("");

    try {
      const isOpen = content === "__OPEN__";
      const res = await partyChat(
        isOpen
          ? { sessionId: sid, isOpening: true }
          : { sessionId: sid, playerMessage: content }
      );

      if (!res.ok) {
        const err = await res.json();

        // Async round: waiting for other players
        if (err.waiting) {
          setRoundSubmitted(err.submitted);
          setRoundTotal(err.total);
          setCurrentUserSubmitted(true);
          setIsStreaming(false);
          return;
        }

        setStreamingText(`오류: ${err.error || "알 수 없는 오류"}`);
        setIsStreaming(false);
        return;
      }

      // Stream response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
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
                fullText += data;
                setStreamingText(fullText);
              }
            }
          }
        }
      }

      if (!fullText) {
        try {
          const text = await res.text();
          const json = JSON.parse(text);
          fullText = json.content || json.message || text;
        } catch { /* consumed */ }
      }

      setStreamingText("");
      setCurrentUserSubmitted(false);
      setRoundSubmitted(0);
    } catch (e) {
      console.error("Party chat error:", e);
      setStreamingText("네트워크 오류...");
    } finally {
      setIsStreaming(false);
    }
  }, [session, isStreaming]);

  const [safetyWarning, setSafetyWarning] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || currentUserSubmitted) return;

    const check = checkUserInput(input.trim());
    if (!check.allowed) {
      setSafetyWarning(check.reason || "");
      tossHaptic("error");
      setTimeout(() => setSafetyWarning(""), 4000);
      return;
    }
    setSafetyWarning("");
    sendChat(input.trim());
    setInput("");
    tossHaptic("tap");
  };

  const handleClaimExp = async () => {
    if (!session || !profile || expClaimed) return;

    await supabase.rpc("complete_party_session", {
      p_session_id: session.id,
      p_party_id: partyId,
    });

    setExpClaimed(true);
    tossHaptic("success");

    const { data: freshProfile } = await supabase
      .from("profiles")
      .select("cat_exp")
      .eq("id", profile.id)
      .single();
    if (freshProfile) {
      tossSubmitScore(freshProfile.cat_exp);
    }
  };

  // Send party chat message (direct insert)
  const handleChatSend = async () => {
    if (!chatInput.trim() || !session || !profile || chatSending) return;
    setChatSending(true);
    const text = chatInput.trim();
    setChatInput("");
    tossHaptic("tap");

    await supabase.from("session_messages").insert({
      session_id: session.id,
      user_id: profile.id,
      role: "chat",
      player_name: profile.nickname,
      content: text,
    });
    setChatSending(false);
  };

  // Tutorial complete handler
  const handleTutorialComplete = () => {
    dismissTutorial();
    tossHaptic("tap");
  };

  // Completed screen
  if (sessionStatus === "completed") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-(--tds-text) mb-2">세션 완료!</h2>
        <p className="text-(--tds-text-secondary) text-sm mb-6">
          "{partyTitle}" 파티의 모험이 끝났다냥!
        </p>

        {!expClaimed ? (
          <button
            onClick={handleClaimExp}
            className="px-6 py-3 bg-(--tds-blue) text-(--tds-text) rounded-xl font-medium active:scale-95 transition-transform"
          >
            +30 EXP 받기
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-(--tds-green) text-sm">+30 EXP 획득! ✨</p>
            <div className="flex gap-2">
              <button
                onClick={() => tossShare(`냥퀘스트 파티 플레이 완료! 🐱 "${partyTitle}"`)}
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
        <p className="text-[10px] text-(--tds-text-disabled) mt-8">🤖 AI가 생성한 콘텐츠가 포함되어 있습니다</p>
      </div>
    );
  }

  if (!session) {
    return <div className="text-center py-12 text-(--tds-text-secondary) text-sm">세션을 불러오는 중...</div>;
  }

  const isRoundBased = session.play_mode === "async" && session.use_ai_gm;

  return (
    <div className="flex flex-col h-screen bg-(--tds-bg)">
      {/* Top bar */}
      <div className="shrink-0 bg-(--tds-bg-deep-glass) border-b border-(--tds-border)">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button onClick={() => navigate(`/party/${partyId}`)} className="text-(--tds-text-secondary) text-sm">← 나가기</button>
          <span className="text-xs text-(--tds-text-secondary) font-medium truncate max-w-[50%]">{partyTitle}</span>
          <span className="text-xs text-(--tds-text-muted)">{session.turn_count}/{session.total_turns}</span>
        </div>

        {/* Player list */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1 shrink-0 bg-(--tds-blue-bg) rounded-full px-2 py-0.5">
            <span className="text-xs">🤖</span>
            <span className="text-[10px] text-(--tds-blue)">AI GM</span>
          </div>
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 ${
                m.user_id === profile?.id ? "bg-(--tds-yellow-bg)" : "bg-(--tds-bg-elevated)"
              }`}
            >
              <span className="text-xs">🐱</span>
              <span className={`text-[10px] ${m.user_id === profile?.id ? "text-(--tds-yellow)" : "text-(--tds-text-secondary)"}`}>
                {m.user?.nickname || "???"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Round status banner */}
      {isRoundBased && currentUserSubmitted && (
        <div className="shrink-0 bg-(--tds-yellow-bg) border-b border-(--tds-yellow-bg) px-4 py-2 text-center">
          <p className="text-xs text-(--tds-yellow)">
            행동 제출 완료! 다른 플레이어를 기다리는 중... ({roundSubmitted}/{roundTotal})
          </p>
        </div>
      )}

      {/* Chat area (game messages only) */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-3">
        {gameMessages.map((msg) => (
          <SessionBubble key={msg.id} msg={msg} currentUserId={profile?.id} />
        ))}
        {streamingText && (
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-(--tds-blue-bg) rounded-full flex items-center justify-center text-sm shrink-0">🤖</div>
            <div className="bg-(--tds-bg-card) rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
              <p className="text-sm text-(--tds-text) whitespace-pre-wrap">{streamingText}<span className="typing-cursor" /></p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Safety warning */}
      {safetyWarning && (
        <div className="shrink-0 bg-(--tds-yellow-bg) px-4 py-2 text-center">
          <p className="text-xs text-(--tds-yellow)">{safetyWarning}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-2 px-4 py-3 bg-(--tds-bg-deep-glass) border-t border-(--tds-border)">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={currentUserSubmitted ? "다른 플레이어를 기다리는 중..." : "행동을 입력하라냥..."}
          disabled={isStreaming || currentUserSubmitted}
          rows={1}
          className="flex-1 bg-(--tds-bg-card) text-(--tds-text) text-sm rounded-xl px-3.5 py-2.5 resize-none outline-none placeholder:text-(--tds-text-muted) border border-(--tds-border) focus:border-(--tds-blue-dim) disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || currentUserSubmitted}
          className="shrink-0 w-10 h-10 bg-(--tds-blue) text-(--tds-text) rounded-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
        >
          ▶
        </button>
      </form>

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => { setChatOpen(true); tossHaptic("tap"); }}
          className="fixed bottom-20 right-4 w-12 h-12 bg-(--tds-bg-card) border border-(--tds-border) rounded-full flex items-center justify-center text-lg shadow-lg active:scale-90 transition-transform z-40"
        >
          💬
          {unreadChat > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadChat > 9 ? "9+" : unreadChat}
            </span>
          )}
        </button>
      )}

      {/* Chat panel (bottom sheet) */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setChatOpen(false)}>
          <div className="bg-black/40 absolute inset-0" />
          <div
            className="relative bg-(--tds-bg) rounded-t-2xl max-h-[60vh] flex flex-col animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--tds-border)">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="text-sm font-medium text-(--tds-text)">파티 채팅</span>
                <span className="text-xs text-(--tds-text-muted)">({chatMessages.length})</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-(--tds-text-secondary) text-sm px-2">닫기</button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-center text-xs text-(--tds-text-muted) py-8">아직 메시지가 없다냥~ 첫 대화를 시작해보라냥!</p>
              )}
              {chatMessages.map((msg) => {
                const isMe = msg.user_id === profile?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-6 h-6 bg-(--tds-bg-elevated) rounded-full flex items-center justify-center text-xs shrink-0 mr-1.5 mt-4">🐱</div>
                    )}
                    <div>
                      {!isMe && <span className="text-[10px] text-(--tds-text-muted) ml-1">{msg.player_name || "???"}</span>}
                      <div className={`rounded-2xl px-3 py-2 max-w-[70vw] ${
                        isMe
                          ? "bg-(--tds-blue-bg) rounded-tr-md"
                          : "bg-(--tds-bg-elevated) rounded-tl-md"
                      }`}>
                        <p className={`text-sm ${isMe ? "text-(--tds-blue-light)" : "text-(--tds-text)"}`}>{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatPanelEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex gap-2 px-4 py-3 border-t border-(--tds-border)">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleChatSend(); } }}
                placeholder="파티원에게 메시지..."
                className="flex-1 bg-(--tds-bg-card) text-(--tds-text) text-sm rounded-xl px-3 py-2 outline-none placeholder:text-(--tds-text-muted) border border-(--tds-border) focus:border-(--tds-blue-dim)"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatSending}
                className="shrink-0 w-9 h-9 bg-(--tds-blue) text-(--tds-text) rounded-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 text-sm"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Party Tutorial */}
      {showTutorial && <PartyTutorialInline onComplete={handleTutorialComplete} />}
    </div>
  );
}

function SessionBubble({ msg, currentUserId }: { msg: SessionMessage; currentUserId?: string }) {
  if (msg.role === "gm") {
    return (
      <div className="flex gap-2">
        <div className="w-7 h-7 bg-(--tds-blue-bg) rounded-full flex items-center justify-center text-sm shrink-0">🤖</div>
        <div className="bg-(--tds-bg-card) rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
          <p className="text-sm text-(--tds-text) whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  if (msg.role === "player") {
    const isMe = msg.user_id === currentUserId;
    if (isMe) {
      return (
        <div className="flex justify-end">
          <div className="bg-(--tds-blue-bg) rounded-2xl rounded-tr-md px-3.5 py-2.5 max-w-[75%]">
            <p className="text-sm text-(--tds-blue-light)">{msg.content}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <div className="w-7 h-7 bg-(--tds-green-bg) rounded-full flex items-center justify-center text-sm shrink-0">🐱</div>
        <div>
          <span className="text-[10px] text-(--tds-green) ml-1">{msg.player_name || msg.user?.nickname || "???"}</span>
          <div className="bg-(--tds-green-bg) rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%] mt-0.5">
            <p className="text-sm text-(--tds-green-light)">{msg.content}</p>
          </div>
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

/* ── Inline Party Tutorial (Toss, hardcoded KR) ── */
function PartyTutorialInline({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) { onComplete(); return; }
    setStep((s) => s + 1);
    tossHaptic("tap");
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-(--tds-bg) rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Skip */}
        <div className="flex justify-end px-4 pt-3">
          <button onClick={onComplete} className="text-xs text-(--tds-text-muted)">건너뛰기</button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Speaker + message */}
          <div className="flex items-start gap-3">
            <div className="text-4xl shrink-0">{current.speaker}</div>
            <div className="bg-(--tds-yellow-bg) rounded-2xl rounded-tl-sm p-4 flex-1">
              <p className="text-sm text-(--tds-text) leading-relaxed">{current.text}</p>
            </div>
          </div>

          {/* Action highlight */}
          {current.highlight === "action" && (
            <div className="flex items-center gap-2 p-3 bg-(--tds-yellow-bg) rounded-xl border border-(--tds-border)">
              <span className="text-xl">✏️</span>
              <div className="flex-1 bg-(--tds-bg-card) rounded-lg px-3 py-2 text-xs text-(--tds-text-muted) border border-(--tds-border)">
                행동을 입력하라냥...
              </div>
              <div className="w-8 h-8 bg-(--tds-blue) rounded-lg flex items-center justify-center text-white text-xs font-bold">➤</div>
            </div>
          )}

          {/* Chat highlight */}
          {current.highlight === "chat" && (
            <div className="flex items-center justify-end gap-2 p-3 bg-(--tds-bg-elevated) rounded-xl border border-(--tds-border)">
              <span className="text-xs text-(--tds-text-muted)">← 이 버튼을 눌러보라냥!</span>
              <div className="w-12 h-12 bg-(--tds-bg-card) border border-(--tds-border) rounded-full flex items-center justify-center text-lg shadow-lg relative">
                💬
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
              </div>
            </div>
          )}

          {/* Next / Start button */}
          <button
            onClick={handleNext}
            className="w-full py-3 font-medium rounded-xl text-sm transition-colors bg-(--tds-blue) text-(--tds-text) active:scale-[0.98]"
          >
            {isLast ? "모험 시작!" : "다음"}
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-(--tds-blue)" : i < step ? "bg-(--tds-blue-dim)" : "bg-(--tds-border)"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
