<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800" class="fixed left-0 top-0 min-h-screen min-w-screen" preserveAspectRatio="none">
    <rect :fill="darkMode ? 'var(--primary-900)' : 'var(--primary-500)'" width="1600" height="800" />
    <path
      :fill="darkMode ? 'var(--primary-800)' : 'var(--primary-400)'"
      d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2
        478.4 581z"
    />
    <path
      :fill="darkMode ? 'var(--primary-700)' : 'var(--primary-300)'"
      d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
    />
    <path
      :fill="darkMode ? 'var(--primary-600)' : 'var(--primary-200)'"
      d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z"
    />
    <path :fill="darkMode ? 'var(--primary-500)' : 'var(--primary-100)'" d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z" />
  </svg>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8" role="main">
    <div class="px-5 min-h-screen flex justify-content-center align-items-center">
      <div class="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
        <div class="mb-4">
          <h1 class="text-900 text-xl font-bold mb-2">Se connecter</h1>
          <p class="text-600 font-medium">Veuillez vous connecter avec votre compte.</p>
        </div>
        <form class="flex flex-column" @submit.prevent="submitForm" aria-label="Formulaire de connexion">
          <label for="email" class="sr-only">Adresse email</label>
          <IconField iconPosition="left" class="w-full mb-4">
            <InputIcon class="pi pi-envelope" />
            <InputText id="email" type="email" v-model="email" class="w-full md:w-25rem" placeholder="Email" autocomplete="email" aria-label="Adresse email" />
          </IconField>

          <label for="password" class="sr-only">Mot de passe</label>
          <IconField iconPosition="left" class="w-full mb-4">
            <InputIcon class="pi pi-lock" />
            <InputText id="password" type="password" v-model="password" class="w-full md:w-25rem" placeholder="Mot de passe" autocomplete="current-password" aria-label="Mot de passe" />
          </IconField>

          <div class="mb-4 flex flex-wrap gap-3">
            <Checkbox inputId="rememberMe" name="rememberMe" v-model="rememberMe" binary class="mr-2"></Checkbox>
            <label for="rememberMe" class="text-900 font-medium mr-8">Se souvenir de moi</label>
            <a class="text-600 cursor-pointer hover:text-primary cursor-pointer ml-auto transition-colors transition-duration-300" role="button" tabindex="0" @click="resetPassword" @keydown.enter="resetPassword">Mot de passe oublié ?</a>
          </div>

          <Button type="submit" label="Se connecter" class="w-full" aria-label="Se connecter" :loading="isSubmitting" :disabled="isSubmitting" />
        </form>
      </div>
    </div>
    <AppDarkAndLightMode simple />
    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/authStore';
import { useRateLimit } from '@/composables/useRateLimit';
import { validateEmail, validatePassword } from '@/composables/useInputValidation';
import { getPostLoginRedirect } from '@/config/adminRedirects';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const isSubmitting = ref(false);
const loginLimiter = useRateLimit({ maxAttempts: 5, lockoutDuration: 60_000 });
const resetLimiter = useRateLimit({ maxAttempts: 3, lockoutDuration: 120_000 });
const { layoutConfig } = useLayout();
const darkMode = ref(layoutConfig.colorScheme.value !== 'light');


const submitForm = async () => {
  // Validation des inputs
  const emailCheck = validateEmail(email.value);
  if (!emailCheck.valid) {
    toast.add({ severity: 'warn', summary: 'Email invalide', detail: emailCheck.message, life: 4000 });
    return;
  }
  const pwdCheck = validatePassword(password.value);
  if (!pwdCheck.valid) {
    toast.add({ severity: 'warn', summary: 'Mot de passe invalide', detail: pwdCheck.message, life: 4000 });
    return;
  }

  // Rate limiting
  if (loginLimiter.isLocked()) {
    const sec = loginLimiter.getLockoutRemaining();
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Veuillez patienter ${sec}s avant de réessayer.`, life: 5000 });
    return;
  }
  if (!loginLimiter.recordAttempt()) {
    const sec = loginLimiter.getLockoutRemaining();
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Compte temporairement bloqué. Réessayez dans ${sec}s.`, life: 5000 });
    return;
  }

  isSubmitting.value = true;
  try {
    await authStore.signInFirebase({ email: email.value, password: password.value });
    loginLimiter.reset();
    toast.add({ severity: 'success', summary: 'Connexion réussie', detail: 'Vous allez être redirigé vers le feed...', life: 3000 });
    
    const redirectPath = getPostLoginRedirect(email.value);
    setTimeout(() => {
      router.push(redirectPath);
    }, 1500);
  } catch (error) {
    console.error('Firebase login error:', error);
    const messages = {
      'auth/user-not-found': 'Utilisateur introuvable.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/invalid-email': 'Adresse e-mail invalide.',
      'auth/user-disabled': 'Ce compte est désactivé.',
      'auth/invalid-credential': 'Identifiants invalides.'
    };
    const errorMessage = messages[error.code] || 'Une erreur est survenue lors de la connexion.';
    toast.add({ severity: 'error', summary: 'Erreur de connexion', detail: errorMessage, life: 5000 });
  } finally {
    isSubmitting.value = false;
  }
};

const resetPassword = async () => {
  const emailCheck = validateEmail(email.value);
  if (!emailCheck.valid) {
    toast.add({ severity: 'warn', summary: 'Email requis', detail: emailCheck.message, life: 5000 });
    return;
  }

  if (resetLimiter.isLocked()) {
    const sec = resetLimiter.getLockoutRemaining();
    toast.add({ severity: 'error', summary: 'Trop de tentatives', detail: `Veuillez patienter ${sec}s avant de réessayer.`, life: 5000 });
    return;
  }
  resetLimiter.recordAttempt();

  try {
    await authStore.resetPasswordFirebase(email.value);
    toast.add({ severity: 'success', summary: 'Email envoyé', detail: 'Un email de réinitialisation de mot de passe a été envoyé.', life: 5000 });
  } catch (error) {
    console.error('Firebase reset password error:', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message || 'Impossible d\'envoyer l\'email de réinitialisation.', life: 5000 });
  }
};
</script>

<style scoped>
/* Tes styles spécifiques ici */
</style>
