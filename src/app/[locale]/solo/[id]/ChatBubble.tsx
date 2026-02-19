"use client";

import { useTranslations } from "next-intl";
import type { QuestMessage } from "@/types/solo-quest";

interface Props {
  message: QuestMessage;
  isStreaming?: boolean;
}

export default function ChatBubble({ message, isStreaming }: Props) {
  const t = useTranslations("SoloQuest");
  if (message.role === "system") {
    return (
      <div className="flex justify-center animate-bubble-in">
        <div className="bg-gray-100 rounded-xl px-4 py-2 text-xs text-gray-500 text-center max-w-xs">
          {message.diceRoll && (
            <div className="mb-1">
              <span className="text-lg">🎲</span>{" "}
              <span className="font-bold text-gray-700">
                {message.diceRoll.type} = {message.diceRoll.result}
                {message.diceRoll.modifier
                  ? ` + ${message.diceRoll.modifier}`
                  : ""}{" "}
                = {message.diceRoll.total}
              </span>
              {message.diceRoll.dc && (
                <span
                  className={`ml-1 font-medium ${
                    message.diceRoll.success
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  vs DC {message.diceRoll.dc}{" "}
                  {message.diceRoll.success ? t("diceSuccess") : t("diceFail")}
                </span>
              )}
            </div>
          )}
          {message.content}
        </div>
      </div>
    );
  }

  const isGm = message.role === "gm";

  return (
    <div
      className={`flex gap-2 animate-bubble-in ${
        isGm ? "justify-start" : "justify-end"
      }`}
    >
      {isGm && (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0">
          🧙‍♂️
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isGm
            ? "bg-amber-50 text-gray-800 rounded-tl-sm"
            : "bg-amber-500 text-white rounded-tr-sm"
        }`}
      >
        {message.content}
        {isStreaming && <span className="streaming-cursor" />}
      </div>
      {!isGm && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
          🧑
        </div>
      )}
    </div>
  );
}
