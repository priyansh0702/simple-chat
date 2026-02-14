const CACHE_NAME = 'instachat-v6';
const assets = [
  '/',
  '/index.html',
  '/manifest.json' // Manifest file nē pan cache mā umero
];

// 1. Install Event: Assets nē cache mā save karē chhe
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching shell assets');
      return cache.addAll(assets);
    })
  );
});

// 2. Activate Event: Junī cache nē delete karē chhe
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event: Offline support māte cache māthī load karē chhe
self.addEventListener('fetch', (event) => {
  if (!(event.request.url.indexOf('http') === 0)) return;
  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request);
    })
  );
});

// 4. Notification Click Event: Notification par click karatā app khulashē
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});