const CACHE = 'rancho-ovino-v1';
const ASSETS = [
  '/', '/index.html',
  '/css/base.css', '/css/components.css', '/css/auth.css',
  '/js/config.js', '/js/utils.js', '/js/animales.js',
  '/js/reproduccion.js', '/js/produccion.js', '/js/salud.js',
  '/js/ventas.js', '/js/dashboard.js', '/js/realtime.js',
  '/js/app.js', '/js/auth.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
