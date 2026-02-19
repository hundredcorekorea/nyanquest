"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { PartyMember, Review } from "@/types/database";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  partyId: string;
  partyStatus: string;
  members: PartyMember[];
}

interface ReviewWithTarget extends Review {
  target: { nickname: string; avatar_url: string | null; manner_temp: number } | null;
  reviewer: { nickname: string } | null;
}

export default function ReviewSection({
  partyId,
  partyStatus,
  members,
}: Props) {
  const t = useTranslations("Review");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewWithTarget[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );

  const isMember = members.some((m) => m.user_id === userId);
  const otherMembers = members.filter((m) => m.user_id !== userId);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select(
        "*, target:profiles!reviews_target_id_fkey(nickname, avatar_url, manner_temp), reviewer:profiles!reviews_reviewer_id_fkey(nickname)"
      )
      .eq("party_id", partyId)
      .order("created_at");

    if (data) setReviews(data as unknown as ReviewWithTarget[]);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      loadReviews();
    };
    init();
  }, [partyId]);

  const handleReview = async (targetId: string, rating: 1 | -1) => {
    if (!userId) return;
    setSubmitting(targetId);

    const { error } = await supabase.from("reviews").insert({
      reviewer_id: userId,
      target_id: targetId,
      party_id: partyId,
      rating,
      comment: commentInputs[targetId]?.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast(t("alreadyReviewed"), "error");
      } else {
        toast(t("reviewFailed", { error: error.message }), "error");
      }
    } else {
      toast(t("reviewSubmitted"));
      setCommentInputs((prev) => ({ ...prev, [targetId]: "" }));
      loadReviews();
    }
    setSubmitting(null);
  };

  // Only show for completed parties
  if (partyStatus !== "completed") return null;

  const myReviewTargets = new Set(
    reviews.filter((r) => r.reviewer_id === userId).map((r) => r.target_id)
  );

  const reviewedCount = userId
    ? otherMembers.filter((m) => myReviewTargets.has(m.user_id)).length
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">{t("title")}</h2>
        {userId && isMember && (
          <span className="text-xs text-gray-400">
            {t("completedCount", { reviewed: reviewedCount, total: otherMembers.length })}
          </span>
        )}
      </div>

      {/* Review targets (for logged-in members) */}
      {userId && isMember && otherMembers.length > 0 && (
        <div className="space-y-3">
          {otherMembers.map((m) => {
            const alreadyReviewed = myReviewTargets.has(m.user_id);
            const existingReview = reviews.find(
              (r) => r.reviewer_id === userId && r.target_id === m.user_id
            );

            return (
              <div
                key={m.user_id}
                className="bg-gray-50 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                    {m.user?.avatar_url ? (
                      <img
                        src={m.user.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      "🐱"
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {m.user?.nickname ?? tc("adventurer")}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      m.role === "GM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {m.role}
                  </span>
                  <span className="text-xs text-amber-500 ml-auto">
                    {m.user?.manner_temp ?? 36.5}°
                  </span>
                </div>

                {alreadyReviewed ? (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <span>
                      {existingReview?.rating === 1 ? "👍" : "👎"} {t("alreadyReviewed")}
                    </span>
                    {existingReview?.comment && (
                      <span className="text-gray-400">
                        &ldquo;{existingReview.comment}&rdquo;
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder={t("commentPlaceholder")}
                      value={commentInputs[m.user_id] ?? ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [m.user_id]: e.target.value,
                        }))
                      }
                      maxLength={100}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(m.user_id, 1)}
                        disabled={submitting === m.user_id}
                        className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                      >
                        👍 {t("positive")}
                      </button>
                      <button
                        onClick={() => handleReview(m.user_id, -1)}
                        disabled={submitting === m.user_id}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                      >
                        👎 {t("negative")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Public review list */}
      {reviews.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium">{t("writtenReviews")}</p>
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <span>{r.rating === 1 ? "👍" : "👎"}</span>
              <div>
                <span className="font-medium text-gray-600">
                  {r.reviewer?.nickname ?? tc("anonymous")}
                </span>
                <span className="text-gray-400"> → </span>
                <span className="font-medium text-gray-600">
                  {r.target?.nickname ?? tc("anonymous")}
                </span>
                {r.comment && (
                  <p className="text-gray-500 mt-0.5">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for non-members */}
      {reviews.length === 0 && (!userId || !isMember) && (
        <p className="text-xs text-gray-400 text-center py-3">
          {t("noReviews")}
        </p>
      )}
    </div>
  );
}
