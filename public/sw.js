/// <reference lib="webworker" />
/* eslint-disable no-undef */
// VitePWA injectera le precache manifest ici
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// Réception Push
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch(_) {}

  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    icon: '/assets/images/hespicto.png',
    badge: '/assets/images/hespicto.png',
    data: { url: payload.url || '/' },
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const target = all.find(c => new URL(c.url).pathname === new URL(url, self.location.origin).pathname);
    if (target) return target.focus();
    return clients.openWindow(url);
  })());
});
