import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Party, PartyMember } from "@/types/database";
import Link from "next/link";
import JoinPartyButton from "./JoinPartyButton";
import DiscordInvite from "./DiscordInvite";
import ReviewSection from "./ReviewSection";
import SessionLogs from "./SessionLogs";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: party } = await supabase
    .from("parties")
    .select("title, content, system:trpg_systems(name)")
    .eq("id", id)
    .single();

  if (!party) return { title: "nyanQuest" };

  const p = party as unknown as Party;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL("/api/og/party?id=" + id, process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "http://localhost:3000").toString() : ""}`;
  return {
    title: `${p.title} - nyanQuest`,
    description: p.content?.slice(0, 160) ?? "TRPG 파티를 찾아보세요!",
    openGraph: {
      title: p.title,
      description: p.content?.slice(0, 160) ?? "nyanQuest에서 파티원 모집 중!",
      type: "article",
      ...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.content?.slice(0, 160) ?? "nyanQuest에서 파티원 모집 중!",
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };
}

const meetingTypeLabel = {
  online: { text: "온라인", emoji: "💻" },
  offline: { text: "오프라인", emoji: "🏠" },
  hybrid: { text: "하이브리드", emoji: "🔄" },
};

const statusConfig = {
  recruiting: { text: "모집중", color: "bg-orange-100 text-orange-700" },
  filled: { text: "모집완료", color: "bg-gray-100 text-gray-500" },
  completed: { text: "완료", color: "bg-green-100 text-green-700" },
  cancelled: { text: "취소됨", color: "bg-red-100 text-red-500" },
};

export default async function PartyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: party } = await supabase
    .from("parties")
    .select(
      `
      *,
      gm:profiles!parties_gm_id_fkey(*),
      system:trpg_systems(*)
    `
    )
    .eq("id", id)
    .single();

  if (!party) notFound();

  const p = party as unknown as Party;

  const { data: members } = await supabase
    .from("party_members")
    .select("*, user:profiles(*)")
    .eq("party_id", id)
    .eq("status", "accepted");

  const typedMembers = (members ?? []) as unknown as PartyMember[];
  const meeting = meetingTypeLabel[p.meeting_type];
  const status = statusConfig[p.status];
  const systemName = p.system?.name ?? p.custom_system_name ?? "미정";

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      {/* Status & System */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
        >
          {status.text}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
          🎲 {systemName}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
          {meeting.emoji} {meeting.text}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>

      {/* GM info */}
      <Link
        href={`/user/${p.gm_id}`}
        className="flex items-center gap-3 bg-amber-50 rounded-xl p-4 hover:bg-amber-100/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg">
          {p.gm?.avatar_url ? (
            <img
              src={p.gm.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            "🐱"
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {p.gm?.nickname ?? "알 수 없음"}
            <span className="text-xs text-amber-600 ml-2">GM</span>
          </p>
          <p className="text-xs text-amber-600">
            꾹꾹이 온도 {p.gm?.manner_temp ?? 36.5}°
          </p>
        </div>
      </Link>

      {/* Content */}
      {p.content && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {p.content}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-bold text-gray-900 text-sm">모험 정보</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">모집 현황</p>
            <p className="text-lg font-bold text-amber-600">
              {p.current_players}
              <span className="text-sm text-gray-400 font-normal">
                {" "}
                / {p.max_players}명
              </span>
            </p>
          </div>

          {p.scheduled_at && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">예정 일시</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(p.scheduled_at).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {p.location && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">장소</p>
            <p className="text-sm font-medium text-gray-700">
              📍 {p.location}
            </p>
          </div>
        )}
      </div>

      {/* Discord invite */}
      {p.discord_invite_url && (
        <DiscordInvite url={p.discord_invite_url} />
      )}

      {/* Party members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-3">
          파티원 ({typedMembers.length}/{p.max_players + 1})
        </h2>
        <div className="space-y-2">
          {typedMembers.map((m) => (
            <Link
              key={m.id}
              href={`/user/${m.user_id}`}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg py-1 px-1 -mx-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                {m.user?.avatar_url ? (
                  <img
                    src={m.user.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  "🐱"
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {m.user?.nickname ?? "모험가"}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  m.role === "GM"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {m.role}
              </span>
              <span className="text-xs text-amber-500 ml-auto">
                {m.user?.manner_temp ?? 36.5}°
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Session logs */}
      <SessionLogs
        partyId={p.id}
        memberUserIds={typedMembers.map((m) => m.user_id)}
      />

      {/* Reviews (only shown for completed parties) */}
      <ReviewSection
        partyId={p.id}
        partyStatus={p.status}
        members={typedMembers}
      />

      {/* Join button */}
      {p.status === "recruiting" && (
        <JoinPartyButton
          partyId={p.id}
          gmId={p.gm_id}
          maxPlayers={p.max_players}
          currentPlayers={p.current_players}
        />
      )}
    </div>
  );
}
