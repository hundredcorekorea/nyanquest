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
        className="flex-1 overflow-y-auto px-3 py-2 gm-panel-scroll relative"
      >
        {/* Streaming: show partial text with cursor */}
        {isCurrentTurnStreaming && streamingText ? (
          <div className="flex gap-2.5 animate-turn-slide-in">
            <div className="w-11 h-11 rounded-lg border border-white/20 overflow-hidden bg-black/30 shrink-0">
              <Image src="/images/nayang/neutral.svg" alt="NaYang" width={44} height={44} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold mb-0.5 ${theme.accentColor}`}>{t("gmName")}</div>
              <div className="text-sm leading-relaxed">
                {stripDiceTags(streamingText).split("\n").map((line, i) => (
                  <p key={i} className={`${i > 0 ? "mt-1.5" : ""}`}>
                    {renderInlineMarkdown(line)}
                  </p>
                ))}
                <span className="streaming-cursor" />
              </div>
            </div>
          </div>
        ) : isCurrentTurnStreaming && !streamingText ? (
          /* Loading state: NaYang thinking */
          <div className="flex gap-2.5 items-center">
            <div className="w-11 h-11 rounded-lg border border-white/20 overflow-hidden bg-black/30 shrink-0 animate-gm-breathe">
              <Image src="/images/nayang/neutral.svg" alt="NaYang" width={44} height={44} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className={`text-[10px] font-bold mb-0.5 ${theme.accentColor}`}>{t("gmName")}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-base animate-pen-write">✍️</span>
                <span className="text-xs text-gray-400">{t("gmThinking")}</span>
              </div>
            </div>
          </div>
        ) : displayText ? (
          /* Normal turn: show GM message */
          <div className="flex gap-2.5 animate-turn-slide-in" key={currentViewIndex}>
            <div className="w-11 h-11 rounded-lg border border-white/20 overflow-hidden bg-black/30 shrink-0">
              <Image src="/images/nayang/neutral.svg" alt="NaYang" width={44} height={44} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold mb-0.5 ${theme.accentColor}`}>{t("gmName")}</div>
              <div className="text-sm leading-relaxed">
                {displayText.split("\n").map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  // Numbered choices: render as styled items
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
          </div>
        ) : (
          /* No GM message yet (incomplete turn) */
          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
            {t("gmThinking")}
          </div>
        )}
      </div>
    </div>
  );
}
