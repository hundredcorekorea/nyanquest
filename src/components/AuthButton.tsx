"use client";

import { createClient, createAuthClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|Twitter|Snapchat|SamsungBrowser\/(?!.*Chrome)/i.test(ua);
}

export default function AuthButton() {
  const t = useTranslations("Auth");
  const tNav = useTranslations("Nav");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLogin = async (provider: "discord" | "google") => {
    setShowMenu(false);

    if (isInAppBrowser()) {
      const currentUrl = window.location.href;
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
        return;
      }
      window.open(currentUrl, "_system");
      return;
    }

    await createAuthClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  if (user && profile) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 rounded-full px-2.5 py-1.5 transition-colors"
        >
          <span className="text-sm">🐱</span>
          <span className="text-sm font-medium text-amber-900 max-w-20 truncate">
            {profile.nickname}
          </span>
          <span className="text-xs text-amber-600">
            {profile.manner_temp}°
          </span>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 w-40">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push("/my");
              }}
              className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm">🧙</span>
              <span className="text-sm text-gray-700">{tNav("adventurer")}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
            >
              <span className="text-sm">🚪</span>
              <span className="text-sm text-gray-500">{t("logout")}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
      >
        {t("login")}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 w-52">
            <button
              onClick={() => handleLogin("discord")}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{t("discord")}</span>
            </button>
            <button
              onClick={() => handleLogin("google")}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{t("google")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
