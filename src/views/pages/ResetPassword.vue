<template>
  <main class="reset-page">
    <section class="reset-shell" aria-labelledby="reset-title">
      <div class="reset-brand" aria-hidden="true">
        <div class="brand-mark">
          <i class="pi pi-lock"></i>
        </div>
        <div>
          <p class="eyebrow">Sécurité du compte</p>
          <h1 id="reset-title">Définir un nouveau mot de passe</h1>
        </div>
      </div>

      <div class="reset-card">
        <div v-if="state === 'checking'" class="state-panel" role="status" aria-live="polite">
          <i class="pi pi-spin pi-spinner state-icon text-primary"></i>
          <h2>Vérification du lien</h2>
          <p>Nous contrôlons le lien de réinitialisation avant d’afficher le formulaire.</p>
        </div>

        <div v-else-if="state === 'invalid'" class="state-panel" aria-live="polite">
          <i class="pi pi-exclamation-triangle state-icon text-orange-500"></i>
          <h2>{{ invalidTitle }}</h2>
          <p>{{ invalidMessage }}</p>

          <form class="code-form" @submit.prevent="verifyWithCode" novalidate>
            <div class="form-row">
              <label for="codeEmail">Adresse email</label>
              <InputText
                id="codeEmail"
                v-model.trim="codeEmail"
                type="email"
                class="w-full"
                autocomplete="username"
                :class="{ 'p-invalid': codeErrorField === 'email' }"
                aria-describedby="code-help"
              />
            </div>

            <div class="form-row">
              <label for="codeToken">Code reçu par email</label>
              <InputText
                id="codeToken"
                v-model.trim="codeToken"
                class="w-full"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="Ex. 123456"
                :class="{ 'p-invalid': codeErrorField === 'token' }"
                aria-describedby="code-help code-error"
              />
              <small id="code-help">Utilisez le dernier email reçu. Un ancien lien ou code peut être expiré.</small>
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
            />
          </form>

          <Button
            label="Revenir à la connexion"
            icon="pi pi-arrow-left"
            class="p-button-text mt-3"
            @click="goToLogin"
          />
        </div>

        <div v-else-if="state === 'success'" class="state-panel" role="status" aria-live="polite">
          <i class="pi pi-check-circle state-icon text-green-500"></i>
          <h2>Mot de passe modifié</h2>
          <p>Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter.</p>
          <Button label="Retour à la connexion" icon="pi pi-sign-in" class="w-full" @click="goToLogin" />
        </div>

        <form v-else class="password-form" @submit.prevent="save" novalidate>
          <div class="intro">
            <p class="eyebrow">Dernière étape</p>
            <h2>Choisissez un mot de passe robuste</h2>
            <p>Les règles sont visibles avant validation et se mettent à jour pendant la saisie.</p>
          </div>

          <div class="rules-panel" aria-label="Règles de complexité du mot de passe">
            <div
              v-for="rule in passwordRuleStates"
              :key="rule.id"
              :class="['rule-item', { 'is-valid': rule.valid }]"
            >
              <i :class="['pi', rule.valid ? 'pi-check-circle' : 'pi-circle']"></i>
              <span>{{ rule.label }}</span>
            </div>
          </div>

          <div class="form-row">
            <label for="pwd1">Nouveau mot de passe</label>
            <Password
              id="pwd1"
              v-model="pwd1"
              toggleMask
              class="w-full reset-password-input"
              inputClass="w-full"
              :inputProps="{
                autocomplete: 'new-password',
                'aria-describedby': 'password-rules form-message',
                'aria-invalid': String(Boolean(msg && !ok)),
              }"
              placeholder="Votre nouveau mot de passe"
              :feedback="false"
            />
          </div>

          <div class="form-row">
            <label for="pwd2">Confirmation</label>
            <Password
              id="pwd2"
              v-model="pwd2"
              toggleMask
              class="w-full reset-password-input"
              inputClass="w-full"
              :inputProps="{
                autocomplete: 'new-password',
                'aria-describedby': 'match-help form-message',
                'aria-invalid': String(Boolean(confirmationTouched && !passwordsMatch)),
              }"
              :feedback="false"
              placeholder="Confirmez le mot de passe"
              @blur="confirmationTouched = true"
            />
            <small id="match-help" :class="passwordsMatch ? 'text-green-600' : 'text-600'">
              {{ matchMessage }}
            </small>
          </div>

          <InlineMessage v-if="msg" id="form-message" :severity="ok ? 'success' : 'error'" class="w-full">
            {{ msg }}
          </InlineMessage>

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
        </form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InlineMessage from 'primevue/inlinemessage'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { supabase } from '@/supabase.js'
import { getPasswordRuleStates, validateNewPassword } from '@/utils/passwordResetValidation'

const router = useRouter()

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

let authSubscription = null

const passwordRuleStates = computed(() => getPasswordRuleStates(pwd1.value))
const passwordsMatch = computed(() => Boolean(pwd2.value) && pwd1.value === pwd2.value)
const matchMessage = computed(() => {
  if (!pwd2.value) return 'Retapez le même mot de passe pour confirmer.'
  return passwordsMatch.value
    ? 'Les deux mots de passe correspondent.'
    : 'Les deux mots de passe ne correspondent pas.'
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
  authSubscription = supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
      state.value = 'form'
    }
  })

  await resolveRecoverySession()
})

