"use client";

import { useTranslations } from "next-intl";
import type { QuestMessage, ScenarioTheme } from "@/types/solo-quest";
import type { TrpgSystemId } from "@/lib/solo-quest/systems";

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
              {/* Pool-count display (VtM) */}
              {message.diceRoll.successes !== undefined ? (
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
        {message.content}
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
