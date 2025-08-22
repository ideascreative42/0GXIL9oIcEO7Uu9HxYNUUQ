// v-safe-2 — caches only static assets, never APIs (archives/login/etc.)
const STATIC_CACHE = 'static-v2';
const STATIC_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/install.js',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/maskable-192.png', '/icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// DO NOT touch API calls (keeps cookies intact)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Bypass APIs and HTML navigations → let browser hit network with credentials
  if (
    url.pathname.startsWith('/archives') ||
    url.pathname.startsWith('/story') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup') ||
    url.pathname.startsWith('/newstory')
  ) return;

  // Cache-first only for GET static files
  if (event.request.method === 'GET') {
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const resp = await fetch(event.request); // preserves credentials if any
        // Optionally cache only same-origin static files
        return resp;
      } catch {
        // Optional: return offline fallback for navigations
        return cached || Response.error();
      }
    })());
  }
});
