/// <reference lib="webworker" />
/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// ── Workbox Precache ──
// self.__WB_MANIFEST is injected by VitePWA injectManifest
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ── Runtime Caching ──
// Supabase API: never cache
registerRoute(
  /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/.*$/,
  new NetworkOnly({ cacheName: 'supabase-api' })
)

// Same-origin resources: network first with 3s timeout
registerRoute(
  ({ url }) => url.origin === self.location.origin && !url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'static-resources',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
)

// ── Skip Waiting & Claim ──
self.skipWaiting()
self.clients.claim()

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch (_) {}

  const title = payload.title || 'Notification'
  const options = {
    body: payload.body || '',
    icon: '/assets/images/hespicto.png',
    badge: '/assets/images/hespicto.png',
    data: { url: payload.url || '/' },
    actions: payload.actions || []
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification Click ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    const target = all.find(c => new URL(c.url).pathname === new URL(url, self.location.origin).pathname)
    if (target) return target.focus()
    return clients.openWindow(url)
  })())
})
