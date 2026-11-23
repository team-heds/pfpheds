<template>
  <section class="offline-screen" aria-labelledby="offline-screen-title">
    <div class="offline-screen__content">
      <span class="offline-screen__icon" aria-hidden="true"><i class="pi pi-wifi"></i></span>
      <h1 id="offline-screen-title">Vous êtes hors ligne</h1>
      <p>HEdS a besoin d’Internet pour afficher vos données. La page se rechargera dès le retour de la connexion.</p>
      <button type="button" class="offline-screen__retry" :disabled="checking" @click="retry">
        {{ checking ? 'Vérification…' : 'Réessayer' }}
      </button>
      <p class="offline-screen__status" role="status">{{ status }}</p>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { watchConnectivityRecovery } from '@/service/startupConnectivity'

const checking = ref(false)
const status = ref('')
let watcher = null

async function retry() {
  checking.value = true
  status.value = ''
  const recovered = await watcher?.check()
  checking.value = false
  if (!recovered) status.value = 'Toujours pas de connexion.'
}

onMounted(() => {
  watcher = watchConnectivityRecovery({ onRecovered: () => window.location.reload() })
})

onBeforeUnmount(() => watcher?.stop())
</script>

<style scoped>
.offline-screen {
  position: fixed;
  z-index: 9500;
  inset: 0;
  display: grid;
  place-items: center;
  padding:
    max(1.5rem, env(safe-area-inset-top, 0px))
    max(1.5rem, env(safe-area-inset-right, 0px))
    max(1.5rem, env(safe-area-inset-bottom, 0px))
    max(1.5rem, env(safe-area-inset-left, 0px));
  color: var(--app-color-text);
  background: var(--app-color-page);
}

.offline-screen__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 24rem);
  text-align: center;
}

.offline-screen__icon {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-block-end: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-pill);
  color: var(--app-color-text-muted);
  background: var(--app-color-surface);
}

.offline-screen__icon .pi {
  font-size: 1.375rem;
}

h1 {
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: 1.25;
}

p {
  margin: var(--app-space-2) 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9375rem;
  line-height: var(--app-line-height-body);
}

.offline-screen__retry {
  min-width: 9rem;
  min-height: var(--app-touch-target);
  margin-block-start: var(--app-space-6);
  padding: 0 var(--app-space-5);
  border: 0;
  border-radius: var(--app-radius-sm);
  color: var(--app-color-on-brand);
  background: var(--app-color-brand);
  font-weight: var(--app-font-weight-semibold);
  cursor: pointer;
  transition: background-color var(--app-duration-fast) var(--app-ease-standard);
}

.offline-screen__retry:hover:not(:disabled) {
  background: var(--app-color-brand-hover);
}

.offline-screen__retry:disabled {
  cursor: progress;
  opacity: 0.75;
}

.offline-screen__status {
  min-height: 1.5rem;
  font-size: var(--app-font-size-sm);
}
</style>
