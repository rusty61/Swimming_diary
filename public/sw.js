/* public/sw.js */
/* Simple Vite-friendly service worker for offline + caching */

const CACHE_NAME = "blackline-pwa-v1";
const CORE_ASSETS = [
  "/",                 // app shell
  "/index.html",
  "/site.webmanifest",
  "/blackline_transparent_180x180.png",
  "/blackline_transparent_167x167.png",
  "/blackline_transparent_152x152.png",
  "/blackline_transparent_120x120.png",
  "/blackline_transparent_32x32.png",
  "/blackline_transparent_16x16.png",
  "/blackline_favicon.ico"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch:
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests (page loads): network-first, cache fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: cache-first, update in background
  const dest = req.destination; // script, style, image, font, etc.
  if (["script", "style", "image", "font"].includes(dest)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
