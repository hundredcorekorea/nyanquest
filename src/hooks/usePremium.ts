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
        const { data: sub } = await supabase.rpc("get_active_subscription", {
          p_user_id: user.id,
        });
        if (sub && sub.length > 0) {
          setSubscription(sub[0]);
        }
      }

      setLoading(false);
    };
    check();
  }, []);

  return { isPremium, subscription, loading };
}
