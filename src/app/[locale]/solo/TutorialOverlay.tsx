"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { rollDice } from "@/lib/solo-quest/dice";
import type { DiceRoll } from "@/types/solo-quest";

const STORAGE_KEY = "nyanquest_tutorial_seen";

interface TutorialStep {
  speaker: string;
  text: string;
  action?: "dice" | "choice";
}

export function useTutorialState() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }, []);

  return { showTutorial: show, dismissTutorial: dismiss };
}

export default function TutorialOverlay({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const t = useTranslations("Tutorial");
  const tSolo = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");

  const STEPS: TutorialStep[] = [
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.welcome"),
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.explainPlayProfile"),
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.askTrpg"),
      action: "choice",
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.explainTrpg"),
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.explainDice"),
      action: "dice",
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.afterDiceAndTraining"),
    },
    {
      speaker: "🧙‍♂️🐱",
      text: t("steps.ready"),
    },
  ];

  const [step, setStep] = useState(0);
  const [diceResult, setDiceResult] = useState<DiceRoll | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [skippedExplanation, setSkippedExplanation] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    // After step 2 (choice), if they already know TRPG, skip explanation
    if (step === 2 && skippedExplanation) {
      setStep(4); // Jump to dice step
      return;
    }
    setStep((s) => s + 1);
    setDiceResult(null);
  };

  const handleDiceRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      const result = rollDice("d20", 0, 12);
      setDiceResult(result);
      setIsRolling(false);
    }, 1200);
  };

  const handleChoice = (knows: boolean) => {
    setSkippedExplanation(knows);
    if (knows) {
      setStep(4); // Skip to dice
    } else {
      setStep(3); // Go to explanation
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Skip button */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("skip")}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Speaker */}
          <div className="flex items-start gap-3">
            <div className="text-4xl flex-shrink-0">{current.speaker}</div>
            <div className="bg-amber-50 rounded-2xl rounded-tl-sm p-4 flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">
                {current.text}
              </p>
            </div>
          </div>

          {/* Dice action */}
          {current.action === "dice" && (
            <div className="text-center space-y-3">
              {!diceResult && !isRolling && (
                <button
                  onClick={handleDiceRoll}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl transition-colors text-sm"
                >
                  {t("rollD20")}
                </button>
              )}
              {isRolling && (
                <div className="text-4xl animate-bounce">🎲</div>
              )}
              {diceResult && (
                <div
                  className={`inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl ${
                    diceResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <span className="text-2xl font-bold">
                    🎲 {diceResult.result}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      diceResult.success ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    DC 12{" "}
                    {diceResult.success
                      ? tSolo("diceSuccess")
                      : diceResult.result === 20
                        ? tSolo("diceGreatSuccess")
                        : tSolo("diceFail")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Choice action */}
          {current.action === "choice" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleChoice(false)}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {t("firstTime")}
              </button>
              <button
                onClick={() => handleChoice(true)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
              >
                {t("alreadyKnow")}
              </button>
            </div>
          )}

          {/* Next / Start button */}
          {current.action !== "choice" &&
            !(current.action === "dice" && !diceResult) && (
              <button
                onClick={handleNext}
                className={`w-full py-3 font-medium rounded-xl text-sm transition-colors ${
                  isLast
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {isLast ? t("startAdventure") : tCommon("next")}
              </button>
            )}

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
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
