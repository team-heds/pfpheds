<template>
  <main class="reset-page">
    <section class="reset-shell" aria-labelledby="reset-title">
      <header class="reset-brand">
        <img
          :src="darkMode
            ? '/assets/images/FR-DE_HEdS_rvb_neg.png'
            : '/assets/images/FR-DE_HEdS.png'"
          alt="Haute école de santé HES-SO Valais-Wallis"
          class="reset-logo"
        />
      </header>

      <div class="reset-content">
        <header class="reset-heading">
          <h1 id="reset-title">Définir un nouveau mot de passe</h1>
          <p>{{ pageIntroduction }}</p>
        </header>

        <section class="reset-card" :aria-busy="state === 'checking'">
          <div v-if="state === 'checking'" class="state-panel" role="status" aria-live="polite">
            <span class="state-icon state-icon--loading" aria-hidden="true">
              <i class="pi pi-spin pi-spinner"></i>
            </span>
            <h2>Vérification du lien</h2>
            <p>Un instant, nous sécurisons votre accès avant d’afficher le formulaire.</p>
          </div>

          <div v-else-if="state === 'invalid'" class="state-panel" role="alert">
            <span class="state-icon state-icon--warning" aria-hidden="true">
              <i class="pi pi-exclamation-triangle"></i>
            </span>
            <h2>{{ invalidTitle }}</h2>
            <p>{{ invalidMessage }}</p>

            <Button
              label="Demander un nouveau lien"
              icon="pi pi-refresh"
              class="w-full"
              type="button"
              @click="goToLogin"
            />

            <div class="code-separator" aria-hidden="true"><span>ou utiliser le code reçu</span></div>

            <form class="code-form" @submit.prevent="verifyWithCode" novalidate>
              <div class="form-row">
                <label for="codeEmail">Adresse email</label>
                <InputText
                  id="codeEmail"
                  ref="codeEmailField"
                  v-model.trim="codeEmail"
                  type="email"
                  name="email"
                  class="w-full"
                  autocomplete="username"
                  :class="{ 'p-invalid': codeErrorField === 'email' }"
                  :aria-invalid="codeErrorField === 'email'"
                  aria-describedby="code-help code-error"
                />
              </div>

              <div class="form-row">
                <label for="codeToken">Code reçu par email</label>
                <InputText
                  id="codeToken"
                  ref="codeTokenField"
                  v-model.trim="codeToken"
                  name="recovery-code"
                  class="w-full"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  placeholder="Ex. 123456"
                  :class="{ 'p-invalid': codeErrorField === 'token' }"
                  :aria-invalid="codeErrorField === 'token'"
                  aria-describedby="code-help code-error"
                />
                <small id="code-help">Utilisez uniquement le dernier email reçu.</small>
              </div>

              <InlineMessage v-if="codeMsg" id="code-error" severity="error" class="w-full">
                {{ codeMsg }}
              </InlineMessage>

              <Button
                label="Valider le code"
                icon="pi pi-check"
                class="w-full"
                type="submit"
                :loading="codeLoading"
                :disabled="codeLoading"
              />
            </form>
          </div>

          <div v-else-if="state === 'success'" class="state-panel" role="status" aria-live="polite">
            <span class="state-icon state-icon--success" aria-hidden="true">
              <i class="pi pi-check-circle"></i>
            </span>
            <h2>Mot de passe modifié</h2>
            <p>Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter.</p>
            <Button
              label="Retour à la connexion"
              icon="pi pi-sign-in"
              class="w-full"
              type="button"
              @click="goToLogin"
            />
          </div>

          <form v-else class="password-form" @submit.prevent="save" novalidate>
            <div class="intro">
              <h2>Choisissez un mot de passe robuste</h2>
              <p>Les règles se valident automatiquement pendant votre saisie.</p>
            </div>

            <div id="password-rules" class="rules-panel" aria-label="Règles de complexité du mot de passe">
              <div
                v-for="rule in passwordRuleStates"
                :key="rule.id"
                :class="['rule-item', { 'is-valid': rule.valid }]"
              >
                <i
                  :class="['pi', rule.valid ? 'pi-check-circle' : 'pi-circle']"
                  aria-hidden="true"
                ></i>
                <span>{{ rule.label }}</span>
              </div>
            </div>

            <div class="form-row">
              <label for="pwd1">Nouveau mot de passe</label>
              <Password
                id="pwd1"
                ref="pwd1Field"
                v-model="pwd1"
                toggleMask
                class="w-full reset-password-input"
                inputClass="w-full"
                :inputProps="{
                  name: 'new-password',
                  autocomplete: 'new-password',
                  'aria-describedby': 'password-rules form-message',
                  'aria-invalid': String(Boolean(msg && !ok)),
                }"
                placeholder="Votre nouveau mot de passe"
                :feedback="false"
              />
            </div>

            <div class="form-row">
              <label for="pwd2">Confirmer le mot de passe</label>
              <Password
                id="pwd2"
                ref="pwd2Field"
                v-model="pwd2"
                toggleMask
                class="w-full reset-password-input"
                inputClass="w-full"
                :inputProps="{
                  name: 'confirm-password',
                  autocomplete: 'new-password',
                  'aria-describedby': 'match-help form-message',
                  'aria-invalid': String(Boolean(confirmationTouched && !passwordsMatch)),
                }"
                :feedback="false"
                placeholder="Confirmez le mot de passe"
                @blur="confirmationTouched = true"
              />
              <small id="match-help" :class="{ 'match-valid': passwordsMatch }">
                {{ matchMessage }}
              </small>
            </div>

            <InlineMessage v-if="msg" id="form-message" :severity="ok ? 'success' : 'error'" class="w-full">
              {{ msg }}
            </InlineMessage>

            <div class="form-actions">
              <Button
                label="Enregistrer le mot de passe"
                icon="pi pi-check"
                class="w-full"
                type="submit"
                :loading="loading"
                :disabled="loading"
              />

              <Button
                label="Annuler et revenir à la connexion"
                icon="pi pi-arrow-left"
                class="p-button-text w-full"
                type="button"
                @click="goToLogin"
              />
            </div>
          </form>
        </section>

        <p class="reset-support">
          Le lien est personnel, valable une heure et utilisable une seule fois.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { supabase } from '@/supabase.js'
