// sw.js
const CACHE = 'app-v2';
const APP_SHELL = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(u => c.add(u).catch(()=>{})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isAPI  = new URL(req.url).pathname.startsWith('/api/');

  if (isHTML || isAPI) {
    // Network-first for HTML pages and APIs
    e.respondWith(
      fetch(req).catch(() => isHTML ? caches.match('/offline.html') : Promise.reject('offline'))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
