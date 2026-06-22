const CACHE = 'eduquest-v2';
const CORE = [
  'EduQuest.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map((u) => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Strategia: Network First — zawsze próbuj pobrać z sieci
  // Cache tylko jako fallback gdy brak internetu
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch {
      const cached = await caches.match(req);
      return cached || new Response('Brak internetu', { status: 503 });
    }
  })());
});
