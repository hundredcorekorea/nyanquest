"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

const STORAGE_PREFIX = "nyanquest_party_tutorial_";

interface TutorialStep {
  speaker: string;
  text: string;
  highlight?: "action" | "chat";
}

export function usePartyTutorialState(userId?: string) {
  const key = `${STORAGE_PREFIX}${userId || "anon"}`;
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return !localStorage.getItem(key); } catch { return false; }
  });

  const dismiss = useCallback(() => {
    try { localStorage.setItem(key, "1"); } catch { /* quota */ }
    setShow(false);
  }, [key]);

  return { showPartyTutorial: show, dismissPartyTutorial: dismiss };
}

export default function PartyTutorialOverlay({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const t = useTranslations("PartyTutorial");

  const STEPS: TutorialStep[] = [
    { speaker: "🧙‍♂️🐱", text: t("steps.welcome") },
    { speaker: "🧙‍♂️🐱", text: t("steps.explainPartyPlay") },
    { speaker: "⌨️", text: t("steps.explainAction"), highlight: "action" },
    { speaker: "💬", text: t("steps.explainChat"), highlight: "chat" },
    { speaker: "⏳", text: t("steps.explainRounds") },
    { speaker: "🎉", text: t("steps.ready") },
  ];

  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Skip button */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={onComplete}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t("skip")}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Speaker + Message */}
          <div className="flex items-start gap-3">
            <div className="text-4xl flex-shrink-0">{current.speaker}</div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl rounded-tl-sm p-4 flex-1">
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {current.text}
              </p>
            </div>
          </div>

          {/* Visual highlight hint */}
          {current.highlight === "action" && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
              <span className="text-xl">✏️</span>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-200 dark:border-gray-700">
                행동을 입력하라냥...
              </div>
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                ➤
              </div>
            </div>
          )}

          {current.highlight === "chat" && (
            <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ← 이 버튼을 눌러보라냥!
              </span>
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-lg shadow-lg relative">
                💬
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
            </div>
          )}

          {/* Next / Start button */}
          <button
            onClick={handleNext}
            className="w-full py-3 font-medium rounded-xl text-sm transition-colors bg-amber-500 hover:bg-amber-600 text-white active:scale-[0.98]"
          >
            {isLast ? t("startAdventure") : t("next")}
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step
                    ? "bg-amber-500"
                    : i < step
                      ? "bg-amber-300"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
