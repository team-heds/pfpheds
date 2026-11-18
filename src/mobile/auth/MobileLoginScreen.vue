<template>
  <main ref="rootRef" class="m-login">
    <div class="m-login__scroll">
      <header class="m-login__brand">
        <img src="/assets/images/FR-DE_HEdS_rvb_neg.png" alt="Haute école de santé HES-SO Valais-Wallis" />
      </header>

      <form id="m-login-form" class="m-login__form" novalidate @submit.prevent="submit">
        <h1 class="m-login__title">Connexion</h1>

        <div class="m-login__field">
          <label for="m-login-email">Adresse e-mail</label>
          <input
            id="m-login-email"
            ref="emailRef"
            :value="email"
            type="email"
            name="email"
            inputmode="email"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="next"
            :aria-invalid="emailMessage ? 'true' : 'false'"
            :aria-describedby="emailMessage ? 'm-login-email-error' : undefined"
            @input="emit('update:email', $event.target.value.trim())"
            @keydown.enter.prevent="passwordRef?.focus()"
          />
          <p v-if="emailMessage" id="m-login-email-error" class="m-login__error">{{ emailMessage }}</p>
        </div>

        <div class="m-login__field">
          <label for="m-login-password">Mot de passe</label>
          <div class="m-login__password">
            <input
              id="m-login-password"
              ref="passwordRef"
              :value="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="go"
              :aria-invalid="passwordMessage ? 'true' : 'false'"
              :aria-describedby="passwordMessage ? 'm-login-password-error' : undefined"
              @input="emit('update:password', $event.target.value)"
            />
            <button
              type="button"
              class="m-login__eye"
              :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              :aria-pressed="showPassword ? 'true' : 'false'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.6 10.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.4 8 2.8 10.1 2 12c1 2.5 5 7 10 7 1.7 0 3.3-.5 4.6-1.3" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
          <p v-if="passwordMessage" id="m-login-password-error" class="m-login__error">{{ passwordMessage }}</p>
        </div>

        <button type="button" class="m-login__link" @click="openReset">Mot de passe oublié ?</button>

        <p v-if="formMessage" class="m-login__alert" role="alert">{{ formMessage }}</p>
      </form>
    </div>

    <div class="m-login__actions">
      <button type="submit" form="m-login-form" class="m-login__cta" :disabled="loading" :aria-busy="loading ? 'true' : 'false'">
        <span v-if="loading" class="m-login__spinner" aria-hidden="true"></span>
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </div>

    <BottomSheet v-if="resetOpen" title="Mot de passe oublié" @close="closeReset">
      <form class="m-login__reset" novalidate @submit.prevent="emit('reset', resetEmail)">
        <p class="m-login__hint">Tu recevras un lien par e-mail pour choisir un nouveau mot de passe.</p>
        <div class="m-login__field">
          <label for="m-login-reset-email">Adresse e-mail</label>
          <input
            id="m-login-reset-email"
            v-model.trim="resetEmail"
            type="email"
            name="email"
            inputmode="email"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="send"
            :aria-invalid="resetStatus?.type === 'error' ? 'true' : 'false'"
            aria-describedby="m-login-reset-status"
          />
        </div>
        <p
          v-if="resetStatus"
          id="m-login-reset-status"
          :class="resetStatus.type === 'success' ? 'm-login__success' : 'm-login__error'"
          :role="resetStatus.type === 'success' ? 'status' : 'alert'"
        >
          {{ resetStatus.text }}
        </p>
        <button type="submit" class="m-login__cta" :disabled="resetLoading">
          <span v-if="resetLoading" class="m-login__spinner" aria-hidden="true"></span>
          Envoyer le lien
        </button>
      </form>
    </BottomSheet>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'

const props = defineProps({
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  resetLoading: { type: Boolean, default: false },
  emailMessage: { type: String, default: '' },
  passwordMessage: { type: String, default: '' },
  formMessage: { type: String, default: '' },
  /** Résultat de la demande de lien : { type: 'success' | 'error', text } */
  resetStatus: { type: Object, default: null },
})
const emit = defineEmits(['update:email', 'update:password', 'submit', 'reset'])

const rootRef = ref(null)
const emailRef = ref(null)
const passwordRef = ref(null)
const showPassword = ref(false)
// Le panneau est inscrit dans l'adresse : le retour du téléphone le ferme.
const RESET_HASH = '#mot-de-passe-oublie'
const route = useRoute()
const router = useRouter()
const resetOpen = computed(() => route.hash === RESET_HASH)
const resetEmail = ref('')

function submit() {
  emit('submit')
}

function openReset() {
  resetEmail.value = props.email
  router.push({ path: route.path, query: route.query, hash: RESET_HASH })
}

