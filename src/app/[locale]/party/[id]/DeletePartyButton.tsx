"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  partyId: string;
  creatorId: string;
}

export default function DeletePartyButton({ partyId, creatorId }: Props) {
  const t = useTranslations("PartyDetail");
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  if (userId !== creatorId) return null;

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    setDeleting(true);

    const { error } = await supabase
      .from("parties")
      .delete()
      .eq("id", partyId);

    if (error) {
      toast(t("deleteFailed", { error: error.message }), "error");
      setDeleting(false);
    } else {
      toast(t("deleteSuccess"), "success");
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="w-full py-3 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
    >
      {deleting ? t("deleting") : t("deleteParty")}
    </button>
  );
}
