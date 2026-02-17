import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Party } from "@/types/database";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const CAT_LEVELS = [
  { min: 0, name: "아기 냥이", emoji: "🐱", title: "갓 태어난 모험가" },
  { min: 50, name: "견습 냥이", emoji: "😺", title: "호기심 가득한 탐험가" },
  { min: 150, name: "모험가 냥이", emoji: "😸", title: "믿음직한 파티원" },
  { min: 300, name: "베테랑 냥이", emoji: "😼", title: "역전의 주사위꾼" },
  { min: 500, name: "대마법사 냥이", emoji: "🧙‍♂️", title: "전설의 집사님" },
];

function getCatLevel(exp: number) {
  for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
  }
  return CAT_LEVELS[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, manner_temp, cat_exp")
    .eq("id", id)
    .single();

  if (!profile) return { title: "nyanQuest" };

  const catLevel = getCatLevel(profile.cat_exp);
  return {
    title: `${profile.nickname} - nyanQuest`,
    description: `${catLevel.name} | 꾹꾹이 온도 ${profile.manner_temp}° | nyanQuest 모험가 프로필`,
    openGraph: {
      title: `${profile.nickname} - ${catLevel.name}`,
      description: `꾹꾹이 온도 ${profile.manner_temp}° | ${catLevel.title}`,
      type: "profile",
    },
  };
}

const statusLabels: Record<string, string> = {
  recruiting: "모집중",
  filled: "모집완료",
  completed: "완료",
  cancelled: "취소",
};

const statusColors: Record<string, string> = {
  recruiting: "text-orange-600 bg-orange-50",
  filled: "text-gray-500 bg-gray-50",
  completed: "text-green-600 bg-green-50",
  cancelled: "text-red-500 bg-red-50",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "오늘";
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const p = profile as Profile;
  const catLevel = getCatLevel(p.cat_exp);
  const nextLevel = CAT_LEVELS.find((l) => p.cat_exp < l.min);
  const progress = nextLevel
    ? ((p.cat_exp - catLevel.min) / (nextLevel.min - catLevel.min)) * 100
    : 100;

  // GM parties
  const { data: gmParties } = await supabase
    .from("parties")
    .select("id, title, status, system:trpg_systems(name), created_at")
    .eq("gm_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // PL parties
  const { data: memberships } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", id)
    .eq("role", "PL")
    .eq("status", "accepted");

  let plParties: unknown[] = [];
  if (memberships && memberships.length > 0) {
    const ids = memberships.map((m) => m.party_id);
    const { data } = await supabase
      .from("parties")
      .select("id, title, status, system:trpg_systems(name), created_at")
      .in("id", ids)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) plParties = data;
  }

  // Review stats
  const { data: receivedReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("target_id", id);

  const positiveCount = receivedReviews?.filter((r) => r.rating === 1).length ?? 0;
  const negativeCount = receivedReviews?.filter((r) => r.rating === -1).length ?? 0;
  const totalReviews = (receivedReviews?.length ?? 0);

  const typedGmParties = (gmParties ?? []) as unknown as (Party & { system?: { name: string } })[];
  const typedPlParties = plParties as unknown as (Party & { system?: { name: string } })[];

  const completedCount = [
    ...typedGmParties.filter((p) => p.status === "completed"),
    ...typedPlParties.filter((p) => p.status === "completed"),
  ].length;

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-2xl"
                />
              ) : (
                catLevel.emoji
              )}
            </div>
            <span className="text-xs font-medium text-amber-600">
              {catLevel.name}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl text-gray-900">{p.nickname}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{catLevel.title}</p>

            {p.style_tags && p.style_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.style_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/80 text-amber-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-400">꾹꾹이 온도</p>
                <p className="text-sm font-bold text-amber-600">
                  {p.manner_temp}°
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">경험치</p>
                <p className="text-sm font-bold text-amber-600">
                  {p.cat_exp} EXP
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">완료 세션</p>
                <p className="text-sm font-bold text-green-600">
                  {completedCount}회
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* EXP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{catLevel.name}</span>
            <span>{nextLevel ? nextLevel.name : "MAX"}</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Review Summary */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            받은 리뷰 ({totalReviews}개)
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">👍</span>
              <div>
                <p className="text-lg font-bold text-green-600">
                  {positiveCount}
                </p>
                <p className="text-xs text-gray-400">좋았다냥</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👎</span>
              <div>
                <p className="text-lg font-bold text-red-500">
                  {negativeCount}
                </p>
                <p className="text-xs text-gray-400">아쉽다냥</p>
              </div>
            </div>
            <div className="ml-auto flex items-center">
              <div className="text-right">
                <p className="text-xs text-gray-400">긍정률</p>
                <p className="text-lg font-bold text-amber-600">
                  {totalReviews > 0
                    ? Math.round((positiveCount / totalReviews) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GM Parties */}
      {typedGmParties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            GM으로 이끈 모험 ({typedGmParties.length})
          </h2>
          <div className="space-y-2">
            {typedGmParties.map((party) => (
              <Link key={party.id} href={`/party/${party.id}`}>
                <div className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {party.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {party.system?.name ?? "미정"}
                      </span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColors[party.status] ?? ""}`}
                      >
                        {statusLabels[party.status]}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">
                    {timeAgo(party.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* PL Parties */}
      {typedPlParties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            PL로 참여한 모험 ({typedPlParties.length})
          </h2>
          <div className="space-y-2">
            {typedPlParties.map((party) => (
              <Link key={party.id} href={`/party/${party.id}`}>
                <div className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {party.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {party.system?.name ?? "미정"}
                      </span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColors[party.status] ?? ""}`}
                      >
                        {statusLabels[party.status]}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">
                    {timeAgo(party.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {typedGmParties.length === 0 && typedPlParties.length === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">😿</p>
          <p className="text-sm text-gray-400">아직 모험 기록이 없다냥...</p>
        </div>
      )}

      {/* Join date */}
      <p className="text-xs text-gray-300 text-center">
        가입일: {new Date(p.created_at).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
