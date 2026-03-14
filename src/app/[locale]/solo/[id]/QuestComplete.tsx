"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { getTitleDef } from "@/lib/titles";
import { tossSubmitScore } from "@/lib/toss";
import PostGameSurvey from "@/components/PostGameSurvey";

const REWIND_COST = 50; // EXP cost to rewrite fate

// Show survey at milestone play counts (first survey handled by 0-response check)
const SURVEY_TRIGGERS = new Set([7, 15, 25, 50, 100]);

interface Props {
  questId: string;
  scenarioId?: string;
  scenarioTitle?: string;
  turnCount: number;
  isPremium: boolean;
  isFailed?: boolean;
  /** If > 0, EXP was already claimed (re-entry guard) */
  alreadyClaimedExp?: number;
  /** Callback to rewind the quest to the last player choice */
  onRewind?: () => void;
  /** Callback to open the session share card */
  onShare?: () => void;
}

export default function QuestComplete({ questId, scenarioId, scenarioTitle, turnCount, isPremium, isFailed = false, alreadyClaimedExp = 0, onRewind, onShare }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(alreadyClaimedExp > 0);
  const [expAmount, setExpAmount] = useState(alreadyClaimedExp);
  const [newTitles, setNewTitles] = useState<string[]>([]);
  const [rewinding, setRewinding] = useState(false);
  const [userExp, setUserExp] = useState<number | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyDismissed, setSurveyDismissed] = useState(false);

  // Fetch user EXP + check survey eligibility on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("cat_exp")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setUserExp(data?.cat_exp ?? 0));

      // Survey trigger: show if never responded OR at milestone play counts
      Promise.all([
        supabase
          .from("survey_responses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("solo_quests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["completed", "failed"]),
      ]).then(([surveyRes, questRes]) => {
        const surveyCount = surveyRes.count ?? 0;
        const questCount = questRes.count ?? 0;
        if (surveyCount === 0 || SURVEY_TRIGGERS.has(questCount)) {
          setShowSurvey(true);
        }
      });
    });
  }, []);

  async function handleRewind() {
    if (rewinding || !onRewind) return;
    setRewinding(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deduct EXP
      const { error } = await supabase.rpc("add_exp", {
        p_user_id: user.id,
        p_amount: -REWIND_COST,
      });
      if (error) {
        toast(tQuest("rewindFailed") ?? "EXP가 부족합니다", "error");
        return;
      }

      // Reset quest status back to in_progress
      await supabase
        .from("solo_quests")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", questId);

      toast(tQuest("rewindSuccess") ?? "운명을 다시 쓴다냥!", "success");
      onRewind();
    } catch {
      toast(tCommon("errorOccurred"), "error");
    } finally {
      setRewinding(false);
    }
  }

  // Failed quests give reduced EXP (60%)
  const expMultiplier = isFailed ? 0.6 : 1;

  async function claimReward(withAd: boolean) {
    if (claiming || claimed) return;
    setClaiming(true);

    try {
      const baseExp = withAd ? 30 : 15;
      const premiumMul = isPremium ? PREMIUM_CONFIG.premium.expMultiplier : PREMIUM_CONFIG.free.expMultiplier;
      const exp = Math.round(baseExp * premiumMul * expMultiplier);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("complete_solo_quest", {
        p_quest_id: questId,
        p_user_id: user.id,
        p_exp_amount: exp,
      });

      if (error) {
        toast(tQuest("rewardClaimFailed"), "error");
        return;
      }

      setExpAmount(exp);
      setClaimed(true);
      toast(tQuest("expGained", { exp }), "success");

      // Submit total EXP to Toss leaderboard
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("cat_exp")
        .eq("id", user.id)
        .single();
      if (freshProfile) {
        tossSubmitScore(freshProfile.cat_exp);
      }

      // Check for new title unlocks
      const { data: titles } = await supabase.rpc("check_titles", { p_user_id: user.id });
      if (titles && titles.length > 0) {
        setNewTitles(titles);
      }
    } catch {
      toast(tCommon("errorOccurred"), "error");
    } finally {
      setClaiming(false);
    }
  }

  const baseExpNormal = Math.round(15 * (isPremium ? PREMIUM_CONFIG.premium.expMultiplier : 1) * expMultiplier);
  const baseExpAd = Math.round(30 * (isPremium ? PREMIUM_CONFIG.premium.expMultiplier : 1) * expMultiplier);

  return (
    <div className={`rounded-2xl border p-6 text-center space-y-4 animate-bubble-in ${
      isFailed
        ? "bg-linear-to-br from-slate-100 to-gray-200 border-gray-300"
        : "bg-linear-to-br from-amber-50 to-orange-50 border-amber-200"
    }`}>
      <div className="text-5xl">{isFailed ? "💀" : "🎉"}</div>
      <h2 className={`text-lg font-bold ${isFailed ? "text-gray-700" : "text-gray-900"}`}>
        {isFailed ? tQuest("questFailed") : tQuest("questComplete")}
      </h2>
      <p className="text-sm text-gray-600">
        {isFailed
          ? tQuest("questFailedDesc", { turnCount })
          : tQuest("questCompleteDesc", { turnCount })}
      </p>

      {/* Rewind option for failed quests */}
      {isFailed && !claimed && onRewind && userExp !== null && userExp >= REWIND_COST && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-purple-800">
            {tQuest("rewindTitle") ?? "운명을 다시 쓸까냥?"}
          </p>
          <p className="text-xs text-purple-600">
            {tQuest("rewindDesc", { cost: REWIND_COST }) ?? `${REWIND_COST} EXP를 소모해 마지막 선택으로 되돌아갑니다`}
          </p>
          <button
            onClick={handleRewind}
            disabled={rewinding}
            className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {rewinding ? tCommon("processing") : `⏪ ${tQuest("rewindButton") ?? "운명 다시쓰기"} (-${REWIND_COST} EXP)`}
          </button>
          <p className="text-[10px] text-purple-400 text-center">
            {tQuest("currentExp") ?? "보유"}: {userExp.toLocaleString()} EXP
          </p>
        </div>
      )}

      {!claimed ? (
        <div className="space-y-3">
          <button
            onClick={() => claimReward(false)}
            disabled={claiming}
            className={`w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${
              isFailed
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {claiming ? tCommon("processing") : isPremium
              ? tQuest("claimExpPremiumBonus", { exp: baseExpNormal })
              : tQuest("claimExpBase", { exp: baseExpNormal })}
          </button>
          <button
            onClick={() => claimReward(true)}
            disabled={claiming}
            className={`w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${
              isFailed
                ? "bg-linear-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                : "bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }`}
          >
            {claiming ? tCommon("processing") : tQuest("claimExpAd", { exp: baseExpAd })}
          </button>
          <p className="text-xs text-gray-400">
            {tQuest("adComingSoon")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`text-2xl font-bold ${isFailed ? "text-gray-600" : "text-amber-600"}`}>
            +{expAmount} EXP
          </div>
          {newTitles.length > 0 && (
            <div className="bg-white/60 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-amber-700">{tQuest("newTitleEarned")}</p>
              {newTitles.map((titleId) => {
                const td = getTitleDef(titleId);
                return td ? (
                  <p key={titleId} className="text-sm">
                    {td.emoji} <span className="font-medium">{locale === "ko" ? td.name : td.nameEn}</span>
                  </p>
                ) : null;
              })}
            </div>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="w-full py-3 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              📸 {tQuest("shareSessionCard") ?? "모험 기록 카드 만들기"}
            </button>
          )}
          {/* Share buttons: Guild Hall + SNS */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const title = isFailed
                  ? tQuest("shareAdventureFailTitle", { scenario: scenarioTitle || "Quest" })
                  : tQuest("shareAdventureTitle", { scenario: scenarioTitle || "Quest" });
                const status = isFailed ? (locale === "ko" ? "실패" : "Failed") : (locale === "ko" ? "성공" : "Cleared");
                const content = tQuest("shareAdventureBody", { turnCount, status });
                const params = new URLSearchParams({ category: "adventure", title, content });
                router.push(`/community/write?${params.toString()}`);
              }}
              className="flex-1 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              🏰 {tQuest("shareToGuildHall") ?? "길드홀에 공유"}
            </button>
            <button
              onClick={async () => {
                const title = isFailed
                  ? tQuest("shareAdventureFailTitle", { scenario: scenarioTitle || "Quest" })
                  : tQuest("shareAdventureTitle", { scenario: scenarioTitle || "Quest" });
                const status = isFailed ? (locale === "ko" ? "실패" : "Failed") : (locale === "ko" ? "성공" : "Cleared");
                const text = `${title}\n🎲 ${turnCount} ${locale === "ko" ? "턴" : "turns"} | ${status}\n\n#냥퀘스트 #nyanQuest #CozyRPG`;
                const url = `https://nyanquest.com/${locale}/solo`;
                if (navigator.share) {
                  try {
                    await navigator.share({ title, text, url });
                  } catch { /* user cancelled */ }
                } else {
                  await navigator.clipboard.writeText(`${text}\n${url}`);
                  toast(tQuest("shareCopied") ?? "링크가 복사되었다냥!", "success");
                }
              }}
              className="flex-1 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              🔗 {tQuest("shareToSns") ?? "SNS에 공유"}
            </button>
          </div>
          {showSurvey && !surveyDismissed && (
            <PostGameSurvey
              questId={questId}
              scenarioId={scenarioId}
              playType="solo"
              questStatus={isFailed ? "failed" : "completed"}
              onClose={() => setSurveyDismissed(true)}
            />
          )}
          <button
            onClick={() => router.push("/solo")}
            className={`w-full py-3 text-white rounded-xl font-medium transition-colors ${
              isFailed ? "bg-gray-500 hover:bg-gray-600" : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {tQuest("returnToTraining")}
          </button>
          <button
            onClick={() => router.push("/my")}
            className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            {tQuest("viewProfile")}
          </button>
        </div>
      )}
    </div>
  );
}
