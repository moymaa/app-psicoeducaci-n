const CACHE_NAME = 'eutimya-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar: cachear recursos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar cachés viejos y tomar control inmediato
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first para HTML, Cache-first para todo lo demás
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen o fuentes confiables
  if (request.method !== 'GET') return;

  // Estrategia según el tipo de recurso
  if (url.origin === self.location.origin) {
    // Network-first para páginas HTML
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Cache-first para recursos externos (fuentes, etc.)
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
