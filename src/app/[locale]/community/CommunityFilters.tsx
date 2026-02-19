"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function CommunityFilters() {
  const t = useTranslations("Community");
  const tMeeting = useTranslations("MeetingType");
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  const categories = [
    { value: "", label: t("categories.all"), emoji: "📋" },
    { value: "free", label: t("categories.freeShort"), emoji: "🐱" },
    { value: "tip", label: t("categories.tipShort"), emoji: "📚" },
    { value: "gallery", label: t("categories.galleryShort"), emoji: "🖼️" },
    { value: "qna", label: t("categories.qnaShort"), emoji: "❓" },
  ];

  return (
    <div className="flex gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() =>
            router.push(
              cat.value
                ? `/community?category=${cat.value}`
                : "/community"
            )
          }
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            current === cat.value
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  );
}
