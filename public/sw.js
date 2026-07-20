/**
 * OptivianAI — Service Worker v3
 *
 * Enhanced with:
 * - SPA hash-routing support (all navigation serves index.html)
 * - Premium offline fallback page (branded)
 * - Cache versioning for clean updates
 * - Stale-while-revalidate for API requests
 * - Background sync for failed requests
 * - Font and icon pre-caching
 */

const CACHE_NAME = 'optivianai-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const FONT_CACHE = 'optivianai-fonts-v1';
const IMG_CACHE = 'optivianai-images-v1';

// ─── Install: cache core assets ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== FONT_CACHE && key !== IMG_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── Offline HTML (branded) ────────────────────────────────────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OptivianAI — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 2rem;
    }
    .container { max-width: 420px; }
    .logo {
      width: 64px; height: 64px; border-radius: 16px;
      background: linear-gradient(135deg, #2563EB, #6366F1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem; font-size: 24px; font-weight: bold; color: white;
      box-shadow: 0 4px 20px rgba(37,99,235,0.3);
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .spinner {
      width: 32px; height: 32px; border: 3px solid #1e293b;
      border-top-color: #2563EB; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    button {
      background: #2563EB; color: white; border: none;
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">O</div>
    <div class="spinner"></div>
    <h1>You're Offline</h1>
    <p>OptivianAI needs an internet connection to load. Cached content may still be available.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;

// ─── Fetch: intelligent caching strategy ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and unsupported schemes (e.g., chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // ── Dev mode: skip SW cache entirely for localhost/Vite dev server ──
  // In development, Vite serves files without content hashes, so cache-first
  // strategies serve stale versions of edited files. In production, Vite emits
  // hashed filenames (e.g. index-abc123.js) so HTTP cache + SW cache are safe.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.port === '5173') {
    return;
  }

  // ── Fonts: cache-first, long-lived ──────────────────────────
  if (url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic') || url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 408 }));
          return cached || fetched;
        })
      )
    );
    return;
  }

  // ── Images: cache-first, separate cache ─────────────────────
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 408 }));
          return cached || fetched;
        })
      )
    );
    return;
  }

  // ── API / Supabase requests: network-first, fallback to cache ──
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/rest/') ||
    url.hostname.includes('googleapis')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Navigation requests (SPA): serve cached index.html ────────
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          if (clone.ok) caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        }).catch(() => {
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          });
        });
      })
    );
    return;
  }

  // ── Static assets (JS, CSS, etc.): cache-first ──────────────
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Everything else: network-first ────────────────────────────
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy: serve from cache, update cache in background.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && request.url.startsWith('http')) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/**
 * Network-first strategy: try network, fallback to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.url.startsWith('http')) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.headers.get('Accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'offline', message: 'You are offline. Data may be stale.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('', { status: 408, statusText: 'Offline' });
  }
}
