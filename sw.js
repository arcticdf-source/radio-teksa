const CACHE = 'radioteka-v2';
const PRECACHE = ['/', '/index.html', '/styles.css', '/app.js', '/logo2.jpg'];

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    if (fallbackUrl) {
      return cache.match(fallbackUrl);
    }
    throw error;
  }
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only cache same-origin GET requests; skip audio streams
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request, '/index.html'));
    return;
  }

  const destination = e.request.destination;
  if (destination === 'script' || destination === 'style' || destination === 'image') {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  e.respondWith(networkFirst(e.request));
});
