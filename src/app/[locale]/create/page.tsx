"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { TrpgSystem } from "@/types/database";
import { useToast } from "@/components/Toast";
import DateTimePicker from "@/components/DateTimePicker";
import { useTranslations, useLocale } from "next-intl";

const CUSTOM_SYSTEM_NAME = "기타 (직접 입력)";

export default function CreatePartyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations("CreateParty");
  const tCommon = useTranslations("Common");
  const tMeeting = useTranslations("MeetingType");
  const locale = useLocale();
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<TrpgSystem[]>([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const STEPS = [
    { label: t("steps.system"), catMsg: t("steps.systemCatMsg") },
    { label: t("steps.info"), catMsg: t("steps.infoCatMsg") },
    { label: t("steps.schedule"), catMsg: t("steps.scheduleCatMsg") },
    { label: t("steps.confirm"), catMsg: t("steps.confirmCatMsg") },
  ];

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
    creator_role: "GM" as "GM" | "PL",
    use_ai_gm: false,
    play_mode: "realtime" as "realtime" | "async",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase
        .from("trpg_systems")
        .select("*")
        .order("is_official", { ascending: false });
      if (data) setSystems(data);
    };
    init();
  }, []);

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return form.system_id || form.custom_system_name;
      case 1:
        return form.title.trim().length >= 2;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("parties")
      .insert({
        creator_id: user.id,
        gm_id: form.use_ai_gm ? null : form.creator_role === "GM" ? user.id : null,
        title: form.title,
        content: form.content || null,
        system_id: form.system_id || null,
        custom_system_name: form.custom_system_name || null,
        max_players: form.max_players,
        meeting_type: form.meeting_type,
        discord_invite_url: form.discord_invite_url || null,
        location: form.location || null,
        scheduled_at: form.scheduled_at || null,
        use_ai_gm: form.use_ai_gm,
        play_mode: form.play_mode,
      })
      .select("id")
      .single();

    if (error) {
      toast(t("submitFailed", { error: error.message }), "error");
      setSubmitting(false);
      return;
    }

    // Auto-add creator as party member + EXP
    if (data) {
      await supabase.from("party_members").insert({
        party_id: data.id,
        user_id: user.id,
        role: form.use_ai_gm ? "PL" : form.creator_role,
        status: "accepted",
      });
      // +10 EXP for creating a party
      await supabase.rpc("add_exp", { p_user_id: user.id, p_amount: 10 });
      router.push(`/party/${data.id}`);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-600 font-medium">
          {tCommon("loginRequired")}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {tCommon("loginRequiredDesc")}
        </p>
      </div>
    );
  }

  const isCustomSystem =
    systems.find((s) => s.id === form.system_id)?.name === CUSTOM_SYSTEM_NAME;

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-amber-400" : "bg-gray-200"
              }`}
            />
            <p
              className={`text-xs mt-1 ${
                i === step ? "text-amber-600 font-medium" : "text-gray-400"
              }`}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Cat guide */}
      <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 mb-6">
        <span className="text-3xl">😺</span>
        <p className="text-sm text-amber-800 font-medium">
          {STEPS[step].catMsg}
        </p>
      </div>

      {/* Step 0: System */}
      {step === 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            {t("trpgSystem")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {systems.map((sys) => (
              <button
                key={sys.id}
                onClick={() => {
                  update("system_id", sys.id);
                  if (sys.name !== CUSTOM_SYSTEM_NAME)
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
            />
          )}
        </div>
      )}

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("postTitle")}
            </label>
            <input
              type="text"
              placeholder={t("postTitlePlaceholder")}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("description")}
            </label>
            <textarea
              placeholder={t("descriptionPlaceholder")}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none"
            />
          </div>
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
                  update(
                    "max_players",
                    Math.min(form.use_ai_gm ? 4 : 20, form.max_players + 1)
                  )
                }
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50"
              >
                +
              </button>
              <span className="text-sm text-gray-400">{tCommon("personUnit")}</span>
            </div>
          </div>

          {/* AI GM toggle */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  🧙‍♂️ {t("useAiGm")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("aiGmDesc")}
                </p>
              </div>
              <button
                onClick={() => {
                  const newVal = !form.use_ai_gm;
                  setForm((prev) => ({
                    ...prev,
                    use_ai_gm: newVal,
                    creator_role: newVal ? "PL" : prev.creator_role,
                    max_players: newVal
                      ? Math.min(prev.max_players, 4)
                      : prev.max_players,
                  }));
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  form.use_ai_gm ? "bg-amber-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    form.use_ai_gm ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {form.use_ai_gm && (
              <p className="text-xs text-amber-600 mt-2">
                {t("aiGmMaxPlayers")}
              </p>
            )}
          </div>

          {/* Play mode (only when AI GM enabled) */}
          {form.use_ai_gm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("playMode")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => update("play_mode", "realtime")}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    form.play_mode === "realtime"
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-500 hover:border-amber-200"
                  }`}
                >
                  {`⚡ ${t("realtime")}`}
                </button>
                <button
                  onClick={() => update("play_mode", "async")}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    form.play_mode === "async"
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-purple-200"
                  }`}
                >
                  {`📝 ${t("async")}`}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {form.play_mode === "realtime"
                  ? t("realtimeDesc")
                  : t("asyncDesc")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schedule & Location */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("myRole")}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => update("creator_role", "GM")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                  form.creator_role === "GM"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-500 hover:border-amber-200"
                }`}
              >
                {`🧙 ${t("joinAsGm")}`}
              </button>
              <button
                onClick={() => update("creator_role", "PL")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                  form.creator_role === "PL"
                    ? "border-purple-400 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-500 hover:border-purple-200"
                }`}
              >
                {`⚔️ ${t("joinAsPl")}`}
              </button>
            </div>
            {form.creator_role === "PL" && (
              <p className="text-xs text-purple-500 mt-1.5">
                {t("gmRecruitNote")}
              </p>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("scheduledDate")}
            </label>
            <DateTimePicker
              value={form.scheduled_at}
              onChange={(v) => update("scheduled_at", v)}
            />
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-amber-100 p-5 space-y-3">
            <h3 className="font-bold text-lg text-gray-900">{form.title}</h3>
            {form.content && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {form.content}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
                🎲{" "}
                {systems.find((s) => s.id === form.system_id)?.name ??
                  form.custom_system_name ??
                  tCommon("undecided")}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                {form.meeting_type === "online"
                  ? `💻 ${tMeeting("online")}`
                  : form.meeting_type === "offline"
                    ? `🏠 ${tMeeting("offline")}`
                    : `🔄 ${tMeeting("hybrid")}`}
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                👥 {t("recruitCount", { count: form.max_players })}
              </span>
              {form.use_ai_gm && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                  🧙‍♂️ AI GM
                </span>
              )}
              {form.use_ai_gm && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                  {form.play_mode === "realtime" ? `⚡ ${t("realtime")}` : `📝 ${t("async")}`}
                </span>
              )}
              {!form.use_ai_gm && form.creator_role === "PL" && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                  {`🎲 ${t("gmRecruiting")}`}
                </span>
              )}
            </div>
            {form.scheduled_at && (
              <p className="text-xs text-gray-400">
                📅{" "}
                {new Date(form.scheduled_at).toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {form.discord_invite_url && (
              <p className="text-xs text-indigo-500">
                🎮 Discord
              </p>
            )}
            {form.location && (
              <p className="text-xs text-gray-500">📍 {form.location}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {tCommon("previous")}
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {tCommon("next")}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            {submitting ? tCommon("submitting") : `🐱 ${t("submitParty")}`}
          </button>
        )}
      </div>
    </div>
  );
}
