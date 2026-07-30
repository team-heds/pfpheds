<template>
  <div class="flex flex-column justify-content-center align-items-center h-screen bg-surface-ground px-4">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-5">
        <h1 class="text-900 text-3xl font-medium mb-3">Reinitialisation</h1>
        <span class="text-600 font-medium line-height-3">Definissez votre nouveau mot de passe</span>
      </div>

      <div v-if="!ready" class="flex flex-column align-items-center justify-content-center p-5">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <span class="text-700">Verification du lien...</span>
      </div>

      <div v-else-if="!recoveryActive" class="p-4">
        <div class="text-center mb-4">
          <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
          <div class="text-700">Lien invalide ou expire.</div>
          <div class="text-600 text-sm mt-2">
            Cela arrive souvent quand un filtre anti-spam de votre messagerie visite le lien avant vous.
            Utilisez plutot le code recu dans le meme email ci-dessous.
          </div>
        </div>

        <form class="flex flex-column gap-3" @submit.prevent="verifyWithCode">
          <div>
            <label for="codeEmail" class="block text-900 font-medium mb-2">Email</label>
            <InputText id="codeEmail" v-model="codeEmail" type="email" class="w-full" autocomplete="username" />
          </div>
          <div>
            <label for="codeToken" class="block text-900 font-medium mb-2">Code recu par email</label>
            <InputText id="codeToken" v-model="codeToken" class="w-full" placeholder="Ex: 123456" autocomplete="one-time-code" />
          </div>
          <Button label="Verifier le code" icon="pi pi-check" class="w-full mt-2" type="submit" :loading="codeLoading" />
          <div v-if="codeMsg" class="mt-2 p-3 border-round text-center bg-red-100 text-red-700">
            <i class="pi pi-times-circle mr-2"></i>{{ codeMsg }}
          </div>
        </form>

        <div class="text-center mt-4">
          <Button label="Retour a la connexion" icon="pi pi-arrow-left" @click="router.push('/')" class="p-button-text" />
        </div>
      </div>

      <div v-else>
        <form class="flex flex-column gap-3" @submit.prevent="save">
          <div>
            <label for="pwd1" class="block text-900 font-medium mb-2">Nouveau mot de passe</label>
            <Password
              id="pwd1"
              v-model="pwd1"
              :toggleMask="true"
              class="w-full"
              inputClass="w-full"
              :inputProps="{ autocomplete: 'new-password' }"
              placeholder="Minimum 8 caracteres"
            />
          </div>

          <div>
            <label for="pwd2" class="block text-900 font-medium mb-2">Confirmer le mot de passe</label>
            <Password
              id="pwd2"
              v-model="pwd2"
              :toggleMask="true"
              class="w-full"
              inputClass="w-full"
              :inputProps="{ autocomplete: 'new-password' }"
              :feedback="false"
              placeholder="Repetez le mot de passe"
            />
          </div>

          <Button
            label="Enregistrer le mot de passe"
            icon="pi pi-check"
            class="w-full mt-2"
            type="submit"
            :loading="loading"
          />

          <div v-if="msg" :class="['mt-3 p-3 border-round text-center', ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
            <i :class="['pi mr-2', ok ? 'pi-check-circle' : 'pi-times-circle']"></i>
            {{ msg }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'

const router = useRouter()

const ready = ref(false)
const recoveryActive = ref(false)
const loading = ref(false)
const pwd1 = ref('')
const pwd2 = ref('')
const msg = ref('')
const ok = ref(false)

const codeEmail = ref('')
const codeToken = ref('')
const codeLoading = ref(false)
const codeMsg = ref('')

onMounted(async () => {
  // Le lien de récupération GoTrue redirige avec les jetons dans le fragment
  // d'URL (#access_token=...&type=recovery), pas au format PKCE (?code=).
  // On traite ça de façon déterministe au montage, sans sondage/attente.

  // Écouteur posé en premier pour ne rater aucun événement émis pendant
  // le traitement (setSession ci-dessous, ou traitement auto du client).
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
      recoveryActive.value = true
      ready.value = true
    }
  })

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  const hashAccessToken = hashParams.get('access_token')
  const hashRefreshToken = hashParams.get('refresh_token')
  const queryCode = searchParams.get('code')

  try {
    if (hashAccessToken) {
      const { error } = await supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken || ''
      })
      if (!error) {
        recoveryActive.value = true
      }
    } else if (queryCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(queryCode)
      if (!error) {
        recoveryActive.value = true
      }
    } else {
      // Pas de jeton dans l'URL : peut-être déjà traité automatiquement par
      // le client (detectSessionInUrl) juste avant le montage du composant.
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        recoveryActive.value = true
      }
    }
  } catch (error) {
    console.error('ResetPassword error:', error)
  } finally {
    ready.value = true
  }
})

const verifyWithCode = async () => {
  codeMsg.value = ''

  if (!codeEmail.value || !codeToken.value) {
    codeMsg.value = 'Email et code requis.'
    return
  }

  codeLoading.value = true
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: codeEmail.value,
      token: codeToken.value.trim(),
      type: 'recovery'
    })
    if (error) throw error
    recoveryActive.value = true
  } catch (error) {
    codeMsg.value = error.message || 'Code invalide ou expire.'
  } finally {
    codeLoading.value = false
  }
}

const save = async () => {
  msg.value = ''
  ok.value = false

  if (!pwd1.value) {
    msg.value = 'Le mot de passe est requis.'
    return
  }

  if (pwd1.value.length < 8) {
    msg.value = 'Le mot de passe doit contenir au moins 8 caracteres.'
    return
  }

  if (pwd1.value !== pwd2.value) {
    msg.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: pwd1.value })
    if (error) throw error

    ok.value = true
    msg.value = 'Mot de passe modifie avec succes. Redirection...'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (error) {
    msg.value = error.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>
