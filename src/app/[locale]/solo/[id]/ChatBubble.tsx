"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import type { QuestMessage, ScenarioTheme } from "@/types/solo-quest";
import type { TrpgSystemId } from "@/lib/solo-quest/systems";

/** Strip [판정 필요: ...] tags from displayed text — these are machine-parsed, not for the player */
function stripDiceTags(text: string): string {
  return text.replace(/\s*\[판정 필요:[^\]]*\]/g, "").trim();
}

/** Render inline markdown: **bold**, *italic*, "dialogue" → JSX */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, or "quoted dialogue" (including Korean quotation marks)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|"([^"]+)"|"([^"]+)")/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match (narration — slightly dimmer)
    if (match.index > lastIndex) {
      parts.push(
        <span key={`n${lastIndex}`} className="text-gray-300">
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-bold text-white">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index} className="italic text-gray-200">{match[3]}</em>);
    } else if (match[4] || match[5]) {
      // "dialogue" or \u201Cdialogue\u201D — bright with left accent bar
      const dialogue = match[4] || match[5];
      parts.push(
        <span
          key={match.index}
          className="inline text-white font-medium border-l-2 border-amber-400/60 pl-1.5 ml-0.5"
        >
          &ldquo;{dialogue}&rdquo;
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`n${lastIndex}`} className="text-gray-300">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [<span key="t" className="text-gray-300">{text}</span>];
}

interface Props {
  message: QuestMessage;
  isStreaming?: boolean;
  theme?: ScenarioTheme;
  systemId?: TrpgSystemId;
}

export default function ChatBubble({ message, isStreaming, theme, systemId }: Props) {
  const t = useTranslations("SoloQuest");
  if (message.role === "system") {
    return (
      <div className="flex justify-center animate-bubble-in">
        <div className="bg-white/10 rounded-xl px-4 py-2 text-xs text-gray-300 text-center max-w-xs">
          {message.diceRoll && (
            <div className="mb-1">
              {/* Pool-highest display (Blades in the Dark) */}
              {systemId === "bitd" && message.diceRoll.results ? (
                <>
                  <div className="flex flex-wrap justify-center gap-0.5 mb-1">
                    {message.diceRoll.results.map((val, i) => {
                      const highest = Math.max(...(message.diceRoll!.results ?? []));
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                            val === highest && val === 6
                              ? "bg-green-400/30 text-green-300"
                              : val === highest
                              ? "bg-amber-400/30 text-amber-300"
                              : "bg-white/10 text-gray-500"
                          }`}
                        >
                          {val}
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-bold text-white">
                    {t("poolHighestShort", { value: message.diceRoll.total })}
                  </span>
                  {message.diceRoll.messyCritical && (
                    <span className="ml-1 text-yellow-400 font-medium">⚡</span>
                  )}
                  <span
                    className={`ml-1 font-medium ${
                      message.diceRoll.tier === "success"
                        ? "text-green-400"
                        : message.diceRoll.tier === "partial"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {message.diceRoll.tier === "success"
                      ? t("diceSuccess")
                      : message.diceRoll.tier === "partial"
                      ? t("dicePartial")
                      : t("diceFail")}
                  </span>
                </>
              ) : /* Pool-count display (VtM) */
              message.diceRoll.successes !== undefined ? (
                <>
                  <div className="flex flex-wrap justify-center gap-0.5 mb-1">
                    {message.diceRoll.results?.map((val, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          val === 10
                            ? "bg-yellow-400/30 text-yellow-300"
                            : val >= 6
                            ? "bg-green-400/20 text-green-300"
                            : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                  <span className="font-bold text-white">
                    {t("poolSuccessesShort", { count: message.diceRoll.successes })}
                  </span>
                  {message.diceRoll.messyCritical && (
                    <span className="ml-1 text-yellow-400 font-medium">⚡</span>
                  )}
                  <span
                    className={`ml-1 font-medium ${
                      message.diceRoll.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    vs {t("difficulty")} {message.diceRoll.difficulty}{" "}
                    {message.diceRoll.success ? t("diceSuccess") : t("diceFail")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg">🎲</span>{" "}
                  <span className="font-bold text-white">
                    {message.diceRoll.results ? (
                      <>
                        [{message.diceRoll.results.join("] [")}]
                        {message.diceRoll.modifier
                          ? ` + ${message.diceRoll.modifier}`
                          : ""}
                        {" = "}{message.diceRoll.total}
                      </>
                    ) : (
                      <>
                        {message.diceRoll.type} = {message.diceRoll.result}
                        {message.diceRoll.modifier
                          ? ` + ${message.diceRoll.modifier}`
                          : ""}{" "}
                        = {message.diceRoll.total}
                      </>
                    )}
                  </span>
                  {message.diceRoll.dc && (
                    <span
                      className={`ml-1 font-medium ${
                        message.diceRoll.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      vs DC {message.diceRoll.dc}{" "}
                      {message.diceRoll.success ? t("diceSuccess") : t("diceFail")}
                    </span>
                  )}
                  {message.diceRoll.target && !message.diceRoll.dc && (
                    <span
                      className={`ml-1 font-medium ${
                        message.diceRoll.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      vs {t("targetValue")} {message.diceRoll.target}{" "}
                      {message.diceRoll.success ? t("diceSuccess") : t("diceFail")}
                    </span>
                  )}
                  {message.diceRoll.skillValue && !message.diceRoll.dc && !message.diceRoll.target && (
                    <span
                      className={`ml-1 font-medium ${
                        message.diceRoll.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      vs {t("skillValue")} {message.diceRoll.skillValue}{" "}
                      {message.diceRoll.total <= 5 && systemId === "coc"
                        ? t("diceCritical")
                        : message.diceRoll.total >= 96 && systemId === "coc"
                        ? t("diceFumble")
                        : message.diceRoll.success ? t("diceSuccess") : t("diceFail")}
                    </span>
                  )}
                  {message.diceRoll.tier && !message.diceRoll.dc && !message.diceRoll.target && !message.diceRoll.skillValue && (
                    <span
                      className={`ml-1 font-medium ${
                        message.diceRoll.tier === "success"
                          ? "text-green-400"
                          : message.diceRoll.tier === "partial"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {message.diceRoll.tier === "success"
                        ? t("diceSuccess")
                        : message.diceRoll.tier === "partial"
                        ? t("dicePartial")
                        : t("diceFail")}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          {message.content}
        </div>
      </div>
    );
  }

  const isGm = message.role === "gm";
  const bubbleBg = theme?.bubbleColor ?? "bg-amber-950/60";

  return (
    <div
      className={`flex gap-2 animate-bubble-in ${
        isGm ? "justify-start" : "justify-end"
      }`}
    >
      {isGm && (
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm shrink-0">
          🧙‍♂️
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isGm
            ? `${bubbleBg} text-gray-100 rounded-tl-sm border border-white/5 backdrop-blur-xs`
            : "bg-white/15 text-white rounded-tr-sm border border-white/10"
        }`}
      >
        {isGm ? renderInlineMarkdown(stripDiceTags(message.content)) : message.content}
        {isStreaming && <span className="streaming-cursor" />}
      </div>
      {!isGm && (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
          🧑
        </div>
      )}
    </div>
  );
}
