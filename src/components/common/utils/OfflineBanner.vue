<template>
  <transition name="offline-banner">
    <div v-if="visible" class="offline-banner" :class="{ 'offline-banner--back': !offline }" role="status" aria-live="polite">
      <i :class="offline ? 'pi pi-wifi' : 'pi pi-check-circle'" aria-hidden="true"></i>
      <span>{{ offline ? 'Hors ligne : les nouveautés s’afficheront au retour de la connexion.' : 'Connexion rétablie.' }}</span>
    </div>
  </transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const BACK_ONLINE_DELAY = 2500

const offline = ref(typeof navigator !== 'undefined' && navigator.onLine === false)
const visible = ref(offline.value)
let hideTimer = null

function handleOffline() {
  clearTimeout(hideTimer)
  offline.value = true
  visible.value = true
}

function handleOnline() {
  if (!offline.value) return
  offline.value = false
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { visible.value = false }, BACK_ONLINE_DELAY)
}

onMounted(() => {
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + .5rem);
  left: 50%;
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: .6rem;
  width: max-content;
  max-width: calc(100vw - 1.5rem);
  padding: .6rem .9rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--surface-overlay, var(--surface-card));
  color: var(--text-color);
  box-shadow: 0 .5rem 1.5rem rgba(2, 12, 27, .35);
  font-size: .875rem;
  line-height: 1.35;
  transform: translateX(-50%);
}
.offline-banner i { flex: 0 0 auto; color: var(--orange-400, #fb923c); }
.offline-banner--back i { color: var(--green-400, #4ade80); }
.offline-banner-enter-active,
.offline-banner-leave-active { transition: opacity 200ms ease, transform 200ms cubic-bezier(.2, 0, 0, 1); }
.offline-banner-enter-from,
.offline-banner-leave-to { opacity: 0; transform: translate(-50%, -.75rem); }
@media (prefers-reduced-motion: reduce) {
  .offline-banner-enter-active,
  .offline-banner-leave-active { transition: opacity 200ms ease; }
  .offline-banner-enter-from,
  .offline-banner-leave-to { transform: translateX(-50%); }
}
</style>
