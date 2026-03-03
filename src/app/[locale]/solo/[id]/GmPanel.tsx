"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ScenarioTheme } from "@/types/solo-quest";
import type { Turn } from "@/hooks/useTurns";
import { stripDiceTags, stripEndTags, renderInlineMarkdown } from "@/lib/solo-quest/text-format";
import TurnNav from "./TurnNav";

interface Props {
  currentTurn: Turn | null;
  isStreaming: boolean;
  streamingText: string;
  theme: ScenarioTheme;
  currentViewIndex: number;
  totalTurns: number;
  onNavigateTurn: (index: number) => void;
}

export default function GmPanel({
  currentTurn,
  isStreaming,
  streamingText,
  theme,
  currentViewIndex,
  totalTurns,
  onNavigateTurn,
}: Props) {
  const t = useTranslations("SoloQuest");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (isStreaming && streamingText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentViewIndex, isStreaming, streamingText]);

  const gmContent = currentTurn?.gmMessage?.content;
  const displayText = gmContent ? stripEndTags(stripDiceTags(gmContent)) : null;
  const isCurrentTurnStreaming = isStreaming && currentViewIndex === totalTurns - 1;

  function renderTextContent(text: string) {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      if (/^\d+[\.\)]\s/.test(trimmed)) {
        return (
          <p key={i} className="mt-1 text-gray-200">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      }
      return (
        <p key={i} className={`${i > 0 ? "mt-1.5" : ""}`}>
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  }

  return (
    <div className={`relative flex flex-col overflow-hidden h-full ${theme.bubbleColor} border-b border-white/5`}>
      {/* Turn navigation bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/5 shrink-0">
        <TurnNav
          currentIndex={currentViewIndex}
          totalTurns={totalTurns}
          onNavigate={onNavigateTurn}
          disabled={isStreaming}
        />
      </div>

      {/* NaYang portrait + speech bubble layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* NaYang portrait — fixed left column */}
        <div className="shrink-0 flex flex-col items-center pt-2 pl-2 pb-2 w-16">
          <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-black/40 ${isCurrentTurnStreaming && !streamingText ? "animate-gm-breathe" : ""} ${theme.accentColor.replace("text-", "border-")}`}>
            <Image
              src="/images/nayang/gm.png"
              alt="NaYang GM"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className={`text-[9px] font-bold mt-0.5 ${theme.accentColor}`}>
            {t("gmName")}
          </div>
        </div>

        {/* Speech bubble — scrollable text area */}
        <div className="flex-1 min-w-0 relative py-2 pr-2 pl-1">
          {/* Speech bubble tail */}
          <div className={`absolute left-0 top-5 w-2 h-3 ${theme.bubbleColor}`} style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)" }} />

          <div
            ref={scrollRef}
            className="h-full overflow-y-auto rounded-xl bg-black/20 border border-white/5 px-3 py-2 gm-panel-scroll"
          >
            {isCurrentTurnStreaming && streamingText ? (
              <div className="animate-turn-slide-in text-sm leading-relaxed">
                {renderTextContent(stripDiceTags(streamingText))}
                <span className="streaming-cursor" />
              </div>
            ) : isCurrentTurnStreaming && !streamingText ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="text-base animate-pen-write">✍️</span>
                <span className="text-xs text-gray-400">{t("gmThinking")}</span>
              </div>
            ) : displayText ? (
              <div className="animate-turn-slide-in text-sm leading-relaxed" key={currentViewIndex}>
                {renderTextContent(displayText)}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                {t("gmThinking")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
