const CACHE = 'soulfield-oasis-572855f73c';
const FILES = ["./", "fonts/Andika-Bold.woff2", "fonts/Andika-Regular.woff2", "fonts/Cinzel-Bold.woff2", "fonts/OFL-Andika.txt", "fonts/OFL-Cinzel.txt", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "manifest.webmanifest"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('soulfield-oasis-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || /\.pdf$/i.test(new URL(e.request.url).pathname)) return;
  const same = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (same && res.ok) c.put(e.request, res.clone());
    return res;
  }))));
});
