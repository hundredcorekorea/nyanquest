"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  hasActiveContest: boolean;
  contestTitle?: string;
}

export default function ScenarioMarketCard({ hasActiveContest, contestTitle }: Props) {
  const t = useTranslations("Solo");

  return (
    <Link
      href="/scenarios"
      className="group relative block bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-4 hover:shadow-md transition-all animate-market-glow"
    >
      {/* Event badge */}
      {hasActiveContest && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-md z-10">
          EVENT
        </span>
      )}

      <div className="flex items-center gap-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-purple-800">
            {t("scenarioMarketTitle")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("scenarioMarketDesc")}
          </p>
          {hasActiveContest && contestTitle && (
            <p className="text-xs text-red-500 font-medium mt-1">
              🏆 {contestTitle}
            </p>
          )}
        </div>
        <svg
          className="w-5 h-5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
