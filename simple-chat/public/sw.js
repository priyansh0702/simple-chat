const CACHE_NAME = 'instachat-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/192px-Instagram_icon.png'
];

// Install Service Worker: Files ne cache mā save kare chhe
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch: Jyāre internet na hoy tyāre cache māthī file lochhe
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Activate: Junī cache ne remove karvā māte
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});