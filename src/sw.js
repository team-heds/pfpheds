/// <reference lib="webworker" />
/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'

// ── Workbox Precache ──
// self.__WB_MANIFEST is injected by VitePWA injectManifest. Its revisions
// provide a build-specific name for the runtime navigation cache as well.
const precacheEntries = self.__WB_MANIFEST
const navigationRevision = precacheEntries.reduce((hash, entry) => {
  const value = `${typeof entry === 'string' ? entry : entry.url}:${entry.revision || ''}`
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash
}, 2166136261).toString(36)
const NAVIGATION_CACHE_PREFIX = 'navigation-pages-'
const NAVIGATION_CACHE = `${NAVIGATION_CACHE_PREFIX}${navigationRevision}`

cleanupOutdatedCaches()
precacheAndRoute(precacheEntries)

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
    cacheName: NAVIGATION_CACHE,
    networkTimeoutSeconds: 5,
  })
)

// ── Skip Waiting & Claim ──
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter((cacheName) => cacheName.startsWith(NAVIGATION_CACHE_PREFIX) && cacheName !== NAVIGATION_CACHE)
      .map((cacheName) => caches.delete(cacheName)))
    await self.clients.claim()
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
