import { createClient } from "@/lib/supabase/server";
import CatMascot from "@/components/CatMascot";
import PartyCard from "@/components/PartyCard";
import PartyFilters from "@/components/PartyFilters";
import LoadMoreParties from "@/components/LoadMoreParties";
import { Suspense } from "react";
import type { Party, TrpgSystem } from "@/types/database";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface SearchParams {
  meeting?: string;
  system?: string;
  gm_wanted?: string;
}

export default async function HomePage({
  searchParams,
  params: localeParams,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await localeParams;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const supabase = await createClient();

  // Fetch TRPG systems for filter dropdown
  const { data: systems } = await supabase
    .from("trpg_systems")
    .select("id, name")
    .eq("is_official", true)
    .order("name");

  // Build parties query
  let query = supabase
    .from("parties")
    .select(
      `
      *,
      creator:profiles!parties_creator_id_fkey(*),
      gm:profiles!parties_gm_id_fkey(*),
      system:trpg_systems(*)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  // Apply filters
  if (sp.meeting) {
    query = query.eq("meeting_type", sp.meeting);
  }
  if (sp.system) {
    query = query.eq("system_id", sp.system);
  }
  if (sp.gm_wanted === "true") {
    query = query.eq("looking_for_gm", true);
  }

  const { data: parties } = await query;

  return (
    <div className="space-y-6 pb-20">
      {/* Cat mascot greeting */}
      <CatMascot />

      {/* Filters */}
      <Suspense>
        <PartyFilters systems={(systems as TrpgSystem[]) ?? []} />
      </Suspense>

      {/* Party list */}
      <div className="space-y-3">
        {parties && parties.length > 0 ? (
          <>
            {(parties as Party[]).map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
            <LoadMoreParties
              initialCount={parties.length}
              meeting={sp.meeting}
              system={sp.system}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-2">🧙‍♂️</div>
            <div className="text-2xl mb-4">🐱</div>
            <p className="text-gray-500 font-medium">
              {t("emptyBoardTitle")}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t("emptyBoardDesc")} 📜
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
