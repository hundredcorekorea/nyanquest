"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ScenarioTheme } from "@/types/solo-quest";
import type { Turn } from "@/hooks/useTurns";

export type InputMode = "choice" | "short" | "narrative";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestions: string[];
  theme: ScenarioTheme;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  previousTurn: Turn | null;
}

export default function PlayerPanel({
  onSend,
  disabled,
  suggestions,
  theme,
  inputMode,
  onInputModeChange,
  previousTurn,
}: Props) {
  const t = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const previousAction = previousTurn?.playerMessage?.content;
  const maxLen = inputMode === "short" ? 100 : 500;
  const accentBg = theme.accentColor.replace("text-", "bg-").replace("-400", "-500");

  const modes: { key: InputMode; label: string; icon: string }[] = [
    { key: "choice", label: t("inputModeChoice"), icon: "⚔️" },
    { key: "short", label: t("inputModeShort"), icon: "✏️" },
    { key: "narrative", label: t("inputModeNarrative"), icon: "📜" },
  ];

  return (
    <div className="border-t border-white/10 px-3 py-2">
      {/* Mode tabs — RPG toggle style */}
      <div className="flex items-center gap-1 mb-2">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onInputModeChange(m.key)}
            className={`text-[10px] px-2.5 py-1 rounded-lg transition-all border ${
              inputMode === m.key
                ? `${theme.accentColor} bg-white/10 border-white/15 font-bold shadow-sm`
                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Choice mode */}
      {inputMode === "choice" && (
        <div className="space-y-1.5 mb-2">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => !disabled && onSend(s)}
                disabled={disabled}
                className="group w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all disabled:opacity-40 bg-black/30 border border-white/10 hover:border-white/25 hover:bg-white/5 active:scale-[0.98]"
              >
                {/* Numbered badge */}
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold mr-2 ${accentBg}/30 ${theme.accentColor} border border-current/20 group-hover:${accentBg}/50`}>
                  {i + 1}
                </span>
                <span className="text-gray-200 group-hover:text-white transition-colors">{s}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-3">
              {t("noChoicesAvailable")}
            </p>
          )}
          {/* Free input in choice mode */}
          <div className="flex gap-2 items-center mt-1.5">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 100))}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={t("shortAnswerPlaceholder")}
                className="w-full bg-black/20 text-sm text-white placeholder-gray-600 px-3 py-2 rounded-xl border border-white/10 focus:border-white/25 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 disabled:opacity-20 ${accentBg} text-white hover:brightness-110 active:scale-95`}
            >
              {tCommon("send")}
            </button>
          </div>
        </div>
      )}

      {/* Short answer mode */}
      {inputMode === "short" && (
        <div className="flex gap-2 items-center mb-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? t("waitingPlaceholder") : t("shortAnswerPlaceholder")}
            className="flex-1 bg-black/20 text-sm text-white placeholder-gray-600 px-3 py-2.5 rounded-xl border border-white/10 focus:border-white/25 focus:outline-none transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 disabled:opacity-20 ${accentBg} text-white hover:brightness-110 active:scale-95`}
          >
            {tCommon("send")}
          </button>
        </div>
      )}

      {/* Narrative mode */}
      {inputMode === "narrative" && (
        <div className="mb-1">
          <div className="flex gap-2 items-end rounded-xl border border-white/10 bg-black/20 p-1.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={disabled ? t("waitingPlaceholder") : t("inputPlaceholder")}
              rows={2}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 px-2 py-1.5 resize-none focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 self-end disabled:opacity-20 ${accentBg} text-white hover:brightness-110 active:scale-95`}
            >
              {tCommon("send")}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-right mt-0.5">{input.length}/{maxLen}</p>
        </div>
      )}

      {/* Previous player action */}
      {previousAction && (
        <div className="text-[10px] text-gray-500 truncate mt-0.5">
          <span className="text-gray-600">●</span> {t("previousAction")}: <span className="text-gray-400">{previousAction}</span>
        </div>
      )}
    </div>
  );
}
