// 2Ghost Service Worker
// Enables PWA install prompt, offline capability, and auto-update.
// Bump CACHE_VERSION on each deploy so returning users get the new app.

const CACHE_VERSION = "ghost-v1";
const CACHE_NAME = `2ghost-${CACHE_VERSION}`;

// Assets to cache on install for offline use
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Let the client trigger immediate activation when they click "Refresh" for update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests; do not cache non-http(s) URLs (e.g. chrome-extension:)
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  // For navigation requests (HTML pages) — network first, fall back to cached index
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For static assets — cache first (only cache http(s) responses)
  if (
    request.destination === "image" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.url.startsWith("http")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // All other requests — network only (Supabase API calls etc.)
});
