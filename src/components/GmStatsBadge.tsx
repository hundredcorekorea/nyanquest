"use client";

import type { GmStats } from "@/types/database";
import { useTranslations } from "next-intl";

interface Props {
  stats: GmStats;
  variant: "compact" | "detailed";
}

export default function GmStatsBadge({ stats, variant }: Props) {
  const t = useTranslations("GmStats");

  if (stats.totalSessions === 0) return null;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
          {t("completed")} {stats.completedSessions}{t("times")}
        </span>
        {stats.systems.length > 0 && (
          <span className="text-xs text-gray-400">
            {stats.systems.slice(0, 2).map((s) => s.name).join(", ")}
          </span>
        )}
        {stats.totalGmReviews > 0 && (
          <span className="text-xs text-purple-500">
            👍 {stats.positiveRate}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-2xl border border-purple-100 p-5 space-y-3">
      <h2 className="font-bold text-sm text-purple-900">🧙 {t("title")}</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400">{t("totalSessions")}</p>
          <p className="text-sm font-bold text-purple-600">
            {stats.totalSessions}{t("times")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{t("completed")}</p>
          <p className="text-sm font-bold text-green-600">
            {stats.completedSessions}{t("times")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{t("positiveRate")}</p>
          <p className="text-sm font-bold text-purple-600">
            {stats.totalGmReviews > 0 ? `${stats.positiveRate}%` : "-"}
          </p>
        </div>
      </div>
      {stats.systems.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">{t("frequentSystems")}</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.systems.slice(0, 5).map((s) => (
              <span
                key={s.name}
                className="text-xs bg-white/80 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100"
              >
                {s.name} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
