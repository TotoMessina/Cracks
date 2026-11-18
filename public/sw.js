// Service worker for El Ídolo: lets the game open and play without internet.
// - Pages: network first (always the latest version), cached copy when offline.
// - Built assets (/assets/*, hashed names): cache first, they never change.
// - Google Fonts: served from cache and refreshed in the background.
const CACHE = 'el-idolo-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

// Every built file (including windows that load on demand) so nothing is missing offline
async function precacheAll(cache) {
  await cache.addAll(SHELL);
  try {
    const res = await fetch('/precache-manifest.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { files = [] } = await res.json();
    await Promise.all(files.map((f) => cache.match(f, { ignoreVary: true }).then((hit) => hit || cache.add(f).catch(() => {}))));
  } catch {
    // No manifest (dev): assets get cached as they are used
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(precacheAll).then(() => self.skipWaiting()));
});

async function pruneOldAssets() {
  try {
    const res = await fetch('/precache-manifest.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { files = [] } = await res.json();
    const keep = new Set(files);
    const cache = await caches.open(CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.map((req) => {
      const path = new URL(req.url).pathname;
      return path.startsWith('/assets/') && !keep.has(path) ? cache.delete(req) : null;
    }));
  } catch {
    // offline: keep everything
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('el-idolo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(pruneOldAssets)
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put('/index.html', response.clone());
    return response;
  } catch {
    return (await cache.match('/index.html', { ignoreVary: true })) || (await cache.match('/', { ignoreVary: true })) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(url.pathname.startsWith('/assets/') ? cacheFirst(request) : staleWhileRevalidate(request));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// The page asks for a refresh of the offline copy on every visit (new versions add new files)
self.addEventListener('message', (event) => {
  if (event.data === 'refresh-offline-copy') {
    event.waitUntil(caches.open(CACHE).then(precacheAll).then(pruneOldAssets));
  }
});
