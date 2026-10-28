// Офлайн-кеш справочника. Версию меняет build.py при каждой сборке.
const VERSION = 'scb-dc8e217846';
const CORE = ['./', './index.html', './app.bin', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './bg.jpg', './bgb.jpg', './fonts/onest.woff', './fonts/unbounded.woff', './fonts/jbmono.woff'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'scb-pages').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin && /\/(p\/\d+\/\d+|d\/[a-z]+-[0-9a-f]+)\.bin$/.test(url.pathname)) {
    // Страницы книг не меняются: сначала из кеша, иначе из сети — и запоминаем (кеш страниц не чистится при обновлениях).
    e.respondWith(caches.open('scb-pages').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin === self.location.origin) {
    // Своё: сначала сеть (с проверкой изменений — без лишней загрузки), без сети — из кеша.
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }
        // Сервер ответил ошибкой (например, во время обновления сайта) — отдаём сохранённую копию.
        return caches.match(req, { ignoreSearch: true }).then((hit) => hit || res);
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }
  // Шрифты и библиотеки: из кеша, а при первом заходе — из сети с сохранением.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
