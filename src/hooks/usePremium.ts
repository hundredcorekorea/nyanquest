"use client";

import { useEffect, useState } from "react";
import { createClient, getUserFromCookies } from "@/lib/supabase/client";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
}

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [canStartTrial, setCanStartTrial] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const user = getUserFromCookies();
      if (!user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data: premium } = await supabase.rpc("is_premium", {
        p_user_id: user.id,
      });
      setIsPremium(!!premium);

      if (premium) {
        // Check for active subscription (paid or trial)
        const { data: sub } = await supabase.rpc("get_active_subscription", {
          p_user_id: user.id,
        });
        if (sub && sub.length > 0) {
          setSubscription(sub[0]);
          if (sub[0].plan === "trial") {
            setIsTrial(true);
            const { data: trialData } = await supabase.rpc("get_trial_info", {
              p_user_id: user.id,
            });
            if (trialData && trialData.length > 0 && trialData[0].is_trial) {
              setTrialDaysLeft(trialData[0].trial_days_left);
            }
          }
        }
      } else {
        // Not premium - check if they can start a trial
        const { data: canTrial } = await supabase.rpc("can_start_trial", {
          p_user_id: user.id,
        });
        setCanStartTrial(!!canTrial);
      }

      setLoading(false);
    };
    check();
  }, []);

  return { isPremium, isTrial, trialDaysLeft, canStartTrial, subscription, loading };
}
