/* sw.js — self-destructing service worker.
   The PWA cache layer was removed. This worker deletes all old caches and
   unregisters itself, so previously-cached users immediately start getting
   fresh files straight from the server (no more stale JS/CSS/HTML).
*/

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.navigate(c.url));
  })());
});

// No fetch handler — all requests go straight to the network.
