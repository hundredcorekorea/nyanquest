const CACHE_NAME = "nyanquest-v2";
const OFFLINE_URL = "/offline";

// Assets to pre-cache on install
const PRECACHE_ASSETS = ["/", "/offline", "/solo", "/party", "/community"];

// Install: pre-cache essential pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches + claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Navigation preload for faster network fetches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});

// Push notification received
self.addEventListener("push", (event) => {
  const defaultData = { title: "nyanQuest", body: "새 알림이다냥!", url: "/" };
  let data = defaultData;
  try {
    data = event.data ? { ...defaultData, ...event.data.json() } : defaultData;
  } catch {
    data = defaultData;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/favicon-48.png",
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click — navigate to relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip external API calls
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("googlesyndication") ||
    request.url.includes("googleads") ||
    request.url.includes("openrouter.ai")
  )
    return;

  // Navigation: stale-while-revalidate (show cache instantly, update behind)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const preloadResponse = event.preloadResponse
          ? await event.preloadResponse
          : null;

        // Try cache first for instant display
        const cached = await caches.match(request);

        // Fetch in background (use preload if available)
        const networkPromise = (preloadResponse
          ? Promise.resolve(preloadResponse)
          : fetch(request)
        )
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => null);

        // Return cached immediately if available, otherwise wait for network
        if (cached) {
          // Still update cache in background
          networkPromise;
          return cached;
        }

        const networkResponse = await networkPromise;
        if (networkResponse) return networkResponse;

        // Final fallback
        return caches.match(OFFLINE_URL);
      })()
    );
    return;
  }

  // Static assets: cache-first with background update
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        return cached || fetched;
      })
    );
    return;
  }
});
