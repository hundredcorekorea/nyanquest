"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Party } from "@/types/database";
import PartyCard from "./PartyCard";

const PAGE_SIZE = 20;

interface Props {
  initialCount: number;
  meeting?: string;
  system?: string;
  lang?: string;
}

export default function LoadMoreParties({
  initialCount,
  meeting,
  system,
  lang,
}: Props) {
  const t = useTranslations("Common");
  const supabase = createClient();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCount >= PAGE_SIZE);

  const loadMore = async () => {
    setLoading(true);
    const offset = initialCount + parties.length;

    let query = supabase
      .from("parties")
      .select(
        `*, creator:profiles!parties_creator_id_fkey(*), gm:profiles!parties_gm_id_fkey(*), system:trpg_systems(*)`
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (meeting) query = query.eq("meeting_type", meeting);
    if (system) query = query.eq("system_id", system);
    if (lang && lang !== "all") query = query.eq("language", lang);

    const { data } = await query;

    if (data) {
      setParties((prev) => [...prev, ...(data as unknown as Party[])]);
      setHasMore(data.length >= PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  return (
    <>
      {parties.map((party) => (
        <PartyCard key={party.id} party={party} />
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 rounded-xl border border-amber-200 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-bounce">🐱</span> {t("loading")}
            </span>
          ) : (
            t("loadMore")
          )}
        </button>
      )}
    </>
  );
}
