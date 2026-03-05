"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { QuestMessage, ScenarioTheme } from "@/types/solo-quest";
import type { TrpgSystemId } from "@/lib/solo-quest/systems";
import { stripDiceTags, renderInlineMarkdown } from "@/lib/solo-quest/text-format";
import { isTossApp } from "@/lib/toss";

interface Props {
  message: QuestMessage;
  isStreaming?: boolean;
  theme?: ScenarioTheme;
  systemId?: TrpgSystemId;
  userAvatarUrl?: string | null;
}

export default function ChatBubble({ message, isStreaming, theme, systemId, userAvatarUrl }: Props) {
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
  const accentBorder = theme?.accentColor?.replace("text-", "border-") ?? "border-amber-400";

  // ── GM message: visual novel dialogue box ──
  if (isGm) {
    return (
      <div className="animate-bubble-in w-full">
        <div className={`${bubbleBg} rounded-xl px-3 py-3 border border-white/5 backdrop-blur-xs`}>
          <div className="flex gap-3">
            {/* NaYang portrait */}
            <div className="shrink-0 animate-portrait-in">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg ${accentBorder} border-2 overflow-hidden bg-black/30`}>
                <Image
                  src="/images/nayang/neutral.png"
                  alt="NaYang GM"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Text area */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${theme?.accentColor ?? "text-amber-400"}`}>
                {t("gmName")}
                <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-white/10 text-gray-400">AI</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-100">
                {renderInlineMarkdown(stripDiceTags(message.content))}
                {isStreaming && <span className="streaming-cursor" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Player message: right-aligned with user avatar ──
  return (
    <div className="animate-bubble-in w-full">
      <div className="bg-white/10 rounded-xl px-3 py-3 border border-white/10">
        <div className="flex gap-3 flex-row-reverse">
          {/* User avatar */}
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-lg border-2 border-white/20 overflow-hidden bg-black/30">
              {userAvatarUrl ? (
                <Image
                  src={userAvatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">
                  🧑
                </div>
              )}
            </div>
          </div>
          {/* Text area */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold mb-1 text-white/60 text-right">
              {t("adventurerLabel")}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-white text-right">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
