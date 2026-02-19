"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { Party, PartyMember, GmStats } from "@/types/database";
import { fetchGmStatsBatch } from "@/lib/gm-stats";
import GmStatsBadge from "@/components/GmStatsBadge";
import { useToast } from "@/components/Toast";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ManagePartyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations("PartyManage");
  const tCommon = useTranslations("Common");

  const [user, setUser] = useState<User | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [gmStatsMap, setGmStatsMap] = useState<Record<string, GmStats>>({});

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

    if (!p || p.creator_id !== user.id) {
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

      // Fetch GM stats for GM applicants
      const gmApplicants = typed.filter(
        (m) => m.role === "GM" && m.status === "pending"
      );
      if (gmApplicants.length > 0) {
        const stats = await fetchGmStatsBatch(
          supabase,
          gmApplicants.map((m) => m.user_id)
        );
        setGmStatsMap(stats);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const pendingGmApplicants = pendingMembers.filter((m) => m.role === "GM");
  const pendingPlApplicants = pendingMembers.filter((m) => m.role === "PL");

  const handleMember = async (
    memberId: string,
    action: "accepted" | "rejected"
  ) => {
    const { error } = await supabase
      .from("party_members")
      .update({ status: action })
      .eq("id", memberId);

    if (error) {
      toast(t("actionFailed", { error: error.message }), "error");
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

  const handleGmApproval = async (memberId: string, userId: string) => {
    // Accept the GM applicant
    const { error } = await supabase
      .from("party_members")
      .update({ status: "accepted" })
      .eq("id", memberId);

    if (error) {
      toast(t("actionFailed", { error: error.message }), "error");
      return;
    }

    // Set as party GM + update current_players
    if (party) {
      await supabase
        .from("parties")
        .update({
          gm_id: userId,
          current_players: party.current_players + 1,
        })
        .eq("id", id);
    }

    // Reject other pending GM applicants
    await supabase
      .from("party_members")
      .update({ status: "rejected" })
      .eq("party_id", id)
      .eq("role", "GM")
      .eq("status", "pending")
      .neq("id", memberId);

    toast(t("gmAssignSuccess"), "success");
    load();
  };

  const handleRemoveGm = async () => {
    if (!party?.gm_id) return;

    // Find the GM member and remove them or change to PL
    await supabase
      .from("party_members")
      .update({ role: "PL" })
      .eq("party_id", id)
      .eq("user_id", party.gm_id)
      .eq("role", "GM");

    await supabase
      .from("parties")
      .update({ gm_id: null })
      .eq("id", id);

    toast(t("gmRemoved"), "success");
    load();
  };

  const handleDeleteParty = async () => {
    if (!confirm(t("deleteConfirm1"))) return;
    if (!confirm(t("deleteConfirm2"))) return;

    const { error } = await supabase.from("parties").delete().eq("id", id);
    if (error) {
      toast(t("deleteFailed", { error: error.message }), "error");
      return;
    }
    toast(t("deleteSuccess"), "success");
    router.push("/my");
  };

  const handleStatusChange = async (
    status: "recruiting" | "filled" | "completed" | "cancelled"
  ) => {
    const { error } = await supabase
      .from("parties")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast(t("statusChangeFailed", { error: error.message }), "error");
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
        <p className="text-sm text-gray-400 mt-2">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!party) return null;

  const statusActions = [
    {
      value: "recruiting" as const,
      label: t("statusRecruiting"),
      color: "bg-orange-100 text-orange-700",
    },
    {
      value: "filled" as const,
      label: t("statusFilled"),
      color: "bg-gray-100 text-gray-600",
    },
    {
      value: "completed" as const,
      label: t("statusCompleted"),
      color: "bg-green-100 text-green-700",
    },
    {
      value: "cancelled" as const,
      label: t("statusCancelled"),
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
          <p className="text-xs text-gray-400">{t("partyManagement")}</p>
        </div>
      </div>

      {/* Status control */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm text-gray-900 mb-3">{t("recruitmentStatus")}</h2>
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

      {/* GM Management */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-sm text-gray-900 mb-3">{t("gmManagement")}</h2>
        {party.gm_id ? (
          <div className="flex items-center justify-between bg-purple-50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                GM
              </span>
              <span className="text-sm text-gray-700">
                {members.find((m) => m.user_id === party.gm_id)?.user
                  ?.nickname ??
                  (party.gm_id === party.creator_id
                    ? t("meLeader")
                    : t("gmAssigned"))}
              </span>
            </div>
            {party.gm_id !== party.creator_id && (
              <button
                onClick={handleRemoveGm}
                className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                {t("gmRemove")}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-3 bg-purple-50 rounded-xl">
            <span className="text-lg">🎲</span>
            <p className="text-sm text-purple-600 font-medium mt-1">
              {t("gmUnassigned")}
            </p>
          </div>
        )}
      </div>

      {/* Pending GM applicants */}
      {pendingGmApplicants.length > 0 && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 p-5">
          <h2 className="font-bold text-sm text-purple-800 mb-3">
            {t("gmApplicants", { count: pendingGmApplicants.length })}
          </h2>
          <div className="space-y-3">
            {pendingGmApplicants.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3"
              >
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                  {m.user?.avatar_url ? (
                    <Image
                      src={m.user.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    "🧙"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.user?.nickname ?? tCommon("adventurer")}
                    </p>
                    <span className="text-xs text-purple-500">
                      {m.user?.manner_temp ?? 36.5}°
                    </span>
                    <Link
                      href={`/user/${m.user_id}`}
                      className="text-xs text-purple-400 hover:text-purple-600 ml-auto"
                      target="_blank"
                    >
                      {t("profile")}
                    </Link>
                  </div>
                  {gmStatsMap[m.user_id] && (
                    <GmStatsBadge
                      stats={gmStatsMap[m.user_id]}
                      variant="compact"
                    />
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleGmApproval(m.id, m.user_id)}
                    className="px-3 py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    {t("gmAccept")}
                  </button>
                  <button
                    onClick={() => handleMember(m.id, "rejected")}
                    className="px-3 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending PL members */}
      {pendingPlApplicants.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <h2 className="font-bold text-sm text-amber-800 mb-3">
            {t("plApplicants", { count: pendingPlApplicants.length })}
          </h2>
          <div className="space-y-3">
            {pendingPlApplicants.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  {m.user?.avatar_url ? (
                    <Image
                      src={m.user.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.user?.nickname ?? tCommon("adventurer")}
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
                    {t("accept")}
                  </button>
                  <button
                    onClick={() => handleMember(m.id, "rejected")}
                    className="px-3 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("reject")}
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
          {t("partyMembersCount", { count: members.length })}
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {t("noMembers")}
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                  {m.user?.avatar_url ? (
                    <Image
                      src={m.user.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    "🐱"
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {m.user?.nickname ?? tCommon("adventurer")}
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

      {/* Session management */}
      {party.use_ai_gm && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <h2 className="font-bold text-sm text-amber-800 mb-2">
            🧙‍♂️ {t("aiGmSession")}
          </h2>
          <p className="text-xs text-amber-600 mb-3">
            {party.play_mode === "realtime" ? t("realtimeMode") : t("asyncMode")}
          </p>
          <Link
            href={`/party/${id}/play`}
            className="block w-full py-3 text-center bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            🎮 {t("sessionPlay")}
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href={`/party/${id}`}
          className="flex-1 py-3 text-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t("viewPost")}
        </Link>
        {(party.status === "recruiting" || party.status === "filled") && (
          <Link
            href={`/party/${id}/edit`}
            className="flex-1 py-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            {t("editPost")}
          </Link>
        )}
        <Link
          href="/my"
          className="flex-1 py-3 text-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t("myList")}
        </Link>
      </div>

      {/* Delete party */}
      <button
        onClick={handleDeleteParty}
        className="w-full py-3 text-center border border-red-200 text-red-400 text-sm rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        {t("deleteParty")}
      </button>
    </div>
  );
}
