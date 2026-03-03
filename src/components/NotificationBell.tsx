"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

interface Notification {
  id: string;
  type: string;
  message: string;
  party_id: string | null;
  link_path: string | null;
  is_read: boolean;
  created_at: string;
}

const typeEmoji: Record<string, string> = {
  join_request: "📩",
  join_accepted: "🎉",
  join_rejected: "😿",
  party_status: "📢",
  review_received: "⭐",
  exp_gained: "✨",
  announcement: "📋",
  referral_signup: "🎉",
  referral_premium: "👑",
  round_your_turn: "🎲",
  round_all_submitted: "⚔️",
  contest_winner: "🏆",
  contest_ended: "🏁",
};

/** Parse a notification message that may be JSON {ko,en} or a plain string */
function getLocalizedMessage(message: string, locale: string): string {
  if (message.startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === "object") {
        return (locale === "ko" ? parsed.ko : parsed.en) || parsed.ko || parsed.en || message;
      }
    } catch {
      // Not valid JSON — use raw string
    }
  }
  return message;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations("Notification");
  const tTime = useTranslations("TimeAgo");
  const locale = useLocale();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return tTime("justNow");
    if (minutes < 60) return tTime("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tTime("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return tTime("daysAgo", { count: days });
  }

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  useEffect(() => {
    loadNotifications();
    let interval = setInterval(loadNotifications, 30000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        loadNotifications();
        interval = setInterval(loadNotifications, 30000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);

  const markAllRead = async () => {
    await supabase.rpc("mark_notifications_read", { p_user_id: userId });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-amber-50 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-2 right-2 top-14 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">{t("title")}</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-amber-500 hover:text-amber-600">
                  {t("markAllRead")}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-gray-400">{t("empty")}</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => {
                  const linkHref = n.link_path ?? (n.party_id ? `/party/${n.party_id}` : null);
                  const inner = (
                    <div className="flex gap-2">
                      <span className="text-sm shrink-0">{typeEmoji[n.type] ?? "🐱"}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed">{getLocalizedMessage(n.message, locale)}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  );
                  return (
                    <div
                      key={n.id}
                      className={`block px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                        !n.is_read ? "bg-amber-50/50" : "hover:bg-gray-50"
                      }`}
                    >
                      {linkHref ? (
                        <Link href={linkHref} onClick={() => setOpen(false)} className="block">
                          {inner}
                        </Link>
                      ) : inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
