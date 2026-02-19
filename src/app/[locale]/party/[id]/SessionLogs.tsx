"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { SessionLog } from "@/types/database";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";

interface Props {
  partyId: string;
  memberUserIds: string[];
}

interface SessionLogWithAuthor extends SessionLog {
  author: { nickname: string } | null;
}

export default function SessionLogs({ partyId, memberUserIds }: Props) {
  const t = useTranslations("SessionLogs");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SessionLogWithAuthor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    external_url: "",
    summary: "",
    session_date: "",
  });

  const isMember = userId ? memberUserIds.includes(userId) : false;

  const loadLogs = async () => {
    const { data } = await supabase
      .from("session_logs")
      .select("*, author:profiles!session_logs_author_id_fkey(nickname)")
      .eq("party_id", partyId)
      .order("session_date", { ascending: false, nullsFirst: false });

    if (data) setLogs(data as unknown as SessionLogWithAuthor[]);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      loadLogs();
    };
    init();
  }, [partyId]);

  const handleSubmit = async () => {
    if (!userId || !form.title.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("session_logs").insert({
      party_id: partyId,
      author_id: userId,
      title: form.title.trim(),
      external_url: form.external_url.trim() || null,
      summary: form.summary.trim() || null,
      session_date: form.session_date || null,
    });

    if (error) {
      toast(t("saveFailed", { error: error.message }), "error");
    } else {
      setForm({ title: "", external_url: "", summary: "", session_date: "" });
      setShowForm(false);
      loadLogs();
    }
    setSubmitting(false);
  };

  const handleDelete = async (logId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    const { error } = await supabase
      .from("session_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      toast(t("deleteFailed", { error: error.message }), "error");
    } else {
      loadLogs();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">
          {t("title", { count: logs.length })}
        </h2>
        {isMember && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-amber-500 hover:text-amber-600 font-medium"
          >
            {t("addRecord")}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-amber-50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-amber-700 font-medium">
            {t("newRecordPrompt")}
          </p>
          <input
            type="text"
            placeholder={t("sessionTitle")}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <input
            type="url"
            placeholder={t("externalLink")}
            value={form.external_url}
            onChange={(e) =>
              setForm((p) => ({ ...p, external_url: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <textarea
            placeholder={t("summary")}
            value={form.summary}
            onChange={(e) =>
              setForm((p) => ({ ...p, summary: e.target.value }))
            }
            rows={2}
            maxLength={300}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none"
          />
          <input
            type="date"
            value={form.session_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, session_date: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim()}
              className="flex-1 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
            >
              {submitting ? t("saving") : t("saveRecord")}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm({
                  title: "",
                  external_url: "",
                  summary: "",
                  session_date: "",
                });
              }}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {tc("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Log list */}
      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={log.id} className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    #{logs.length - i}
                  </span>
                  <h3 className="text-sm font-medium text-gray-900">
                    {log.title}
                  </h3>
                </div>
                {log.author_id === userId && (
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    {tc("delete")}
                  </button>
                )}
              </div>

              {log.session_date && (
                <p className="text-xs text-gray-400">
                  {new Date(log.session_date + "T00:00:00").toLocaleDateString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    }
                  )}
                </p>
              )}

              {log.summary && (
                <p className="text-xs text-gray-500 leading-relaxed">
                  {log.summary}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">
                  by {log.author?.nickname ?? tc("adventurer")}
                </span>
                {log.external_url && (
                  <a
                    href={log.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-500 hover:text-amber-600 font-medium"
                  >
                    {t("viewDetail")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
