"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Post, Comment, PostCategory } from "@/types/database";
import { useToast } from "@/components/Toast";
import ReportButton from "@/components/ReportButton";
import LoginModal from "@/components/LoginModal";

export default function PostContent({ post }: { post: Post }) {
  const t = useTranslations("CommunityPost");
  const tCat = useTranslations("Community");
  const tTimeAgo = useTranslations("TimeAgo");
  const tCommon = useTranslations("Common");

  const categoryConfig: Record<PostCategory, { label: string; emoji: string }> = {
    free: { label: tCat("categories.free"), emoji: "🐱" },
    tip: { label: tCat("categories.tip"), emoji: "📚" },
    gallery: { label: tCat("categories.gallery"), emoji: "🖼️" },
    qna: { label: tCat("categories.qna"), emoji: "❓" },
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

  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const cat = categoryConfig[post.category];

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(nickname, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at");
    if (data) setComments(data as unknown as Comment[]);
  };

  useEffect(() => {
    const init = async () => {
      // Increment view count
      await supabase.rpc("increment_view_count", { post_id: post.id });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Check if liked
        const { data } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single();
        if (data) setLiked(true);
      }

      loadComments();
    };
    init();
  }, [post.id]);

  const handleLike = async () => {
    if (!userId) return;

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: userId });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const handleComment = async () => {
    if (!userId || !commentText.trim()) return;
    setSubmittingComment(true);

    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      author_id: userId,
      content: commentText.trim(),
    });

    if (error) {
      toast(t("commentFailed", { error: error.message }), "error");
    } else {
      setCommentText("");
      loadComments();
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t("deleteCommentConfirm"))) return;
    await supabase.from("comments").delete().eq("id", commentId);
    loadComments();
  };

  const handleDeletePost = async () => {
    if (!confirm(t("deletePostConfirm"))) return;
    await supabase.from("posts").delete().eq("id", post.id);
    router.push("/community");
  };

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-4">
      {/* Back + Category */}
      <div className="flex items-center gap-2">
        <Link
          href="/community"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
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
      <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>

      {/* Author + meta */}
      <div className="flex items-center justify-between">
        <Link
          href={`/user/${post.author_id}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs">
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full"
              />
            ) : (
              "🐱"
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {post.author?.nickname ?? tCommon("anonymous")}
          </span>
          <span className="text-xs text-amber-500">
            {post.author?.manner_temp ?? 36.5}°
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {timeAgo(post.created_at)}
          </span>
          {userId === post.author_id && (
            <button
              onClick={handleDeletePost}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              {tCommon("delete")}
            </button>
          )}
          {userId && userId !== post.author_id && (
            <ReportButton reportType="post" targetId={post.id} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Like + stats */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleLike}
          disabled={!userId}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            liked
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
          } ${!userId ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <span className="text-lg">🐾</span>
          {t("like", { count: likesCount })}
        </button>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{t("comments", { count: comments.length })}</span>
          <span>👁 {post.view_count + 1}</span>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-sm text-gray-900">
          {t("comments", { count: comments.length })}
        </h2>

        {/* Comment input */}
        {userId ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("commentPlaceholder")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              onClick={handleComment}
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              {t("commentSubmit")}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full py-2.5 text-sm text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium"
            >
              🔒 {t("commentLoginRequired")}
            </button>
            <LoginModal
              open={showLoginModal}
              onClose={() => setShowLoginModal(false)}
            />
          </>
        )}

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  {c.author?.avatar_url ? (
                    <img
                      src={c.author.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {c.author?.nickname ?? tCommon("anonymous")}
                    </span>
                    <span className="text-xs text-gray-300">
                      {timeAgo(c.created_at)}
                    </span>
                    {c.author_id === userId && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors ml-auto"
                      >
                        {tCommon("delete")}
                      </button>
                    )}
                    {userId && c.author_id !== userId && (
                      <span className="ml-auto">
                        <ReportButton reportType="comment" targetId={c.id} compact />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">
            {t("emptyComments")}
          </p>
        )}
      </div>
    </div>
  );
}
