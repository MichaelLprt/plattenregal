// Offline-Cache für die App-Dateien. Discogs-Anfragen werden nie gecacht.
// Bei jedem Update die Zahl erhöhen (gleiche Zahl wie APP_VERSION in index.html) –
// daran erkennt das iPhone, dass es eine neue Version gibt.
// Wichtig: Dieser Service Worker fasst die gespeicherten Platten (IndexedDB) nie an.
const CACHE = 'plattenregal-v8';
const SHELL = ['./', './index.html', './zxing.min.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cache: 'reload' = am Browser-Zwischenspeicher vorbei direkt vom Server holen
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Netz zuerst (damit Updates ankommen), sonst Cache.
  // cache: 'no-cache' = beim Server nachfragen, ob es Neues gibt (GitHub Pages liefert sonst bis zu 10 Min. alte Dateien)
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
