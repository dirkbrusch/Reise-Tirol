// Wildschoenau Reise-Guide — Service Worker
// Cache-first for static assets; network-first for Open-Meteo weather API.

const CACHE = 'rt-v4';
const PRECACHE = [
  './',
  './index.html',
  'index.html',
  'reiseplan.md',
  'days.json',
  'places.json',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/app.css',
  'assets/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (
    url.hostname.endsWith('fonts.googleapis.com') ||
    url.hostname.endsWith('fonts.gstatic.com') ||
    url.hostname.endsWith('cdn.jsdelivr.net') ||
    url.hostname.endsWith('unpkg.com')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          fetch(req)
            .then((res) => {
              if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
            })
            .catch(() => {});
          return cached;
        }
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
