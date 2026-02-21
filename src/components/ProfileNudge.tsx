"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileNudge() {
  const t = useTranslations("Home");
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (sessionStorage.getItem("nq_nudge_dismissed")) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_works, preferred_elements")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const hasWorks = Array.isArray(profile.favorite_works) && profile.favorite_works.length > 0;
      const hasPreferred = Array.isArray(profile.preferred_elements) && profile.preferred_elements.length > 0;

      if (!hasWorks && !hasPreferred) {
        setShow(true);
      }
    };
    check();
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("nq_nudge_dismissed", "1");
  }

  if (!show || dismissed) return null;

  return (
    <div className="relative bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-start gap-3">
      <span className="text-2xl shrink-0">🐱</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-800">{t("profileNudge")}</p>
        <Link
          href="/my"
          className="inline-block mt-2 text-xs font-medium text-amber-600 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors"
        >
          {t("profileNudgeAction")} →
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="text-amber-300 hover:text-amber-500 text-sm shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
