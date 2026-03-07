import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://nyanquest.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["ko", "en"];
  const now = new Date().toISOString();

  // Static pages that should be indexed
  const staticRoutes = [
    "", // home
    "/community",
    "/solo",
    "/premium",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : route === "/community" ? "hourly" : "monthly",
        priority: route === "" ? 1.0 : route === "/solo" ? 0.9 : route === "/community" ? 0.8 : 0.5,
      });
    }
  }

  // Dynamic routes: community scenarios
  try {
    const supabase = createAdminClient();
    const { data: scenarios } = await supabase
      .from("community_scenarios")
      .select("id, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (scenarios) {
      for (const s of scenarios) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/community/${s.id}`,
            lastModified: s.updated_at || now,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }

    // Dynamic routes: scenarios (built-in)
    const { data: builtInScenarios } = await supabase
      .from("scenarios")
      .select("id, updated_at")
      .limit(100);

    if (builtInScenarios) {
      for (const s of builtInScenarios) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/scenarios/${s.id}`,
            lastModified: s.updated_at || now,
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Sitemap should never fail — return static entries only
  }

  return entries;
}
