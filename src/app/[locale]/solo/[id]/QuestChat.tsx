"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { parseDiceRequest } from "@/lib/solo-quest/dice";
import { useQuestSounds } from "@/hooks/useQuestSounds";
import { useBgmPlayer } from "@/hooks/useBgmPlayer";
import { useBgmMood } from "@/hooks/useBgmMood";
import type { SoloQuest, QuestMessage, DiceRoll, ScenarioTheme } from "@/types/solo-quest";
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
  theme: ScenarioTheme;
}

export default function QuestChat({
  quest,
  scenarioTitle,
  scenarioId,
  totalTurns,
  suggestedActions: initialSuggestions,
  isPremium,
  theme,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tSolo = useTranslations("Solo");
  const tCommon = useTranslations("Common");
  const sounds = useQuestSounds();
  const bgm = useBgmPlayer();
  const bgmMood = useBgmMood(bgm.playCategory);
  const [showBgmVolume, setShowBgmVolume] = useState(false);
  const [messages, setMessages] = useState<QuestMessage[]>(quest.messages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [turnCount, setTurnCount] = useState(quest.turn_count);
  const [questStatus, setQuestStatus] = useState(quest.status);
  const [pendingDice, setPendingDice] = useState<ReturnType<typeof parseDiceRequest>>(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Analyze initial GM message mood on mount
  useEffect(() => {
    const lastGm = [...quest.messages].reverse().find((m) => m.role === "gm");
    if (lastGm) bgmMood.analyzeMessage(lastGm.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (lastGm?.content.includes("[퀘스트 완료]") || turnCount >= totalTurns + 2) {
      setQuestStatus("completed");
    }
  }, [messages, turnCount, totalTurns]);

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
        sounds.playMessage();
        bgmMood.analyzeMessage(fullText);
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
    // Play success/failure sound
    if (result.success) {
      sounds.playSuccess();
    } else if (result.success === false) {
      sounds.playFailure();
    }

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
    bgm.stopAll();
    const supabase = createClient();
    await supabase
      .from("solo_quests")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", quest.id);

    router.push("/solo");
  }

  return (
    <div className={`relative -mx-4 -mt-4 min-h-[calc(100vh-5rem)] bg-linear-to-b ${theme.bgGradient} ${isPremium ? "ring-1 ring-inset ring-amber-500/20" : ""}`}>
    {isPremium && (
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-amber-500/5 via-transparent to-amber-500/5" />
    )}
    <div className="relative max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-sm font-bold ${theme.accentColor}`}>{scenarioTitle}</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              {tQuest("turnProgress", { current: turnCount, total: totalTurns })}
            </p>
            {isPremium && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 rounded-full px-1.5 py-0.5">
                👑 Premium
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* BGM toggle + volume */}
          <div className="relative flex items-center gap-1">
            <button
              onClick={bgm.toggle}
              className={`text-sm px-2 py-1 rounded-lg transition-colors ${
                bgm.enabled ? "text-amber-400 hover:text-amber-300" : "text-gray-500 hover:text-gray-300"
              }`}
              title={bgm.enabled ? "BGM Off" : "BGM On"}
            >
              {bgm.enabled ? "♫" : "♪"}
            </button>
            {bgm.enabled && (
              <button
                onClick={() => setShowBgmVolume((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                title="Volume"
              >
                ▾
              </button>
            )}
            {showBgmVolume && bgm.enabled && (
              <div className="absolute top-full right-0 mt-1 bg-gray-900/95 backdrop-blur-sm rounded-lg p-2 z-50 border border-white/10">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(bgm.volume * 100)}
                  onChange={(e) => bgm.setVolume(Number(e.target.value) / 100)}
                  className="w-24 h-1 accent-amber-400"
                />
              </div>
            )}
          </div>
          {/* SFX toggle */}
          <button
            onClick={sounds.toggle}
            className="text-sm px-2 py-1 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
            title={sounds.enabled ? "Mute SFX" : "Unmute SFX"}
          >
            {sounds.enabled ? "🔊" : "🔇"}
          </button>
          {questStatus === "in_progress" && (
            <button
              onClick={handleAbandon}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-950/30"
            >
              {tSolo("abandon")}
            </button>
          )}
        </div>
      </div>

      {/* Turn progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((turnCount / totalTurns) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} theme={theme} />
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
            theme={theme}
          />
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingText && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
              🧙‍♂️
            </div>
            <div className={`${theme.bubbleColor} rounded-2xl rounded-tl-sm px-4 py-3`}>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dice roller */}
        {pendingDice && !isStreaming && questStatus === "in_progress" && (
          <DiceRoller request={pendingDice} onRoll={handleDiceRoll} onRolling={sounds.playDiceRoll} />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quest completion overlay */}
      {questStatus === "completed" && (
        <QuestComplete questId={quest.id} turnCount={turnCount} isPremium={isPremium} />
      )}

      {/* Input area */}
      {questStatus === "in_progress" && !pendingDice && (
        <div className={`sticky bottom-16 backdrop-blur-sm pt-2 pb-2 border-t border-white/10 ${isPremium ? "bg-black/40" : "bg-black/60"}`}>
          <ActionInput
            onSend={(msg) => sendMessage(msg)}
            disabled={isStreaming}
            suggestedActions={suggestions}
            theme={theme}
          />
        </div>
      )}
    </div>
    </div>
  );
}
