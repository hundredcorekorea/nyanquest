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

  // Auto-scroll to top when turn changes, or to bottom during streaming
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

  return (
    <div className={`relative flex flex-col overflow-hidden h-full ${theme.bubbleColor} border-b border-white/5`}>
      {/* Turn navigation bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
        <TurnNav
          currentIndex={currentViewIndex}
          totalTurns={totalTurns}
          onNavigate={onNavigateTurn}
          disabled={isStreaming}
        />
      </div>

      {/* GM narrative content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto gm-panel-scroll relative"
      >
        {/* NaYang portrait — always visible at top */}
        <div className="relative w-full h-24 overflow-hidden shrink-0">
          <Image
            src="/images/nayang/gm.png"
            alt="NaYang GM"
            width={480}
            height={200}
            className={`w-full h-full object-cover object-top ${isCurrentTurnStreaming && !streamingText ? "animate-gm-breathe" : ""}`}
            priority
          />
          {/* Bottom fade into text area */}
          <div className={`absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/80 to-transparent`} />
          {/* GM name overlay */}
          <div className={`absolute bottom-1 left-3 text-[10px] font-bold ${theme.accentColor}`}>
            {t("gmName")}
          </div>
        </div>

        {/* Text area — speech bubble style */}
        <div className="px-3 py-2">
          {/* Streaming: show partial text with cursor */}
          {isCurrentTurnStreaming && streamingText ? (
            <div className="animate-turn-slide-in">
              <div className="text-sm leading-relaxed">
                {stripDiceTags(streamingText).split("\n").map((line, i) => (
                  <p key={i} className={`${i > 0 ? "mt-1.5" : ""}`}>
                    {renderInlineMarkdown(line)}
                  </p>
                ))}
                <span className="streaming-cursor" />
              </div>
            </div>
          ) : isCurrentTurnStreaming && !streamingText ? (
            /* Loading state: NaYang thinking */
            <div className="flex items-center gap-1.5 py-2">
              <span className="text-base animate-pen-write">✍️</span>
              <span className="text-xs text-gray-400">{t("gmThinking")}</span>
            </div>
          ) : displayText ? (
            /* Normal turn: show GM message */
            <div className="animate-turn-slide-in" key={currentViewIndex}>
              <div className="text-sm leading-relaxed">
                {displayText.split("\n").map((line, i) => {
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
                })}
              </div>
            </div>
          ) : (
            /* No GM message yet */
            <div className="flex items-center justify-center py-4 text-gray-500 text-xs">
              {t("gmThinking")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
