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

  // Derive accent border from theme
  const accentBorder = theme.accentColor.replace("text-", "border-");

  return (
    <div className="relative flex flex-col overflow-hidden h-full">
      {/* Turn navigation */}
      <div className="flex items-center justify-between px-3 py-1 shrink-0">
        <TurnNav
          currentIndex={currentViewIndex}
          totalTurns={totalTurns}
          onNavigate={onNavigateTurn}
          disabled={isStreaming}
        />
      </div>

      {/* Dialogue box area */}
      <div className="flex-1 overflow-hidden flex gap-2 px-2 pb-2">
        {/* Portrait column */}
        <div className="shrink-0 flex flex-col items-center w-18">
          {/* Decorative portrait frame */}
          <div className={`relative w-17 h-17 rounded-lg ${isCurrentTurnStreaming && !streamingText ? "animate-gm-breathe" : ""}`}>
            {/* Outer decorative border */}
            <div className={`absolute inset-0 rounded-lg border-2 ${accentBorder} opacity-60`} />
            {/* Inner image */}
            <div className={`absolute inset-0.75 rounded-md overflow-hidden border ${accentBorder}`}>
              <Image
                src="/images/nayang/gm.png"
                alt="NaYang GM"
                width={62}
                height={62}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Corner accents */}
            <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 ${accentBorder} rounded-tl-sm`} />
            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 ${accentBorder} rounded-tr-sm`} />
            <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 ${accentBorder} rounded-bl-sm`} />
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 ${accentBorder} rounded-br-sm`} />
          </div>
          {/* Name plate */}
          <div className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/40 border ${accentBorder} border-opacity-40 ${theme.accentColor}`}>
            {t("gmName")}
          </div>
        </div>

        {/* Dialogue box */}
        <div className="flex-1 min-w-0 relative">
          {/* Inner accent border */}
          <div className={`absolute inset-0 rounded-xl border ${accentBorder} opacity-15`} />

          {/* Speech bubble tail (triangle pointing to portrait) */}
          <div className="absolute -left-1.5 top-6 w-0 h-0"
            style={{
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid rgba(255,255,255,0.1)",
            }}
          />

          {/* Scrollable text content */}
          <div
            ref={scrollRef}
            className="relative h-full overflow-y-auto rounded-xl px-3 py-2.5 gm-panel-scroll"
          >
            {isCurrentTurnStreaming && streamingText ? (
              <div className="animate-turn-slide-in text-[13px] leading-relaxed text-gray-100">
                {renderTextContent(stripDiceTags(streamingText))}
                <span className="streaming-cursor" />
              </div>
            ) : isCurrentTurnStreaming && !streamingText ? (
              <div className="flex items-center gap-2 py-2">
                <span className="text-lg animate-pen-write">✍️</span>
                <span className="text-xs text-gray-400">{t("gmThinking")}</span>
              </div>
            ) : displayText ? (
              <div className="animate-turn-slide-in text-[13px] leading-relaxed text-gray-100" key={currentViewIndex}>
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
