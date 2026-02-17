"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { SessionLog } from "@/types/database";
import { useToast } from "@/components/Toast";

interface Props {
  partyId: string;
  memberUserIds: string[];
}

interface SessionLogWithAuthor extends SessionLog {
  author: { nickname: string } | null;
}

export default function SessionLogs({ partyId, memberUserIds }: Props) {
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

  const loadLogs = async () => {
    const { data } = await supabase
      .from("session_logs")
      .select("*, author:profiles!session_logs_author_id_fkey(nickname)")
      .eq("party_id", partyId)
      .order("session_date", { ascending: false, nullsFirst: false });

    if (data) setLogs(data as unknown as SessionLogWithAuthor[]);
  };

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
      toast("등록 실패: " + error.message, "error");
    } else {
      setForm({ title: "", external_url: "", summary: "", session_date: "" });
      setShowForm(false);
      loadLogs();
    }
    setSubmitting(false);
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("이 기록을 삭제할까냥?")) return;

    const { error } = await supabase
      .from("session_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      toast("삭제 실패: " + error.message, "error");
    } else {
      loadLogs();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">
          📜 세션 기록 ({logs.length}개)
        </h2>
        {isMember && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-amber-500 hover:text-amber-600 font-medium"
          >
            + 기록 추가
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-amber-50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-amber-700 font-medium">
            😺 새 세션 기록을 남겨달라냥!
          </p>
          <input
            type="text"
            placeholder="세션 제목 (필수)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <input
            type="url"
            placeholder="외부 링크 (구글독스, 포스타입 등)"
            value={form.external_url}
            onChange={(e) =>
              setForm((p) => ({ ...p, external_url: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <textarea
            placeholder="간단한 요약 (선택)"
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
              {submitting ? "저장 중..." : "기록 저장"}
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
              취소
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
                    삭제
                  </button>
                )}
              </div>

              {log.session_date && (
                <p className="text-xs text-gray-400">
                  📅{" "}
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
                  by {log.author?.nickname ?? "모험가"}
                </span>
                {log.external_url && (
                  <a
                    href={log.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-500 hover:text-amber-600 font-medium"
                  >
                    자세히 보기 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">
          아직 기록이 없다냥... 첫 세션 기록을 남겨봐냥!
        </p>
      )}
    </div>
  );
}
