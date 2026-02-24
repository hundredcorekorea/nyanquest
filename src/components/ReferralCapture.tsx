"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[A-Za-z0-9]{6,8}$/.test(ref)) {
      localStorage.setItem("nyanquest_referral_code", ref.toUpperCase());
    }
  }, [searchParams]);

  return null;
}
