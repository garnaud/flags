const CACHE_NAME = 'flags-quiz-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './world.svg',
];

// Installation : pré-mise en cache des assets statiques critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Stratégie Cache-First pour les images de drapeaux de flagcdn.com
  if (url.origin === 'https://flagcdn.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Si hors-ligne et pas en cache
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // Stratégie Network-First avec fallback sur le cache pour les fichiers de l'application
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (request.method === 'GET' && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback pour la navigation vers index.html en mode hors-ligne
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      })
  );
});
