import type { MetadataRoute } from "next";

const BASE_URL = "https://nyanquest.com";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return entries;
}
