"use client";

import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PROMO_APPS } from "@/lib/self-promo";
import { useState, useEffect, useRef } from "react";
import { isTossApp, tossLogin } from "@/lib/toss";

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

type EmailMode = null | "login" | "signup" | "forgot" | "check-email" | "reset-sent";

export default function LoginModal({ open, onClose, redirectAfterLogin }: Props) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const isKo = locale === "ko";

  const [emailMode, setEmailMode] = useState<EmailMode>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tossLoading, setTossLoading] = useState(false);
  const tossLoginAttempted = useRef(false);

  // Auto-trigger Toss login when modal opens in Toss environment
  const inToss = typeof window !== "undefined" && isTossApp();

  useEffect(() => {
    if (!open || !inToss || tossLoginAttempted.current) return;
    tossLoginAttempted.current = true;
    handleTossLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inToss]);

  async function handleTossLogin() {
    setTossLoading(true);
    setError("");
    try {
      const result = await tossLogin();
      if (!result) {
        setError("토스 로그인에 실패했습니다");
        setTossLoading(false);
        return;
      }

      const res = await fetch("/api/auth/toss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인 실패");
        setTossLoading(false);
        return;
      }

      // Use the redirect URL to establish Supabase session
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Fallback: reload
      onClose();
      window.location.reload();
    } catch (e) {
      console.error("[Toss Login]", e);
      setError("로그인 중 오류가 발생했습니다");
      setTossLoading(false);
    }
  }

  if (!open) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  };

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      console.error("Login error:", err.message);
      setError(err.message || t("emailLoginFailed"));
      setLoading(false);
      return;
    }

    resetForm();
    setEmailMode(null);
    onClose();
    window.location.reload();
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(t("passwordNeedsLetterDigit"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const next = redirectAfterLogin ?? window.location.pathname;
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmailMode("check-email");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmailMode("reset-sent");
  };

  const handleClose = () => {
    resetForm();
    setEmailMode(null);
    onClose();
  };

  // Email sub-screens
  if (emailMode === "check-email") {
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
        <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
            <div className="px-5 py-8 text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{t("checkEmailTitle")}</h3>
              <p className="text-sm text-gray-500 mb-1">{email}</p>
              <p className="text-xs text-gray-400">{t("checkEmailDesc")}</p>
            </div>
            <div className="px-5 pb-4">
              <button onClick={handleClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("loginModalClose")}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  if (emailMode === "reset-sent") {
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
        <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
            <div className="px-5 py-8 text-center">
              <div className="text-4xl mb-3">🔑</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{t("resetSentTitle")}</h3>
              <p className="text-sm text-gray-500 mb-1">{email}</p>
              <p className="text-xs text-gray-400">{t("resetSentDesc")}</p>
            </div>
            <div className="px-5 pb-4">
              <button onClick={handleClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("loginModalClose")}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  if (emailMode === "forgot") {
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
        <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
            <div className="bg-gradient-to-b from-amber-50 to-white px-5 pt-5 pb-3 text-center">
              <div className="text-3xl mb-1">🔑</div>
              <h3 className="text-base font-bold text-gray-900">{t("forgotPasswordTitle")}</h3>
              <p className="text-xs text-gray-500 mt-1.5">{t("forgotPasswordDesc")}</p>
            </div>
            <form onSubmit={handleForgotPassword} className="px-5 pb-3 space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-medium text-sm transition-colors"
              >
                {loading ? t("sending") : t("sendResetLink")}
              </button>
            </form>
            <div className="px-5 pb-4">
              <button
                onClick={() => { resetForm(); setEmailMode("login"); }}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t("backToLogin")}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  if (emailMode === "login" || emailMode === "signup") {
    const isSignup = emailMode === "signup";
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
        <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
            <div className="bg-gradient-to-b from-amber-50 to-white px-5 pt-5 pb-3 text-center">
              <div className="text-3xl mb-1">{isSignup ? "📝" : "📧"}</div>
              <h3 className="text-base font-bold text-gray-900">
                {isSignup ? t("emailSignupTitle") : t("emailLoginTitle")}
              </h3>
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1.5">{t("emailSignupDesc")}</p>
              )}
            </div>
            <form onSubmit={isSignup ? handleEmailSignup : handleEmailLogin} className="px-5 pb-3 space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
              {isSignup && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                />
              )}
              {isSignup && (
                <p className="text-[11px] text-gray-400">{t("passwordRequirements")}</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-medium text-sm transition-colors"
              >
                {loading
                  ? t("processing")
                  : isSignup ? t("emailSignupBtn") : t("emailLoginBtn")}
              </button>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => { setError(""); setEmailMode("forgot"); }}
                  className="w-full text-xs text-amber-500 hover:text-amber-600 transition-colors"
                >
                  {t("forgotPassword")}
                </button>
              )}
            </form>
            <div className="px-5 pb-2 text-center">
              <button
                onClick={() => { resetForm(); setEmailMode(isSignup ? "login" : "signup"); }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isSignup ? t("haveAccount") : t("noAccount")}
              </button>
            </div>
            <div className="px-5 pb-2">
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400">{t("or")}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
            <div className="px-5 pb-3 space-y-2">
              <button
                onClick={() => handleLogin("discord")}
                className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium text-xs transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Discord
              </button>
              <button
                onClick={() => handleLogin("google")}
                className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium text-xs transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
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
            <div className="px-5 pb-4">
              <button onClick={handleClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("loginModalClose")}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  // Toss environment: show Toss-only login
  if (inToss) {
    return createPortal(
      <>
        <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
        <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
            <div className="bg-gradient-to-b from-blue-50 to-white px-5 pt-5 pb-3 text-center">
              <div className="text-3xl mb-1">🐱</div>
              <h3 className="text-base font-bold text-gray-900">
                {t("loginModalTitle")}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5">
                토스 계정으로 간편 로그인
              </p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {tossLoading ? (
                <div className="text-center py-6">
                  <div className="text-2xl animate-bounce">🔐</div>
                  <p className="text-sm text-gray-500 mt-2">토스 로그인 중...</p>
                </div>
              ) : (
                <>
                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                  <button
                    onClick={() => { tossLoginAttempted.current = false; handleTossLogin(); }}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    토스로 계속하기
                  </button>
                </>
              )}
              <button onClick={handleClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {t("loginModalClose")}
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  // Default: OAuth + email option
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-9998" onClick={handleClose} />
      <div className="fixed inset-0 z-9999 flex justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200 m-auto shrink-0">
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

            {/* Divider */}
            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400">{t("or")}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email login button */}
            <button
              onClick={() => setEmailMode("login")}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {t("loginWithEmail")}
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
              onClick={handleClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t("loginModalClose")}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
