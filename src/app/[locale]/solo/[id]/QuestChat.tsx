"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { parseDiceRequest } from "@/lib/solo-quest/dice";
import type { SoloQuest, QuestMessage, DiceRoll } from "@/types/solo-quest";
import ChatBubble from "./ChatBubble";
import DiceRoller from "./DiceRoller";
import ActionInput from "./ActionInput";
import QuestComplete from "./QuestComplete";

interface Props {
  quest: SoloQuest;
  scenarioTitle: string;
  scenarioId: string;
  totalTurns: number;
  suggestedActions: string[];
  isPremium: boolean;
}

export default function QuestChat({
  quest,
  scenarioTitle,
  scenarioId,
  totalTurns,
  suggestedActions: initialSuggestions,
  isPremium,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tSolo = useTranslations("Solo");
  const tCommon = useTranslations("Common");
  const [messages, setMessages] = useState<QuestMessage[]>(quest.messages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [turnCount, setTurnCount] = useState(quest.turn_count);
  const [questStatus, setQuestStatus] = useState(quest.status);
  const [pendingDice, setPendingDice] = useState<ReturnType<typeof parseDiceRequest>>(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Parse dice requests from last GM message
  useEffect(() => {
    const lastGm = [...messages].reverse().find((m) => m.role === "gm");
    if (lastGm && !isStreaming) {
      const request = parseDiceRequest(lastGm.content);
      setPendingDice(request);

      // Extract numbered suggestions from GM message
      const lines = lastGm.content.split("\n");
      const numbered = lines
        .filter((l) => /^\d+\.\s/.test(l.trim()))
        .map((l) => l.replace(/^\d+\.\s*[^\s]*\s*/, "").trim())
        .filter((l) => l.length > 0 && l.length < 30);
      if (numbered.length > 0) {
        setSuggestions(numbered);
      }
    }
  }, [messages, isStreaming]);

  // Check for quest completion
  useEffect(() => {
    const lastGm = [...messages].reverse().find((m) => m.role === "gm");
    if (lastGm?.content.includes("[퀘스트 완료]")) {
      setQuestStatus("completed");
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (playerMessage: string, diceRoll?: DiceRoll) => {
      if (isStreaming || questStatus !== "in_progress") return;

      const playerMsg: QuestMessage = {
        role: "player",
        content: playerMessage,
        timestamp: new Date().toISOString(),
        ...(diceRoll ? { diceRoll } : {}),
      };
      const updatedMessages = [...messages, playerMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setStreamingText("");
      setPendingDice(null);

      try {
        const response = await fetch("/api/solo-quest/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questId: quest.id,
            scenarioId,
            playerMessage,
            diceRoll,
            messages: updatedMessages.slice(-6),
            turnCount,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || tQuest("requestFailed"));
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

        const gmMsg: QuestMessage = {
          role: "gm",
          content: fullText,
          timestamp: new Date().toISOString(),
        };
        setMessages([...updatedMessages, gmMsg]);
        setStreamingText("");
        setTurnCount((prev) => prev + 1);
      } catch (err) {
        toast(
          err instanceof Error ? err.message : tCommon("errorOccurred"),
          "error"
        );
        // Remove the player message on error
        setMessages(messages);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, questStatus, messages, quest.id, scenarioId, turnCount, toast, tQuest, tCommon]
  );

  function handleDiceRoll(result: DiceRoll) {
    // Create a system message for the dice result
    const diceMsg: QuestMessage = {
      role: "system",
      content: "",
      timestamp: new Date().toISOString(),
      diceRoll: result,
    };
    setMessages((prev) => [...prev, diceMsg]);

    // Send to AI with dice context
    const resultText = tQuest("diceRollResult", {
      type: result.type,
      total: result.total,
      dc: result.dc ?? 0,
      result: result.success ? tQuest("diceResultSuccess") : tQuest("diceResultFail"),
    });

    sendMessage(resultText, result);
  }

  async function handleAbandon() {
    const supabase = createClient();
    await supabase
      .from("solo_quests")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", quest.id);

    router.push("/solo");
  }

  return (
    <div className="pb-24 max-w-lg mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-sm font-bold text-gray-900">{scenarioTitle}</h1>
          <p className="text-xs text-gray-400">
            {tQuest("turnProgress", { current: turnCount, total: totalTurns })}
          </p>
        </div>
        {questStatus === "in_progress" && (
          <button
            onClick={handleAbandon}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
          >
            {tSolo("abandon")}
          </button>
        )}
      </div>

      {/* Turn progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((turnCount / totalTurns) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}

        {/* Streaming text */}
        {isStreaming && streamingText && (
          <ChatBubble
            message={{
              role: "gm",
              content: streamingText,
              timestamp: new Date().toISOString(),
            }}
            isStreaming
          />
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

        {/* Dice roller */}
        {pendingDice && !isStreaming && questStatus === "in_progress" && (
          <DiceRoller request={pendingDice} onRoll={handleDiceRoll} />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quest completion overlay */}
      {questStatus === "completed" && (
        <QuestComplete questId={quest.id} turnCount={turnCount} isPremium={isPremium} />
      )}

      {/* Input area */}
      {questStatus === "in_progress" && !pendingDice && (
        <div className="sticky bottom-16 bg-white/90 backdrop-blur-sm pt-2 pb-2 -mx-4 px-4 border-t border-gray-50">
          <ActionInput
            onSend={(msg) => sendMessage(msg)}
            disabled={isStreaming}
            suggestedActions={suggestions}
          />
        </div>
      )}
    </div>
  );
}
