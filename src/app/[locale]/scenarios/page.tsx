"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { CommunityScenario, ScenarioGenre, ScenarioContest } from "@/types/database";

const GENRES: ScenarioGenre[] = ["fantasy", "horror", "comedy", "scifi", "mystery", "romance", "historical", "modern", "other"];
const GENRE_EMOJI: Record<ScenarioGenre, string> = {
  fantasy: "🗡️", horror: "👻", comedy: "😂", scifi: "🚀",
  mystery: "🔍", romance: "💕", historical: "🏛️", modern: "🏙️", other: "🎲",
};

type SortMode = "popular" | "liked" | "recent";

export default function ScenariosPage() {
  const t = useTranslations("Scenarios");
  const tc = useTranslations("Contest");
  const locale = useLocale();
  const [scenarios, setScenarios] = useState<CommunityScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("popular");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeContest, setActiveContest] = useState<ScenarioContest | null>(null);

  useEffect(() => {
    // Fetch active contest
    fetch("/api/contests")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.contests || []).find(
          (c: ScenarioContest) => c.status === "active" || c.status === "upcoming"
        );
        if (active) setActiveContest(active);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchScenarios(1, true);
  }, [genre, sort]);

  async function fetchScenarios(p: number, replace = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page: p.toString() });
      if (genre !== "all") params.set("genre", genre);
      const res = await fetch(`/api/scenarios?${params}`);
      const data = await res.json();
      setScenarios(prev => replace ? data.scenarios : [...prev, ...data.scenarios]);
      setHasMore(data.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchScenarios(next);
  }

  const contestTitle = locale === "en" && activeContest?.title_en ? activeContest.title_en : activeContest?.title;
  const contestDesc = locale === "en" && activeContest?.description_en ? activeContest.description_en : activeContest?.description;

  return (
    <div className="pb-24 space-y-4">
      {/* Contest Banner */}
      {activeContest && (
        <Link href={`/scenarios/contest/${activeContest.id}` as any} className="block">
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {activeContest.status === "active" ? tc("statusActive") : tc("statusUpcoming")}
                  </span>
                </div>
                <h3 className="font-bold text-sm mt-1">{contestTitle}</h3>
                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{contestDesc}</p>
                <p className="text-xs text-white/70 mt-1">
                  🎁 {tc("reward", { months: activeContest.reward_months })} · Top {activeContest.winner_count}
                </p>
              </div>
              <span className="text-xl">→</span>
            </div>
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>
        <Link
          href="/scenarios/create"
          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl font-medium hover:bg-amber-600 transition-colors"
        >
          {t("create")}
        </Link>
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setGenre("all")}
          className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${
            genre === "all" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
          }`}
        >
          {t("filterAll")}
        </button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${
              genre === g ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}
          >
            {GENRE_EMOJI[g]} {t(`genre${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        {(["popular", "liked", "recent"] as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              sort === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t(`sort${s.charAt(0).toUpperCase() + s.slice(1)}` as any)}
          </button>
        ))}
      </div>

      {/* Scenario list */}
      {loading && scenarios.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl animate-bounce">🐱</div>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="text-5xl">📜</div>
          <p className="text-gray-500 font-medium">{t("empty")}</p>
          <p className="text-sm text-gray-400">{t("emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <Link key={s.id} href={`/scenarios/${s.id}` as any} className="block">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-amber-300 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{GENRE_EMOJI[s.genre]}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {locale === "en" && s.title_en ? s.title_en : s.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {t("by", { name: s.creator?.nickname || "???" })}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                    s.difficulty === "easy" ? "bg-green-100 text-green-700" :
                    s.difficulty === "hard" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {t(`difficulty${s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}` as any)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {locale === "en" && s.description_en ? s.description_en : s.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>▶ {t("plays", { count: s.play_count })}</span>
                  <span>♥ {t("likes", { count: s.like_count })}</span>
                  <span>{t("estimatedTurns", { turns: s.estimated_turns })}</span>
                </div>
              </div>
            </Link>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-amber-600 font-medium hover:bg-amber-50 rounded-xl transition-colors"
            >
              {loading ? "..." : t("loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
