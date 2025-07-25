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
