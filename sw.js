const CACHE_NAME = 'eutimya-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Roboto+Flex:opsz,wght@8..144,300;8..144,400;8..144,500;8..144,600;8..144,700&family=Roboto+Mono:wght@400;500&display=swap'
];

// Instalar y cachear recursos básicos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Estrategia: Buscar en red, si falla usar cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
