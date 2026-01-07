const CACHE = "pwa-basica-v2";
const ARCHIVOS = ["/", "/index.html", "/manifiesto.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((respuestaCache) => {
      // 1) Si existe en caché, úsalo
      if (respuestaCache) return respuestaCache;

      // 2) Si no está en caché, ve a internet
      return fetch(e.request)
        .then((respuestaRed) => {
          // 3) Guarda una copia en caché para la próxima vez (incluye /assets/*)
          const copia = respuestaRed.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
          return respuestaRed;
        })
        .catch(() => caches.match("/") || caches.match("/index.html"));
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.tipo === "SALTAR_ESPERA") self.skipWaiting();
});
