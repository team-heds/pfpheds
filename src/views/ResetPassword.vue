<template>
  <div class="flex flex-column align-items-center justify-content-center h-screen bg-surface-ground">
    <div class="p-4 border-round shadow-2 bg-white w-full max-w-xs">
      <h2 class="mb-3">Réinitialiser le mot de passe</h2>
      <form @submit.prevent="resetPassword" class="flex flex-column gap-3">
        <input v-model="email" type="email" placeholder="Votre email" required class="w-full p-inputtext" />
        <button type="submit" class="w-full p-button p-button-primary">Envoyer le lien</button>
      </form>
      <p v-if="message" class="mt-3 text-green-600">{{ message }}</p>
      <p v-if="error" class="mt-3 text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const email = ref('');
const message = ref('');
const error = ref('');

const resetPassword = async () => {
  message.value = '';
  error.value = '';
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email.value);
    message.value = 'Un email de réinitialisation a été envoyé.';
  } catch (e) {
    error.value = e.message;
  }
};
</script>

<style scoped>
.bg-surface-ground {
  background: #f4f6fa;
}
</style>
