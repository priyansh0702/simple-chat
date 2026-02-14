const CACHE_NAME = 'instachat-v5';
const assets = [
  '/',
  '/index.html'
];

// 1. Install Event: Files ne cache ma save kare che
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
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
});

// 3. Fetch Event: Network na hoy to cache mathi load kare
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. Push Notification Event: Background notification mate
self.addEventListener('push', (event) => {
    const options = {
        body: 'New notification from private-insta',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/192px-Instagram_icon.png',
        badge: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/192px-Instagram_icon.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification('Private-Insta', options)
    );
});

// 5. Notification Click Event: Notification par click karta app khulve
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