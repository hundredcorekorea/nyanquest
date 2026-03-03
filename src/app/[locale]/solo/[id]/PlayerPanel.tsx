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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
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

  const modes: { key: InputMode; label: string }[] = [
    { key: "choice", label: t("inputModeChoice") },
    { key: "short", label: t("inputModeShort") },
    { key: "narrative", label: t("inputModeNarrative") },
  ];

  return (
    <div className={`${theme.bubbleColor} border-t border-white/5 px-3 py-2`}>
      {/* Mode tabs */}
      <div className="flex items-center gap-1 mb-2">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onInputModeChange(m.key)}
            className={`text-[10px] px-2.5 py-1 rounded-full transition-all ${
              inputMode === m.key
                ? `${theme.accentColor} bg-white/10 font-bold`
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Choice mode: vertical button list */}
      {inputMode === "choice" && (
        <div className="space-y-1.5 mb-2">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => !disabled && onSend(s)}
                disabled={disabled}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all disabled:opacity-50 ${theme.bubbleColor} border border-white/10 hover:border-white/25 hover:bg-white/5 active:scale-[0.98]`}
              >
                <span className={`font-bold mr-1.5 ${theme.accentColor}`}>{i + 1}.</span>
                <span className="text-gray-200">{s}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">
              {t("noChoicesAvailable")}
            </p>
          )}
          {/* Also show a small text input for free-form in choice mode */}
          <div className="flex gap-2 items-end mt-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 100))}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={t("shortAnswerPlaceholder")}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 px-3 py-1.5 rounded-lg border border-white/10 focus:border-white/20 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 disabled:opacity-30 ${theme.accentColor.replace("text-", "bg-").replace("-400", "-500")} text-white`}
            >
              {tCommon("send")}
            </button>
          </div>
        </div>
      )}

      {/* Short answer mode: single line input */}
      {inputMode === "short" && (
        <div className="flex gap-2 items-center mb-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? t("waitingPlaceholder") : t("shortAnswerPlaceholder")}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 px-3 py-2 rounded-xl border border-white/10 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all shrink-0 disabled:opacity-30 ${theme.accentColor.replace("text-", "bg-").replace("-400", "-500")} text-white`}
          >
            {tCommon("send")}
          </button>
        </div>
      )}

      {/* Narrative mode: multi-line textarea */}
      {inputMode === "narrative" && (
        <div className="mb-1">
          <div className="flex gap-2 items-end rounded-xl border border-white/10 p-1.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, maxLen))}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={disabled ? t("waitingPlaceholder") : t("inputPlaceholder")}
              rows={2}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 px-2 py-1.5 resize-none focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all shrink-0 self-end disabled:opacity-30 ${theme.accentColor.replace("text-", "bg-").replace("-400", "-500")} text-white`}
            >
              {tCommon("send")}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 text-right mt-0.5">{input.length}/{maxLen}</p>
        </div>
      )}

      {/* Previous player action */}
      {previousAction && (
        <div className="text-[10px] text-gray-500 truncate">
          💬 {t("previousAction")}: {previousAction}
        </div>
      )}
    </div>
  );
}
