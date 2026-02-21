"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LoginModal from "@/components/LoginModal";

export default function LoginBanner() {
  const t = useTranslations("Solo");
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        className="w-full text-center bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl p-6 transition-colors"
      >
        <p className="text-3xl mb-2">🧙‍♂️🐱</p>
        <p className="text-sm font-medium text-amber-700">
          {t("loginRequiredForTraining")}
        </p>
        <p className="text-xs text-amber-500 mt-1">
          {t("loginPromptDesc")}
        </p>
      </button>
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
