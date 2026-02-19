"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  targetUserId: string;
}

export default function BlockButton({ targetUserId }: Props) {
  const t = useTranslations("Block");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id === targetUserId) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId)
        .single();

      setIsBlocked(!!data);
      setLoading(false);
    };
    check();
  }, [targetUserId]);

  if (loading || !userId) return null;

  async function handleToggle() {
    setToggling(true);
    try {
      const supabase = createClient();

      if (isBlocked) {
        await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", userId!)
          .eq("blocked_id", targetUserId);

        setIsBlocked(false);
        toast(t("unblocked"), "success");
      } else {
        const { error } = await supabase.from("blocked_users").insert({
          blocker_id: userId!,
          blocked_id: targetUserId,
        });

        if (error) {
          toast(t("blockFailed", { error: error.message }), "error");
          return;
        }
        setIsBlocked(true);
        toast(t("blockSuccess"), "success");
      }
    } catch {
      toast(tCommon("errorOccurred"), "error");
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        isBlocked
          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
          : "bg-red-50 text-red-500 hover:bg-red-100"
      }`}
    >
      {toggling
        ? "..."
        : isBlocked
        ? t("unblock")
        : `🚫 ${t("block")}`}
    </button>
  );
}