function closeReset() {
  if (window.history.state?.back === route.path || window.history.state?.back?.startsWith?.(`${route.path}?`)) router.back()
  else router.replace({ path: route.path, query: route.query })
}

// Sur iPhone, le clavier recouvre la page sans la redimensionner : l'écran suit
// la partie visible, pour que le bouton reste juste au-dessus du clavier.
const viewport = typeof window !== 'undefined' ? window.visualViewport : null
function fitViewport() {
  const el = rootRef.value
  if (!el || !viewport) return
  el.style.height = `${Math.round(viewport.height)}px`
  el.style.transform = viewport.offsetTop ? `translateY(${Math.round(viewport.offsetTop)}px)` : ''
}

onMounted(() => {
  viewport?.addEventListener('resize', fitViewport)
  viewport?.addEventListener('scroll', fitViewport)
  fitViewport()
})
onBeforeUnmount(() => {
  viewport?.removeEventListener('resize', fitViewport)
  viewport?.removeEventListener('scroll', fitViewport)
})

defineExpose({ emailRef, passwordRef })
</script>

<style scoped>
.m-login {
  --m-bg: #0b213f;
  --m-surface: #071426;
  --m-raised: rgba(127, 140, 160, 0.16);
  --m-line: rgba(255, 255, 255, 0.14);
  --m-fg: #f2f5fa;
  --m-muted: #93a4bd;
  --m-accent: #f3c300;
  --m-on-accent: #172033;
  --m-accent-text: #f3c300;
  --m-danger: #fca5a5;
  --m-ok: #6ee7b7;
  --m-radius: 16px;

  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  background: var(--m-bg);
  color: var(--m-fg);
  font-family: var(--font-family, 'Poppins', system-ui, sans-serif);
  -webkit-tap-highlight-color: transparent;
}

.m-login__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 24px 16px;
}

.m-login__brand {
  display: flex;
  justify-content: center;
  padding: 24px 0 32px;
}
.m-login__brand img {
  width: min(56vw, 220px);
  height: auto;
}

.m-login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
  margin: 0 auto;
}
.m-login__title {
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.m-login__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-login__field label {
  font-size: 0.875rem;
  font-weight: 600;
}
.m-login__field input {
  box-sizing: border-box;
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid var(--m-line);
  border-radius: 14px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  font-size: max(16px, 1rem);
  -webkit-appearance: none;
  appearance: none;
}
.m-login__field input:focus {
  border-color: var(--m-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(243, 195, 0, 0.25);
}
.m-login__field input[aria-invalid='true'] {
  border-color: var(--m-danger);
}

.m-login__password {
  position: relative;
}
.m-login__password input {
  padding-right: 56px;
}
.m-login__eye {
  position: absolute;
  top: 50%;
  right: 4px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--m-muted);
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
}
.m-login__eye:active {
  background: var(--m-raised);
}
.m-login__eye:focus-visible {
  outline: 2px solid var(--m-accent-text);
}
.m-login__eye svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.m-login__error,
.m-login__success,
.m-login__hint {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}
.m-login__error {
  color: var(--m-danger);
}
.m-login__success {
  color: var(--m-ok);
}
.m-login__hint {
  color: var(--m-muted);
}
.m-login__alert {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(248, 113, 113, 0.14);
  color: var(--m-danger);
  font-size: 0.875rem;
  line-height: 1.4;
}

.m-login__link {
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--m-accent-text);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
}
.m-login__link:active {
  opacity: 0.7;
}
.m-login__link:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}

/* Bouton principal dans la zone du pouce, au-dessus de la barre d'accueil et du clavier. */
.m-login__actions {
  flex-shrink: 0;
  padding: 12px 24px calc(16px + env(safe-area-inset-bottom, 0px));
  background: var(--m-bg);
}
.m-login__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 420px;
  min-height: 52px;
  margin: 0 auto;
  border: 0;
  border-radius: 14px;
  background: var(--m-accent);
  color: var(--m-on-accent);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  transition: transform 120ms ease;
}
.m-login__cta:active:not(:disabled) {
  transform: scale(0.98);
}
.m-login__cta:disabled {
  opacity: 0.7;
  cursor: default;
}
.m-login__cta:focus-visible {
  outline: 2px solid var(--m-fg);
  outline-offset: 2px;
}
.m-login__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: m-login-spin 0.7s linear infinite;
}
@keyframes m-login-spin {
  to { transform: rotate(360deg); }
}

/* Croix du panneau : hors de la coque, on reprend son bouton rond de 44 px. */
.m-login :deep(.m-icon-button) {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}
.m-login :deep(.m-icon-button:active) {
  background: var(--m-raised);
}

.m-login__reset {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .m-login__cta {
    transition: none;
  }
  .m-login__spinner {
    animation-duration: 3s;
  }
}
</style>