import { useLayout } from '@/layout/composables/layout'
import {
  createPasswordRecoveryService,
  PASSWORD_RECOVERY_ERROR_CODES,
} from '@/service/passwordRecoveryService'
import { getPasswordRuleStates, validateNewPassword } from '@/utils/passwordResetValidation'

const router = useRouter()
const { layoutConfig } = useLayout()
const recoveryService = createPasswordRecoveryService(supabase.auth)

const darkMode = computed(() => layoutConfig.colorScheme.value !== 'light')

const state = ref('checking')
const loading = ref(false)
const pwd1 = ref('')
const pwd2 = ref('')
const confirmationTouched = ref(false)
const msg = ref('')
const ok = ref(false)

const codeEmail = ref('')
const codeToken = ref('')
const codeLoading = ref(false)
const codeMsg = ref('')
const codeErrorField = ref('')
const invalidReason = ref('missing')
const codeEmailField = ref(null)
const codeTokenField = ref(null)
const pwd1Field = ref(null)
const pwd2Field = ref(null)

const passwordRuleStates = computed(() => getPasswordRuleStates(pwd1.value))
const passwordsMatch = computed(() => Boolean(pwd2.value) && pwd1.value === pwd2.value)
const matchMessage = computed(() => {
  if (!pwd2.value) return 'Retapez le même mot de passe pour confirmer.'
  return passwordsMatch.value
    ? 'Les deux mots de passe correspondent.'
    : 'Les deux mots de passe ne correspondent pas.'
})

const pageIntroduction = computed(() => {
  if (state.value === 'checking') return 'Nous vérifions votre lien sécurisé.'
  if (state.value === 'invalid') return 'Votre lien ne peut pas être utilisé en l’état.'
  if (state.value === 'success') return 'Votre accès est de nouveau sécurisé.'
  return 'Choisissez un mot de passe différent de celui que vous utilisiez auparavant.'
})

const invalidTitle = computed(() => {
  if (invalidReason.value === 'expired') return 'Lien expiré'
  if (invalidReason.value === 'error') return 'Lien impossible à valider'
  return 'Lien invalide'
})

const invalidMessage = computed(() => {
  if (invalidReason.value === 'expired') {
    return 'Le lien de réinitialisation n’est plus valide. Demandez un nouvel email ou utilisez le code reçu si l’email en contient un.'
  }

  if (invalidReason.value === 'error') {
    return 'La validation automatique du lien a échoué. Vous pouvez essayer le code de récupération reçu par email.'
  }

  return 'Le lien ne contient pas de jeton de récupération valide. Cela peut arriver si un filtre anti-spam a ouvert le lien avant vous.'
})

onMounted(async () => {
  await resolveRecoverySession()
})

async function resolveRecoverySession() {
  const result = await recoveryService.resolveFromLocation()
  if (result.status === 'valid') {
    state.value = 'form'
    return
  }

  invalidReason.value = result.reason
  state.value = 'invalid'
}

