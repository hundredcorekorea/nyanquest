"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useToast } from "@/components/Toast";
import type { ScenarioContest, ContestEntry, CommunityScenario } from "@/types/database";

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Contest");
  const { toast } = useToast();

  const [contest, setContest] = useState<ScenarioContest | null>(null);
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  const [myEntry, setMyEntry] = useState<ContestEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [myScenarios, setMyScenarios] = useState<CommunityScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [entering, setEntering] = useState(false);
  const [showEnterForm, setShowEnterForm] = useState(false);

  useEffect(() => {
    loadContest();
  }, [id]);

  async function loadContest() {
    try {
      const res = await fetch(`/api/contests/${id}`);
      if (!res.ok) {
        router.push("/scenarios");
        return;
      }
      const data = await res.json();
      setContest(data.contest);
      setEntries(data.entries || []);
      setMyEntry(data.myEntry);
    } catch {
      router.push("/scenarios");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyScenarios() {
    try {
      const res = await fetch("/api/scenarios/mine");
      if (res.ok) {
        const data = await res.json();
        setMyScenarios(data.scenarios || []);
      }
    } catch {
      // ignore
    }
    setShowEnterForm(true);
  }

  async function handleEnter() {
    if (!selectedScenario) {
      toast(t("selectScenario"), "error");
      return;
    }
    setEntering(true);
    try {
      const res = await fetch(`/api/contests/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: selectedScenario }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || t("enterFailed"), "error");
        return;
      }
      toast(t("enterSuccess"), "success");
      setShowEnterForm(false);
      loadContest();
    } catch {
      toast(t("enterFailed"), "error");
    } finally {
      setEntering(false);
    }
  }

  if (loading || !contest) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl animate-bounce">🐱</div>
      </div>
    );
  }

  const title = locale === "en" && contest.title_en ? contest.title_en : contest.title;
  const description = locale === "en" && contest.description_en ? contest.description_en : contest.description;

  const endDate = new Date(contest.end_date);
  const startDate = new Date(contest.start_date);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const statusColor = {
    upcoming: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    ended: "bg-gray-100 text-gray-600",
    finalized: "bg-purple-100 text-purple-700",
  }[contest.status];

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-5">
      {/* Contest Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏆</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                {t(`status${contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}` as any)}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          </div>
        </div>
        <p className="text-sm text-gray-600">{description}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-gray-400">{t("period")}</p>
            <p className="font-bold text-gray-700 mt-1">
              {startDate.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}
              {" ~ "}
              {endDate.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-gray-400">{t("prize")}</p>
            <p className="font-bold text-amber-600 mt-1">
              {t("reward", { months: contest.reward_months })}
            </p>
          </div>
        </div>

        {contest.status === "active" && (
          <div className="text-center text-xs text-orange-600 font-medium">
            ⏰ {t("daysLeft", { days: daysLeft })}
          </div>
        )}

        {/* Genre filter info */}
        {contest.genre_filter && (
          <div className="text-xs text-gray-500 text-center">
            {t("genreRestriction", { genre: contest.genre_filter })}
          </div>
        )}
      </div>

      {/* Enter Contest */}
      {contest.status === "active" && !myEntry && (
        <div className="space-y-3">
          {!showEnterForm ? (
            <button
              onClick={loadMyScenarios}
              className="w-full py-3 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 transition-colors"
            >
              🎯 {t("enterContest")}
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">{t("selectYourScenario")}</h3>
              {myScenarios.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-gray-500">{t("noScenarios")}</p>
                  <Link
                    href="/scenarios/create"
                    className="inline-block px-4 py-2 bg-amber-500 text-white text-xs rounded-xl font-medium"
                  >
                    {t("createFirst")}
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
                  >
                    <option value="">{t("selectScenario")}</option>
                    {myScenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {locale === "en" && s.title_en ? s.title_en : s.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEnterForm(false)}
                      className="flex-1 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={handleEnter}
                      disabled={entering || !selectedScenario}
                      className="flex-1 py-2 bg-amber-500 text-white text-sm rounded-xl font-medium disabled:opacity-50"
                    >
                      {entering ? "..." : t("submitEntry")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* My Entry badge */}
      {myEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-sm">
          ✅ {t("alreadyEntered")}
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">
          🏅 {t("leaderboard")} ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {t("noEntries")}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const scenario = entry.scenario;
              const rank = entry.rank || i + 1;
              const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;
              const scenarioTitle = scenario
                ? (locale === "en" && (scenario as any).title_en ? (scenario as any).title_en : (scenario as any).title)
                : "???";

              return (
                <Link
                  key={entry.id}
                  href={`/scenarios/${entry.scenario_id}` as any}
                  className="block"
                >
                  <div className={`bg-white border rounded-xl p-3 hover:border-amber-300 transition-colors ${
                    rank <= 3 ? "border-amber-200" : "border-gray-200"
                  } ${entry.user_id === myEntry?.user_id ? "ring-2 ring-amber-400" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center font-bold">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {scenarioTitle}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(scenario as any)?.creator?.nickname || "???"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-600">
                          {(entry.score || 0).toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">{t("points")}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoring info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-gray-700">{t("scoringTitle")}</h3>
        <p className="text-xs text-gray-500">
          {t("scoringFormula", {
            likeWeight: contest.like_weight,
            playWeight: contest.play_weight,
          })}
        </p>
      </div>
    </div>
  );
}
