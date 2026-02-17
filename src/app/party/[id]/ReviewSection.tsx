"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { PartyMember, Review } from "@/types/database";
import { useToast } from "@/components/Toast";

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
        toast("이미 리뷰를 남겼다냥!", "error");
      } else {
        toast("리뷰 실패: " + error.message, "error");
      }
    } else {
      toast("리뷰를 남겼다냥!");
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
        <h2 className="font-bold text-gray-900 text-sm">꾹꾹이 리뷰</h2>
        {userId && isMember && (
          <span className="text-xs text-gray-400">
            {reviewedCount}/{otherMembers.length}명 완료
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
                    {m.user?.nickname ?? "모험가"}
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
                      {existingReview?.rating === 1 ? "👍" : "👎"} 리뷰 완료
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
                      placeholder="한줄 코멘트 (선택)"
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
                        👍 좋았다냥
                      </button>
                      <button
                        onClick={() => handleReview(m.user_id, -1)}
                        disabled={submitting === m.user_id}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                      >
                        👎 아쉽다냥
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
          <p className="text-xs text-gray-400 font-medium">작성된 리뷰</p>
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <span>{r.rating === 1 ? "👍" : "👎"}</span>
              <div>
                <span className="font-medium text-gray-600">
                  {r.reviewer?.nickname ?? "익명"}
                </span>
                <span className="text-gray-400"> → </span>
                <span className="font-medium text-gray-600">
                  {r.target?.nickname ?? "익명"}
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
          아직 리뷰가 없다냥...
        </p>
      )}
    </div>
  );
}
