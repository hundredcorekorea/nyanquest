"use client";

import { useTranslations } from "next-intl";

export default function OfflinePage() {
  const t = useTranslations("Offline");

  return (
    <div className="text-center py-20 pb-24">
      <div className="text-5xl mb-4">😿</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {t("title")}
      </h1>
      <p className="text-sm text-gray-500">
        {t("description")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
      >
        {t("retry")}
      </button>
    </div>
  );
}
