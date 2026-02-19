"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  sessionId: string;
  partyId: string;
  isCreator: boolean;
  sessionStatus: "active" | "paused" | "completed";
  onStatusChange: (status: "active" | "paused" | "completed") => void;
}

export default function SessionControls({
  sessionId,
  partyId,
  isCreator,
  sessionStatus,
  onStatusChange,
}: Props) {
  const t = useTranslations("PartyPlay");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!isCreator) return null;

  async function handleAction(action: "pause" | "resume" | "complete") {
    if (loading) return;
    setLoading(true);

    try {
      if (action === "complete") {
        if (!confirm(t("endSessionConfirm"))) {
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.rpc("complete_party_session", {
          p_session_id: sessionId,
        });

        if (error) {
          toast(t("endSessionFailed", { error: error.message }), "error");
          return;
        }

        toast(t("endSessionSuccess"), "success");
        onStatusChange("completed");
        return;
      }

      const newStatus = action === "pause" ? "paused" : "active";
      const supabase = createClient();
      const { error } = await supabase
        .from("party_sessions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) {
        toast(t("statusChangeFailed"), "error");
        return;
      }

      onStatusChange(newStatus);
      toast(
        action === "pause"
          ? t("sessionPausedToast")
          : t("sessionResumedToast"),
        "success"
      );
    } catch {
      toast(tc("errorOccurred"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {sessionStatus === "active" && (
        <>
          <button
            onClick={() => handleAction("pause")}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ⏸️ {t("pause")}
          </button>
          <button
            onClick={() => handleAction("complete")}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            ✅ {t("endSession")}
          </button>
        </>
      )}

      {sessionStatus === "paused" && (
        <>
          <button
            onClick={() => handleAction("resume")}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            ▶️ {t("resume")}
          </button>
          <button
            onClick={() => handleAction("complete")}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ✅ {t("endSession")}
          </button>
        </>
      )}

      {sessionStatus === "completed" && (
        <button
          onClick={() => router.push(`/party/${partyId}`)}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          {t("returnToParty")}
        </button>
      )}
    </div>
  );
}
