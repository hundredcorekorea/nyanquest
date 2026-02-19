"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { TrpgSystem, Party } from "@/types/database";
import { useToast } from "@/components/Toast";
import DateTimePicker from "@/components/DateTimePicker";
import { useTranslations } from "next-intl";

export default function EditPartyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations("PartyEdit");
  const tCommon = useTranslations("Common");
  const tMeeting = useTranslations("MeetingType");
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<TrpgSystem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    content: "",
    system_id: "",
    custom_system_name: "",
    max_players: 4,
    meeting_type: "online" as "online" | "offline" | "hybrid",
    discord_invite_url: "",
    location: "",
    scheduled_at: "",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: sysList } = await supabase
        .from("trpg_systems")
        .select("*")
        .order("is_official", { ascending: false });
      if (sysList) setSystems(sysList);

      const { data: party } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (!party || party.creator_id !== user.id) {
        router.push("/my");
        return;
      }

      const p = party as unknown as Party;
      if (p.status !== "recruiting" && p.status !== "filled") {
        toast(t("cannotEditCompleted"), "error");
        router.push(`/party/${id}`);
        return;
      }

      setForm({
        title: p.title,
        content: p.content ?? "",
        system_id: p.system_id ?? "",
        custom_system_name: p.custom_system_name ?? "",
        max_players: p.max_players,
        meeting_type: p.meeting_type,
        discord_invite_url: p.discord_invite_url ?? "",
        location: p.location ?? "",
        scheduled_at: p.scheduled_at
          ? new Date(p.scheduled_at).toISOString().slice(0, 16)
          : "",
      });
      setLoading(false);
    };
    init();
  }, [id]);

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !form.title.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("parties")
      .update({
        title: form.title.trim(),
        content: form.content.trim() || null,
        system_id: form.system_id || null,
        custom_system_name: form.custom_system_name || null,
        max_players: form.max_players,
        meeting_type: form.meeting_type,
        discord_invite_url: form.discord_invite_url || null,
        location: form.location || null,
        scheduled_at: form.scheduled_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast(t("editFailed", { error: error.message }), "error");
      setSubmitting(false);
      return;
    }

    toast(t("editSuccess"));
    router.push(`/party/${id}`);
  };

  if (!user || loading) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-400 mt-2">{tCommon("loading")}</p>
      </div>
    );
  }

  const isCustomSystem =
    systems.find((s) => s.id === form.system_id)?.name === "기타 (직접 입력)";

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/party/${id}/manage`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* System */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("trpgSystem")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {systems.map((sys) => (
            <button
              key={sys.id}
              onClick={() => {
                update("system_id", sys.id);
                if (sys.name !== "기타 (직접 입력)")
                  update("custom_system_name", "");
              }}
              className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                form.system_id === sys.id
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 hover:border-amber-200 text-gray-600"
              }`}
            >
              {sys.is_official && "🎲 "}
              {sys.name}
            </button>
          ))}
        </div>
        {isCustomSystem && (
          <input
            type="text"
            placeholder={t("customSystemPlaceholder")}
            value={form.custom_system_name}
            onChange={(e) => update("custom_system_name", e.target.value)}
            className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
          />
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("postTitle")}
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("description")}
        </label>
        <textarea
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
        />
      </div>

      {/* Max players */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("maxPlayers")}
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              update("max_players", Math.max(1, form.max_players - 1))
            }
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
          >
            -
          </button>
          <span className="text-2xl font-bold text-amber-600 w-10 text-center">
            {form.max_players}
          </span>
          <button
            onClick={() =>
              update("max_players", Math.min(20, form.max_players + 1))
            }
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
          >
            +
          </button>
          <span className="text-sm text-gray-400">{tCommon("personUnit")}</span>
        </div>
      </div>

      {/* Meeting type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("meetingType")}
        </label>
        <div className="flex gap-2">
          {(
            [
              { value: "online", label: tMeeting("online"), emoji: "💻" },
              { value: "offline", label: tMeeting("offline"), emoji: "🏠" },
              { value: "hybrid", label: tMeeting("hybrid"), emoji: "🔄" },
            ] as const
          ).map((type) => (
            <button
              key={type.value}
              onClick={() => update("meeting_type", type.value)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                form.meeting_type === type.value
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 text-gray-500 hover:border-amber-200"
              }`}
            >
              {type.emoji} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discord link */}
      {(form.meeting_type === "online" ||
        form.meeting_type === "hybrid") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("discordLink")}
          </label>
          <input
            type="url"
            placeholder="https://discord.gg/..."
            value={form.discord_invite_url}
            onChange={(e) => update("discord_invite_url", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
          />
        </div>
      )}

      {/* Location */}
      {(form.meeting_type === "offline" ||
        form.meeting_type === "hybrid") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("offlineLocation")}
          </label>
          <input
            type="text"
            placeholder={t("offlineLocationPlaceholder")}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
          />
        </div>
      )}

      {/* Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("scheduledDate")}
        </label>
        <DateTimePicker
          value={form.scheduled_at}
          onChange={(v) => update("scheduled_at", v)}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !form.title.trim()}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? t("editing") : t("submitEdit")}
      </button>
    </div>
  );
}
