<template>
  <transition name="pwa-update">
    <aside v-if="visible" class="pwa-update" role="status" aria-live="polite">
      <i class="pi pi-sync pwa-update__icon" aria-hidden="true"></i>
      <span class="pwa-update__text">Une nouvelle version de HEdS est disponible.</span>
      <button type="button" class="pwa-update__apply" :disabled="applying" @click="apply">
        {{ applying ? 'Mise à jour…' : 'Mettre à jour' }}
      </button>
      <button type="button" class="pwa-update__close" aria-label="Plus tard" :disabled="applying" @click="visible = false">
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </aside>
  </transition>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { watchForAppUpdate } from '@/utils/pwaUpdate'

const visible = ref(false)
const applying = ref(false)
let watcher = null

function apply() {
  applying.value = true
  watcher?.applyUpdate()
}

onMounted(() => {
  watcher = watchForAppUpdate({ onUpdateReady: () => { visible.value = true } })
})

onBeforeUnmount(() => watcher?.stop())
</script>

<style scoped>
.pwa-update {
  position: fixed;
  right: 1rem;
  bottom: 2rem;
  left: 1rem;
  z-index: 10000;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  width: min(34rem, calc(100vw - 2rem));
  margin-inline: auto;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  border: 1px solid var(--primary-color);
  border-radius: 1rem;
  background: var(--surface-card);
  color: var(--text-color);
  box-shadow: 0 16px 40px rgba(2, 12, 27, 0.4);
  font-size: 0.95rem;
  line-height: 1.35;
}
.pwa-update__icon { color: var(--primary-color); font-size: 1.15rem; }
.pwa-update__apply {
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 0.6rem;
  background: var(--primary-color);
  color: var(--primary-color-text, #071426);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.pwa-update__apply:disabled { cursor: progress; opacity: 0.7; }
.pwa-update__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
}
.pwa-update__apply:focus-visible,
.pwa-update__close:focus-visible { outline: 3px solid var(--text-color); outline-offset: 2px; }
.pwa-update-enter-active,
.pwa-update-leave-active { transition: opacity 200ms ease, transform 250ms cubic-bezier(0.2, 0, 0, 1); }
.pwa-update-enter-from,
.pwa-update-leave-to { opacity: 0; transform: translateY(1rem); }
/* Téléphone : au-dessus de la barre de navigation du bas. */
@media (max-width: 768px) {
  .pwa-update { bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px)); }
}
@media (max-width: 26rem) {
  .pwa-update { grid-template-columns: auto minmax(0, 1fr) auto; }
  .pwa-update__apply { grid-column: 1 / -1; grid-row: 2; }
  .pwa-update__close { grid-column: 3; grid-row: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pwa-update-enter-active,
  .pwa-update-leave-active { transition: opacity 200ms ease; }
  .pwa-update-enter-from,
  .pwa-update-leave-to { transform: none; }
}
</style>
