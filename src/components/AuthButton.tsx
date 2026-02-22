"use client";

import { createClient, getUserFromCookies } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import LoginModal from "./LoginModal";

export default function AuthButton() {
  const t = useTranslations("Auth");
  const tNav = useTranslations("Nav");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Read user from cookies directly (bypasses getUser() hang)
    const cookieUser = getUserFromCookies();
    setUser(cookieUser);

    if (cookieUser) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", cookieUser.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
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

  const handleLogout = async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.reload();
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
    <>
      <button
        onClick={() => setShowLoginModal(true)}
        className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
      >
        {t("login")}
      </button>
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
