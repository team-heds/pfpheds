/// <reference lib="webworker" />
/* eslint-disable no-undef */
const SW_VERSION = '0.2.6';
void SW_VERSION;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    if (self.registration.active === self) {
      await self.clients.claim();
    }
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

// Réception Push
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch(_) { payload = {}; }

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
