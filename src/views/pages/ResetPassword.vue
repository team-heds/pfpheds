<template>
  <main class="reset-page">
    <section class="reset-shell" aria-labelledby="reset-title">
      <div class="reset-brand">
        <img
          src="/assets/images/FR-DE_HEdS_rvb_neg.png"
          alt="Haute école de santé"
          class="reset-logo"
        />
        <p>Retrouvez l’accès à votre espace de formation en quelques étapes sécurisées.</p>
      </div>

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
import {
  createPasswordRecoveryService,
  PASSWORD_RECOVERY_ERROR_CODES,
} from '@/service/passwordRecoveryService'
import { getPasswordRuleStates, validateNewPassword } from '@/utils/passwordResetValidation'

const router = useRouter()
const recoveryService = createPasswordRecoveryService(supabase.auth)

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
  padding: clamp(1.5rem, 4vw, 4rem);
  background: var(--surface-ground, #0b213f);
  font-family: var(--font-family, 'Poppins', sans-serif);
}

.reset-shell {
  width: min(100%, 80rem);
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) minmax(24rem, 1fr);
  gap: clamp(3rem, 8vw, 8rem);
  align-items: center;
}

.reset-brand {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  color: #fff;
  text-align: center;
}

.reset-logo {
  width: min(100%, 24rem);
  height: auto;
  object-fit: contain;
}

.reset-brand p {
  max-width: 31rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  line-height: 1.65;
}

.reset-content {
  width: min(100%, 32rem);
  justify-self: center;
  display: grid;
  gap: 1.5rem;
}

.reset-heading {
  display: grid;
  gap: 0.75rem;
}

.reset-heading h1,
.reset-card h2 {
  margin: 0;
  color: var(--text-color, #f8fafc);
  letter-spacing: -0.025em;
}

.reset-heading h1 {
  max-width: 14ch;
  font-size: clamp(2rem, 4vw, 3.75rem);
  font-weight: 800;
  line-height: 1.08;
  text-wrap: balance;
}

.reset-heading p {
  max-width: 48ch;
  margin: 0;
  color: var(--text-color-secondary, #cbd5e1);
  line-height: 1.65;
}

.reset-card {
  background: var(--surface-card, #fff);
  border-radius: 1rem;
  box-shadow: 0 1.5rem 3.5rem rgba(2, 12, 27, 0.24);
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
  color: var(--text-color-secondary, #64748b);
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
  color: var(--primary-color, #f3c300);
  background: color-mix(in srgb, var(--primary-color, #f3c300) 13%, transparent);
}

.state-icon--warning {
  color: #b45309;
  background: #fff7ed;
}

.state-icon--success {
  color: #047857;
  background: #ecfdf5;
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
  background: color-mix(in srgb, var(--primary-color, #6229ff) 7%, white);
}

.rule-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--text-color-secondary, #5f6572);
  font-weight: 600;
  font-size: 0.875rem;
}

.rule-item i {
  color: var(--primary-color, #6229ff);
}

.rule-item.is-valid {
  color: #157347;
}

.rule-item.is-valid i {
  color: #157347;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

label {
  color: var(--text-color, #1f2937);
  font-weight: 700;
}

.match-valid {
  color: #047857 !important;
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
  color: var(--text-color-secondary, #64748b);
  font-size: 0.8rem;
  font-weight: 600;
}

.code-separator::before,
.code-separator::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--surface-border, #e2e8f0);
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
  box-shadow: var(--focus-ring, 0 0 0 0.2rem rgba(62, 207, 142, 0.25));
}

:deep(.p-button:not(.p-button-text)) {
  min-height: 3.1rem;
  border: 0;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #f3c300 0%, #d49f3f 100%);
  color: #222;
  font-weight: 700;
  box-shadow: 0 0.5rem 1.25rem rgba(212, 159, 63, 0.18);
  transition-property: transform, box-shadow, opacity;
  transition-duration: 150ms;
}

:deep(.p-button:not(.p-button-text):hover:not(:disabled)) {
  transform: translateY(-1px);
  box-shadow: 0 0.75rem 1.5rem rgba(212, 159, 63, 0.24);
}

:deep(.p-button:not(.p-button-text):active:not(:disabled)) {
  transform: scale(0.96);
}

:deep(.p-button:focus-visible) {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

:deep(.p-inline-message) {
  justify-content: flex-start;
  text-align: left;
}

.reset-support {
  margin: 0;
  color: var(--text-color-secondary, #cbd5e1);
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}

@media (max-width: 56rem) {
  .reset-shell {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .reset-brand {
    gap: 1rem;
  }

  .reset-logo {
    width: min(100%, 15rem);
  }

  .reset-brand p {
    display: none;
  }

  .reset-heading {
    text-align: center;
    justify-items: center;
  }
}

@media (max-width: 34rem) {
  .reset-page {
    padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
    place-items: start center;
  }

  .reset-shell {
    gap: 1.75rem;
  }

  .reset-heading h1 {
    font-size: 2rem;
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