async function verifyWithCode() {
  codeMsg.value = ''
  codeErrorField.value = ''

  if (!codeEmail.value) {
    codeErrorField.value = 'email'
    codeMsg.value = 'L’adresse email est requise.'
    focusField(codeEmailField)
    return
  }

  if (!codeToken.value) {
    codeErrorField.value = 'token'
    codeMsg.value = 'Le code reçu par email est requis.'
    focusField(codeTokenField)
    return
  }

  codeLoading.value = true
  try {
    await recoveryService.authorizeWithOtp(codeEmail.value.trim(), codeToken.value.trim())
    codeToken.value = ''
    state.value = 'form'
  } catch (error) {
    codeMsg.value = mapRecoveryError(error)
  } finally {
    codeLoading.value = false
  }
}

async function save() {
  msg.value = ''
  ok.value = false
  confirmationTouched.value = true

  const validation = validateNewPassword(pwd1.value, pwd2.value)
  if (!validation.valid) {
    msg.value = validation.message
    const passwordRuleMissing = passwordRuleStates.value.some(rule => !rule.valid)
    focusField(!pwd1.value || passwordRuleMissing ? pwd1Field : pwd2Field)
    return
  }

  loading.value = true
  try {
    await recoveryService.updatePassword(pwd1.value)

    ok.value = true
    msg.value = 'Mot de passe modifié avec succès.'
    pwd1.value = ''
    pwd2.value = ''
    state.value = 'success'
  } catch (error) {
    msg.value = mapRecoveryError(error)
  } finally {
    loading.value = false
  }
}

function mapRecoveryError(error) {
  if (error?.code === PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED) {
    return 'Ce lien de réinitialisation a déjà été utilisé. Demandez un nouvel email.'
  }

  if (error?.code === PASSWORD_RECOVERY_ERROR_CODES.INVALID_CONTEXT) {
    return 'Le lien de réinitialisation n’est plus valide. Demandez un nouvel email.'
  }

  if (error?.code === PASSWORD_RECOVERY_ERROR_CODES.UPDATE_IN_PROGRESS) {
    return 'La modification est déjà en cours.'
  }

  const message = error?.message || ''
  const normalized = message.toLowerCase()

  if (normalized.includes('expired')) {
    return 'Le lien ou le code a expiré. Demandez un nouvel email de réinitialisation.'
  }

  if (normalized.includes('invalid') || normalized.includes('token')) {
    return 'Le lien ou le code est invalide. Vérifiez que vous utilisez le dernier email reçu.'
  }

  if (normalized.includes('password')) {
    return 'Le mot de passe ne respecte pas les règles de sécurité du serveur.'
  }

  return message || 'Une erreur est survenue. Réessayez avec le dernier email reçu.'
}

function focusField(fieldRef) {
  nextTick(() => {
    const component = fieldRef.value
    const element = component?.$el?.matches?.('input')
      ? component.$el
      : component?.$el?.querySelector?.('input')
    element?.focus?.()
  })
}

async function goToLogin() {
  try {
    await recoveryService.abandon()
  } catch {
    // La navigation reste possible : abandon() tente déjà une suppression locale de secours.
  }
  router.push('/')
}
</script>

