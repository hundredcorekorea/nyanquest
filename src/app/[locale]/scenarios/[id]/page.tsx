"use client";

import { useEffect, useState, useCallback } from "react";
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

const GENRES: ScenarioGenre[] = ["fantasy", "horror", "comedy", "scifi", "mystery", "romance", "historical", "modern", "other"];

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
  const [isOwner, setIsOwner] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editGenre, setEditGenre] = useState<ScenarioGenre>("fantasy");
  const [editDifficulty, setEditDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [editTurns, setEditTurns] = useState(20);
  const [editBackground, setEditBackground] = useState("");
  const [editOpening, setEditOpening] = useState("");
  const [editGmInstructions, setEditGmInstructions] = useState("");
  const [editTags, setEditTags] = useState("");

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
        setIsOwner(data.isOwner);
      } catch {
        router.push("/scenarios");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const startEditing = useCallback(() => {
    if (!scenario) return;
    setEditTitle(scenario.title);
    setEditDescription(scenario.description);
    setEditGenre(scenario.genre);
    setEditDifficulty(scenario.difficulty as "easy" | "normal" | "hard");
    setEditTurns(scenario.estimated_turns);
    setEditBackground(scenario.scenario_data.background);
    setEditOpening(scenario.scenario_data.opening);
    setEditGmInstructions(scenario.scenario_data.gmInstructions);
    setEditTags(scenario.tags.join(", "));
    setEditing(true);
  }, [scenario]);

  async function handleSave() {
    if (!editTitle.trim() || !editDescription.trim() || !editBackground.trim() || !editOpening.trim() || !editGmInstructions.trim()) {
      toast(t("fillRequired"), "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          genre: editGenre,
          difficulty: editDifficulty,
          estimated_turns: editTurns,
          scenario_data: {
            background: editBackground.trim(),
            opening: editOpening.trim(),
            gmInstructions: editGmInstructions.trim(),
            npcs: scenario?.scenario_data.npcs,
            keyEvents: scenario?.scenario_data.keyEvents,
            possibleEndings: scenario?.scenario_data.possibleEndings,
          },
          tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        toast(t("editFailed"), "error");
        return;
      }
      toast(t("editSuccess"), "success");
      setEditing(false);
      // Reload data
      const reload = await fetch(`/api/scenarios/${id}`);
      if (reload.ok) {
        const data = await reload.json();
        setScenario(data.scenario);
      }
    } catch {
      toast(t("editFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

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

  async function handleShare() {
    if (!scenario) return;
    const url = `${window.location.origin}/${locale}/scenarios/${id}`;
    const title = locale === "en" && scenario.title_en ? scenario.title_en : scenario.title;
    const desc = locale === "en" && scenario.description_en ? scenario.description_en : scenario.description;
    const shareData = { title, text: desc, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast(t("linkCopied"), "success");
    }
  }

  async function handleDelete() {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast(t("deleteSuccess"), "success");
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

  const sd = locale === "en" && scenario.scenario_data_en ? scenario.scenario_data_en : scenario.scenario_data;
  const displayTitle = locale === "en" && scenario.title_en ? scenario.title_en : scenario.title;
  const displayDesc = locale === "en" && scenario.description_en ? scenario.description_en : scenario.description;
  const isTranslating = scenario.translation_status === "pending";

  // Edit mode UI
  if (editing) {
    return (
      <div className="pb-24 max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{t("editTitle")}</h1>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t("editCancel")}
          </button>
        </div>

        <div className="space-y-4">
          <Field label={t("fieldTitle")} value={editTitle} onChange={setEditTitle} />
          <Field label={t("fieldDescription")} value={editDescription} onChange={setEditDescription} multiline rows={3} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldGenre")}</label>
              <select
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value as ScenarioGenre)}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {t(`genre${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldDifficulty")}</label>
              <select
                value={editDifficulty}
                onChange={(e) => setEditDifficulty(e.target.value as "easy" | "normal" | "hard")}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
              >
                <option value="easy">{t("difficultyEasy")}</option>
                <option value="normal">{t("difficultyNormal")}</option>
                <option value="hard">{t("difficultyHard")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fieldEstimatedTurns")}: {editTurns}
            </label>
            <input
              type="range"
              min={5}
              max={25}
              step={5}
              value={editTurns}
              onChange={(e) => setEditTurns(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <Field label={t("fieldBackground")} value={editBackground} onChange={setEditBackground} multiline rows={5} />
          <Field label={t("fieldOpening")} value={editOpening} onChange={setEditOpening} multiline rows={5} />
          <Field label={t("fieldGmInstructions")} value={editGmInstructions} onChange={setEditGmInstructions} multiline rows={5} />
          <Field label={t("fieldTags")} value={editTags} onChange={setEditTags} placeholder={t("fieldTagsPlaceholder")} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            {t("editCancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-amber-500 text-white text-sm rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? t("editSaving") : t("editSave")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{GENRE_EMOJI[scenario.genre]}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{displayTitle}</h1>
            <p className="text-xs text-gray-500">
              {t("by", { name: scenario.creator?.nickname || "???" })}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{displayDesc}</p>

        {/* Translation status */}
        {isTranslating && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
            <span className="animate-spin">🔄</span>
            {t("translating")}
          </div>
        )}

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
          <button
            onClick={handleShare}
            className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            📤 {t("share")}
          </button>
          <div className="ml-auto">
            <ReportButton reportType="scenario" targetId={scenario.id} compact />
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={startEditing}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
            >
              {t("editButton")}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
            >
              {t("deleteButton")}
            </button>
          </div>
        )}

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

function Field({
  label,
  value,
  onChange,
  multiline,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const cls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows || 3}
          placeholder={placeholder}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
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
