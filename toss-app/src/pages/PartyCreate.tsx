import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { tossHaptic } from "../lib/toss";
import { SCENARIOS } from "../lib/scenarios";
import type { Profile } from "../types";

interface Props {
  profile: Profile | null;
}

export default function PartyCreate({ profile }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playMode, setPlayMode] = useState<"realtime" | "async">("realtime");
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const freeScenarios = SCENARIOS.filter((s) => !s.isPremium);

  async function handleCreate() {
    if (!profile || isCreating) return;
    setIsCreating(true);

    try {
      const { data: party, error } = await supabase
        .from("parties")
        .insert({
          creator_id: profile.id,
          title: title || "AI GM 파티",
          content: scenarioId
            ? `${SCENARIOS.find((s) => s.id === scenarioId)?.titleKo} 시나리오로 모험!`
            : "자유 모험 파티! AI GM과 함께하는 TRPG 세션",
          scenario_id: scenarioId,
          max_players: maxPlayers,
          current_players: 1,
          use_ai_gm: true,
          play_mode: playMode,
          status: "recruiting",
          language: "ko",
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase.from("party_members").insert({
        party_id: party.id,
        user_id: profile.id,
        role: "PL",
        status: "accepted",
      });

      tossHaptic("success");
      navigate(`/party/${party.id}`);
    } catch (e) {
      console.error("Party creation failed:", e);
      alert("파티 생성에 실패했다냥...");
    } finally {
      setIsCreating(false);
    }
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-(--tds-text-secondary) text-sm">
        로그인이 필요하다냥...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-(--tds-text)">🤖 AI GM 파티 만들기</h1>

      {step === 1 ? (
        <>
          {/* Title */}
          <div>
            <label className="text-xs text-(--tds-text-secondary) mb-1.5 block">파티 이름</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 금요일 밤 던전 탐험!"
              maxLength={50}
              className="w-full bg-(--tds-bg-card) text-(--tds-text) text-sm rounded-xl px-3.5 py-2.5 outline-none border border-(--tds-border) focus:border-(--tds-blue-dim) placeholder:text-(--tds-text-muted)"
            />
          </div>

          {/* Max players */}
          <div>
            <label className="text-xs text-(--tds-text-secondary) mb-1.5 block">최대 인원</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${
                    maxPlayers === n
                      ? "bg-(--tds-blue-bg) border-(--tds-blue-dim) text-(--tds-blue)"
                      : "bg-(--tds-bg-card) border-(--tds-border) text-(--tds-text-secondary)"
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>

          {/* Play mode */}
          <div>
            <label className="text-xs text-(--tds-text-secondary) mb-1.5 block">플레이 방식</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPlayMode("realtime")}
                className={`flex-1 py-3 text-sm rounded-xl border transition-colors ${
                  playMode === "realtime"
                    ? "bg-(--tds-blue-bg) border-(--tds-blue-dim) text-(--tds-blue)"
                    : "bg-(--tds-bg-card) border-(--tds-border) text-(--tds-text-secondary)"
                }`}
              >
                <span className="block text-base mb-0.5">⚡</span>
                실시간
                <span className="block text-[10px] text-(--tds-text-muted) mt-0.5">모두 동시에 플레이</span>
              </button>
              <button
                onClick={() => setPlayMode("async")}
                className={`flex-1 py-3 text-sm rounded-xl border transition-colors ${
                  playMode === "async"
                    ? "bg-(--tds-blue-bg) border-(--tds-blue-dim) text-(--tds-blue)"
                    : "bg-(--tds-bg-card) border-(--tds-border) text-(--tds-text-secondary)"
                }`}
              >
                <span className="block text-base mb-0.5">🔄</span>
                비동기
                <span className="block text-[10px] text-(--tds-text-muted) mt-0.5">각자 편한 시간에</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-(--tds-blue) text-(--tds-text) rounded-xl font-medium active:scale-[0.98] transition-transform"
          >
            다음 →
          </button>
        </>
      ) : (
        <>
          {/* Scenario selection */}
          <div>
            <label className="text-xs text-(--tds-text-secondary) mb-1.5 block">시나리오 선택 (선택사항)</label>
            <button
              onClick={() => setScenarioId(null)}
              className={`w-full mb-2 py-3 text-sm rounded-xl border text-left px-4 transition-colors ${
                !scenarioId
                  ? "bg-(--tds-blue-bg) border-(--tds-blue-dim) text-(--tds-blue)"
                  : "bg-(--tds-bg-card) border-(--tds-border) text-(--tds-text-secondary)"
              }`}
            >
              🎲 자유 모험 (AI GM이 즉흥으로 진행)
            </button>

            <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
              {freeScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`w-full py-2.5 text-sm rounded-xl border text-left px-4 flex items-center gap-2.5 transition-colors ${
                    scenarioId === s.id
                      ? "bg-(--tds-blue-bg) border-(--tds-blue-dim) text-(--tds-blue)"
                      : "bg-(--tds-bg-card) border-(--tds-border) text-(--tds-text-secondary)"
                  }`}
                >
                  <span className="text-lg">{s.thumbnailEmoji}</span>
                  <div>
                    <span className="block">{s.titleKo}</span>
                    <span className="text-[10px] text-(--tds-text-muted)">{s.genre}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-(--tds-bg-card) text-(--tds-text) rounded-xl text-sm"
            >
              ← 이전
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 py-3 bg-(--tds-blue) text-(--tds-text) rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isCreating ? "생성 중..." : "파티 만들기 🎉"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
