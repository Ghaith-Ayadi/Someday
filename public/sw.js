// Someday service worker.
// Strategy:
//   - HTML / navigations: network-first, fall back to cached shell (so new deploys are picked up immediately)
//   - /assets/* (hashed JS/CSS): cache-first (immutable)
//   - TMDB images: cache-first
//   - TMDB API: network-first
//   - Supabase: pass through (never cache, never intercept)

const VERSION = "v3";
const APP_SHELL = `someday-shell-${VERSION}`;
const ASSETS = `someday-assets-${VERSION}`;
const TMDB_IMAGES = "tmdb-images-v1";
const TMDB_API = `tmdb-api-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.add("/"))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const allow = new Set([APP_SHELL, ASSETS, TMDB_IMAGES, TMDB_API]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !allow.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept Supabase — auth + realtime must always hit network.
  if (url.hostname.endsWith(".supabase.co")) return;

  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(req, TMDB_IMAGES));
    return;
  }

  if (url.hostname === "api.themoviedb.org") {
    event.respondWith(networkFirst(req, TMDB_API));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Immutable hashed assets — cache-first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(req, ASSETS));
    return;
  }

  // HTML / navigation — network-first so new deploys take effect.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirstShell(req));
    return;
  }
  // Everything else: let the browser handle it normally.
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw new Error("offline and no cache");
  }
}

async function networkFirstShell(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(APP_SHELL);
      cache.put("/", res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(APP_SHELL);
    const cached = await cache.match("/");
    if (cached) return cached;
    return Response.error();
  }
}
