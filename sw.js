const CACHE = 'tp-v1';
const PRECACHE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Só intercepta GET
  if (req.method !== 'GET') return;
  // Estratégia: Network first → Cache fallback
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || new Response('Offline', { status: 503 })))
  );
});
