"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFromCookies } from "@/lib/supabase/client";

/**
 * Process referral code stored in localStorage after a new user signs up.
 * Call this in a top-level client component (e.g. /my page or layout).
 */
export function useReferralProcess(
  onSuccess?: (referrerNickname: string) => void
) {
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = localStorage.getItem("nyanquest_referral_code");
    if (!code) return;

    const user = getUserFromCookies();
    if (!user) return;

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;

        // Only process for users created within the last 5 minutes
        const created = new Date(data.created_at);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (created < fiveMinAgo) {
          localStorage.removeItem("nyanquest_referral_code");
          return;
        }

        fetch("/api/referral/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: code }),
        })
          .then((r) => r.json())
          .then((result) => {
            if (result.success && result.referrer_nickname) {
              onSuccess?.(result.referrer_nickname);
            }
          })
          .finally(() => {
            localStorage.removeItem("nyanquest_referral_code");
          });
      });
  }, [onSuccess]);
}
