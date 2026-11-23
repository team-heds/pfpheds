/// <reference lib="webworker" />
/* eslint-disable no-undef */
import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { createNavigationHandler } from '@/utils/navigationFallback'
import { cacheableAssetResponse, isBuildAsset } from '@/utils/assetCache'

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

// Les écrans hors de la coque sont gardés à leur première visite. Leur nom contient
// une empreinte du contenu : une version déployée ne peut pas en remplacer une autre.
registerRoute(
  ({ url }) => isBuildAsset(url, self.location.origin),
  new CacheFirst({
    cacheName: 'app-assets-v1',
    plugins: [
      { cacheWillUpdate: async ({ response }) => cacheableAssetResponse(response) },
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Les navigations HTML ont leur propre cache. Sans réseau, une page jamais visitée reçoit la
// coque précachée : c'est l'application qui affiche alors l'écran « Hors ligne ».
registerRoute(
  ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
  createNavigationHandler({
    strategy: new NetworkFirst({
      cacheName: NAVIGATION_CACHE,
      networkTimeoutSeconds: 5,
    }),
    matchShell: () => matchPrecache('/index.html'),
  })
)

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames
      .filter((cacheName) => cacheName.startsWith(NAVIGATION_CACHE_PREFIX) && cacheName !== NAVIGATION_CACHE)
      .map((cacheName) => caches.delete(cacheName)))
  })())
})

// ── Mise à jour à la demande ──
// Une nouvelle version reste en attente tant que l'utilisateur n'a pas touché
// « Mettre à jour » dans l'application : la page est alors rechargée en entier,
// ce qui évite tout mélange entre ancienne et nouvelle version.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
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
  // Seuls les liens internes au site sont ouverts (protection contre l'hameçonnage).
  let url = '/'
  try {
    const parsed = new URL(event.notification.data?.url || '/', self.location.origin)
    if (parsed.origin === self.location.origin) url = parsed.pathname + parsed.search + parsed.hash
  } catch (e) {
    url = '/'
  }
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    const target = all.find(c => new URL(c.url).pathname === new URL(url, self.location.origin).pathname)
    if (target) return target.focus()
    return clients.openWindow(url)
  })())
})
