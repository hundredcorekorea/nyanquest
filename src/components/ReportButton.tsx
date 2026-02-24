"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import type { ReportReason } from "@/types/database";

interface Props {
  reportType: "post" | "comment" | "user" | "session_message" | "scenario";
  targetId: string;
  compact?: boolean;
}

export default function ReportButton({ reportType, targetId, compact }: Props) {
  const t = useTranslations("Report");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REASONS: { value: ReportReason; label: string }[] = [
    { value: "spam", label: t("reasons.spam") },
    { value: "harassment", label: t("reasons.harassment") },
    { value: "inappropriate", label: t("reasons.inappropriate") },
    { value: "cheating", label: t("reasons.cheating") },
    { value: "copyright", label: t("reasons.copyright") },
    { value: "other", label: t("reasons.other") },
  ];

  async function handleSubmit() {
    if (!reason) {
      toast(t("selectReason"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast(tCommon("loginRequired"), "error");
        return;
      }

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        report_type: reportType,
        target_id: targetId,
        reason,
        description: description.trim() || null,
      });

      if (error) {
        toast(t("failed", { error: error.message }), "error");
        return;
      }

      toast(t("success"), "success");
      setOpen(false);
      setReason("");
      setDescription("");
    } catch {
      toast(tCommon("errorOccurred"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? "text-gray-400 hover:text-red-500 text-xs transition-colors"
            : "text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
        }
        title={t("title")}
      >
        {compact ? "🚨" : `🚨 ${t("title")}`}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">{t("title")}</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">{t("reason")}</p>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? "border-red-300 bg-red-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">{t("description")}</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !reason}
                className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
