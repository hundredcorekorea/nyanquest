"use client";

import type { Party } from "@/types/database";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

export default function PartyCard({ party }: { party: Party }) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";

  const meetingTypeLabel = {
    online: { text: t("MeetingType.online"), color: "bg-blue-100 text-blue-700" },
    offline: { text: t("MeetingType.offline"), color: "bg-green-100 text-green-700" },
    hybrid: { text: t("MeetingType.hybrid"), color: "bg-purple-100 text-purple-700" },
  };

  const statusLabel = {
    recruiting: { text: t("Status.recruiting"), color: "bg-orange-100 text-orange-700" },
    filled: { text: t("Status.filled"), color: "bg-gray-100 text-gray-500" },
    completed: { text: t("Status.completed"), color: "bg-green-100 text-green-700" },
    cancelled: { text: t("Status.cancelled"), color: "bg-red-100 text-red-500" },
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return t("TimeAgo.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("TimeAgo.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("TimeAgo.daysAgo", { count: days });
  }

  const meeting = meetingTypeLabel[party.meeting_type];
  const status = statusLabel[party.status];
  const systemName =
    party.system?.name ?? party.custom_system_name ?? t("Common.undecided");

  return (
    <Link href={`/party/${party.id}`}>
      <div className="relative bg-white rounded-2xl border border-amber-200/80 p-5 hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer group overflow-hidden">
        <div className="absolute top-0 right-0 w-10 h-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-0 h-0 border-t-20 border-t-amber-100/60 border-l-20 border-l-transparent" />
        </div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.text}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meeting.color}`}>
              {meeting.text}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {timeAgo(party.created_at)}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
          {party.title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100/80">
            📖 {systemName}
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
            ⚔️ {party.current_players}/{party.max_players}{t("Common.personUnit")}
          </span>
          {party.looking_for_gm && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg border border-purple-100/80">
              🎲 {t("Party.lookingForGm")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-amber-100/50">
          <div className="flex items-center gap-2">
            {party.creator?.avatar_url ? (
              <Image
                src={party.creator.avatar_url}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs">
                🐱
              </div>
            )}
            <span className="text-sm text-gray-600">
              {party.creator?.nickname ?? party.gm?.nickname ?? t("Common.unknown")}
            </span>
            {(party.creator || party.gm) && (
              <span className="text-xs text-amber-500">
                {(party.creator?.manner_temp ?? party.gm?.manner_temp) ?? 36.5}°
              </span>
            )}
          </div>

          {party.scheduled_at && (
            <span className="text-xs text-gray-400">
              📅{" "}
              {new Date(party.scheduled_at).toLocaleDateString(dateLocale, {
                month: "short",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
