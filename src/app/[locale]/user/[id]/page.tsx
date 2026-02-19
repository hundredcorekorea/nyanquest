import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Party } from "@/types/database";
import { fetchGmStats } from "@/lib/gm-stats";
import { getTitleDef } from "@/lib/titles";
import GmStatsBadge from "@/components/GmStatsBadge";
import ProfileActions from "./ProfileActions";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

function getCatLevel(catLevels: { min: number; name: string; emoji: string; title: string }[], exp: number) {
  for (let i = catLevels.length - 1; i >= 0; i--) {
    if (exp >= catLevels[i].min) return catLevels[i];
  }
  return catLevels[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UserProfile");
  const tMyPage = await getTranslations("MyPage");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, manner_temp, cat_exp")
    .eq("id", id)
    .single();

  if (!profile) return { title: "nyanQuest" };

  const CAT_LEVELS = [
    { min: 0, name: tMyPage("catLevel0Name"), emoji: "🐱", title: tMyPage("catLevel0Title") },
    { min: 50, name: tMyPage("catLevel1Name"), emoji: "😺", title: tMyPage("catLevel1Title") },
    { min: 150, name: tMyPage("catLevel2Name"), emoji: "😸", title: tMyPage("catLevel2Title") },
    { min: 300, name: tMyPage("catLevel3Name"), emoji: "😼", title: tMyPage("catLevel3Title") },
    { min: 500, name: tMyPage("catLevel4Name"), emoji: "🧙‍♂️", title: tMyPage("catLevel4Title") },
  ];

  const catLevel = getCatLevel(CAT_LEVELS, profile.cat_exp);
  return {
    title: `${profile.nickname} - nyanQuest`,
    description: `${catLevel.name} | ${t("mannerTemp")} ${profile.manner_temp}° | nyanQuest`,
    openGraph: {
      title: `${profile.nickname} - ${catLevel.name}`,
      description: `${t("mannerTemp")} ${profile.manner_temp}° | ${catLevel.title}`,
      type: "profile",
    },
  };
}

const statusColors: Record<string, string> = {
  recruiting: "text-orange-600 bg-orange-50",
  filled: "text-gray-500 bg-gray-50",
  completed: "text-green-600 bg-green-50",
  cancelled: "text-red-500 bg-red-50",
};

export default async function PublicProfilePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("UserProfile");
  const tStatus = await getTranslations("Status");
  const tTimeAgo = await getTranslations("TimeAgo");
  const tCommon = await getTranslations("Common");
  const tMyPage = await getTranslations("MyPage");

  const statusLabels: Record<string, string> = {
    recruiting: tStatus("recruiting"),
    filled: tStatus("filled"),
    completed: tStatus("completed"),
    cancelled: tStatus("cancelled"),
  };

  const CAT_LEVELS = [
    { min: 0, name: tMyPage("catLevel0Name"), emoji: "🐱", title: tMyPage("catLevel0Title") },
    { min: 50, name: tMyPage("catLevel1Name"), emoji: "😺", title: tMyPage("catLevel1Title") },
    { min: 150, name: tMyPage("catLevel2Name"), emoji: "😸", title: tMyPage("catLevel2Title") },
    { min: 300, name: tMyPage("catLevel3Name"), emoji: "😼", title: tMyPage("catLevel3Title") },
    { min: 500, name: tMyPage("catLevel4Name"), emoji: "🧙‍♂️", title: tMyPage("catLevel4Title") },
  ];

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return tTimeAgo("today");
    if (days < 30) return tTimeAgo("daysAgo", { count: days });
    const months = Math.floor(days / 30);
    return tTimeAgo("monthsAgo", { count: months });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const p = profile as Profile;
  const catLevel = getCatLevel(CAT_LEVELS, p.cat_exp);
  const nextLevel = CAT_LEVELS.find((l) => p.cat_exp < l.min);
  const progress = nextLevel
    ? ((p.cat_exp - catLevel.min) / (nextLevel.min - catLevel.min)) * 100
    : 100;

  // GM parties (GM으로 이끈 모험)
  const { data: gmedParties } = await supabase
    .from("parties")
    .select("id, title, status, system:trpg_systems(name), created_at")
    .eq("gm_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Creator parties (파티장으로 만든 모험 — GM이 아닌 경우만)
  const { data: createdParties } = await supabase
    .from("parties")
    .select("id, title, status, system:trpg_systems(name), created_at")
    .eq("creator_id", id)
    .or(`gm_id.neq.${id},gm_id.is.null`)
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

  // GM stats
  const gmStats = await fetchGmStats(supabase, id);

  type PartyWithSystem = Party & { system?: { name: string } };
  const typedGmedParties = (gmedParties ?? []) as unknown as PartyWithSystem[];
  const typedCreatedParties = (createdParties ?? []) as unknown as PartyWithSystem[];
  const typedPlParties = plParties as unknown as PartyWithSystem[];

  const allCompletedIds = new Set([
    ...typedGmedParties.filter((p) => p.status === "completed").map((p) => p.id),
    ...typedCreatedParties.filter((p) => p.status === "completed").map((p) => p.id),
    ...typedPlParties.filter((p) => p.status === "completed").map((p) => p.id),
  ]);
  const completedCount = allCompletedIds.size;

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100">
              {p.avatar_url ? (
                <Image
                  src={p.avatar_url}
                  alt=""
                  width={80}
                  height={80}
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
            <p className="text-xs text-gray-400 mt-0.5">
              {p.active_title
                ? (() => { const td = getTitleDef(p.active_title); return td ? `${td.emoji} ${td.name}` : catLevel.title; })()
                : catLevel.title}
            </p>

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
                <p className="text-xs text-gray-400">{t("mannerTemp")}</p>
                <p className="text-sm font-bold text-amber-600">
                  {p.manner_temp}°
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t("experience")}</p>
                <p className="text-sm font-bold text-amber-600">
                  {p.cat_exp} EXP
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{t("completedSessions")}</p>
                <p className="text-sm font-bold text-green-600">
                  {completedCount}
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
            {t("receivedReviews", { count: totalReviews })}
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">👍</span>
              <div>
                <p className="text-lg font-bold text-green-600">
                  {positiveCount}
                </p>
                <p className="text-xs text-gray-400">{t("positive")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👎</span>
              <div>
                <p className="text-lg font-bold text-red-500">
                  {negativeCount}
                </p>
                <p className="text-xs text-gray-400">{t("negative")}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center">
              <div className="text-right">
                <p className="text-xs text-gray-400">{t("positiveRate")}</p>
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

      {/* GM Stats */}
      <GmStatsBadge stats={gmStats} variant="detailed" />

      {/* GM Parties */}
      {typedGmedParties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            {t("gmAdventures", { count: typedGmedParties.length })}
          </h2>
          <div className="space-y-2">
            {typedGmedParties.map((party) => (
              <Link key={party.id} href={`/party/${party.id}`}>
                <div className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {party.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {party.system?.name ?? tCommon("undecided")}
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

      {/* Creator Parties (not GM) */}
      {typedCreatedParties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            {t("creatorAdventures", { count: typedCreatedParties.length })}
          </h2>
          <div className="space-y-2">
            {typedCreatedParties.map((party) => (
              <Link key={party.id} href={`/party/${party.id}`}>
                <div className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {party.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {party.system?.name ?? tCommon("undecided")}
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
            {t("plAdventures", { count: typedPlParties.length })}
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
                        {party.system?.name ?? tCommon("undecided")}
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
      {typedGmedParties.length === 0 && typedCreatedParties.length === 0 && typedPlParties.length === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">😿</p>
          <p className="text-sm text-gray-400">{t("noAdventureHistory")}</p>
        </div>
      )}

      {/* Report / Block */}
      <ProfileActions targetUserId={p.id} />

      {/* Join date */}
      <p className="text-xs text-gray-300 text-center">
        {t("joinDate", { date: new Date(p.created_at).toLocaleDateString("ko-KR") })}
      </p>
    </div>
  );
}
