"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { PREMIUM_CONFIG } from "@/lib/premium";
import { getTitleDef } from "@/lib/titles";

interface Props {
  questId: string;
  turnCount: number;
  isPremium: boolean;
}

export default function QuestComplete({ questId, turnCount, isPremium }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const tQuest = useTranslations("SoloQuest");
  const tCommon = useTranslations("Common");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [expAmount, setExpAmount] = useState(0);
  const [newTitles, setNewTitles] = useState<string[]>([]);

  async function claimReward(withAd: boolean) {
    if (claiming || claimed) return;
    setClaiming(true);

    try {
      const baseExp = withAd ? 30 : 15;
      const multiplier = isPremium ? PREMIUM_CONFIG.premium.expMultiplier : PREMIUM_CONFIG.free.expMultiplier;
      const exp = Math.round(baseExp * multiplier);
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

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 text-center space-y-4 animate-bubble-in">
      <div className="text-5xl">🎉</div>
      <h2 className="text-lg font-bold text-gray-900">{tQuest("questComplete")}</h2>
      <p className="text-sm text-gray-600">
        {tQuest("questCompleteDesc", { turnCount })}
      </p>

      {!claimed ? (
        <div className="space-y-3">
          <button
            onClick={() => claimReward(false)}
            disabled={claiming}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {claiming ? tCommon("processing") : isPremium ? tQuest("claimExpPremiumBonus", { exp: Math.round(15 * PREMIUM_CONFIG.premium.expMultiplier) }) : tQuest("claimExpBase", { exp: 15 })}
          </button>
          <button
            onClick={() => claimReward(true)}
            disabled={claiming}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
          >
            {claiming ? tCommon("processing") : tQuest("claimExpAd", { exp: isPremium ? Math.round(30 * PREMIUM_CONFIG.premium.expMultiplier) : 30 })}
          </button>
          <p className="text-xs text-gray-400">
            {tQuest("adComingSoon")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-2xl font-bold text-amber-600">
            +{expAmount} EXP
          </div>
          {newTitles.length > 0 && (
            <div className="bg-white/60 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-amber-700">{tQuest("newTitleEarned")}</p>
              {newTitles.map((titleId) => {
                const t = getTitleDef(titleId);
                return t ? (
                  <p key={titleId} className="text-sm">
                    {t.emoji} <span className="font-medium">{t.name}</span>
                  </p>
                ) : null;
              })}
            </div>
          )}
          <button
            onClick={() => router.push("/solo")}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
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
