"use client";

import { Link } from "@/i18n/navigation";
import AuthButton from "./AuthButton";
import NotificationBell from "./NotificationBell";
import { getUserFromCookies } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = getUserFromCookies();
    setUserId(user?.id ?? null);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐱</span>
          <span className="font-bold text-lg text-gray-900">
            nyan<span className="text-amber-500">Quest</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {userId && <NotificationBell userId={userId} />}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
