"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

const MOOD_OPTIONS = [
  { value: 5, emoji: "😍", label: "최고" },
  { value: 4, emoji: "🙂", label: "좋았어" },
  { value: 3, emoji: "😐", label: "보통" },
  { value: 2, emoji: "😕", label: "별로" },
  { value: 1, emoji: "😢", label: "아쉬워" },
];

interface Props {
  questId?: string;
  sessionId?: string;
  scenarioId?: string;
  playType: "solo" | "party";
  questStatus?: string;
  onClose: () => void;
}

export default function PostGameSurvey({ questId, sessionId, scenarioId, playType, questStatus, onClose }: Props) {
  const t = useTranslations("Survey");
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating === null || submitting) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("survey_responses").insert({
        user_id: user.id,
        quest_id: questId || null,
        session_id: sessionId || null,
        scenario_id: scenarioId || null,
        play_type: playType,
        rating,
        feedback: feedback.trim() || null,
        quest_status: questStatus || null,
      });

      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {
      // silently fail — survey is optional
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center animate-bubble-in">
        <div className="text-3xl mb-2">🐱</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("thankYou")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 animate-bubble-in">
      <div className="text-center">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("title")}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Emoji rating */}
      <div className="flex justify-center gap-2">
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRating(opt.value)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
              rating === opt.value
                ? "bg-amber-100 dark:bg-amber-900/40 scale-110 ring-2 ring-amber-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className={`text-[10px] ${
              rating === opt.value ? "text-amber-700 dark:text-amber-300 font-bold" : "text-gray-400"
            }`}>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Optional text feedback */}
      {rating !== null && (
        <div className="animate-bubble-in">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 200))}
            placeholder={t("placeholder")}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 dark:text-gray-100 placeholder-gray-400"
          />
          <p className="text-[10px] text-gray-400 text-right mt-0.5">{feedback.length}/200</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {t("skip")}
        </button>
        {rating !== null && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? "..." : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}
