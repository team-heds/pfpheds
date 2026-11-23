<template>
  <transition name="offline-banner">
    <div
      v-if="visible && isMyTurn"
      class="offline-banner p-message"
      :class="offline ? 'p-message-error' : 'p-message-success'"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="p-message-wrapper">
        <i
          :class="offline ? 'pi pi-wifi' : 'pi pi-check-circle'"
          class="p-message-icon"
          aria-hidden="true"
        ></i>
        <span>{{ offline ? 'Connexion Internet perdue. Tentative de reconnexion en cours…' : 'Connexion rétablie.' }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { activeAnnouncement, hideAnnouncement, showAnnouncement } from '@/utils/announcementQueue'

const OFFLINE_DISPLAY_DELAY = 2500
const ONLINE_DISPLAY_DURATION = 3000
// Connexion normale : une vérification par minute suffit, les événements
// online/offline du navigateur signalent déjà les coupures franches.
// Après un échec, on vérifie toutes les 5 secondes jusqu'au retour.
const PROBE_INTERVAL_ONLINE = 60000
const PROBE_INTERVAL_RECOVERY = 5000
const PROBE_TIMEOUT = 3000
const FAILURES_BEFORE_OFFLINE = 2

const offline = ref(typeof navigator !== 'undefined' && navigator.onLine === false)
const visible = ref(offline.value)
const isMyTurn = computed(() => activeAnnouncement.value === 'offline')
watch(visible, (shown) => (shown ? showAnnouncement('offline') : hideAnnouncement('offline')), { immediate: true, flush: 'sync' })
let hideTimer = null
let offlineTimer = null
let probeTimer = null
let activeController = null
let consecutiveFailures = 0
let wasOffline = offline.value
let mounted = false

function clearOfflineTimer() {
  clearTimeout(offlineTimer)
  offlineTimer = null
}

function markOffline() {
  if (offline.value || offlineTimer) return
  clearTimeout(hideTimer)
  hideTimer = null
  offlineTimer = setTimeout(() => {
    offline.value = true
    visible.value = true
    wasOffline = true
    offlineTimer = null
  }, OFFLINE_DISPLAY_DELAY)
}

function markOnline() {
  consecutiveFailures = 0
  clearOfflineTimer()
  if (!offline.value && !wasOffline) return

  offline.value = false
  visible.value = true
  wasOffline = false
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
    hideTimer = null
  }, ONLINE_DISPLAY_DURATION)
}

async function checkConnection() {
  if (!mounted || activeController) return

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    consecutiveFailures = FAILURES_BEFORE_OFFLINE
    markOffline()
    scheduleProbe()
    return
  }

  const controller = new AbortController()
  activeController = controller
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT)

  try {
    // Any HTTP response confirms that this app's origin is reachable.
    await fetch(window.location.origin, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
    markOnline()
  } catch {
    consecutiveFailures += 1
    if (consecutiveFailures >= FAILURES_BEFORE_OFFLINE) markOffline()
  } finally {
    clearTimeout(timeout)
    if (activeController === controller) activeController = null
    scheduleProbe()
  }
}

function isPageHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

function scheduleProbe() {
  clearTimeout(probeTimer)
  probeTimer = null
  // Onglet en arrière-plan ou application mise de côté : aucune requête.
  if (!mounted || isPageHidden()) return
  const recovering = offline.value || consecutiveFailures > 0 || Boolean(offlineTimer)
  probeTimer = setTimeout(() => { void checkConnection() }, recovering ? PROBE_INTERVAL_RECOVERY : PROBE_INTERVAL_ONLINE)
}

function handleVisibilityChange() {
  if (isPageHidden()) {
    clearTimeout(probeTimer)
    probeTimer = null
    return
  }
  // Retour sur la page : on vérifie tout de suite, puis le rythme reprend.
  void checkConnection()
}

function handleOffline() {
  consecutiveFailures = FAILURES_BEFORE_OFFLINE
  markOffline()
  scheduleProbe()
}

function handleOnline() {
  // navigator.onLine is only a hint; the origin probe confirms recovery.
  void checkConnection()
}

onMounted(() => {
  mounted = true
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (offline.value) void checkConnection()
  else scheduleProbe()
})

onBeforeUnmount(() => {
  mounted = false
  hideAnnouncement('offline')
  clearTimeout(hideTimer)
  clearOfflineTimer()
  clearTimeout(probeTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  activeController?.abort()
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})
</script>

<style scoped>
.offline-banner {
  position: fixed;
  z-index: 9000;
  inset-block-start: max(20px, calc(env(safe-area-inset-top, 0px) + .5rem));
  inset-inline-start: 50%;
  width: max-content;
  max-width: calc(100vw - 2rem);
  margin: 0;
  border-radius: var(--border-radius, 6px);
  box-shadow: 0 .5rem 1.5rem rgba(2, 12, 27, .25);
  transform: translateX(-50%);
}

/* Le thème donne aux messages un fond à 20 % d'opacité : posée sur la barre
   de navigation, la bannière laissait voir les icônes à travers son texte.
   Fond plein, teinté avec la couleur du message (erreur ou succès). */
.offline-banner.p-message {
  background: color-mix(in srgb, currentColor 16%, var(--surface-overlay, var(--surface-card, #071426)));
}

.offline-banner :deep(.p-message-wrapper) {
  gap: .65rem;
  padding: .75rem 1rem;
}

.offline-banner-enter-active,
.offline-banner-leave-active {
  transition: opacity 200ms ease, transform 200ms cubic-bezier(.2, 0, 0, 1);
}

.offline-banner-enter-from,
.offline-banner-leave-to {
  opacity: 0;
  transform: translate(-50%, -.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .offline-banner-enter-active,
  .offline-banner-leave-active {
    transition: opacity 200ms ease;
  }

  .offline-banner-enter-from,
  .offline-banner-leave-to {
    transform: translateX(-50%);
  }
}
</style>
