"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestedActions: string[];
}

export default function ActionInput({
  onSend,
  disabled,
  suggestedActions,
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

  return (
    <div className="space-y-2">
      {/* Suggested actions */}
      {suggestedActions.length > 0 && !disabled && (
        <div className="flex gap-2 flex-wrap">
          {suggestedActions.map((action) => (
            <button
              key={action}
              onClick={() => onSend(action)}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled ? tQuest("waitingPlaceholder") : tQuest("inputPlaceholder")
          }
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex-shrink-0"
        >
          {tCommon("send")}
        </button>
      </div>
      <p className="text-xs text-gray-300 text-right">{input.length}/500</p>
    </div>
  );
}
