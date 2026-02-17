import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import type { Post, PostCategory } from "@/types/database";
import CommunityFilters from "./CommunityFilters";

const categoryConfig: Record<
  PostCategory,
  { label: string; emoji: string; description: string }
> = {
  free: { label: "냥냥 잡담", emoji: "🐱", description: "자유롭게 수다 떨기" },
  tip: { label: "고양이 도서관", emoji: "📚", description: "룰 & 팁 공유" },
  gallery: {
    label: "모험가 갤러리",
    emoji: "🖼️",
    description: "캐릭터 & 후기",
  },
  qna: { label: "질문해냥", emoji: "❓", description: "궁금한 건 물어봐냥" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

interface SearchParams {
  category?: string;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(nickname, avatar_url, manner_temp), system:trpg_systems(name)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data: posts } = await query;
  const typedPosts = (posts ?? []) as unknown as Post[];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">집사들의 쉼터</h1>
        <Link
          href="/community/write"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          글쓰기
        </Link>
      </div>

      {/* Category tabs */}
      <Suspense>
        <CommunityFilters />
      </Suspense>

      {/* Post list */}
      <div className="space-y-2">
        {typedPosts.length > 0 ? (
          typedPosts.map((post) => {
            const cat = categoryConfig[post.category];
            return (
              <Link key={post.id} href={`/community/${post.id}`}>
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
                        {post.author?.nickname ?? "익명"}
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
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😿</div>
            <p className="text-gray-500 font-medium">
              아직 글이 없다냥...
            </p>
            <p className="text-sm text-gray-400 mt-1">
              첫 번째 이야기를 남겨봐냥!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
