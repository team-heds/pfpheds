<template>
  <div class="flex flex-column lg:flex-row justify-content-center align-items-center h-screen bg-surface-ground px-2 lg:px-0">
    <!-- Conteneur principal -->
    <div class="flex flex-column lg:flex-row w-full max-w-7xl rounded-md overflow-hidden">
      <!-- Section gauche - Logo -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6 text-white p-5">
        <img
          src="/assets/images/FR-DE_HEdS_rvb_neg.png"
          alt="Logo"
          class="mb-3 h-8rem lg:h-15rem" />
      </div>

      <!-- Section droite - Sélection de connexion -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6 p-4 lg:p-7">
        <h1 class="title-hero text-4xl lg:text-6xl text-left mb-4">Veuillez vous connecter :</h1>

        <!-- Système d'onglets pour choisir le type de connexion -->
        <div class="w-full" style="max-width: 28rem;">
          <div class="px-1">
            <!-- Contenu - Formulaire Supabase -->
            <div v-if="activeTab === 'supabase'" class="tab-content">
              <AuthForm
                :email="email"
                :password="password"
                :remember="rememberMe"
                :loading="loading"
                :emailError="emailError"
                :passwordError="passwordError"
                :resetLoading="resetLoading"
                @update:email="val => (email = val)"
                @update:password="val => (password = val)"
                @update:remember="val => (rememberMe = val)"
                @submit="submitFormSupabase"
                @reset-password="resetPassword"
              />
            </div>

            <!-- Contenu - Bouton Firebase -->
            <div v-if="activeTab === 'firebase'" class="tab-content">
              <div class="text-center mb-4">
                <p class="text-sm text-600 mb-4">
                  Connectez-vous pour accéder à la votation PFP
                </p>
                <Button
                  @click="navigateToFirebaseLogin"
                  class="w-full p-button-raised firebase-button"
                  label="Connexion Firebase"
                  icon="pi pi-sign-in"
                  aria-label="Se connecter avec Firebase (votation)"
                  :loading="loadingFirebase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import { useRateLimit } from '@/composables/useRateLimit'
import { validateEmail, validatePassword } from '@/composables/useInputValidation'
import { getPostLoginRedirect } from '@/config/adminRedirects'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import AuthForm from '@/components/common/forms/AuthForm.vue'

// Variables réactives
const activeTab = ref('supabase') // Onglet actif par défaut
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const emailError = ref(false)
const passwordError = ref(false)
const loading = ref(false)
const loadingFirebase = ref(false)
const resetLoading = ref(false)
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const loginLimiter = useRateLimit({ maxAttempts: 5, lockoutDuration: 60_000 })
const resetLimiter = useRateLimit({ maxAttempts: 3, lockoutDuration: 120_000 })


// Méthode de connexion Supabase
const submitFormSupabase = async () => {
  const emailCheck = validateEmail(email.value)
  const pwdCheck = validatePassword(password.value)
  emailError.value = !emailCheck.valid
  passwordError.value = !pwdCheck.valid
  
  if (emailError.value || passwordError.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Champs invalides', 
      detail: emailCheck.message || pwdCheck.message || 'Veuillez corriger les erreurs.', 
      life: 3000 
    })
    return
  }

  // Rate limiting
  if (loginLimiter.isLocked()) {
    const sec = loginLimiter.getLockoutRemaining()
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Veuillez patienter ${sec}s avant de réessayer.`, life: 5000 })
    return
  }
  if (!loginLimiter.recordAttempt()) {
    const sec = loginLimiter.getLockoutRemaining()
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Compte temporairement bloqué. Réessayez dans ${sec}s.`, life: 5000 })
    return
  }

  loading.value = true
  try {
    await authStore.signInSupabase({ 
      email: email.value, 
      password: password.value 
    })
    loginLimiter.reset()
    
    toast.add({ 
      severity: 'success', 
      summary: 'Connexion réussie', 
      detail: 'Bienvenue ! Redirection en cours...', 
      life: 3000 
    })
    
    const redirectPath = getPostLoginRedirect(email.value)
    setTimeout(() => router.push(redirectPath), 1500)
  } catch (error) {
    console.error('Supabase login error:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur de connexion', 
      detail: error.message || 'Une erreur est survenue.', 
      life: 4000 
    })
  } finally {
    loading.value = false
  }
}

