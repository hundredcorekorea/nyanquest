"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePremium } from "@/hooks/usePremium";

export default function CatMascot() {
  const t = useTranslations("CatMascot");
  const { isPremium, loading } = usePremium();

  const normalMessages = [
    t("msg1"), t("msg2"), t("msg3"), t("msg4"),
    t("msg5"), t("msg6"), t("msg7"),
  ];

  const premiumMessages = [
    t("premiumMsg1"), t("premiumMsg2"), t("premiumMsg3"), t("premiumMsg4"),
    t("premiumMsg5"), t("premiumMsg6"), t("premiumMsg7"),
  ];

  const messages = isPremium ? premiumMessages : normalMessages;
  const [message, setMessage] = useState(normalMessages[0]);

  useEffect(() => {
    if (!loading) {
      const msgs = isPremium ? premiumMessages : normalMessages;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [isPremium, loading]);

  useEffect(() => {
    if (loading) return;
    const msgInterval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 5000);

    return () => clearInterval(msgInterval);
  }, [isPremium, loading]);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 border transition-colors ${
        isPremium
          ? "bg-linear-to-r from-amber-100 via-yellow-50 to-purple-100 border-amber-300"
          : "bg-linear-to-r from-amber-50 to-orange-50 border-amber-100"
      }`}
    >
      <div className="text-5xl shrink-0 select-none" role="img" aria-label="cat mascot">
        <div className="relative">
          <span>🧙‍♂️</span>
          <span className="absolute -bottom-1 -right-1 text-lg">🐱</span>
          {isPremium && (
            <span className="absolute -top-2 -right-2 text-sm">👑</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {isPremium && (
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200/80 rounded-full px-2 py-0.5">
              ⭐ {t("premiumBadge")}
            </span>
          </div>
        )}
        <div
          className={`relative rounded-xl px-4 py-2.5 shadow-sm border flex-1 ${
            isPremium
              ? "bg-white/80 border-amber-200"
              : "bg-white border-amber-100"
          }`}
        >
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-8 border-r-white border-b-[6px] border-b-transparent" />
          <p className={`text-sm font-medium ${isPremium ? "text-amber-800" : "text-gray-700"}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
