"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { getTitleDef } from "@/lib/titles";

interface Props {
  questId: string;
  turnCount: number;
  isPremium: boolean;
  isFailed?: boolean;
}

export default function QuestComplete({ questId, turnCount, isPremium, isFailed = false }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [expAmount, setExpAmount] = useState(0);
  const [newTitles, setNewTitles] = useState<string[]>([]);

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
