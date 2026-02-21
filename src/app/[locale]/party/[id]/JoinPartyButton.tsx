"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import LoginModal from "@/components/LoginModal";

interface Props {
  partyId: string;
  creatorId: string;
  gmId: string | null;
  maxPlayers: number;
  currentPlayers: number;
  lookingForGm: boolean;
}

export default function JoinPartyButton({
  partyId,
  creatorId,
  gmId,
  maxPlayers,
  currentPlayers,
  lookingForGm,
}: Props) {
  const t = useTranslations("PartyDetail");
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "already" | "pending" | "loading"
  >("idle");
  const [memberRole, setMemberRole] = useState<"GM" | "PL" | null>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Check if already a member
      const { data } = await supabase
        .from("party_members")
        .select("status, role")
        .eq("party_id", partyId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setMemberRole(data.role as "GM" | "PL");
        setStatus(data.status === "accepted" ? "already" : "pending");
      }
    };
    check();
  }, [partyId]);

  const handleJoin = async (role: "GM" | "PL" = "PL") => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setStatus("loading");

    const { error } = await supabase.from("party_members").insert({
      party_id: partyId,
      user_id: userId,
      role,
      status: "pending",
    });

    if (error) {
      toast(t("joinFailed", { error: error.message }), "error");
      setStatus("idle");
      return;
    }

    setMemberRole(role);
    setStatus("pending");
    setShowRoleSelect(false);
    router.refresh();
  };

  // Creator and current GM don't see join button
  if (userId === creatorId || userId === gmId) {
    return null;
  }

  if (status === "already") {
    return (
      <div className="bg-green-50 rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-green-700">
          {t("alreadyJoined")}
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="bg-amber-50 rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-amber-700">
          {t("pendingJoin", { role: memberRole === "GM" ? "GM" : "PL" })}
        </p>
      </div>
    );
  }

  const isFull = currentPlayers >= maxPlayers + 1;

  // Show role selection if looking for GM
  if (showRoleSelect && lookingForGm) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleJoin("GM")}
          disabled={status === "loading"}
          className="w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-base disabled:opacity-40 transition-colors"
        >
          {status === "loading" ? t("applying") : t("joinAsGm")}
        </button>
        {!isFull && (
          <button
            onClick={() => handleJoin("PL")}
            disabled={status === "loading"}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base disabled:opacity-40 transition-colors"
          >
            {status === "loading" ? t("applying") : t("joinAsPl")}
          </button>
        )}
        <button
          onClick={() => setShowRoleSelect(false)}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          {tc("cancel")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectAfterLogin={`/party/${partyId}`}
      />
      {lookingForGm ? (
        <button
          onClick={() =>
            userId ? setShowRoleSelect(true) : handleJoin("PL")
          }
          disabled={status === "loading" || (isFull && !lookingForGm)}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {!userId
            ? ta("loginAndJoin")
            : status === "loading"
              ? t("applying")
              : t("joinAsPl")}
        </button>
      ) : (
        <button
          onClick={() => handleJoin("PL")}
          disabled={status === "loading" || isFull}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {!userId
            ? ta("loginAndJoin")
            : isFull
              ? t("recruitmentClosed")
              : status === "loading"
                ? t("applying")
                : t("joinAsPl")}
        </button>
      )}
    </div>
  );
}
