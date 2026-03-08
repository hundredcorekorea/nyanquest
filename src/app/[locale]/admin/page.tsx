"use client";

import { useEffect, useState } from "react";

const RATING_EMOJI: Record<number, string> = {
  5: "😍",
  4: "🙂",
  3: "😐",
  2: "😕",
  1: "😢",
};
const RATING_LABEL: Record<number, string> = {
  5: "최고",
  4: "좋았어",
  3: "보통",
  2: "별로",
  1: "아쉬워",
};

interface SurveyResponse {
  id: string;
  rating: number;
  feedback: string | null;
  play_type: "solo" | "party";
  quest_status: string | null;
  scenario_id: string | null;
  created_at: string;
}

interface SurveyData {
  period: { days: number; since: string };
  summary: {
    total: number;
    totalAll: number;
    avgRating: number;
    distribution: Record<number, number>;
    byType: {
      solo: { count: number; avg: number };
      party: { count: number; avg: number };
    };
  };
  responses: SurveyResponse[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "responses">("overview");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/surveys?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!data?.summary) {
    return <p className="text-center text-gray-500 py-20">데이터를 불러올 수 없습니다.</p>;
  }

  const { summary, responses } = data;
  const maxDist = Math.max(...Object.values(summary.distribution), 1);
  const feedbackOnly = responses.filter((r) => r.feedback);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              days === d
                ? "bg-amber-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="전체 응답" value={summary.totalAll} sub="누적" />
        <StatCard
          label="평균 평점"
          value={`${summary.avgRating}`}
          sub={`${RATING_EMOJI[Math.round(summary.avgRating)] || "📊"} ${days}일`}
        />
        <StatCard
          label="솔로 평점"
          value={summary.byType.solo.avg || "-"}
          sub={`${summary.byType.solo.count}건`}
        />
        <StatCard
          label="파티 평점"
          value={summary.byType.party.avg || "-"}
          sub={`${summary.byType.party.count}건`}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "overview"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📊 분포
        </button>
        <button
          onClick={() => setTab("responses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "responses"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          💬 피드백 ({feedbackOnly.length})
        </button>
      </div>

      {tab === "overview" ? (
        /* Rating distribution bar chart */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            평점 분포 (최근 {days}일, {summary.total}건)
          </h3>
          {[5, 4, 3, 2, 1].map((r) => {
            const count = summary.distribution[r] || 0;
            const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
            return (
              <div key={r} className="flex items-center gap-3">
                <span className="w-8 text-center text-lg">{RATING_EMOJI[r]}</span>
                <span className="w-12 text-xs text-gray-500 dark:text-gray-400">{RATING_LABEL[r]}</span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxDist) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  {count}건 ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Feedback list */
        <div className="space-y-2">
          {feedbackOnly.length === 0 ? (
            <p className="text-center text-gray-400 py-10">텍스트 피드백이 없습니다.</p>
          ) : (
            feedbackOnly.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{RATING_EMOJI[r.rating]}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                    {r.play_type === "solo" ? "⚔️ 솔로" : "🎭 파티"}
                  </span>
                  {r.quest_status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.quest_status === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {r.quest_status === "completed" ? "✅ 완료" : "💀 실패"}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-gray-400">
                    {new Date(r.created_at).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{r.feedback}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
