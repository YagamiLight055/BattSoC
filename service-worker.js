self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('batt-soc-cache').then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'styles.css',
        'script.js',
        'battsoc.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

