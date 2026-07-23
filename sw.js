/* Офлайн-кеш приложения. Стратегия «сначала сеть, потом кеш»:
   онлайн всегда свежие файлы, офлайн — последняя рабочая копия.
   Векторные тайлы карты не кешируются (их слишком много). */
const CACHE = 'roadmap-v6';
const ASSETS = ['.', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // тайлы карты — мимо кеша (их тысячи)
  if(url.hostname.includes('arcgisonline.com') || url.hostname.includes('cartocdn.com') || url.hostname.includes('tile.openstreetmap.org')) return;
  const cacheable = url.origin === location.origin ||
    url.hostname.includes('unpkg.com') || url.hostname.includes('fonts.g');
  e.respondWith(
    fetch(e.request).then(r => {
      if(cacheable && (r.ok || r.type === 'opaque')){
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}))
  );
});
