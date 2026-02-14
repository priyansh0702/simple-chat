const CACHE_NAME = 'instachat-v3';
const assets = [
  '/',
  '/index.html'
];

// 1. Install Event: Files ne cache ma save kare che
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching shell assets');
      return cache.addAll(assets);
    })
  );
});

// 2. Activate Event: Juni cache ne clear kare che jethi navo code load thay
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event: Network na hoy tyare cache mathi load kare che
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});