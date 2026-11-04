/* にゃん日和 — offline cache */
const VERSION = 'nyanbiyori-v11';
const SHELL = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/util.js', './js/data.js', './js/audio.js', './js/cat.js', './js/scene.js', './js/habitat.js', './js/apartment.js', './js/painted.js', './art/apartment-night.webp', './js/bond.js', './js/diary.js', './js/minigames.js', './js/game.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google Fonts: stale-while-revalidate so they work offline after first visit
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // app shell: network-first (fresh updates), fall back to cache offline
  e.respondWith(fetch(req).then((r) => {
    const copy = r.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
});
