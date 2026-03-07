import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Party, PartyMember } from "@/types/database";
import { fetchGmStats } from "@/lib/gm-stats";
import { SCENARIOS } from "@/lib/solo-quest/scenarios";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import JoinPartyButton from "./JoinPartyButton";
import StartSessionButton from "./StartSessionButton";
import DeletePartyButton from "./DeletePartyButton";
import DiscordInvite from "./DiscordInvite";
import ReviewSection from "./ReviewSection";
import SessionLogs from "./SessionLogs";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createClient();
  const { data: party } = await supabase
    .from("parties")
    .select("title, content, system:trpg_systems(name)")
    .eq("id", id)
    .single();

  if (!party) return { title: "nyanQuest" };

  const tMeta = await getTranslations({ locale, namespace: "PartyDetail" });
  const p = party as unknown as Party;
  const ogImageUrl = `/api/og/party?id=${id}`;
  return {
    title: `${p.title} - nyanQuest`,
    description: p.content?.slice(0, 160) ?? tMeta("findParty"),
    openGraph: {
      title: p.title,
      description: p.content?.slice(0, 160) ?? tMeta("recruitingParty"),
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.content?.slice(0, 160) ?? tMeta("recruitingParty"),
      images: [ogImageUrl],
    },
  };
}

export default async function PartyDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";

  const t = await getTranslations("PartyDetail");
  const tStatus = await getTranslations("Status");
  const tMeeting = await getTranslations("MeetingType");
  const tCommon = await getTranslations("Common");
  const tParty = await getTranslations("Party");

  const meetingTypeLabel = {
    online: { text: tMeeting("online"), emoji: "💻" },
    offline: { text: tMeeting("offline"), emoji: "🏠" },
    hybrid: { text: tMeeting("hybrid"), emoji: "🔄" },
  };

  const statusConfig = {
    recruiting: { text: tStatus("recruiting"), color: "bg-orange-100 text-orange-700" },
    filled: { text: tStatus("filled"), color: "bg-gray-100 text-gray-500" },
    completed: { text: tStatus("completed"), color: "bg-green-100 text-green-700" },
    cancelled: { text: tStatus("cancelled"), color: "bg-red-100 text-red-500" },
  };

  const supabase = await createClient();

  const { data: party } = await supabase
    .from("parties")
    .select(
      `
      *,
      creator:profiles!parties_creator_id_fkey(*),
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

  // Check if current user is the creator
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isCreator = currentUser?.id === p.creator_id;

  // Count pending join requests
  let pendingCount = 0;
  if (isCreator) {
    const { count } = await supabase
      .from("party_members")
      .select("*", { count: "exact", head: true })
      .eq("party_id", id)
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  // Fetch GM stats if GM is assigned
  const gmStats = p.gm_id ? await fetchGmStats(supabase, p.gm_id) : null;

  const meeting = meetingTypeLabel[p.meeting_type];
  const status = statusConfig[p.status];
  const systemName = p.system?.name ?? p.custom_system_name ?? tCommon("undecided");

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
        {p.looking_for_gm && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
            🎲 {t("gmWanted")}
          </span>
        )}
        {p.use_ai_gm && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            🧙‍♂️ AI GM
          </span>
        )}
        {p.use_ai_gm && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
            {p.play_mode === "realtime" ? `⚡ ${tMeeting("online")}` : `📝 ${tMeeting("async")}`}
          </span>
        )}
        {p.use_ai_gm && p.scenario_id && (() => {
          const sc = SCENARIOS.find((s) => s.id === p.scenario_id);
          return sc ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              {sc.thumbnailEmoji} {locale === "ko" ? sc.titleKo : sc.title}
            </span>
          ) : null;
        })()}
      </div>

      {/* Title + Manage */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
        {isCreator && (
          <Link
            href={`/party/${p.id}/manage`}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            ⚙️ {t("manageParty")}
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full min-w-4.5 h-4.5 px-1">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Creator (파티장) info */}
      <Link
        href={`/user/${p.creator_id}`}
        className="flex items-center gap-3 bg-amber-50 rounded-xl p-4 hover:bg-amber-100/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg">
          {p.creator?.avatar_url ? (
            <Image
              src={p.creator.avatar_url}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            "🐱"
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {p.creator?.nickname ?? tCommon("unknown")}
            <span className="text-xs text-amber-600 ml-2">{tParty("partyLeader")}</span>
            {p.gm_id === p.creator_id && (
              <>
                <span className="text-xs text-purple-600 ml-1">GM</span>
                {gmStats && gmStats.completedSessions > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-1">
                    {t("completedCount", { count: gmStats.completedSessions })}
                  </span>
                )}
              </>
            )}
          </p>
          <p className="text-xs text-amber-600">
            {t("mannerTemp", { temp: p.creator?.manner_temp ?? 36.5 })}
          </p>
        </div>
      </Link>

      {/* GM info (separate from creator) */}
      {p.gm_id && p.gm_id !== p.creator_id && p.gm && (
        <Link
          href={`/user/${p.gm_id}`}
          className="flex items-center gap-3 bg-purple-50 rounded-xl p-4 hover:bg-purple-100/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg">
            {p.gm.avatar_url ? (
              <Image
                src={p.gm.avatar_url}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              "🧙"
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {p.gm.nickname ?? tCommon("unknown")}
              <span className="text-xs text-purple-600 ml-2">GM</span>
              {gmStats && gmStats.completedSessions > 0 && (
                <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full ml-1">
                  {t("completedCount", { count: gmStats.completedSessions })}
                </span>
              )}
            </p>
            <p className="text-xs text-purple-600">
              {t("mannerTemp", { temp: p.gm.manner_temp ?? 36.5 })}
            </p>
          </div>
        </Link>
      )}

      {/* AI GM banner */}
      {p.use_ai_gm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <span className="text-2xl">🧙‍♂️</span>
          <p className="text-sm font-medium text-amber-700 mt-1">
            {t("aiGmSession")}
          </p>
          <p className="text-xs text-amber-500 mt-0.5">
            {p.play_mode === "realtime" ? t("aiGmRealtime") : t("aiGmAsync")}
          </p>
        </div>
      )}

      {/* Looking for GM banner */}
      {!p.gm_id && !p.use_ai_gm && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <span className="text-2xl">🎲</span>
          <p className="text-sm font-medium text-purple-700 mt-1">
            {t("lookingForGmTitle")}
          </p>
          <p className="text-xs text-purple-500 mt-0.5">
            {t("lookingForGmDesc")}
          </p>
        </div>
      )}

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
        <h2 className="font-bold text-gray-900 text-sm">{t("questInfo")}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">{t("recruitmentStatus")}</p>
            <p className="text-lg font-bold text-amber-600">
              {p.current_players}
              <span className="text-sm text-gray-400 font-normal">
                {" "}
                / {p.max_players}{tCommon("personUnit")}
              </span>
            </p>
          </div>

          {p.scheduled_at && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{t("scheduledDate")}</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(p.scheduled_at).toLocaleDateString(dateLocale, {
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
            <p className="text-xs text-gray-400">{t("location")}</p>
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
          {t("partyMembers", { count: typedMembers.length, max: p.max_players + 1 })}
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
                  <Image
                    src={m.user.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  "🐱"
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {m.user?.nickname ?? tCommon("adventurer")}
              </span>
              {m.user_id === p.creator_id && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  {tParty("partyLeader")}
                </span>
              )}
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  m.role === "GM"
                    ? "bg-purple-100 text-purple-700"
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

      {/* Start / Join session button */}
      <StartSessionButton
        partyId={p.id}
        creatorId={p.creator_id}
        useAiGm={!!p.use_ai_gm}
        playMode={p.play_mode ?? "realtime"}
        partyStatus={p.status}
        scenarioId={p.scenario_id}
      />

      {/* Join button */}
      {p.status === "recruiting" && (
        <JoinPartyButton
          partyId={p.id}
          creatorId={p.creator_id}
          gmId={p.gm_id}
          maxPlayers={p.max_players}
          currentPlayers={p.current_players}
          lookingForGm={p.looking_for_gm}
        />
      )}

      {/* Delete (creator only) */}
      <DeletePartyButton partyId={p.id} creatorId={p.creator_id} />
    </div>
  );
}
