"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import type { PartySession, SessionMessage } from "@/types/party-session";
import type { PartyMember } from "@/types/database";
import PlayerList from "./PlayerList";
import SessionControls from "./SessionControls";
import DiceRollButton from "./DiceRollButton";
import AdGate from "@/components/AdGate";
import PostGameSurvey from "@/components/PostGameSurvey";
import PartyChatPanel from "@/components/PartyChatPanel";
import PartyTutorialOverlay, { usePartyTutorialState } from "@/components/PartyTutorialOverlay";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { DiceRoll } from "@/types/solo-quest";
import {
  useBgmPlayer,
  BGM_CATALOG,
  BGM_CATEGORY_LABELS,
  type BgmCategory,
} from "@/hooks/useBgmPlayer";
import { useBgmMood } from "@/hooks/useBgmMood";

interface Props {
  session: PartySession;
  partyId: string;
  partyTitle: string;
  creatorId: string;
  currentUserId: string;
  members: PartyMember[];
  isPremium: boolean;
}

export default function SessionChat({
  session: initialSession,
  partyId,
  partyTitle,
  creatorId,
  currentUserId,
  members,
  isPremium,
}: Props) {
  const t = useTranslations("PartyPlay");
  const tc = useTranslations("Common");
  const tDice = useTranslations("SoloQuest");
  const { toast } = useToast();
  const supabase = createClient();
  const bgm = useBgmPlayer();
  const bgmMood = useBgmMood(useCallback((category, trackId) => {
    if (trackId) {
      bgm.playTrack(category, trackId);
    } else {
      bgm.playCategory(category);
    }
  }, [bgm.playTrack, bgm.playCategory]));
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionStatus, setSessionStatus] = useState(initialSession.status);
  const [turnCount, setTurnCount] = useState(initialSession.turn_count);
  const [totalTurns, setTotalTurns] = useState(initialSession.total_turns);
  const [extendCount, setExtendCount] = useState(0);
  const [showAdGate, setShowAdGate] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  // Round-based state (async AI GM)
  const [roundSubmitted, setRoundSubmitted] = useState(0);
  const [roundTotal, setRoundTotal] = useState(0);
  const [roundSubmittedNames, setRoundSubmittedNames] = useState<string[]>([]);
  const [currentUserSubmitted, setCurrentUserSubmitted] = useState(false);
  const [isRoundBased, setIsRoundBased] = useState(
    initialSession.play_mode === "async" && initialSession.use_ai_gm
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCreator = currentUserId === creatorId;
  const isHumanGm = isCreator && !initialSession.use_ai_gm;
  const [bgmPickerOpen, setBgmPickerOpen] = useState(false);
  const [bgmPickerCategory, setBgmPickerCategory] = useState<BgmCategory | null>(null);
  const locale = typeof window !== "undefined" ? (document.documentElement.lang || "ko") : "ko";
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const { showPartyTutorial, dismissPartyTutorial } = usePartyTutorialState();

  // Check if current user has empty preferences
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const hasEmptyPreferences =
    !currentMember?.user?.style_tags?.length &&
    !currentMember?.user?.preferred_elements?.length &&
    !currentMember?.user?.avoided_elements?.length;

  const openingTriggered = useRef(false);

  // Show survey when session completes (random 30% chance to avoid fatigue)
  useEffect(() => {
    if (sessionStatus === "completed" && !surveyDismissed) {
      if (Math.random() < 0.3) {
        setShowSurvey(true);
      }
    }
  }, [sessionStatus, surveyDismissed]);

  // Fetch round status for async AI GM sessions
  const fetchRoundStatus = useCallback(async () => {
    if (!isRoundBased) return;
    try {
      const res = await fetch(`/api/party-session/round-status?sessionId=${initialSession.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.roundBased) {
        setRoundSubmitted(data.submitted);
        setRoundTotal(data.total);
        setRoundSubmittedNames(data.submittedNames ?? []);
        setCurrentUserSubmitted(data.currentUserSubmitted);
      }
    } catch {
      // ignore
    }
  }, [isRoundBased, initialSession.id]);

  // AI GM opening: auto-start the adventure
  const triggerOpening = useCallback(async () => {
    setIsStreaming(true);
    setStreamingText("");
    try {
      const response = await fetch("/api/party-session/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: initialSession.id,
          isOpening: true,
        }),
      });

      if (!response.ok) throw new Error(t("requestFailed"));

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }

      setStreamingText("");
      setTurnCount((prev) => prev + 1);
      bgmMood.analyzeMessage(fullText);

      const { data } = await supabase
        .from("session_messages")
        .select("*")
        .eq("session_id", initialSession.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as unknown as SessionMessage[]);
    } catch {
      // opening failed silently — user can still type manually
    } finally {
      setIsStreaming(false);
    }
  }, [initialSession.id, supabase, t]);

  // Load initial messages + auto-start AI GM opening
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("session_messages")
        .select("*")
        .eq("session_id", initialSession.id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as unknown as SessionMessage[]);

      // Auto-trigger AI GM opening if no messages yet (delay if tutorial is showing)
      if (
        initialSession.use_ai_gm &&
        (!data || data.length === 0) &&
        !openingTriggered.current &&
        !showPartyTutorial
      ) {
        openingTriggered.current = true;
        triggerOpening();
      }

      // Fetch initial round status
      fetchRoundStatus();
    };
    loadMessages();
  }, [initialSession.id, initialSession.use_ai_gm, triggerOpening, fetchRoundStatus, showPartyTutorial]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`session:${initialSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${initialSession.id}`,
        },
        (payload) => {
          const newMsg = payload.new as unknown as SessionMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Analyze mood from GM messages (human or AI)
          if (newMsg.role === "gm") {
            bgmMood.analyzeMessage(newMsg.content);
            // GM responded — reset round state
            if (isRoundBased) {
              setCurrentUserSubmitted(false);
              setRoundSubmitted(0);
              setRoundSubmittedNames([]);
            }
          }
          // Player submitted — refresh round status
          if (newMsg.role === "player" && isRoundBased) {
            fetchRoundStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSession.id, supabase]);

  // Detect when new content is below the viewport
  useEffect(() => {
    if (!chatEndRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollDown(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(chatEndRef.current);
    return () => observer.disconnect();
  }, []);

  // Show scroll indicator when new messages arrive
  useEffect(() => {
    if (!chatEndRef.current) return;
    const rect = chatEndRef.current.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
    if (!isVisible) setShowScrollDown(true);
  }, [messages, streamingText]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowScrollDown(false);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || sessionStatus !== "active" || !text.trim()) return;

      const trimmed = text.trim();
      setInput("");

      if (initialSession.use_ai_gm) {
        // AI GM mode: send to API for AI response
        setIsStreaming(true);
        setStreamingText("");

        try {
          const response = await fetch("/api/party-session/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: initialSession.id,
              playerMessage: trimmed,
            }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || t("requestFailed"));
          }

          // Check if response is JSON (round waiting) or stream (AI response)
          const contentType = response.headers.get("content-type") ?? "";

          if (contentType.includes("application/json")) {
            // Round-based: waiting for other players
            const data = await response.json();
            if (data.waiting) {
              setCurrentUserSubmitted(true);
              setRoundSubmitted(data.submitted);
              setRoundTotal(data.total);
              setRoundSubmittedNames(data.submittedNames ?? []);
              // Reload messages to show our own submitted message
              const { data: msgs } = await supabase
                .from("session_messages")
                .select("*")
                .eq("session_id", initialSession.id)
                .order("created_at", { ascending: true });
              if (msgs) setMessages(msgs as unknown as SessionMessage[]);
              setIsStreaming(false);
              return;
            }
          }

          // Stream response (AI GM is responding — either all submitted or non-round mode)
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            fullText += chunk;
            setStreamingText(fullText);
          }

          setStreamingText("");
          setTurnCount((prev) => prev + 1);
          bgmMood.analyzeMessage(fullText);

          // Reset round state after AI responds
          if (isRoundBased) {
            setCurrentUserSubmitted(false);
            setRoundSubmitted(0);
            setRoundSubmittedNames([]);
          }

          // The messages will arrive via Realtime subscription
          // But we should reload to make sure we have everything
          const { data } = await supabase
            .from("session_messages")
            .select("*")
            .eq("session_id", initialSession.id)
            .order("created_at", { ascending: true });
          if (data) setMessages(data as unknown as SessionMessage[]);

          // Check for quest completion
          if (fullText.includes("[퀘스트 완료]")) {
            setSessionStatus("completed");
            toast(t("sessionCompletedToast"), "success");
          }
        } catch (err) {
          toast(
            err instanceof Error ? err.message : t("requestFailed"),
            "error"
          );
        } finally {
          setIsStreaming(false);
        }
      } else {
        // Human GM mode: just insert the message
        const playerName =
          members.find((m) => m.user_id === currentUserId)?.user?.nickname ??
          tc("adventurer");
        const memberRole = members.find(
          (m) => m.user_id === currentUserId
        )?.role;

        const { error } = await supabase.from("session_messages").insert({
          session_id: initialSession.id,
          user_id: currentUserId,
          role: memberRole === "GM" ? "gm" : "player",
          player_name: playerName,
          content: trimmed,
          dice_roll: null,
        });

        if (error) {
          toast(t("messageSendFailed"), "error");
        }
      }
    },
    [
      isStreaming,
      sessionStatus,
      initialSession.id,
      initialSession.use_ai_gm,
      members,
      currentUserId,
      supabase,
      toast,
    ]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  async function handleDiceRoll(result: DiceRoll) {
    const playerName =
      members.find((m) => m.user_id === currentUserId)?.user?.nickname ??
      tc("adventurer");

    // Format dice result text
    const resultsStr = result.results
      ? `[${result.results.join("][")}]${result.modifier ? ` + ${result.modifier}` : ""} = ${result.total}`
      : `${result.type} = ${result.result}${result.modifier ? ` + ${result.modifier} = ${result.total}` : ""}`;
    const diceText = `${playerName}: ${resultsStr}`;

    if (initialSession.use_ai_gm) {
      // AI GM mode: send dice result as message for AI to process
      setIsStreaming(true);
      setStreamingText("");
      try {
        const response = await fetch("/api/party-session/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: initialSession.id,
            playerMessage: `[주사위 굴림] ${diceText}`,
            diceRoll: result,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || t("requestFailed"));
        }

        // Check if response is JSON (round waiting) or stream (AI response)
        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (data.waiting) {
            setCurrentUserSubmitted(true);
            setRoundSubmitted(data.submitted);
            setRoundTotal(data.total);
            setRoundSubmittedNames(data.submittedNames ?? []);
            const { data: msgs } = await supabase
              .from("session_messages")
              .select("*")
              .eq("session_id", initialSession.id)
              .order("created_at", { ascending: true });
            if (msgs) setMessages(msgs as unknown as SessionMessage[]);
            setIsStreaming(false);
            return;
          }
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          setStreamingText(fullText);
        }

        setStreamingText("");
        setTurnCount((prev) => prev + 1);
        bgmMood.analyzeMessage(fullText);

        if (isRoundBased) {
          setCurrentUserSubmitted(false);
          setRoundSubmitted(0);
          setRoundSubmittedNames([]);
        }

        const { data } = await supabase
          .from("session_messages")
          .select("*")
          .eq("session_id", initialSession.id)
          .order("created_at", { ascending: true });
        if (data) setMessages(data as unknown as SessionMessage[]);

        if (fullText.includes("[퀘스트 완료]")) {
          setSessionStatus("completed");
          toast(t("sessionCompletedToast"), "success");
        }
      } catch (err) {
        toast(
          err instanceof Error ? err.message : t("requestFailed"),
          "error"
        );
      } finally {
        setIsStreaming(false);
      }
    } else {
      // Human GM mode: insert system message with dice roll directly
      const { error } = await supabase.from("session_messages").insert({
        session_id: initialSession.id,
        user_id: currentUserId,
        role: "system",
        player_name: playerName,
        content: diceText,
        dice_roll: result,
      });

      if (error) {
        toast(t("messageSendFailed"), "error");
      }
    }
  }

  // Handle turn extension after ad completion
  const handleExtendTurns = useCallback(async () => {
    setShowAdGate(false);
    setIsExtending(true);
    try {
      const res = await fetch("/api/party-session/extend-turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: initialSession.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotalTurns(data.totalTurns);
      setExtendCount(data.extendCount);
      toast(t("turnsExtended"), "success");
    } catch {
      toast(t("extendFailed"), "error");
    } finally {
      setIsExtending(false);
    }
  }, [initialSession.id, toast, t]);

  // Force round: party leader triggers AI without all submissions
  const handleForceRound = useCallback(async () => {
    if (!isCreator || isStreaming) return;
    setIsStreaming(true);
    setStreamingText("");
    try {
      const response = await fetch("/api/party-session/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: initialSession.id,
          forceRound: true,
          playerMessage: "[라운드 강제 진행]",
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || t("requestFailed"));
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }

      setStreamingText("");
      setTurnCount((prev) => prev + 1);
      bgmMood.analyzeMessage(fullText);

      setCurrentUserSubmitted(false);
      setRoundSubmitted(0);
      setRoundSubmittedNames([]);

      const { data } = await supabase
        .from("session_messages")
        .select("*")
        .eq("session_id", initialSession.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as unknown as SessionMessage[]);

      if (fullText.includes("[퀘스트 완료]")) {
        setSessionStatus("completed");
        toast(t("sessionCompletedToast"), "success");
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : t("requestFailed"),
        "error"
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isCreator, isStreaming, initialSession.id, supabase, toast, t]);

  const turnsRemaining = totalTurns - turnCount;
  const showExtendBanner =
    sessionStatus === "active" &&
    turnsRemaining <= 3 &&
    extendCount < 3 &&
    !isPremium;

  // Find member info for a message
  function getMemberForMessage(msg: SessionMessage) {
    if (!msg.user_id) return null; // AI GM
    return members.find((m) => m.user_id === msg.user_id);
  }

  return (
    <div className="pb-24 max-w-lg mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/party/${partyId}`}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              {partyTitle}
            </h1>
            <p className="text-xs text-gray-400">
              {t("turnProgress", { current: turnCount, total: totalTurns })}
              {initialSession.use_ai_gm && " · AI GM"}
              {initialSession.play_mode === "async" && " · Async"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={bgm.toggle}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm ${
              bgm.enabled
                ? "bg-purple-100 text-purple-600"
                : "bg-gray-100 text-gray-400"
            }`}
            title={bgm.enabled ? "BGM Off" : "BGM On"}
          >
            {bgm.enabled ? "♫" : "♪"}
          </button>
          {bgm.enabled && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgm.volume}
              onChange={(e) => bgm.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-purple-500"
            />
          )}
          <SessionControls
            sessionId={initialSession.id}
            partyId={partyId}
            isCreator={isCreator}
            sessionStatus={sessionStatus}
            onStatusChange={setSessionStatus}
          />
        </div>
      </div>

      {/* Turn progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(
              (turnCount / totalTurns) * 100,
              100
            )}%`,
          }}
        />
      </div>

      {/* Player list */}
      <div className="mb-3">
        <PlayerList
          members={members}
          currentUserId={currentUserId}
          turnOrder={initialSession.turn_order}
          currentTurnIndex={initialSession.current_turn_index}
          playMode={initialSession.play_mode}
          useAiGm={initialSession.use_ai_gm}
        />
      </div>

      {/* Profile preference nudge */}
      {initialSession.use_ai_gm && hasEmptyPreferences && !profileNudgeDismissed && (
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 mb-3 text-xs">
          <span>💡</span>
          <p className="flex-1 text-blue-700">
            {t("profileNudge")}
          </p>
          <Link
            href="/profile/edit"
            className="px-2.5 py-1 bg-blue-500 text-white rounded-lg font-medium whitespace-nowrap hover:bg-blue-600 transition-colors"
          >
            {t("profileNudgeAction")}
          </Link>
          <button
            onClick={() => setProfileNudgeDismissed(true)}
            className="text-blue-300 hover:text-blue-500 ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Round status banner (async AI GM) */}
      {isRoundBased && roundTotal > 1 && sessionStatus === "active" && (
        <div className={`rounded-xl px-3 py-2.5 mb-3 text-xs ${
          currentUserSubmitted
            ? "bg-amber-50 border border-amber-200"
            : "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentUserSubmitted ? "⏳" : "✏️"}</span>
              <div>
                <p className="font-medium text-gray-800">
                  {currentUserSubmitted
                    ? t("roundWaiting")
                    : t("roundYourTurn")}
                </p>
                <p className="text-gray-500">
                  {t("roundProgress", { submitted: roundSubmitted, total: roundTotal })}
                  {roundSubmittedNames.length > 0 && (
                    <span className="ml-1">
                      ({roundSubmittedNames.join(", ")})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Force round button — creator only, at least 1 submitted */}
            {isCreator && currentUserSubmitted && roundSubmitted > 0 && roundSubmitted < roundTotal && (
              <button
                onClick={handleForceRound}
                disabled={isStreaming}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium text-xs hover:bg-amber-600 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {t("forceRound")}
              </button>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: roundTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < roundSubmitted ? "bg-amber-400" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 space-y-3 mb-4">
        {messages.filter((msg) => msg.role !== "chat").map((msg) => {
          const member = getMemberForMessage(msg);
          const isMe = msg.user_id === currentUserId;
          const isGm = msg.role === "gm";
          const isSystem = msg.role === "system";

          if (isSystem) {
            const dr = msg.dice_roll;
            return (
              <div key={msg.id} className="flex justify-center animate-bubble-in">
                <div className="bg-gray-100 rounded-xl px-4 py-2.5 text-xs text-gray-500 text-center max-w-xs">
                  {dr && (
                    <div className="mb-1">
                      <span className="text-lg">🎲</span>{" "}
                      <span className="text-[10px] text-gray-400 block mb-0.5">{msg.player_name}</span>
                      {/* Multi-dice individual results */}
                      {dr.results && (
                        <div className="flex flex-wrap justify-center gap-0.5 mb-1">
                          {dr.results.map((val, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold bg-white text-gray-700 border border-gray-200"
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="font-bold text-gray-700">
                        {dr.results
                          ? `${dr.results.length > 1 ? `${dr.results.length}${dr.type}` : dr.type}${dr.modifier ? ` + ${dr.modifier}` : ""} = ${dr.total}`
                          : `${dr.type} = ${dr.result}${dr.modifier ? ` + ${dr.modifier} = ${dr.total}` : ""}`}
                      </span>
                      {/* Success/fail indicators */}
                      {dr.dc !== undefined && dr.dc > 0 && (
                        <span className={`ml-1 font-medium ${dr.success ? "text-green-600" : "text-red-500"}`}>
                          vs DC {dr.dc} {dr.success ? tDice("diceSuccess") : tDice("diceFail")}
                        </span>
                      )}
                      {dr.target !== undefined && dr.target > 0 && (
                        <span className={`ml-1 font-medium ${dr.success ? "text-green-600" : "text-red-500"}`}>
                          vs {tDice("targetValue")} {dr.target} {dr.success ? tDice("diceSuccess") : tDice("diceFail")}
                        </span>
                      )}
                      {dr.skillValue !== undefined && dr.skillValue > 0 && (
                        <span className={`ml-1 font-medium ${dr.success ? "text-green-600" : "text-red-500"}`}>
                          vs {tDice("skillValue")} {dr.skillValue} {dr.success ? tDice("diceSuccess") : tDice("diceFail")}
                        </span>
                      )}
                      {dr.tier && !dr.dc && !dr.target && !dr.skillValue && (
                        <span className={`ml-1 font-medium ${
                          dr.tier === "success" ? "text-green-600" : dr.tier === "partial" ? "text-amber-600" : "text-red-500"
                        }`}>
                          {dr.tier === "success" ? tDice("diceSuccess") : dr.tier === "partial" ? tDice("dicePartial") : tDice("diceFail")}
                        </span>
                      )}
                      {dr.successes !== undefined && (
                        <span className={`ml-1 font-medium ${dr.success ? "text-green-600" : "text-red-500"}`}>
                          {tDice("poolSuccessesShort", { count: dr.successes })}{dr.difficulty ? ` vs ${tDice("difficulty")} ${dr.difficulty}` : ""} {dr.success ? tDice("diceSuccess") : tDice("diceFail")}
                        </span>
                      )}
                    </div>
                  )}
                  {!dr && msg.content}
                </div>
              </div>
            );
          }

          if (isGm) {
            return (
              <div key={msg.id} className="flex gap-2 justify-start animate-bubble-in">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0">
                  {msg.user_id ? (
                    member?.user?.avatar_url ? (
                      <Image
                        src={member.user.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      "🧙"
                    )
                  ) : (
                    "🧙‍♂️"
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 font-medium mb-0.5 ml-1 flex items-center gap-1">
                    {msg.player_name ?? t("nayangGm")}
                    <span className="text-[8px] font-medium px-1 py-0.5 rounded bg-amber-100 text-amber-500">AI</span>
                  </p>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-amber-50 text-gray-800 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          // Player message
          return (
            <div
              key={msg.id}
              className={`flex gap-2 animate-bubble-in ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
                  {member?.user?.avatar_url ? (
                    <Image
                      src={member.user.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
              )}
              <div className={isMe ? "text-right" : ""}>
                <p
                  className={`text-[10px] font-medium mb-0.5 ${
                    isMe ? "text-amber-600 mr-1" : "text-gray-400 ml-1"
                  }`}
                >
                  {isMe ? t("me") : msg.player_name ?? tc("adventurer")}
                </p>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap inline-block ${
                    isMe
                      ? "bg-amber-500 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
              {isMe && (
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm flex-shrink-0">
                  {members.find((m) => m.user_id === currentUserId)?.user
                    ?.avatar_url ? (
                    <Image
                      src={
                        members.find((m) => m.user_id === currentUserId)!.user!
                          .avatar_url!
                      }
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming AI GM response */}
        {isStreaming && streamingText && (
          <div className="flex gap-2 justify-start animate-bubble-in">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0">
              🧙‍♂️
            </div>
            <div>
              <p className="text-[10px] text-amber-600 font-medium mb-0.5 ml-1 flex items-center gap-1">
                {t("nayangGm")}
                <span className="text-[8px] font-medium px-1 py-0.5 rounded bg-amber-100 text-amber-500">AI</span>
              </p>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-amber-50 text-gray-800 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {streamingText}
                <span className="streaming-cursor" />
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingText && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
              🧙‍♂️
            </div>
            <div className="bg-amber-50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-amber-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-2 h-2 bg-amber-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Session completed overlay */}
        {sessionStatus === "completed" && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 text-center space-y-3 animate-bubble-in">
            <div className="text-5xl">🎉</div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("sessionCompleted")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("sessionCompletedDesc", { turnCount })}
            </p>
            <div className="text-2xl font-bold text-amber-600">{t("sessionCompletedExp")}</div>
            {showSurvey && !surveyDismissed && (
              <PostGameSurvey
                sessionId={initialSession.id}
                scenarioId={initialSession.scenario_id ?? undefined}
                playType="party"
                questStatus="completed"
                onClose={() => setSurveyDismissed(true)}
              />
            )}
            <Link
              href={`/party/${partyId}`}
              className="block w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              {t("returnToParty")}
            </Link>
          </div>
        )}

        {/* Paused overlay */}
        {sessionStatus === "paused" && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center space-y-2 animate-bubble-in">
            <div className="text-4xl">⏸️</div>
            <h2 className="text-sm font-bold text-gray-700">
              {t("sessionPaused")}
            </h2>
            <p className="text-xs text-gray-400">
              {t("sessionPausedDesc")}
            </p>
          </div>
        )}

        {/* Turn extension banner */}
        {showExtendBanner && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3 animate-bubble-in">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {t("turnsRunningLow")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("turnsRemaining", { remaining: turnsRemaining })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowAdGate(true)}
                disabled={isExtending}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>🎬</span>
                {t("watchAdExtend")}
                <span className="text-xs opacity-75">
                  {t("extendCountInfo", { current: extendCount, max: 3 })}
                </span>
              </button>
              <Link
                href="/premium"
                className="w-full py-2.5 bg-purple-500 text-white rounded-xl font-medium text-sm hover:bg-purple-600 transition-colors text-center flex items-center justify-center gap-2"
              >
                <span>👑</span>
                {t("goPremium")}
                <span className="text-xs opacity-75">
                  {t("premiumNoTurnLimit")}
                </span>
              </Link>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Scroll down indicator */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-32 ml-auto mr-2 z-40 flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full hover:bg-white/25 transition-all animate-bounce shadow-lg border border-white/10"
        >
          <span>↓</span>
        </button>
      )}

      {/* AdGate for turn extension */}
      <AdGate
        open={showAdGate}
        onComplete={handleExtendTurns}
        onCancel={() => setShowAdGate(false)}
      />

      {/* GM BGM Picker */}
      {isHumanGm && bgmPickerOpen && (
        <div className="sticky bottom-36 bg-white rounded-2xl border border-gray-200 shadow-lg p-3 z-10 max-h-60 overflow-y-auto">
          {!bgmPickerCategory ? (
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(BGM_CATALOG) as BgmCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setBgmPickerCategory(cat);
                    bgm.playCategory(cat);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    bgm.currentCategory === cat
                      ? "bg-purple-100 text-purple-700 font-bold"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {locale === "ko" ? BGM_CATEGORY_LABELS[cat].ko : BGM_CATEGORY_LABELS[cat].en}
                  <span className="text-gray-400 ml-1">({BGM_CATALOG[cat].length})</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setBgmPickerCategory(null)}
                className="text-xs text-gray-400 hover:text-gray-600 mb-2"
              >
                ← {locale === "ko" ? "카테고리 목록" : "Categories"}
              </button>
              <div className="space-y-1">
                {BGM_CATALOG[bgmPickerCategory].map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      bgm.playTrack(bgmPickerCategory, track.id);
                      setBgmPickerOpen(false);
                      setBgmPickerCategory(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    {locale === "ko" ? track.ko : track.en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      {sessionStatus === "active" && (
        <div className="sticky bottom-16 bg-white/90 backdrop-blur-sm pt-2 pb-2 -mx-4 px-4 border-t border-gray-50">
          <div className="flex gap-2 items-end">
            {isHumanGm && (
              <button
                onClick={() => {
                  setBgmPickerOpen((p) => !p);
                  setBgmPickerCategory(null);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                  bgmPickerOpen
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                }`}
                title="BGM"
              >
                🎵
              </button>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || (isRoundBased && currentUserSubmitted)}
              placeholder={
                isStreaming
                  ? t("aiGmResponding")
                  : isRoundBased && currentUserSubmitted
                    ? t("roundWaitingPlaceholder")
                    : t("inputPlaceholder")
              }
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
            <DiceRollButton onRoll={handleDiceRoll} disabled={isStreaming || (isRoundBased && currentUserSubmitted)} />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim() || (isRoundBased && currentUserSubmitted)}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex-shrink-0"
            >
              {tc("send")}
            </button>
          </div>
          <p className="text-xs text-gray-300 text-right mt-1">
            {input.length}/500
          </p>
        </div>
      )}

      {/* Party Chat Panel */}
      <PartyChatPanel
        sessionId={initialSession.id}
        currentUserId={currentUserId}
        members={members}
        allMessages={messages}
      />

      {/* Party Tutorial (first time only) */}
      {showPartyTutorial && (
        <PartyTutorialOverlay
          onComplete={() => {
            dismissPartyTutorial();
            // Trigger opening after tutorial if not yet triggered
            if (
              initialSession.use_ai_gm &&
              messages.length === 0 &&
              !openingTriggered.current
            ) {
              openingTriggered.current = true;
              triggerOpening();
            }
          }}
        />
      )}
    </div>
  );
}
