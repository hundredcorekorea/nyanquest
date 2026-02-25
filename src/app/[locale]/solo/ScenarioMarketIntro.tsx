"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "nyanquest_scenario_market_intro_seen";

interface Props {
  hasActiveContest: boolean;
  contestTitle?: string;
}

export default function ScenarioMarketIntro({ hasActiveContest, contestTitle }: Props) {
  const t = useTranslations("Solo");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up sm:animate-bubble-in">
        <div className="px-6 pt-6 pb-5 space-y-4">
          {/* NaYang speech */}
          <div className="flex items-start gap-3">
            <div className="text-4xl shrink-0">🧙‍♂️📚</div>
            <div className="bg-purple-50 rounded-2xl rounded-tl-sm p-4 flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">
                {t("marketIntroMessage")}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 pl-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>🎮</span> {t("marketIntroPlay")}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>✍️</span> {t("marketIntroCreate")}
            </div>
            {hasActiveContest && contestTitle && (
              <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                <span>🏆</span> {t("marketIntroContest", { title: contestTitle })}
              </div>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/scenarios"
            onClick={handleDismiss}
            className="block w-full py-3 text-center font-medium rounded-xl text-sm bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            {t("marketIntroCta")}
          </Link>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
          >
            {t("marketIntroDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
