import type { Party } from "@/types/database";
import Link from "next/link";

const meetingTypeLabel = {
  online: { text: "온라인", color: "bg-blue-100 text-blue-700" },
  offline: { text: "오프라인", color: "bg-green-100 text-green-700" },
  hybrid: { text: "하이브리드", color: "bg-purple-100 text-purple-700" },
};

const statusLabel = {
  recruiting: { text: "모집중", color: "bg-orange-100 text-orange-700" },
  filled: { text: "모집완료", color: "bg-gray-100 text-gray-500" },
  completed: { text: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { text: "취소됨", color: "bg-red-100 text-red-500" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function PartyCard({ party }: { party: Party }) {
  const meeting = meetingTypeLabel[party.meeting_type];
  const status = statusLabel[party.status];
  const systemName =
    party.system?.name ?? party.custom_system_name ?? "미정";

  return (
    <Link href={`/party/${party.id}`}>
      <div className="bg-white rounded-2xl border border-amber-100 p-5 hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
            >
              {status.text}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${meeting.color}`}
            >
              {meeting.text}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {timeAgo(party.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
          {party.title}
        </h3>

        {/* System tag */}
        <div className="mb-3">
          <span className="inline-block text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">
            🎲 {systemName}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {party.gm?.avatar_url ? (
              <img
                src={party.gm.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs">
                🐱
              </div>
            )}
            <span className="text-sm text-gray-600">
              {party.gm?.nickname ?? "알 수 없음"}
            </span>
            {party.gm && (
              <span className="text-xs text-amber-500">
                {party.gm.manner_temp}°
              </span>
            )}
          </div>

          {/* Player count */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-amber-600">
              {party.current_players}
            </span>
            <span className="text-sm text-gray-400">
              / {party.max_players}명
            </span>
          </div>
        </div>

        {/* Scheduled date */}
        {party.scheduled_at && (
          <div className="mt-3 pt-3 border-t border-amber-50 text-xs text-gray-400">
            📅{" "}
            {new Date(party.scheduled_at).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
