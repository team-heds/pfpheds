<template>
  <section v-if="visible" class="push-opt-in" :aria-labelledby="titleId">
    <span class="push-opt-in__icon" :class="{ 'push-opt-in__icon--on': state === STATES.ENABLED }" aria-hidden="true">
      <i class="pi pi-bell"></i>
    </span>

    <div class="push-opt-in__text">
      <h2 :id="titleId" class="push-opt-in__title">{{ title }}</h2>
      <p class="push-opt-in__detail" aria-live="polite">{{ detail }}</p>
      <p v-if="error" class="push-opt-in__error" role="alert">{{ error }}</p>
    </div>

    <Button
      v-if="state === STATES.DISABLED"
      label="Activer les notifications"
      icon="pi pi-bell"
      class="push-opt-in__action"
      :loading="busy"
      @click="enable"
    />
    <Button
      v-else-if="state === STATES.ENABLED"
      label="Désactiver"
      severity="secondary"
      text
      class="push-opt-in__action"
      :loading="busy"
      @click="disable"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import {
  PUSH_STATES,
  disablePushOnThisDevice,
  enablePushForCurrentUser,
  getPushState,
  needsHomeScreenInstall,
} from '@/service/pushSubscriptionService'

const props = defineProps({
  // Ce que l'utilisateur recevra, dans ses mots : « quand un créneau est réservé… ».
  purpose: { type: String, default: 'quand il se passe quelque chose qui vous concerne' },
  // Masquer le bloc quand les notifications ne sont pas possibles sur cet appareil.
  hideWhenUnavailable: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

const STATES = PUSH_STATES
const titleId = `push-opt-in-${Math.random().toString(36).slice(2, 8)}`
const state = ref(null)
const busy = ref(false)
const error = ref('')

const unavailable = computed(() => [STATES.UNSUPPORTED, STATES.NOT_CONFIGURED].includes(state.value))
const visible = computed(() => state.value !== null && !(props.hideWhenUnavailable && unavailable.value))

const title = computed(() => (
  state.value === STATES.ENABLED
    ? 'Notifications activées sur cet appareil'
    : 'Notifications sur cet appareil'
))

const detail = computed(() => {
  switch (state.value) {
    case STATES.ENABLED:
      return `Vous êtes prévenu·e ici ${props.purpose}.`
    case STATES.DISABLED:
      return `Recevez une notification sur cet appareil ${props.purpose}.`
    case STATES.DENIED:
      return 'Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur (icône à gauche de l’adresse), puis rechargez la page.'
    case STATES.UNSUPPORTED:
      return needsHomeScreenInstall()
        ? 'Sur iPhone et iPad, ajoutez d’abord le site à l’écran d’accueil (Partager, puis « Sur l’écran d’accueil ») et ouvrez-le depuis cette icône.'
        : 'Ce navigateur ne permet pas les notifications. Essayez avec Chrome, Edge, Firefox ou Safari à jour.'
    default:
      return 'Les notifications ne sont pas disponibles sur ce site pour le moment.'
  }
})

async function refresh() {
  state.value = await getPushState()
  emit('change', state.value)
}

async function enable() {
  busy.value = true
  error.value = ''
  try {
    await enablePushForCurrentUser()
  } catch (failure) {
    // Un refus se lit déjà dans l'état « bloqué » : pas de second message.
    if (failure?.code !== 'denied') error.value = failure?.message || 'L’activation a échoué. Réessayez.'
  } finally {
    await refresh()
    busy.value = false
  }
}

async function disable() {
  busy.value = true
  error.value = ''
  try {
    await disablePushOnThisDevice()
  } catch {
    error.value = 'La désactivation a échoué. Réessayez.'
  } finally {
    await refresh()
    busy.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.push-opt-in {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.9rem 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  color: var(--text-color);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.85rem;
}

.push-opt-in__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--text-color-secondary);
  background: var(--surface-hover);
  border-radius: 50%;
}

.push-opt-in__icon--on { color: var(--primary-color); }

.push-opt-in__title {
  margin: 0 0 0.15rem;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 700;
}

.push-opt-in__detail,
.push-opt-in__error {
  max-width: 70ch;
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
}

.push-opt-in__detail { color: var(--text-color-secondary); }
.push-opt-in__error { margin-top: 0.3rem; color: var(--red-400, #f87171); }

:deep(.push-opt-in__action) {
  min-height: 44px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .push-opt-in { grid-template-columns: auto minmax(0, 1fr); }
  :deep(.push-opt-in__action) { grid-column: 1 / -1; justify-content: center; }
}
</style>
