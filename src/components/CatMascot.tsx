"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function CatMascot() {
  const t = useTranslations("CatMascot");
  const messages = [
    t("msg1"), t("msg2"), t("msg3"), t("msg4"),
    t("msg5"), t("msg6"), t("msg7"),
  ];

  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 5000);

    return () => clearInterval(msgInterval);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
      <div className="text-5xl shrink-0 select-none" role="img" aria-label="cat mascot">
        <div className="relative">
          <span>🧙‍♂️</span>
          <span className="absolute -bottom-1 -right-1 text-lg">🐱</span>
        </div>
      </div>
      <div className="relative bg-white rounded-xl px-4 py-2.5 shadow-sm border border-amber-100 flex-1">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-8 border-r-white border-b-[6px] border-b-transparent" />
        <p className="text-sm text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
