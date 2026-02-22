"use client";

import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PROMO_APPS } from "@/lib/self-promo";

interface Props {
  open: boolean;
  onClose: () => void;
  /** URL to redirect to after login (defaults to current page) */
  redirectAfterLogin?: string;
}

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|Twitter|Snapchat|SamsungBrowser\/(?!.*Chrome)/i.test(ua);
}

export default function LoginModal({ open, onClose, redirectAfterLogin }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const isKo = locale === "ko";

  if (!open) return null;

  const handleLogin = async (provider: "discord" | "google") => {
    if (isInAppBrowser()) {
      const currentUrl = window.location.href;
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
        return;
      }
      window.open(currentUrl, "_system");
      return;
    }

    const next = redirectAfterLogin ?? window.location.pathname;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 my-auto">
          {/* Header */}
          <div className="bg-gradient-to-b from-amber-50 to-white px-5 pt-5 pb-3 text-center">
            <div className="text-3xl mb-1">🧙‍♂️🐱</div>
            <h3 className="text-base font-bold text-gray-900">
              {t("loginModalTitle")}
            </h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
              {t("hcSubtitle")}
            </p>
            <p className="text-xs text-gray-500 mt-1.5">
              {t("loginModalDesc")}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="px-5 pb-3 space-y-2.5">
            <button
              onClick={() => handleLogin("discord")}
              className="flex items-center justify-center gap-3 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              {t("loginWithDiscord")}
            </button>
            <button
              onClick={() => handleLogin("google")}
              className="flex items-center justify-center gap-3 w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("loginWithGoogle")}
            </button>
          </div>

          {/* HC Apps Section */}
          <div className="px-5 pb-3">
            <div className="bg-amber-50/70 rounded-xl px-3 py-2.5 border border-amber-100">
              <p className="text-[11px] text-amber-700 text-center leading-relaxed mb-1.5">
                {t("hcAppsNote")}
              </p>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                {PROMO_APPS.slice(0, 5).map((app) => (
                  <span key={app.id} className="text-[10px] text-amber-600/70">
                    {app.emoji} {isKo ? app.nameKo : app.nameEn}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Close */}
          <div className="px-5 pb-4">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("loginModalClose")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
