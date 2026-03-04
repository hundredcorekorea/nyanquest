import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/solo-quest/scenarios";

const PEXELS_API_URL = "https://api.pexels.com/v1/search";
const FREEPIK_API_URL = "https://api.freepik.com/v1/resources";

interface SceneResult {
  url: string;
  photographer: string;
  pexelsUrl: string;
  source: "freepik" | "pexels";
}

// Server-side in-memory cache: scenarioId -> cached result
const cache = new Map<string, SceneResult & { ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/** Extract 2-3 core descriptive words from scene keywords */
function coreWords(keywords: string, max = 2): string {
  const skip = new Set([
    "dark", "night", "lights", "the", "and", "of", "in", "interior",
  ]);
  return keywords
    .split(" ")
    .filter((w) => !skip.has(w.toLowerCase()))
    .slice(0, max)
    .join(" ");
}

/**
 * Try Freepik for pixel-art style vector backgrounds.
 * Uses genre + simplified keywords with vector content filter.
 */
async function tryFreepik(
  keywords: string,
  genre: string,
): Promise<SceneResult | null> {
  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey) return null;

  // Build a focused search term: "pixel art fantasy dungeon game scene"
  const core = coreWords(keywords);
  const genreSimple = genre.split("/")[0].trim().toLowerCase();
  const term = `pixel art ${genreSimple} ${core} game scene`;

  try {
    const params = new URLSearchParams({
      term,
      limit: "15",
      "filters[orientation][landscape]": "1",
      "filters[content_type][vector]": "1",
    });

    const res = await fetch(`${FREEPIK_API_URL}?${params}`, {
      headers: { "x-freepik-api-key": apiKey },
    });

    if (!res.ok) {
      console.error(`[scene] Freepik API ${res.status} for "${term}"`);
      return null;
    }

    const data = await res.json();
    const items = data.data;
    if (!items || items.length === 0) {
      console.log(`[scene] Freepik: no results for "${term}"`);
      return null;
    }

    // Filter for items with usable images (landscape-ish, decent size)
    const usable = items.filter((item: Record<string, unknown>) => {
      const src = (item.image as Record<string, unknown>)?.source as Record<string, unknown> | undefined;
      if (!src?.url) return false;
      const size = src.size as string | undefined;
      if (!size) return true;
      const [w, h] = size.split("x").map(Number);
      return w >= 400 && w > h; // landscape orientation, decent width
    });

    if (usable.length === 0) {
      console.log(`[scene] Freepik: no usable landscape results for "${term}"`);
      return null;
    }

    const item = usable[Math.floor(Math.random() * usable.length)];
    const imgUrl = (item.image as Record<string, unknown>)?.source as Record<string, unknown>;

    console.log(`[scene] Freepik hit: "${term}" → ${(imgUrl?.size as string) ?? "?"} from ${(item.author as Record<string, unknown>)?.name ?? "unknown"}`);

    return {
      url: imgUrl.url as string,
      photographer: ((item.author as Record<string, unknown>)?.name as string) ?? "Freepik",
      pexelsUrl: (item.url as string) ?? "https://www.freepik.com",
      source: "freepik",
    };
  } catch (err) {
    console.error("[scene] Freepik error:", err);
    return null;
  }
}

/**
 * Pexels for atmospheric/cinematic photos.
 * Dark, moody photos work great as game backgrounds.
 */
async function tryPexels(
  keywords: string,
): Promise<SceneResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      query: `${keywords} cinematic dark moody`,
      per_page: "10",
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
      source: "pexels",
    };
  } catch (err) {
    console.error("[scene] Pexels error:", err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get("scenarioId");
  const directKeywords = request.nextUrl.searchParams.get("keywords");

  if (!scenarioId && !directKeywords) {
    return NextResponse.json({ error: "Missing scenarioId or keywords" }, { status: 400 });
  }

  // Cache key: use keywords if provided, otherwise scenarioId
  const cacheKey = directKeywords
    ? `kw:${directKeywords}`
    : `sc:${scenarioId}`;

  // Check server cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  let keywords: string;
  let genre: string;

  if (directKeywords) {
    // Dynamic scene change: keywords come directly from GM's [SCENE:] tag
    keywords = directKeywords;
    genre = "fantasy"; // default genre for dynamic scenes
    // Try to get genre from scenarioId if also provided
    if (scenarioId) {
      const scenario = getScenario(scenarioId);
      genre = scenario?.genreEn ?? "fantasy";
    }
  } else {
    const scenario = getScenario(scenarioId!);
    if (!scenario?.sceneKeywords) {
      return NextResponse.json({ error: "No scene keywords" }, { status: 404 });
    }
    keywords = scenario.sceneKeywords;
    genre = scenario.genreEn ?? "fantasy";
  }

  // Try Freepik (pixel art vectors) first, then Pexels (atmospheric photos)
  const result =
    (await tryFreepik(keywords, genre)) ??
    (await tryPexels(keywords));

  if (!result) {
    return NextResponse.json({ error: "No images found" }, { status: 404 });
  }

  const cacheEntry = { ...result, ts: Date.now() };
  cache.set(cacheKey, cacheEntry);

  return NextResponse.json(cacheEntry, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
