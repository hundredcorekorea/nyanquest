"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCallback, useTransition } from "react";

interface Props {
  currentLang: string;
}

export default function CommunityFilters({ currentLang }: Props) {
  const t = useTranslations("Community");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const currentCategory = searchParams.get("category") ?? "";
  const [isPending, startTransition] = useTransition();

  const categories = [
    { value: "", label: t("categories.all"), emoji: "📋" },
    { value: "free", label: t("categories.freeShort"), emoji: "🐱" },
    { value: "tip", label: t("categories.tipShort"), emoji: "📚" },
    { value: "gallery", label: t("categories.galleryShort"), emoji: "🖼️" },
    { value: "qna", label: t("categories.qnaShort"), emoji: "❓" },
  ];

  const langOptions = [
    { value: locale, label: locale === "ko" ? "🇰🇷 한국어" : "🇺🇸 English" },
    { value: locale === "ko" ? "en" : "ko", label: locale === "ko" ? "🇺🇸 English" : "🇰🇷 한국어" },
    { value: "all", label: t("allLanguages") },
  ];

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className={`flex flex-wrap gap-2 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateFilter("category", cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              currentCategory === cat.value
                ? "bg-amber-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        {langOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateFilter("lang", opt.value === locale ? "" : opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentLang === opt.value
                ? "bg-amber-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
