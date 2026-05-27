/* sw.js — Service Worker for SN Dashboard PWA
   Strategy: Network-first for API calls, cache-first for static assets.
   This lets the app shell load instantly from cache while data stays fresh.
*/

const CACHE_NAME   = 'sn-dashboard-v1';
const STATIC_CACHE = 'sn-static-v1';

// App shell — files to pre-cache on install
const SHELL_URLS = [
  '/',
  '/dashboard.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/components.css',
  '/css/login.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/router.js',
  '/js/data.js',
  '/js/dashboard-section.js',
  '/js/attendance-section.js',
  '/js/members-section.js',
  '/js/events-section.js',
  '/js/announcements-section.js',
  '/js/zones-section.js',
  '/js/password-section.js',
  '/js/registration-section.js',
  '/js/superhumane-section.js',
  '/icons/icon.svg',
  '/manifest.json',
];

// ── Install: pre-cache app shell ───────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ─
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for API calls — data must be fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, icons)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return dashboard shell for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard.html');
        }
      });
    })
  );
});