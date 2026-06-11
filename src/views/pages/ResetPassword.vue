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

      <div v-else-if="!recoveryActive" class="text-center p-4">
        <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
        <div class="text-700 mb-4">Lien invalide ou expire.</div>
        <Button label="Retour a la connexion" icon="pi pi-arrow-left" @click="router.push('/')" class="p-button-text" />
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

const router = useRouter()

const ready = ref(false)
const recoveryActive = ref(false)
const loading = ref(false)
const pwd1 = ref('')
const pwd2 = ref('')
const msg = ref('')
const ok = ref(false)

onMounted(async () => {
  console.log('ResetPassword: mount', window.location.href)

  const safetyTimeout = setTimeout(() => {
    if (!ready.value) {
      console.warn('ResetPassword: timeout fallback')
      ready.value = true
    }
  }, 6000)

  try {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('ResetPassword auth event:', event)
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        recoveryActive.value = true
        ready.value = true
      }
    })

    const searchParams = new URLSearchParams(window.location.search)

    // Legacy fallback: old links carrying tokens in query params.
    if (!recoveryActive.value) {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        if (!error) {
          recoveryActive.value = true
          ready.value = true
        }
      }
    }

    // Legacy fallback: implicit flow in hash.
    if (!recoveryActive.value) {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          if (!error) {
            recoveryActive.value = true
            ready.value = true
          }
        }
      }
    }

    // Main path: with detectSessionInUrl=true in the shared Supabase client,
    // PKCE code exchange already happens automatically.
    if (!recoveryActive.value) {
      await new Promise((resolve) => setTimeout(resolve, 700))
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        recoveryActive.value = true
        ready.value = true
      }
    }

    if (!recoveryActive.value) {
      for (let i = 0; i < 5; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          recoveryActive.value = true
          ready.value = true
          break
        }
      }
    }
  } catch (error) {
    console.error('ResetPassword error:', error)
  } finally {
    clearTimeout(safetyTimeout)
    ready.value = true
  }
})

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
