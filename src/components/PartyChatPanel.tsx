"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SessionMessage } from "@/types/party-session";
import type { PartyMember } from "@/types/database";
import { useTranslations } from "next-intl";

// Basic client-side safety filter (matches toss-app/src/lib/safety.ts)
const BLOCKED_PATTERNS = [
  /자살\s*(방법|하는\s*법|도구)/,
  /자해\s*(방법|하는\s*법)/,
  /폭탄\s*(만드|제조|설계)/,
  /마약\s*(제조|구매|파는)/,
  /아동.*성|성.*아동/,
  /살인\s*(방법|하는\s*법|도구)/,
];

function isSafeInput(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  return !BLOCKED_PATTERNS.some((p) => p.test(normalized));
}

interface Props {
  sessionId: string;
  currentUserId: string;
  members: PartyMember[];
  allMessages: SessionMessage[];
}

export default function PartyChatPanel({
  sessionId,
  currentUserId,
  members,
  allMessages,
}: Props) {
  const t = useTranslations("PartyPlay");
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMessages = allMessages.filter((m) => m.role === "chat");
  const unreadCount = isOpen ? 0 : Math.max(0, chatMessages.length - lastSeenCount);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen) {
      setLastSeenCount(chatMessages.length);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      inputRef.current?.focus();
    }
  }, [isOpen, chatMessages.length]);

  // Auto-scroll on new message while open
  useEffect(() => {
    if (isOpen && chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, isOpen]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || sending) return;

    if (!isSafeInput(text)) return; // silently block unsafe input

    const member = members.find((m) => m.user_id === currentUserId);
    const playerName = member?.user?.nickname ?? "???";

    setSending(true);
    setChatInput("");

    const { error } = await supabase.from("session_messages").insert({
      session_id: sessionId,
      user_id: currentUserId,
      role: "chat",
      player_name: playerName,
      content: text,
      dice_roll: null,
    });

    if (error) {
      console.error("[PartyChat] send failed:", error);
      setChatInput(text); // restore on failure
    }
    setSending(false);
  }, [chatInput, sending, sessionId, currentUserId, members, supabase]);

  const getMemberAvatar = (userId: string | null) => {
    if (!userId) return null;
    const member = members.find((m) => m.user_id === userId);
    return member?.user?.avatar_url;
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-slate-600 hover:bg-slate-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all"
          aria-label={t("partyChat")}
        >
          <span className="text-lg">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Bottom sheet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom sheet panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-2">
                💬 {t("partyChat")}
              </span>
              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                {chatMessages.length}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[120px]">
            {chatMessages.length === 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
                {t("partyChatEmpty")}
              </p>
            )}
            {chatMessages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              const avatarUrl = getMemberAvatar(msg.user_id);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        "🐱"
                      )}
                    </div>
                  )}
                  <div className={isMe ? "text-right" : ""}>
                    {!isMe && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-1 mb-0.5">
                        {msg.player_name}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-1.5 text-sm max-w-[220px] inline-block ${
                        isMe
                          ? "bg-slate-500 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
            <input
              ref={inputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              placeholder={t("partyChatPlaceholder")}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-gray-400"
              maxLength={200}
              disabled={sending}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || sending}
              className="px-3 py-2 bg-slate-500 hover:bg-slate-400 text-white rounded-xl text-sm font-medium disabled:opacity-30 active:scale-95 transition-all shrink-0"
            >
              {t("partyChatSend")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
