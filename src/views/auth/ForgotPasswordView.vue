<<<<<<< HEAD:src/views/auth/ForgotPasswordView.vue
<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AppConfig from '@/layout/AppConfig.vue';

const router = useRouter();

const { layoutConfig } = useLayout();

const darkMode = computed(() => {
    return layoutConfig.colorScheme.value !== 'light';
});
const navigateToDashboard = () => {
    router.push({ name: 'e-commerce' });
};
</script>

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
    <div class="px-5 min-h-screen flex justify-content-center align-items-center">
        <div class="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
            <div class="mb-4">
                <div class="text-900 text-xl font-bold mb-2">Forgot Password</div>
                <span class="text-600 font-medium">Enter your email to reset your password</span>
            </div>
            <div class="flex flex-column">
                <IconField iconPosition="left" class="w-full mb-4">
                    <InputIcon class="pi pi-envelope" />
                    <InputText id="email" type="text" class="w-full md:w-25rem" placeholder="Email" />
                </IconField>
                <div class="flex flex-wrap gap-2 justify-content-between">
                    <Button label="Cancel" class="flex-auto" outlined @click="navigateToDashboard"></Button>
                    <Button label="Submit" class="flex-auto" @click="navigateToDashboard"></Button>
                </div>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>
=======
<template>
  <div class="flex flex-column lg:flex-row justify-content-center align-items-center h-screen bg-surface-ground px-2 lg:px-0">
    <div class="flex flex-column lg:flex-row w-full max-w-7xl rounded-md overflow-hidden">
      <!-- Section gauche (logo) -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6 text-white p-5">
        <img src="/assets/images/FR-DE_HEdS_rvb_neg.png" alt="Logo" class="mb-3 h-8rem lg:h-15rem" />
      </div>
      <!-- Section droite (formulaire) -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6  p-4" style="min-height: 400px;">
        <h1 class="text-4xl lg:text-6xl text-left mb-4">Nouveau mot de passe</h1>
        <form @submit.prevent="submitNewPassword" class="w-full max-w-25rem">
          <div class="mb-4">
            <Password
              id="password1"
              v-model="value1"
              placeholder="Nouveau mot de passe"
              inputClass="w-full"
              :feedback="false"
              toggleMask
              class="w-full"
            />
          </div>
          <div class="mb-4">
            <Password
              id="password2"
              v-model="value2"
              placeholder="Répéter le mot de passe"
              inputClass="w-full"
              :feedback="false"
              toggleMask
              class="w-full"
            />
          </div>
          <Button label="Valider" type="submit" class="w-full p-button-raised mb-2" />
          <Button label="Annuler" type="button" class="w-full p-button-text" @click="navigateToDashboard" />
        </form>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';
import { supabase } from '@/supabase.js';
import { useToast } from 'primevue/usetoast';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const value1 = ref('');
const value2 = ref('');
const router = useRouter();
const route = useRoute();
const toast = useToast();



const navigateToDashboard = () => {
  router.push({ name: '/' });
};

const submitNewPassword = async () => {
  if (!value1.value || !value2.value || value1.value !== value2.value) {
    toast.add({ severity: 'warn', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas.', life: 4000 });
    return;
  }
  const access_token = route.query.access_token;
  if (!access_token) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Lien invalide ou expiré.', life: 4000 });
    return;
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: value1.value }, { accessToken: access_token });
    if (error) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
    } else {
      toast.add({ severity: 'success', summary: 'Mot de passe changé', detail: 'Votre mot de passe a été mis à jour.', life: 4000 });
      setTimeout(() => navigateToDashboard(), 1500);
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
  }
};
</script>

<style scoped>
/* Tu peux ajouter ici des styles personnalisés si besoin */
</style>
>>>>>>> prod:src/views/pages/auth/NewPassword.vue
