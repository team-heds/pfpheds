<template>
  <div v-if="visible" class="error-fallback">
    <ErrorState
      title="Cette page n’a pas pu être chargée"
      description="Le serveur n’a pas répondu. Réessayez dans un instant."
      @retry="retry"
    />
    <RouterLink to="/home" class="error-fallback__home">Retour à l’accueil</RouterLink>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ErrorState from '@/components/common/states/ErrorState.vue'
import { pageHealth, pageTextLength, resetPageHealth } from '@/service/pageHealth'

const CHECK_DELAYS_MS = [2500, 6000]
const EMPTY_PAGE_TEXT = 120

const route = useRoute()
const visible = ref(false)
let timers = []

const clearTimers = () => { timers.forEach(clearTimeout); timers = [] }

function check() {
  if (!pageHealth.failures) return
  visible.value = pageTextLength(document.getElementById('main-content')) < EMPTY_PAGE_TEXT
}

watch(() => route.fullPath, () => {
  clearTimers()
  visible.value = false
  resetPageHealth()
  timers = CHECK_DELAYS_MS.map((delay) => setTimeout(check, delay))
}, { immediate: true })

function retry() {
  window.location.reload()
}

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.error-fallback {
  display: grid;
  justify-items: start;
  gap: var(--app-space-3);
  width: min(40rem, calc(100% - 2 * var(--app-page-gutter)));
  margin: var(--app-space-8) auto;
}

.error-fallback__home {
  color: var(--app-color-text);
  font-weight: var(--app-font-weight-semibold);
}
</style>
