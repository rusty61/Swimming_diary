/* public/sw.js */
/* PWA SW: keeps home-screen app in sync with latest deploy */

const SW_VERSION = "v2";                // <<< bump this on every deploy
const CACHE_NAME = `blackline-pwa-${SW_VERSION}`;

// Only icons/manifest here. DON'T pin /index.html long-term.
const CORE_ASSETS = [
  "/site.webmanifest",
  "/blackline_transparent_180x180.png",
  "/blackline_transparent_167x167.png",
  "/blackline_transparent_152x152.png",
  "/blackline_transparent_120x120.png",
  "/blackline_transparent_32x32.png",
  "/blackline_transparent_16x16.png",
  "/blackline_favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // 1) HTML / navigation: ALWAYS network-first.
  if (req.mode === "navigate" || req.destination === "document") {
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

  // 2) Static assets (scripts/styles/images/fonts): cache-first.
  if (["script", "style", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
  }
});
