"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const meetingTypes = [
  { value: "", label: "전체" },
  { value: "online", label: "온라인" },
  { value: "offline", label: "오프라인" },
  { value: "hybrid", label: "하이브리드" },
];

interface Props {
  systems: { id: string; name: string }[];
}

export default function PartyFilters({ systems }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMeeting = searchParams.get("meeting") ?? "";
  const currentSystem = searchParams.get("system") ?? "";

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
      {/* Meeting type filter */}
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

      {/* System filter */}
      <select
        value={currentSystem}
        onChange={(e) => updateFilter("system", e.target.value)}
        className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        <option value="">🎲 모든 시스템</option>
        {systems.map((sys) => (
          <option key={sys.id} value={sys.id}>
            {sys.name}
          </option>
        ))}
      </select>
    </div>
  );
}
