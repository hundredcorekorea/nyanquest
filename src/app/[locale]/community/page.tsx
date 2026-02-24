import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import type { Post, PostCategory } from "@/types/database";
import CommunityFilters from "./CommunityFilters";
import PromoCard from "@/components/PromoCard";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface SearchParams {
  category?: string;
  lang?: string;
}

export default async function CommunityPage({
  searchParams,
  params: localeParams,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await localeParams;
  setRequestLocale(locale);
  const t = await getTranslations("Community");
  const tTimeAgo = await getTranslations("TimeAgo");
  const tCommon = await getTranslations("Common");
  const supabase = await createClient();

  const categoryConfig: Record<
    PostCategory,
    { label: string; emoji: string; description: string }
  > = {
    free: { label: t("categories.free"), emoji: "🐱", description: t("categoryDescriptions.free") },
    tip: { label: t("categories.tip"), emoji: "📚", description: t("categoryDescriptions.tip") },
    gallery: {
      label: t("categories.gallery"),
      emoji: "🖼️",
      description: t("categoryDescriptions.gallery"),
    },
    qna: { label: t("categories.qna"), emoji: "❓", description: t("categoryDescriptions.qna") },
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return tTimeAgo("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tTimeAgo("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return tTimeAgo("daysAgo", { count: days });
  }

  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(nickname, avatar_url, manner_temp), system:trpg_systems(name)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (sp.category) {
    query = query.eq("category", sp.category);
  }

  // Language filter: default to current locale, "all" shows everything
  const langFilter = sp.lang ?? locale;
  if (langFilter !== "all") {
    query = query.eq("language", langFilter);
  }

  const { data: posts } = await query;
  const typedPosts = (posts ?? []) as unknown as Post[];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
        <Link
          href="/community/write"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {t("writePost")}
        </Link>
      </div>

      {/* Announcement board */}
      <Suspense>
        <AnnouncementBoard />
      </Suspense>

      {/* Category tabs */}
      <Suspense>
        <CommunityFilters currentLang={sp.lang ?? locale} />
      </Suspense>

      {/* Post list */}
      <div className="space-y-2">
        {typedPosts.length > 0 ? (
          typedPosts.map((post, idx) => {
            const cat = categoryConfig[post.category];
            return (
              <div key={post.id}>
                {/* Insert promo after every 3rd post */}
                {idx > 0 && idx % 3 === 0 && (
                  <PromoCard placement="community" className="my-2" />
                )}
                <Link href={`/community/${post.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                    {/* Category + System tag */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {cat.emoji} {cat.label}
                      </span>
                      {post.system && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          🎲 {post.system.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                      {post.title}
                    </h3>

                    {/* Content preview */}
                    <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                      {post.content}
                    </p>

                    {/* Footer */}
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
            <p className="text-gray-500 font-medium">
              {t("emptyTitle")}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t("emptyDesc")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
