const CACHE_NAME = 'penguin-finance-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/images/icon.png',
];

self.addEventListener('install', (event) => {
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 激活后立即接管所有页面
  event.waitUntil(
    Promise.all([
      // 删除旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // 立即接管所有客户端
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests - always go to network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    // 优先使用网络，失败时使用缓存
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || fetch(event.request);
        });
      })
  );
});
