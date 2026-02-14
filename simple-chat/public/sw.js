const CACHE_NAME = 'instachat-v8';
const assets = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/192px-Instagram_icon.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/512px-Instagram_icon.png'
];

// 1. Install Event: Assets ne cache ma save kare che
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching assets');
      return cache.addAll(assets);
    })
  );
  self.skipWaiting(); // Turant active thava mate
});

// 2. Activate Event: Juni cache delete kare che
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Badha tabs par turant kabjo levam mate
});

// 3. Fetch Event: Offline support mate
self.addEventListener('fetch', (event) => {
  // Fakt http/https requests ne j handle karo (chrome-extension vagere ne nahi)
  if (!(event.request.url.indexOf('http') === 0)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// 4. Notification Click: Notification par click karata App khulashe
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});