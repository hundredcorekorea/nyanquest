"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

interface Props {
  systems: { id: string; name: string }[];
}

export default function PartyFilters({ systems }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const meetingTypes = [
    { value: "", label: t("MeetingType.all") },
    { value: "online", label: t("MeetingType.online") },
    { value: "offline", label: t("MeetingType.offline") },
    { value: "hybrid", label: t("MeetingType.hybrid") },
  ];

  const currentMeeting = searchParams.get("meeting") ?? "";
  const currentSystem = searchParams.get("system") ?? "";
  const currentGmWanted = searchParams.get("gm_wanted") === "true";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        {meetingTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => updateFilter("meeting", type.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentMeeting === type.value
                ? "bg-amber-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          updateFilter("gm_wanted", currentGmWanted ? "" : "true")
        }
        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
          currentGmWanted
            ? "bg-purple-500 text-white border-purple-500 shadow-sm"
            : "text-gray-500 hover:text-gray-700 border-gray-200 bg-white"
        }`}
      >
        🎲 {t("Party.gmRecruit")}
      </button>

      <select
        value={currentSystem}
        onChange={(e) => updateFilter("system", e.target.value)}
        className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        <option value="">📖 {t("Party.selectRulebook")}</option>
        {systems.map((sys) => (
          <option key={sys.id} value={sys.id}>
            {sys.name}
          </option>
        ))}
      </select>
    </div>
  );
}
