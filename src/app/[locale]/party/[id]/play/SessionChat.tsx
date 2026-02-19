"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import type { PartySession, SessionMessage } from "@/types/party-session";
import type { PartyMember } from "@/types/database";
import PlayerList from "./PlayerList";
import SessionControls from "./SessionControls";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

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
  const { toast } = useToast();
  const supabase = createClient();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionStatus, setSessionStatus] = useState(initialSession.status);
  const [turnCount, setTurnCount] = useState(initialSession.turn_count);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCreator = currentUserId === creatorId;

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("session_messages")
        .select("*")
        .eq("session_id", initialSession.id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as unknown as SessionMessage[]);
    };
    loadMessages();
  }, [initialSession.id]);

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
          // Don't add if it's from the AI GM streaming (we handle that separately)
          // Or if we already have this message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // If we're currently streaming AI GM response, skip AI GM messages
            // (they'll be added when streaming completes)
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSession.id, supabase]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

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
              {t("turnProgress", { current: turnCount, total: initialSession.total_turns })}
              {initialSession.use_ai_gm && " · AI GM"}
              {initialSession.play_mode === "async" && " · Async"}
            </p>
          </div>
        </div>
        <SessionControls
          sessionId={initialSession.id}
          partyId={partyId}
          isCreator={isCreator}
          sessionStatus={sessionStatus}
          onStatusChange={setSessionStatus}
        />
      </div>

      {/* Turn progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(
              (turnCount / initialSession.total_turns) * 100,
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

      {/* Chat area */}
      <div className="flex-1 space-y-3 mb-4">
        {messages.map((msg) => {
          const member = getMemberForMessage(msg);
          const isMe = msg.user_id === currentUserId;
          const isGm = msg.role === "gm";
          const isSystem = msg.role === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center animate-bubble-in">
                <div className="bg-gray-100 rounded-xl px-4 py-2 text-xs text-gray-500 text-center max-w-xs">
                  {msg.dice_roll && (
                    <div className="mb-1">
                      <span className="text-lg">🎲</span>{" "}
                      <span className="font-bold text-gray-700">
                        {msg.player_name}: {msg.dice_roll.type} ={" "}
                        {msg.dice_roll.total}
                      </span>
                    </div>
                  )}
                  {msg.content}
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
                  <p className="text-[10px] text-amber-600 font-medium mb-0.5 ml-1">
                    {msg.player_name ?? t("nayangGm")}
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
              <p className="text-[10px] text-amber-600 font-medium mb-0.5 ml-1">
                {t("nayangGm")}
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

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {sessionStatus === "active" && (
        <div className="sticky bottom-16 bg-white/90 backdrop-blur-sm pt-2 pb-2 -mx-4 px-4 border-t border-gray-50">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? t("aiGmResponding")
                  : t("inputPlaceholder")
              }
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
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
    </div>
  );
}
