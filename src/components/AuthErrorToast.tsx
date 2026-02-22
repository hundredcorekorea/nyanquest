"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AuthErrorToast() {
  const searchParams = useSearchParams();
  const t = useTranslations("Auth");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const desc = searchParams.get("error_description");
      const detail = searchParams.get("detail");
      setMessage(desc ?? detail ?? t("loginFailed"));
      setShow(true);

      // Remove error params from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      url.searchParams.delete("detail");
      window.history.replaceState({}, "", url.pathname);

      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, t]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 text-sm max-w-sm">
        <span>⚠️</span>
        <span>{message}</span>
        <button
          onClick={() => setShow(false)}
          className="ml-2 text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
