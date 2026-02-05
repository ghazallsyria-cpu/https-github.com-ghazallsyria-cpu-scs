
// ملف الخدمة الخلفية (Service Worker) - نظام القمة V3.5
const CACHE_NAME = 'summit-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker Activated');
});

// التعامل مع حدث دفع الإشعارات من السيرفر (Web Push)
self.addEventListener('push', (event) => {
  let data = { 
    title: 'تنبيه إداري من المنصة', 
    body: 'لديك رسالة جديدة من الإدارة المركزية.' 
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Push data error:", e);
  }

  const options = {
    body: data.body,
    icon: 'https://img.icons8.com/fluency/512/knowledge-sharing.png',
    badge: 'https://img.icons8.com/fluency/128/knowledge-sharing.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'عرض التفاصيل' },
      { action: 'close', title: 'تجاهل' }
    ],
    tag: 'admin-broadcast', // يضمن استبدال الإشعارات القديمة بنفس التاج
    renotify: true
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
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(event.notification.data.url);
      })
    );
  }
});
