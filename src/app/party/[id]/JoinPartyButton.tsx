"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Props {
  partyId: string;
  gmId: string;
  maxPlayers: number;
  currentPlayers: number;
}

export default function JoinPartyButton({
  partyId,
  gmId,
  maxPlayers,
  currentPlayers,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "already" | "pending" | "loading"
  >("idle");

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
        .select("status")
        .eq("party_id", partyId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setStatus(data.status === "accepted" ? "already" : "pending");
      }
    };
    check();
  }, [partyId]);

  const handleJoin = async () => {
    if (!userId) {
      // Trigger login
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/party/${partyId}`,
        },
      });
      return;
    }

    setStatus("loading");

    const { error } = await supabase.from("party_members").insert({
      party_id: partyId,
      user_id: userId,
      role: "PL",
      status: "pending",
    });

    if (error) {
      toast("참가 신청 실패: " + error.message, "error");
      setStatus("idle");
      return;
    }

    setStatus("pending");
    router.refresh();
  };

  if (userId === gmId) {
    return null; // GM doesn't see join button for own party
  }

  if (status === "already") {
    return (
      <div className="bg-green-50 rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-green-700">
          이미 파티에 참여중이다냥! 🎉
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="bg-amber-50 rounded-xl p-4 text-center">
        <p className="text-sm font-medium text-amber-700">
          참가 신청 완료! GM의 수락을 기다리는 중이다냥... ⏳
        </p>
      </div>
    );
  }

  const isFull = currentPlayers >= maxPlayers + 1;

  return (
    <button
      onClick={handleJoin}
      disabled={status === "loading" || isFull}
      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {!userId
        ? "🐱 로그인하고 참가 신청하기"
        : isFull
          ? "😿 모집이 마감됐다냥..."
          : status === "loading"
            ? "신청 중..."
            : "🐱 이 모험에 참가하겠다냥!"}
    </button>
  );
}
