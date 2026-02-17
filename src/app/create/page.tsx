"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { TrpgSystem } from "@/types/database";
import { useToast } from "@/components/Toast";

const STEPS = [
  { label: "시스템", catMsg: "어떤 시스템으로 놀거냥? 🎲" },
  { label: "모집 정보", catMsg: "어떤 모험이냥? 자세히 알려달라냥!" },
  { label: "일정 & 장소", catMsg: "언제 어디서 만나냥? 📅" },
  { label: "확인", catMsg: "다 됐다냥! 확인하고 올리자냥! ✨" },
];

export default function CreatePartyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [systems, setSystems] = useState<TrpgSystem[]>([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
        gm_id: user.id,
        title: form.title,
        content: form.content || null,
        system_id: form.system_id || null,
        custom_system_name: form.custom_system_name || null,
        max_players: form.max_players,
        meeting_type: form.meeting_type,
        discord_invite_url: form.discord_invite_url || null,
        location: form.location || null,
        scheduled_at: form.scheduled_at || null,
      })
      .select("id")
      .single();

    if (error) {
      toast("등록 실패: " + error.message, "error");
      setSubmitting(false);
      return;
    }

    // Auto-add GM as party member + EXP
    if (data) {
      await supabase.from("party_members").insert({
        party_id: data.id,
        user_id: user.id,
        role: "GM",
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
          로그인이 필요하다냥!
        </p>
        <p className="text-sm text-gray-400 mt-1">
          오른쪽 위의 로그인 버튼을 눌러달라냥~
        </p>
      </div>
    );
  }

  const isCustomSystem =
    systems.find((s) => s.id === form.system_id)?.name === "기타 (직접 입력)";

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
            TRPG 시스템
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
              placeholder="시스템 이름을 입력해주세요"
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
              모집글 제목
            </label>
            <input
              type="text"
              placeholder="예: [D&D 5e] 주말 원샷 같이 하실 분!"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세 설명
            </label>
            <textarea
              placeholder="캠페인 설명, 원하는 플레이 스타일, 주의사항 등을 자유롭게 적어주세요."
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모집 인원 (GM 제외)
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
              <span className="text-sm text-gray-400">명</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Schedule & Location */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              진행 방식
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "online", label: "온라인", emoji: "💻" },
                  { value: "offline", label: "오프라인", emoji: "🏠" },
                  { value: "hybrid", label: "하이브리드", emoji: "🔄" },
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
                디스코드 초대 링크 (선택)
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
                오프라인 장소
              </label>
              <input
                type="text"
                placeholder="예: 강남역 OO보드게임카페"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              예정 일시 (선택)
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => update("scheduled_at", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
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
                  "미정"}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                {form.meeting_type === "online"
                  ? "💻 온라인"
                  : form.meeting_type === "offline"
                    ? "🏠 오프라인"
                    : "🔄 하이브리드"}
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                👥 {form.max_players}명 모집
              </span>
            </div>
            {form.scheduled_at && (
              <p className="text-xs text-gray-400">
                📅{" "}
                {new Date(form.scheduled_at).toLocaleDateString("ko-KR", {
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
                🎮 디스코드 링크 첨부됨
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
            이전
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            {submitting ? "등록 중..." : "🐱 모험 올리기!"}
          </button>
        )}
      </div>
    </div>
  );
}