// Méthode de réinitialisation du mot de passe
const resetPassword = async () => {
  // Garde anti-double-soumission : un deuxième clic pendant l'envoi générerait
  // un second lien de récupération qui invaliderait immédiatement le premier
  // (jeton à usage unique côté GoTrue), rendant le premier email inutilisable.
  if (resetLoading.value) return

  const emailCheck = validateEmail(email.value)
  emailError.value = !emailCheck.valid

  if (emailError.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email requis',
      detail: emailCheck.message,
      life: 3000
    })
    return
  }

  if (resetLimiter.isLocked()) {
    const sec = resetLimiter.getLockoutRemaining()
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Veuillez patienter ${sec}s.`, life: 5000 })
    return
  }
  resetLimiter.recordAttempt()

  resetLoading.value = true
  try {
    await authStore.resetPasswordSupabase(email.value)
    toast.add({
      severity: 'success',
      summary: 'Email envoyé',
      detail: 'Un lien de réinitialisation a été envoyé à votre adresse email. N\'utilisez que le dernier email reçu et cliquez une seule fois sur le lien.',
      life: 6000
    })
  } catch (error) {
    console.error('Supabase reset password error:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de l\'envoi de l\'email.',
      life: 4000
    })
  } finally {
    resetLoading.value = false
  }
}

// Méthode pour naviguer vers la connexion Firebase
const navigateToFirebaseLogin = () => {
  loadingFirebase.value = true
  toast.add({
    severity: "info",
    summary: "Redirection",
    detail: "Redirection vers la connexion Firebase...",
    life: 2000,
  })
  setTimeout(() => {
    router.push("/login-firebase")
    loadingFirebase.value = false
  }, 1000)
}
</script>

<style scoped>
/* Adaptations pour mobile */
@media (max-width: 768px) {
  h1 {
    font-size: 1.75rem;
  }

  img {
    max-height: 8rem;
  }
}

/* Titre principal (style proche du visuel fourni) */
.title-hero {
  font-weight: 800; /* très gras */
  line-height: 1.15; /* hauteur de ligne plus compacte */
  letter-spacing: -0.02em; /* léger serrage des lettres */
  max-width: 22rem; /* force un retour à la ligne élégant */
}

@media (min-width: 1024px) {
  .title-hero {
    max-width: 26rem; /* un peu plus large sur desktop */
  }
}

/* (styles onglets supprimés car non utilisés) */

/* Animation du contenu des onglets */
.tab-content {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* (styles de carte supprimés pour éviter les fonds) */

/* Bouton Supabase - Connexion principale */
.supabase-button {
  background: linear-gradient(135deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
  transition: all 0.3s ease;
  font-weight: 600;
  border-radius: 12px;
  height: 3rem;
}

.supabase-button:hover {
  transform: translateY(-2px);
}

.supabase-button:focus-visible {
  outline: 2px solid #111; /* contraste élevé */
  outline-offset: 2px;
}

/* Bouton Firebase */
.firebase-button {
  background: linear-gradient(135deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(243, 195, 0, 0.3);
  font-weight: 600;
  border-radius: 12px;
  height: 3rem;
}

.firebase-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(243, 195, 0, 0.4);
}

.firebase-button:focus-visible {
  outline: 2px solid #111;
  outline-offset: 2px;
}

/* Styles pour les champs de formulaire */
form {
  animation: fadeInUp 0.6s ease-out;
}

/* Messages d'erreur */
.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Checkbox et label */
label {
  cursor: pointer;
}

/* Lien mot de passe oublié */
a {
  transition: all 0.2s ease;
}

a:hover {
  opacity: 0.8;
}

/* Animation d'entrée */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Amélioration des champs de formulaire */
:deep(.p-inputtext),
:deep(.p-password-input) {
  border-radius: 12px;
  padding: 0.9rem 1rem;
  height: 3.2rem;
  font-size: 1.05rem;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus),
:deep(.p-password-input:focus) {
  box-shadow: 0 0 0 0.2rem rgba(62, 207, 142, 0.25);
  border-color: #3ECF8E;
}

:deep(.p-invalid) {
  border-color: #e24c4c !important;
}

/* Forcer la même largeur pour email et mot de passe */
:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input.p-inputtext) {
  width: 100%;
}
</style>
