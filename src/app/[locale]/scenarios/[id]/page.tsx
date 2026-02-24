"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { useTranslations, useLocale } from "next-intl";
import type { CommunityScenario, ScenarioGenre } from "@/types/database";
import ReportButton from "@/components/ReportButton";

const GENRE_EMOJI: Record<ScenarioGenre, string> = {
  fantasy: "🗡️", horror: "👻", comedy: "😂", scifi: "🚀",
  mystery: "🔍", romance: "💕", historical: "🏛️", modern: "🏙️", other: "🎲",
};

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Scenarios");
  const locale = useLocale();

  const [scenario, setScenario] = useState<CommunityScenario | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/scenarios/${id}`);
        if (!res.ok) {
          router.push("/scenarios");
          return;
        }
        const data = await res.json();
        setScenario(data.scenario);
        setLiked(data.liked);
        setLikeCount(data.scenario.like_count);
      } catch {
        router.push("/scenarios");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleLike() {
    try {
      const res = await fetch(`/api/scenarios/${id}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/scenarios");
      }
    } catch {
      // ignore
    }
  }

  if (loading || !scenario) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl animate-bounce">🐱</div>
      </div>
    );
  }

  const sd = scenario.scenario_data;
  const displayTitle = locale === "en" && scenario.title_en ? scenario.title_en : scenario.title;
  const displayDesc = locale === "en" && scenario.description_en ? scenario.description_en : scenario.description;

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{GENRE_EMOJI[scenario.genre]}</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{displayTitle}</h1>
            <p className="text-xs text-gray-500">
              {t("by", { name: scenario.creator?.nickname || "???" })}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{displayDesc}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            scenario.difficulty === "easy" ? "bg-green-100 text-green-700" :
            scenario.difficulty === "hard" ? "bg-red-100 text-red-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {t(`difficulty${scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}` as any)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {t(`genre${scenario.genre.charAt(0).toUpperCase() + scenario.genre.slice(1)}` as any)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {t("estimatedTurns", { turns: scenario.estimated_turns })}
          </span>
        </div>

        {/* Stats + actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">▶ {t("plays", { count: scenario.play_count })}</span>
          <button
            onClick={handleLike}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              liked
                ? "bg-pink-50 border-pink-300 text-pink-600"
                : "bg-white border-gray-200 text-gray-500 hover:border-pink-300"
            }`}
          >
            {liked ? "♥" : "♡"} {likeCount}
          </button>
          <div className="ml-auto">
            <ReportButton reportType="scenario" targetId={scenario.id} compact />
          </div>
        </div>

        {/* Tags */}
        {scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scenario.tags.map((tag) => (
              <span key={tag} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scenario details */}
      <div className="space-y-4">
        <Section title={t("detailBackground")} content={sd.background} />
        <Section title={t("detailOpening")} content={sd.opening} />

        {sd.npcs && sd.npcs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{t("detailNpcs")}</h3>
            {sd.npcs.map((npc, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-sm font-medium text-gray-800">{npc.name}</p>
                <p className="text-xs text-gray-500">{npc.description}</p>
              </div>
            ))}
          </div>
        )}

        {sd.keyEvents && sd.keyEvents.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{t("detailEvents")}</h3>
            {sd.keyEvents.map((ev, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs text-amber-600 font-medium">{ev.trigger}</p>
                <p className="text-xs text-gray-500">{ev.description}</p>
              </div>
            ))}
          </div>
        )}

        {sd.possibleEndings && sd.possibleEndings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{t("detailEndings")}</h3>
            {sd.possibleEndings.map((end, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs text-purple-600 font-medium">{end.condition}</p>
                <p className="text-xs text-gray-500">{end.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Play button */}
      <Link
        href="/solo"
        className="block w-full py-4 bg-amber-500 text-white text-center rounded-2xl font-bold text-base hover:bg-amber-600 transition-colors"
      >
        ⚔️ {t("play")}
      </Link>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
    </div>
  );
}
