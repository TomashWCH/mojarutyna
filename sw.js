const CACHE = 'eduquest-v3';
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

// Powiadomienia — odbiera wiadomość z apki i wyświetla notyfikację
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'NOTIFY') return;
  const { title, body, tag } = e.data;
  self.registration.showNotification(title, {
    body,
    tag,              // ten sam tag zapobiega duplikatom
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  });
});

// Klik w powiadomienie → otwiera apkę
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const c = clients.find(c => c.url.includes('EduQuest'));
      if (c) return c.focus();
      return self.clients.openWindow('EduQuest.html');
    })
  );
});
