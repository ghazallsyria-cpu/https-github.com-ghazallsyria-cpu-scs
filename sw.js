// ملف الخدمة الخلفية (Service Worker) - نظام القمة
const CACHE_NAME = 'summit-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker Activated');
});

// التعامل مع حدث دفع الإشعارات من السيرفر
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { 
    title: 'تذكير الحصة القادمة', 
    body: 'لديك حصة ستبدأ قريباً، يرجى الاستعداد.' 
  };

  const options = {
    body: data.body,
    icon: 'https://img.icons8.com/fluency/512/knowledge-sharing.png',
    badge: 'https://img.icons8.com/fluency/128/knowledge-sharing.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'فتح النظام' },
      { action: 'close', title: 'تجاهل' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});