"use client";

import type { FavoriteWork } from "@/types/database";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  favoriteWorks: FavoriteWork[];
  preferredElements: string[];
  avoidedElements: string[];
}

export default function PlayProfileDisplay({
  favoriteWorks,
  preferredElements,
  avoidedElements,
}: Props) {
  const t = useTranslations("PlayProfile");
  const locale = useLocale();

  // Build ko↔en tag mapping for display translation
  const koPreferred = ["전술 전투", "던전 탐험", "캐릭터 드라마", "대서사시", "미스터리/추리", "정치/외교", "코미디/유머", "호러/공포", "월드빌딩", "자유도 높은 플레이"];
  const enPreferred = ["Tactical Combat", "Dungeon Crawling", "Character Drama", "Epic Narrative", "Mystery/Investigation", "Politics/Diplomacy", "Comedy/Humor", "Horror", "Worldbuilding", "High Freedom Play"];
  const koAvoided = ["PvP", "과도한 롤플레이 강요", "지나친 전투", "성인 콘텐츠", "하드코어 룰", "즉흥 GM", "긴 세션 (4시간+)"];
  const enAvoided = ["PvP", "Forced Roleplay", "Excessive Combat", "Adult Content", "Hardcore Rules", "Improv GM", "Long Sessions (4h+)"];

  const tagMap = new Map<string, string>();
  if (locale !== "ko") {
    koPreferred.forEach((ko, i) => tagMap.set(ko, enPreferred[i]));
    koAvoided.forEach((ko, i) => tagMap.set(ko, enAvoided[i]));
  } else {
    enPreferred.forEach((en, i) => tagMap.set(en, koPreferred[i]));
    enAvoided.forEach((en, i) => tagMap.set(en, koAvoided[i]));
  }
  const translateTag = (tag: string) => tagMap.get(tag) || tag;

  const hasContent =
    favoriteWorks.length > 0 ||
    preferredElements.length > 0 ||
    avoidedElements.length > 0;

  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
        🎭 {t("title")}
      </h2>

      {/* Favorite Works */}
      {favoriteWorks.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">
            {t("favoriteWorksTitle")}
          </h3>
          <div className="space-y-2">
            {favoriteWorks.map((work, i) => (
              <div
                key={i}
                className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50"
              >
                <p className="text-sm font-medium text-gray-900">
                  {work.title}
                </p>
                {work.reason && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    → {work.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Elements */}
      {preferredElements.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">
            {t("preferredTitle")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {preferredElements.map((el) => (
              <span
                key={el}
                className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100"
              >
                👍 {translateTag(el)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Avoided Elements */}
      {avoidedElements.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">
            {t("avoidedTitle")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {avoidedElements.map((el) => (
              <span
                key={el}
                className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100"
              >
                🚫 {translateTag(el)}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-300 italic">{t("ntcCredit")}</p>
    </div>
  );
}