onBeforeUnmount(() => {
  authSubscription?.data?.subscription?.unsubscribe?.()
})

async function resolveRecoverySession() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  const hashAccessToken = hashParams.get('access_token')
  const hashRefreshToken = hashParams.get('refresh_token')
  const queryCode = searchParams.get('code')
  const linkError = hashParams.get('error') || searchParams.get('error')
  const linkErrorCode = hashParams.get('error_code') || searchParams.get('error_code')

  try {
    if (linkError) {
      invalidReason.value = linkErrorCode === 'otp_expired' ? 'expired' : 'error'
      state.value = 'invalid'
      return
    }

    if (hashAccessToken && hashRefreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken,
      })
      if (error) throw error
      state.value = 'form'
      return
    }

    if (queryCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(queryCode)
      if (error) throw error
      state.value = 'form'
      return
    }

    const { data } = await supabase.auth.getSession()
    state.value = data?.session ? 'form' : 'invalid'
  } catch (error) {
    console.error('ResetPassword recovery error:', error)
    invalidReason.value = error?.message?.toLowerCase().includes('expired') ? 'expired' : 'error'
    state.value = 'invalid'
  }
}

async function verifyWithCode() {
  codeMsg.value = ''
  codeErrorField.value = ''

  if (!codeEmail.value) {
    codeErrorField.value = 'email'
    codeMsg.value = 'L’adresse email est requise.'
    return
  }

  if (!codeToken.value) {
    codeErrorField.value = 'token'
    codeMsg.value = 'Le code reçu par email est requis.'
    return
  }

  codeLoading.value = true
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: codeEmail.value.trim(),
      token: codeToken.value.trim(),
      type: 'recovery',
    })
    if (error) throw error
    state.value = 'form'
  } catch (error) {
    console.error('ResetPassword verifyOtp error:', error)
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
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: pwd1.value })
    if (error) throw error

    ok.value = true
    msg.value = 'Mot de passe modifié avec succès.'
    state.value = 'success'
  } catch (error) {
    console.error('ResetPassword update error:', error)
    msg.value = mapRecoveryError(error)
  } finally {
    loading.value = false
  }
}

function mapRecoveryError(error) {
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

function goToLogin() {
  authSubscription?.data?.subscription?.unsubscribe?.()
  router.push('/')
}
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background:
    radial-gradient(circle at 15% 10%, rgba(98, 41, 255, 0.10), transparent 28rem),
    linear-gradient(135deg, var(--surface-ground, #f8f9fa) 0%, #fff 100%);
  font-family: var(--font-family, 'Poppins', sans-serif);
}

.reset-shell {
  width: min(100%, 68rem);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
  align-items: center;
}

.reset-brand {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
}

.brand-mark {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1.25rem;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color, #6229ff), #d49f3f);
  box-shadow: 0 1rem 3rem rgba(98, 41, 255, 0.18);
  font-size: 1.8rem;
  flex: 0 0 auto;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--primary-color, #6229ff);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1,
h2 {
  margin: 0;
  color: var(--text-color, #1f2937);
  line-height: 0.95;
  letter-spacing: -0.055em;
}

h1 {
  font-size: clamp(2.7rem, 6vw, 5.5rem);
  font-weight: 900;
}

h2 {
  font-size: clamp(1.85rem, 3vw, 2.7rem);
  font-weight: 900;
}

p,
small {
  color: var(--text-color-secondary, #5f6572);
  line-height: 1.55;
}

.reset-card {
  background: var(--surface-card, #fff);
  border: 1px solid var(--surface-border, rgba(0, 0, 0, 0.08));
  border-radius: 1.5rem;
  box-shadow: 0 1.5rem 4rem rgba(17, 24, 39, 0.10);
  padding: clamp(1.25rem, 4vw, 2rem);
}

.state-panel,
.password-form,
.code-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.state-panel {
  text-align: center;
  align-items: center;
}

.state-icon {
  font-size: 3rem;
}

.intro {
  display: grid;
  gap: 0.35rem;
}

.rules-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 1rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--primary-color, #6229ff) 7%, white);
}

.rule-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--text-color-secondary, #5f6572);
  font-weight: 700;
  font-size: 0.92rem;
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
  gap: 0.45rem;
  text-align: left;
}

label {
  color: var(--text-color, #1f2937);
  font-weight: 800;
}

:deep(.p-password-input),
:deep(.p-inputtext) {
  min-height: 3rem;
  border-radius: 0.9rem;
}

:deep(.p-password) {
  display: block;
}

:deep(.p-inline-message) {
  justify-content: flex-start;
  text-align: left;
}

@media (max-width: 900px) {
  .reset-shell {
    grid-template-columns: 1fr;
  }

  .reset-brand {
    max-width: 42rem;
  }
}

@media (max-width: 560px) {
  .reset-page {
    padding: 1rem;
    place-items: start center;
  }

  .reset-brand {
    flex-direction: column;
  }

  .rules-panel {
    grid-template-columns: 1fr;
  }

  .reset-card {
    border-radius: 1.1rem;
  }
}
</style>
