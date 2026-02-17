import { createClient } from "@/lib/supabase/server";
import CatMascot from "@/components/CatMascot";
import PartyCard from "@/components/PartyCard";
import PartyFilters from "@/components/PartyFilters";
import { Suspense } from "react";
import type { Party, TrpgSystem } from "@/types/database";

interface SearchParams {
  meeting?: string;
  system?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
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
      gm:profiles!parties_gm_id_fkey(*),
      system:trpg_systems(*)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  // Apply filters
  if (params.meeting) {
    query = query.eq("meeting_type", params.meeting);
  }
  if (params.system) {
    query = query.eq("system_id", params.system);
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
          (parties as Party[]).map((party) => (
            <PartyCard key={party.id} party={party} />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😿</div>
            <p className="text-gray-500 font-medium">
              아직 모험이 없다냥...
            </p>
            <p className="text-sm text-gray-400 mt-1">
              첫 번째 파티를 모집해보는 건 어떨까냥?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
