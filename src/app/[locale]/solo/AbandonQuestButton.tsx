"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/Toast";

export default function AbandonQuestButton({ questId }: { questId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Solo");

  async function handleAbandon() {
    if (!confirm(t("abandonConfirm"))) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("solo_quests")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", questId);

    if (error) {
      toast(t("abandonFailed", { error: error.message }), "error");
      return;
    }

    toast(t("abandonSuccess"), "success");
    router.refresh();
  }

  return (
    <button
      onClick={handleAbandon}
      className="inline-block px-4 py-2 border border-gray-300 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
    >
      {t("abandon")}
    </button>
  );
}
