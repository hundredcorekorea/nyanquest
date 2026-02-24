"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Post, PostCategory } from "@/types/database";
import PromoCard from "@/components/PromoCard";

interface Props {
  posts: Post[];
}

export default function CommunityPostList({ posts }: Props) {
  const t = useTranslations("Community");
  const tTimeAgo = useTranslations("TimeAgo");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [category, setCategory] = useState("");
  const [lang, setLang] = useState(locale);

  const categoryConfig: Record<
    PostCategory,
    { label: string; emoji: string }
  > = {
    free: { label: t("categories.free"), emoji: "🐱" },
    tip: { label: t("categories.tip"), emoji: "📚" },
    gallery: { label: t("categories.gallery"), emoji: "🖼️" },
    qna: { label: t("categories.qna"), emoji: "❓" },
  };

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

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return tTimeAgo("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tTimeAgo("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return tTimeAgo("daysAgo", { count: days });
  }

  // Client-side filtering — instant, no server round-trip
  const filtered = posts.filter((post) => {
    if (category && post.category !== category) return false;
    if (lang !== "all" && post.language !== lang) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-50 rounded-xl p-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                category === cat.value
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
              onClick={() => setLang(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                lang === opt.value
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((post, idx) => {
            const cat = categoryConfig[post.category];
            return (
              <div key={post.id}>
                {idx > 0 && idx % 3 === 0 && (
                  <PromoCard placement="community" className="my-2" />
                )}
                <Link href={`/community/${post.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {cat.emoji} {cat.label}
                      </span>
                      {post.system && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          🎲 {(post.system as { name: string }).name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                          {post.author?.avatar_url ? (
                            <img
                              src={post.author.avatar_url}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            "🐱"
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {post.author?.nickname ?? tCommon("anonymous")}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>🐾 {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>👁 {post.view_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😿</div>
            <p className="text-gray-500 font-medium">{t("emptyTitle")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("emptyDesc")}</p>
          </div>
        )}
      </div>
    </>
  );
}
