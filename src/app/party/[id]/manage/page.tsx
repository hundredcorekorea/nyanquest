"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Party, PartyMember } from "@/types/database";
import { useToast } from "@/components/Toast";
import Link from "next/link";

export default function ManagePartyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: p } = await supabase
      .from("parties")
      .select("*, system:trpg_systems(name)")
      .eq("id", id)
      .single();

    if (!p || p.gm_id !== user.id) {
      router.push("/my");
      return;
    }
    setParty(p as unknown as Party);

    const { data: allMembers } = await supabase
      .from("party_members")
      .select("*, user:profiles(*)")
      .eq("party_id", id)
      .order("created_at");

    if (allMembers) {
      const typed = allMembers as unknown as PartyMember[];
      setMembers(typed.filter((m) => m.status === "accepted"));
      setPendingMembers(typed.filter((m) => m.status === "pending"));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleMember = async (
    memberId: string,
    action: "accepted" | "rejected"
  ) => {
    const { error } = await supabase
      .from("party_members")
      .update({ status: action })
      .eq("id", memberId);

    if (error) {
      toast("처리 실패: " + error.message, "error");
      return;
    }

    // Update current_players count if accepted
    if (action === "accepted" && party) {
      await supabase
        .from("parties")
        .update({ current_players: party.current_players + 1 })
        .eq("id", id);
    }

    load();
  };

  const handleStatusChange = async (
    status: "recruiting" | "filled" | "completed" | "cancelled"
  ) => {
    const { error } = await supabase
      .from("parties")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast("상태 변경 실패: " + error.message, "error");
      return;
    }

    // +30 EXP for all members when completed
    if (status === "completed") {
      await supabase.rpc("complete_party_exp", { p_party_id: id });
    }

    load();
  };

  if (loading) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-400 mt-2">불러오는 중이다냥...</p>
      </div>
    );
  }

  if (!party) return null;

  const statusActions = [
    {
      value: "recruiting" as const,
      label: "모집중",
      color: "bg-orange-100 text-orange-700",
    },
    {
      value: "filled" as const,
      label: "모집마감",
      color: "bg-gray-100 text-gray-600",
    },
    {
      value: "completed" as const,
      label: "세션 완료",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "cancelled" as const,
      label: "취소",
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="pb-24 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/party/${id}`}
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
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 truncate">{party.title}</h1>
          <p className="text-xs text-gray-400">파티 관리</p>
        </div>
      </div>

      {/* Status control */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm text-gray-900 mb-3">모집 상태</h2>
        <div className="flex flex-wrap gap-2">
          {statusActions.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                party.status === s.value
                  ? s.color + " ring-2 ring-offset-1 ring-amber-300"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending members */}
      {pendingMembers.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <h2 className="font-bold text-sm text-amber-800 mb-3">
            참가 신청 대기중 ({pendingMembers.length}명)
          </h2>
          <div className="space-y-3">
            {pendingMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  {m.user?.avatar_url ? (
                    <img
                      src={m.user.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.user?.nickname ?? "모험가"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-500">
                      {m.user?.manner_temp ?? 36.5}°
                    </span>
                    {m.user?.style_tags && m.user.style_tags.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {m.user.style_tags.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleMember(m.id, "accepted")}
                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => handleMember(m.id, "rejected")}
                    className="px-3 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm text-gray-900 mb-3">
          파티원 ({members.length}명)
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            아직 파티원이 없다냥... 😿
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  {m.user?.avatar_url ? (
                    <img
                      src={m.user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1">
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
                <span className="text-xs text-amber-500">
                  {m.user?.manner_temp ?? 36.5}°
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href={`/party/${id}`}
          className="flex-1 py-3 text-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          구인글 보기
        </Link>
        {(party.status === "recruiting" || party.status === "filled") && (
          <Link
            href={`/party/${id}/edit`}
            className="flex-1 py-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            구인글 수정
          </Link>
        )}
        <Link
          href="/my"
          className="flex-1 py-3 text-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          내 목록으로
        </Link>
      </div>
    </div>
  );
}
