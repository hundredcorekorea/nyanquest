"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ScenarioTheme } from "@/types/solo-quest";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestedActions: string[];
  theme?: ScenarioTheme;
  darkMode?: boolean;
}

export default function ActionInput({
  onSend,
  disabled,
  suggestedActions,
  theme,
  darkMode,
}: Props) {
  const tQuest = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
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

  const isDark = darkMode || !!theme;

  return (
    <div className="space-y-3">
      {/* Suggested actions */}
      {suggestedActions.length > 0 && !disabled && (
        <div className="flex gap-2 flex-wrap">
          {suggestedActions.map((action) => (
            <button
              key={action}
              onClick={() => onSend(action)}
              disabled={disabled}
              className={`text-xs px-3.5 py-2 rounded-full transition-all disabled:opacity-50 backdrop-blur-xs ${
                theme
                  ? `${theme.bubbleColor} ${theme.accentColor} border border-white/10 hover:border-white/25 hover:scale-[1.02] active:scale-95`
                  : isDark
                    ? "bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20"
                    : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className={`flex gap-2 items-end rounded-2xl p-2 ${
        theme ? `${theme.bubbleColor} border border-white/10` : isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled ? tQuest("waitingPlaceholder") : tQuest("inputPlaceholder")
          }
          rows={2}
          className={`flex-1 px-3 py-2 rounded-xl text-sm resize-none focus:outline-none bg-transparent ${
            isDark
              ? "text-white placeholder-gray-400 disabled:text-gray-500"
              : "placeholder-gray-400 disabled:text-gray-400"
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 disabled:opacity-40 ${
            theme
              ? `${theme.accentColor.replace("text-", "bg-").replace("-400", "-500")} text-white hover:brightness-110`
              : "bg-amber-500 text-white hover:bg-amber-600"
          } disabled:bg-gray-600 disabled:text-gray-400`}
        >
          {tCommon("send")}
        </button>
      </div>
      <p className={`text-xs text-right ${isDark ? "text-gray-500" : "text-gray-300"}`}>{input.length}/500</p>
    </div>
  );
}
