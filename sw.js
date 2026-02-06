// ملف الخدمة الخلفية (Service Worker) - نظام القمة V4.0 GOLDEN
const CACHE_NAME = 'summit-v4-golden';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // إجبار النسخة الجديدة على العمل فوراً
});

self.addEventListener('activate', (event) => {
  // مسح كافة الكاش القديم فوراً
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية Network-First: حاول دائماً جلب النسخة الأحدث من السيرفر
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});