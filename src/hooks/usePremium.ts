"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: premium } = await supabase.rpc("is_premium", {
        p_user_id: user.id,
      });
      setIsPremium(!!premium);

      if (premium) {
        // Check for real paid subscription first
        const { data: sub } = await supabase.rpc("get_active_subscription", {
          p_user_id: user.id,
        });
        if (sub && sub.length > 0) {
          setSubscription(sub[0]);
          setIsTrial(false);
        } else {
          // Premium but no subscription = trial user
          const { data: trialData } = await supabase.rpc("get_trial_info", {
            p_user_id: user.id,
          });
          if (trialData && trialData.length > 0 && trialData[0].is_trial) {
            setIsTrial(true);
            setTrialDaysLeft(trialData[0].trial_days_left);
          }
        }
      }

      setLoading(false);
    };
    check();
  }, []);

  return { isPremium, isTrial, trialDaysLeft, subscription, loading };
}
