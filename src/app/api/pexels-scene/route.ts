import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/solo-quest/scenarios";

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

// Server-side in-memory cache: scenarioId -> cached result
const cache = new Map<
  string,
  { url: string; photographer: string; pexelsUrl: string; ts: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Pexels not configured" },
      { status: 503 },
    );
  }

  try {
    const params = new URLSearchParams({
      query: `pixel art ${scenario.sceneKeywords}`,
      per_page: "5",
      orientation: "landscape",
    });

    const res = await fetch(`${PEXELS_API_URL}?${params}`, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      console.error(`[pexels-scene] Pexels API ${res.status}`);
      return NextResponse.json(
        { error: "Pexels API error" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const photos = data.photos;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Pick a random photo from top results for variety
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const result = {
      url: photo.src.landscape as string, // 1200x627
      photographer: photo.photographer as string,
      pexelsUrl: photo.url as string,
      ts: Date.now(),
    };

    cache.set(scenarioId, result);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("[pexels-scene] Fetch error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
