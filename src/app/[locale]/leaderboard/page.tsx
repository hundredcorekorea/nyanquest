"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getCatRank, getRankShareText } from "@/lib/cat-ranks";
import { getTitleDef } from "@/lib/titles";
import { isTossApp, tossShare, tossOpenLeaderboard } from "@/lib/toss";

interface LeaderEntry {
  id: string;
  nickname: string;
  avatar_url: string | null;
  cat_exp: number;
  active_title: string | null;
}

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isKo = locale === "ko";

  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myProfile, setMyProfile] = useState<LeaderEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setLeaders(data.leaders || []);
        setMyRank(data.myRank);
        setMyProfile(data.myProfile);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleShareRank() {
    if (!myProfile) return;
    const text = getRankShareText(myProfile.cat_exp, isKo ? "ko" : "en");
    await tossShare(text);
  }

  if (loading) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🏆</div>
        <p className="text-sm text-gray-400 mt-2">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-xl font-bold text-gray-900">🏆 {t("title")}</h1>
        <p className="text-xs text-gray-500">{t("subtitle")}</p>
        {isTossApp() && (
          <button
            onClick={() => tossOpenLeaderboard()}
            className="mt-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition-colors"
          >
            {isKo ? "토스 전체 랭킹 보기" : "View Toss Rankings"}
          </button>
        )}
      </div>

      {/* My Rank Card */}
      {myProfile && myRank && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-amber-600">#{myRank}</div>
              <div>
                <p className="text-sm font-bold text-gray-900">{myProfile.nickname}</p>
                <RankBadge exp={myProfile.cat_exp} locale={isKo ? "ko" : "en"} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-600">{myProfile.cat_exp.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">EXP</p>
            </div>
          </div>
          <button
            onClick={handleShareRank}
            className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition-colors"
          >
            {t("shareMyRank")}
          </button>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-2 pt-2 pb-1">
          <PodiumCard entry={leaders[1]} rank={2} isKo={isKo} />
          <PodiumCard entry={leaders[0]} rank={1} isKo={isKo} isFirst />
          <PodiumCard entry={leaders[2]} rank={3} isKo={isKo} />
        </div>
      )}

      {/* Full Ranking List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {leaders.map((entry, idx) => {
          const rank = idx + 1;
          const catRank = getCatRank(entry.cat_exp);
          const isMe = myProfile?.id === entry.id;

          return (
            <Link
              key={entry.id}
              href={`/user/${entry.id}`}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors hover:bg-gray-50 ${
                isMe ? "bg-amber-50/50" : ""
              }`}
            >
              {/* Rank number */}
              <div className={`w-7 text-center font-bold text-sm ${
                rank === 1 ? "text-amber-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-orange-400" : "text-gray-300"
              }`}>
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
                {entry.avatar_url ? (
                  <Image src={entry.avatar_url} alt="" width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    {catRank.emoji}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.nickname}</p>
                  {isMe && <span className="text-[8px] bg-amber-100 text-amber-600 px-1 rounded font-bold">ME</span>}
                </div>
                <RankBadge exp={entry.cat_exp} locale={isKo ? "ko" : "en"} small />
              </div>

              {/* EXP */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-700">{entry.cat_exp.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">EXP</p>
              </div>
            </Link>
          );
        })}

        {leaders.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">{t("empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────── */

function RankBadge({ exp, locale, small }: { exp: number; locale: "ko" | "en"; small?: boolean }) {
  const rank = getCatRank(exp);
  return (
    <span className={`inline-flex items-center gap-0.5 ${rank.bgColor} ${rank.color} rounded-full font-medium ${
      small ? "text-[9px] px-1.5 py-0" : "text-[10px] px-2 py-0.5"
    }`}>
      {rank.emoji} {locale === "ko" ? rank.name : rank.nameEn}
    </span>
  );
}

function PodiumCard({ entry, rank, isKo, isFirst }: { entry: LeaderEntry; rank: number; isKo: boolean; isFirst?: boolean }) {
  const catRank = getCatRank(entry.cat_exp);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className={`flex flex-col items-center ${isFirst ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className="text-lg mb-1">{medals[rank - 1]}</div>
      <div className={`${isFirst ? "w-16 h-16" : "w-12 h-12"} rounded-full bg-gray-100 overflow-hidden border-2 ${
        isFirst ? "border-amber-400" : rank === 2 ? "border-gray-300" : "border-orange-300"
      }`}>
        {entry.avatar_url ? (
          <Image src={entry.avatar_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl bg-gray-50">
            {catRank.emoji}
          </div>
        )}
      </div>
      <p className={`mt-1 font-bold text-gray-900 truncate max-w-[80px] text-center ${isFirst ? "text-xs" : "text-[10px]"}`}>
        {entry.nickname}
      </p>
      <p className={`font-bold ${isFirst ? "text-sm text-amber-600" : "text-xs text-gray-500"}`}>
        {entry.cat_exp.toLocaleString()}
      </p>
    </div>
  );
}
