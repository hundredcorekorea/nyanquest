import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/solo-quest/scenarios";

const PEXELS_API_URL = "https://api.pexels.com/v1/search";
const FREEPIK_API_URL = "https://api.freepik.com/v1/resources";

// Server-side in-memory cache: scenarioId -> cached result
const cache = new Map<
  string,
  { url: string; photographer: string; pexelsUrl: string; ts: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/** Try Freepik first for pixel art images */
async function tryFreepik(
  keywords: string,
): Promise<{ url: string; photographer: string; pexelsUrl: string } | null> {
  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      term: `pixel art ${keywords}`,
      limit: "5",
      "filters[orientation][landscape]": "1",
    });

    const res = await fetch(`${FREEPIK_API_URL}?${params}`, {
      headers: { "x-freepik-api-key": apiKey },
    });

    if (!res.ok) {
      console.error(`[scene] Freepik API ${res.status}`);
      return null;
    }

    const data = await res.json();
    const items = data.data;
    if (!items || items.length === 0) return null;

    // Pick random from results
    const item = items[Math.floor(Math.random() * items.length)];
    const imgUrl = item.image?.source?.url;
    if (!imgUrl) return null;

    return {
      url: imgUrl,
      photographer: item.author?.name ?? "Freepik",
      pexelsUrl: item.url ?? "https://www.freepik.com",
    };
  } catch (err) {
    console.error("[scene] Freepik error:", err);
    return null;
  }
}

/** Fallback to Pexels for regular photos */
async function tryPexels(
  keywords: string,
): Promise<{ url: string; photographer: string; pexelsUrl: string } | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      query: keywords,
      per_page: "5",
      orientation: "landscape",
    });

    const res = await fetch(`${PEXELS_API_URL}?${params}`, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      console.error(`[scene] Pexels API ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photos = data.photos;
    if (!photos || photos.length === 0) return null;

    const photo = photos[Math.floor(Math.random() * photos.length)];
    return {
      url: photo.src.landscape as string,
      photographer: photo.photographer as string,
      pexelsUrl: photo.url as string,
    };
  } catch (err) {
    console.error("[scene] Pexels error:", err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get("scenarioId");
  if (!scenarioId) {
    return NextResponse.json({ error: "Missing scenarioId" }, { status: 400 });
  }

  // Check server cache
  const cached = cache.get(scenarioId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  const scenario = getScenario(scenarioId);
  if (!scenario?.sceneKeywords) {
    return NextResponse.json({ error: "No scene keywords" }, { status: 404 });
  }

  // Try Freepik (pixel art) first, then fall back to Pexels
  const result =
    (await tryFreepik(scenario.sceneKeywords)) ??
    (await tryPexels(scenario.sceneKeywords));

  if (!result) {
    return NextResponse.json({ error: "No images found" }, { status: 404 });
  }

  const cacheEntry = { ...result, ts: Date.now() };
  cache.set(scenarioId, cacheEntry);

  return NextResponse.json(cacheEntry, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
