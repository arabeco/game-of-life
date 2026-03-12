const CACHE_VERSION = 'glyph-app-v5';
const SUPABASE_CACHE = 'glyph-supabase-assets-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo-diamond.png',
  '/logo-core.png'
];

// Pattern to detect Supabase Storage public URLs
const SUPABASE_STORAGE_PATTERN = 'supabase.co/storage/v1/object/public/';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        // Keep only current caches
        if (key === CACHE_VERSION || key === SUPABASE_CACHE) return null;
        return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  const reqUrl = new URL(url);

  if (reqUrl.origin === self.location.origin && reqUrl.pathname === '/favicon.ico') {
    event.respondWith(
      caches.match('/logo-diamond.png').then(cached => {
        if (cached) return cached;
        return fetch('/logo-diamond.png').catch(() => new Response('', { status: 204 }));
      })
    );
    return;
  }

  // ─── SUPABASE STORAGE: Cache-First ───
  // Images and videos from Supabase are cached locally forever.
  // On first load they download once; every subsequent load serves from cache.
  if (url.includes(SUPABASE_STORAGE_PATTERN)) {
    event.respondWith(
      caches.open(SUPABASE_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached; // HIT → instant, zero egress
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // ─── NAVIGATION: Network-First with offline fallback ───
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // ─── SAME-ORIGIN STATIC: Cache-First ───
  if (reqUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).catch(() => {
          if (event.request.destination === 'image') {
            return caches.match('/logo-diamond.png').then(image => image || new Response('', { status: 204 }));
          }
          return new Response('', { status: 204 });
        });
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  const targetUrl = event.notification?.data?.url || '/';
  event.notification.close();

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of clientList) {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin !== self.location.origin) continue;

      try {
        await client.focus();
      } catch (error) {
        console.warn('Could not focus client:', error);
      }

      if ('navigate' in client) {
        try {
          await client.navigate(targetUrl);
        } catch (error) {
          console.warn('Could not navigate client:', error);
        }
      }

      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
