import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/my/", "/_next/", "/offline/"],
      },
    ],
    sitemap: "https://nyanquest.vercel.app/sitemap.xml",
  };
}