<style scoped>
.reset-page {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: clamp(1.25rem, 4vw, 3rem) var(--app-page-gutter, 1.5rem);
  background: var(--app-color-page, var(--surface-ground, #0b213f));
  color: var(--app-color-text, var(--text-color, #f8fafc));
  font-family: var(--app-font-family, var(--font-family, 'Poppins', sans-serif));
}

.reset-shell {
  width: min(100%, 34rem);
  display: grid;
  gap: clamp(1.5rem, 4vh, 2.5rem);
}

.reset-brand {
  display: flex;
  justify-content: center;
}

.reset-logo {
  width: min(100%, 18rem);
  height: auto;
  object-fit: contain;
}

.reset-content {
  min-width: 0;
  display: grid;
  gap: var(--app-space-5, 1.25rem);
}

.reset-heading {
  display: grid;
  gap: 0.75rem;
}

.reset-heading h1,
.reset-card h2 {
  margin: 0;
  color: var(--app-color-text, var(--text-color, #1f2937));
  letter-spacing: -0.025em;
}

.reset-heading h1 {
  max-width: 18ch;
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 800;
  line-height: 1.12;
  text-wrap: balance;
}

.reset-heading p {
  max-width: 48ch;
  margin: 0;
  color: var(--app-color-text-muted, var(--text-color-secondary, #64748b));
  line-height: var(--app-line-height-body, 1.55);
}

.reset-card {
  background: var(--app-color-surface, var(--surface-card, #fff));
  border-radius: var(--app-radius-xl, 1rem);
  box-shadow: var(--app-shadow-md, 0 0.75rem 2rem rgba(2, 12, 27, 0.18));
  padding: clamp(1.25rem, 3vw, 2rem);
}

.state-panel,
.password-form,
.code-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.state-panel {
  text-align: center;
  align-items: center;
}

.state-panel > p,
.intro p,
.form-row small {
  margin: 0;
  color: var(--app-color-text-muted, var(--text-color-secondary, #64748b));
  line-height: 1.55;
}

.state-panel > p {
  max-width: 42ch;
}

.state-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 1.45rem;
}

.state-icon--loading {
  color: var(--app-color-focus, #775f00);
  background: color-mix(in srgb, var(--app-color-brand, #f3c300) 18%, transparent);
}

.state-icon--warning {
  color: var(--app-color-warning, #c2410c);
  background: var(--app-color-warning-soft, #fff7ed);
}

.state-icon--success {
  color: var(--app-color-success, #15803d);
  background: var(--app-color-success-soft, #f0fdf4);
}

.intro {
  display: grid;
  gap: 0.5rem;
}

.reset-card h2 {
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: 750;
  line-height: 1.2;
}

.rules-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--app-color-brand, #f3c300) 12%, var(--app-color-surface, white));
}

.rule-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--app-color-text-muted, var(--text-color-secondary, #5f6572));
  font-weight: 600;
  font-size: 0.875rem;
}

.rule-item i {
  color: var(--app-color-focus, #775f00);
}

.rule-item.is-valid {
  color: var(--app-color-success, #15803d);
}

.rule-item.is-valid i {
  color: var(--app-color-success, #15803d);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

label {
  color: var(--app-color-text, var(--text-color, #1f2937));
  font-weight: 700;
}

.match-valid {
  color: var(--app-color-success, #15803d) !important;
  font-weight: 600;
}

.form-actions {
  display: grid;
  gap: 0.5rem;
}

.code-separator {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--app-color-text-muted, var(--text-color-secondary, #64748b));
  font-size: 0.8rem;
  font-weight: 600;
}

.code-separator::before,
.code-separator::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--app-color-border, var(--surface-border, #e2e8f0));
}

:deep(.p-password-input),
:deep(.p-inputtext) {
  width: 100%;
  min-height: var(--input-height, 3.2rem);
  border-radius: var(--input-radius, 0.75rem);
  font-size: max(1rem, var(--font-size-base, 1rem));
}

:deep(.p-password) {
  display: block;
  width: 100%;
}

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus) {
  box-shadow: var(--app-shadow-focus, var(--focus-ring));
  border-color: var(--app-color-focus, #775f00);
}

:deep(.p-button:not(.p-button-text)) {
  min-height: 3.1rem;
  border: 0;
  border-radius: 0.75rem;
  background: var(--app-color-brand, #f3c300);
  color: var(--app-color-on-brand, #172033);
  font-weight: 700;
  box-shadow: var(--app-shadow-sm, 0 0.25rem 0.75rem rgba(2, 12, 27, 0.12));
  transition-property: transform, box-shadow, opacity;
  transition-duration: 150ms;
}

:deep(.p-button:not(.p-button-text):hover:not(:disabled)) {
  transform: translateY(-1px);
  background: var(--app-color-brand-hover, #d9ad00);
  box-shadow: var(--app-shadow-md, 0 0.75rem 2rem rgba(2, 12, 27, 0.16));
}

:deep(.p-button:not(.p-button-text):active:not(:disabled)) {
  transform: scale(0.96);
}

:deep(.p-button:focus-visible) {
  outline: 2px solid var(--app-color-focus, #775f00);
  outline-offset: 3px;
}

:deep(.p-button.p-button-text) {
  color: var(--app-color-text, var(--text-color, #1f2937));
}

:deep(.p-inline-message) {
  justify-content: flex-start;
  text-align: left;
}

.reset-support {
  margin: 0;
  color: var(--app-color-text-muted, var(--text-color-secondary, #64748b));
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}

@media (max-width: 34rem) {
  .reset-page {
    padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
    place-items: start center;
  }

  .reset-shell {
    gap: 1.5rem;
  }

  .reset-logo {
    width: min(100%, 13rem);
  }

  .reset-heading h1 {
    font-size: 1.75rem;
  }

  .rules-panel {
    grid-template-columns: 1fr;
  }

  .reset-card {
    border-radius: 0.875rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.p-button) {
    transition: none;
  }
}
</style>
