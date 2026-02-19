import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nyanQuest - TRPG 파티 찾기",
    short_name: "nyanQuest",
    description: "주사위 굴리는 고양이와 함께 떠나는 모험! TRPG 구인 & 기록 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbeb",
    theme_color: "#f59e0b",
    orientation: "portrait",
    categories: ["games", "social", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/icons/screenshot-narrow.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
