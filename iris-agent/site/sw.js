const CACHE = "iris-desk-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./css/iris-tokens.css",
  "./css/style.css",
  "./css/desk-overrides.css",
  "./js/app.js",
  "./js/app.bundle.js",
  "./js/config.js",
  "./js/api-client.js",
  "./js/cache-store.js",
  "./js/posts-service.js",
  "./js/date-utils.js",
  "./js/calendar-view.js",
  "./js/kanban-view.js",
  "./js/detail-panel.js",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.pathname.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
