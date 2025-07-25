<template>
  <div class="flex flex-column lg:flex-row justify-content-center align-items-center h-screen bg-surface-ground px-2 lg:px-0">
    <div class="flex flex-column lg:flex-row w-full max-w-7xl rounded-md overflow-hidden">
      <!-- Section gauche (logo) -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6 text-white p-5">
        <img src="/assets/images/FR-DE_HEdS_rvb_neg.png" alt="Logo" class="mb-3 h-8rem lg:h-15rem" />
      </div>
      <!-- Section droite (formulaire) -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6  p-4" style="min-height: 400px;">
        <h1 class="text-4xl lg:text-6xl text-left mb-4">Connexion (Supabase)</h1>
        <form @submit.prevent="submitForm" class="w-full max-w-25rem">
          <div class="mb-4">
            <InputText
              id="email"
              type="email"
              v-model="email"
              placeholder="Email"
              class="w-full"
              :class="{ 'p-invalid': emailError }"
            />
          </div>
          <div class="mb-4">
            <Password
              id="password"
              v-model="password"
              placeholder="Mot de passe"
              inputClass="w-full"
              :feedback="false"
              :class="{ 'p-invalid': passwordError }"
              toggleMask
            />
            <small v-if="passwordError" class="p-error">Le mot de passe est requis.</small>
          </div>
          <div class="flex align-items-center mb-4">
            <Checkbox v-model="rememberMe" inputId="remember-me" binary class="mr-2" />
            <label for="remember-me" class="text-sm">Se souvenir de moi</label>
          </div>
          <Button label="Se connecter" type="submit" class="w-full p-button-raised " />
        </form>
        <p class="mt-4 text-sm text-center">
          <a type="button" @click="resetPassword" class="text-primary font-bold hover:underline bg-transparent border-0 cursor-pointer p-0">
            Mot de passe oublié ?
          </a>
        </p>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase.js'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Toast from 'primevue/toast'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const emailError = ref(false)
const passwordError = ref(false)
const router = useRouter()
const toast = useToast()

const submitForm = async () => {
  emailError.value = !email.value || !email.value.includes('@')
  passwordError.value = !password.value
  if (emailError.value || passwordError.value) return
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 })
    } else {
      toast.add({ severity: 'success', summary: 'Connexion réussie', detail: 'Bienvenue !', life: 3000 })
      // router.push('/home') // Décommente si tu veux rediriger
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 })
  }
}

const resetPassword = async () => {
  emailError.value = !email.value || !email.value.includes('@')
  if (emailError.value) {
    toast.add({ severity: 'warn', summary: 'Email requis', detail: 'Veuillez entrer votre email pour recevoir un lien de réinitialisation.', life: 3000 })
    return
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value)
    console.log('resetPasswordForEmail error:', error)
    if (error) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 })
    } else {
      toast.add({ severity: 'success', summary: 'Email envoyé', detail: 'Un lien de réinitialisation a été envoyé à votre adresse email.', life: 4000 })
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 })
  }
}
</script>

<style scoped>

</style>
