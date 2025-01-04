self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('batt-soc-cache').then((cache) => {
      return cache.addAll([
        '/BattSoC/', // Include subdirectory
        '/BattSoC/index.html',
        '/BattSoC/styles/styles.css',
        '/BattSoC/scripts/script.js',
        '/BattSoC/battsoc.png'
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
