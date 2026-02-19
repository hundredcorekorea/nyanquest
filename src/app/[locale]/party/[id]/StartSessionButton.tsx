"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { PREMIUM_CONFIG } from "@/lib/premium";
import AdGate from "@/components/AdGate";
import { useTranslations } from "next-intl";

interface Props {
  partyId: string;
  creatorId: string;
  useAiGm: boolean;
  playMode: "realtime" | "async";
  partyStatus: "recruiting" | "filled" | "completed" | "cancelled";
}

export default function StartSessionButton({
  partyId,
  creatorId,
  useAiGm,
  playMode,
  partyStatus,
}: Props) {
  const t = useTranslations("PartyDetail");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is a member
      const { data: membership } = await supabase
        .from("party_members")
        .select("id")
        .eq("party_id", partyId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .single();

      if (!membership) {
        setLoading(false);
        return;
      }

      // Check premium status
      const { data: premiumData } = await supabase.rpc("is_premium", {
        p_user_id: user.id,
      });
      setIsPremium(!!premiumData);

      // Check for active session
      const { data: session } = await supabase
        .from("party_sessions")
        .select("id")
        .eq("party_id", partyId)
        .in("status", ["active", "paused"])
        .limit(1)
        .single();

      setHasActiveSession(!!session);
      setLoading(false);
    };
    check();
  }, [partyId, supabase]);

  if (loading || !userId) return null;

  // Check if user is a party member (they need to be to see this button)
  const isCreator = userId === creatorId;

  if (hasActiveSession) {
    return (
      <button
        onClick={() => router.push(`/party/${partyId}/play`)}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-colors"
      >
        {t("joinSession")}
      </button>
    );
  }

  if (!isCreator) return null;
  if (partyStatus === "completed" || partyStatus === "cancelled") return null;

  async function handleStartSession() {
    if (creating) return;
    setCreating(true);

    try {
      // Check weekly AI GM session limit
      if (useAiGm && userId) {
        const { data: weeklyCount } = await supabase.rpc(
          "get_weekly_multi_session_count",
          { p_user_id: userId }
        );
        const { data: premiumStatus } = await supabase.rpc("is_premium", {
          p_user_id: userId,
        });
        const limit = premiumStatus
          ? PREMIUM_CONFIG.premium.weeklyMultiSessionLimit
          : PREMIUM_CONFIG.free.weeklyMultiSessionLimit;

        if ((weeklyCount ?? 0) >= limit) {
          toast(t("weeklyLimitReached"), "error");
          setCreating(false);
          return;
        }
      }

      // Determine total turns based on premium
      const { data: premiumStatus } = await supabase.rpc("is_premium", {
        p_user_id: userId!,
      });
      const totalTurns = premiumStatus
        ? PREMIUM_CONFIG.premium.multiSessionTurns
        : PREMIUM_CONFIG.free.multiSessionTurns;

      const { data: sessionId, error } = await supabase.rpc(
        "create_party_session",
        {
          p_party_id: partyId,
          p_total_turns: totalTurns,
          p_use_ai_gm: useAiGm,
          p_play_mode: playMode,
        }
      );

      if (error) {
        toast(t("sessionCreateFailed", { error: error.message }), "error");
        return;
      }

      toast(t("sessionCreated"), "success");
      router.push(`/party/${partyId}/play`);
    } catch {
      toast(tc("errorOccurred"), "error");
    } finally {
      setCreating(false);
    }
  }

  function handleClick() {
    if (isPremium) {
      handleStartSession();
    } else {
      setShowAdGate(true);
    }
  }

  return (
    <>
      <AdGate
        open={showAdGate}
        onComplete={() => {
          setShowAdGate(false);
          handleStartSession();
        }}
        onCancel={() => setShowAdGate(false)}
      />
      <button
        onClick={handleClick}
        disabled={creating}
        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium text-sm hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50"
      >
        {creating
          ? t("creatingSession")
          : useAiGm
            ? t("startSessionAiGm")
            : t("startSession")}
      </button>
    </>
  );
}
