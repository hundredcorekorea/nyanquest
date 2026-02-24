import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import type { Post } from "@/types/database";
import CommunityPostList from "./CommunityPostList";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function CommunityPage({
  params: localeParams,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await localeParams;
  setRequestLocale(locale);
  const t = await getTranslations("Community");
  const supabase = await createClient();

  // Fetch all recent posts at once — client-side filtering handles the rest
  const { data: posts } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(nickname, avatar_url, manner_temp), system:trpg_systems(name)")
    .order("created_at", { ascending: false })
    .limit(50);

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
        <AnnouncementBoard locale={locale} />
      </Suspense>

      {/* Filters + Post list (client-side, instant filtering) */}
      <CommunityPostList posts={typedPosts} />
    </div>
  );
}
