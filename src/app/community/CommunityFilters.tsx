"use client";

import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  { value: "", label: "전체", emoji: "📋" },
  { value: "free", label: "잡담", emoji: "🐱" },
  { value: "tip", label: "팁", emoji: "📚" },
  { value: "gallery", label: "갤러리", emoji: "🖼️" },
  { value: "qna", label: "Q&A", emoji: "❓" },
];

export default function CommunityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

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
