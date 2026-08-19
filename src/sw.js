/// <reference lib="webworker" />
/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'

// ── Workbox Precache ──
// self.__WB_MANIFEST is injected by VitePWA injectManifest
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ── Runtime Caching ──
const API_PATH_PREFIXES = [
  '/api/',
  '/auth/v1/',
  '/rest/v1/',
  '/storage/v1/',
  '/functions/v1/',
  '/realtime/v1/',
]

const isApiRequest = ({ url }) =>
  API_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
  url.hostname.endsWith('.supabase.co') ||
  url.hostname === 'api2.hedsvs.ch'

// Auth, API and Supabase data must never be served from a cache. This includes
// the self-hosted production gateway as well as hosted Supabase projects.
registerRoute(
  isApiRequest,
  new NetworkOnly()
)

// Only HTML navigations use a runtime cache. Versioned build assets are
// already handled by the precache manifest, avoiding mixed application
// bundles after a deployment.
registerRoute(
  ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: 'navigation-pages',
    networkTimeoutSeconds: 5,
  })
)

// ── Skip Waiting & Claim ──
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.active === self) {
      await self.clients.claim()
    }
  })())
})

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch (_) { payload = {} }

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
