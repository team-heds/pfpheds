<template>
  <div class="flex flex-column justify-content-center align-items-center h-screen bg-surface-ground px-4">
    <div class="surface-card p-4 shadow-2 border-round w-full lg:w-4">
      <div class="text-center mb-5">
        <h1 class="text-900 text-3xl font-medium mb-3">Réinitialisation</h1>
        <span class="text-600 font-medium line-height-3">Définissez votre nouveau mot de passe</span>
      </div>

      <div v-if="!ready" class="flex flex-column align-items-center justify-content-center p-5">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <span class="text-700">Vérification du lien...</span>
      </div>

      <div v-else-if="!recoveryActive" class="text-center p-4">
        <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-3"></i>
        <div class="text-700 mb-4">Lien invalide ou expiré.</div>
        <Button label="Retour à la connexion" icon="pi pi-arrow-left" @click="router.push('/')" class="p-button-text" />
      </div>

      <div v-else>
        <div class="flex flex-column gap-3">
          <div>
            <label for="pwd1" class="block text-900 font-medium mb-2">Nouveau mot de passe</label>
            <Password 
              id="pwd1" 
              v-model="pwd1" 
              :toggleMask="true" 
              class="w-full" 
              inputClass="w-full"
              placeholder="Minimum 8 caractères"
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
              :feedback="false"
              placeholder="Répétez le mot de passe"
            />
          </div>

          <Button 
            label="Enregistrer le mot de passe" 
            icon="pi pi-check" 
            class="w-full mt-2" 
            :loading="loading" 
            @click="save" 
          />
          
          <div v-if="msg" :class="['mt-3 p-3 border-round text-center', ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
            <i :class="['pi mr-2', ok ? 'pi-check-circle' : 'pi-times-circle']"></i>
            {{ msg }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import Password from 'primevue/password'

const router = useRouter()
const authStore = useAuthStore()

const ready = ref(false)
const recoveryActive = ref(false)
const loading = ref(false)
const pwd1 = ref('')
const pwd2 = ref('')
const msg = ref('')
const ok = ref(false)

onMounted(async () => {
  console.log('ResetPassword: Montage du composant')
  console.log('ResetPassword: URL:', window.location.href)

  // Timeout de sécurité
  const safetyTimeout = setTimeout(() => {
    if (!ready.value) {
      console.warn('ResetPassword: Timeout, affichage forcé')
      ready.value = true
    }
  }, 6000)

  try {
    // 1. Écouter les événements auth (enregistrer AVANT tout échange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('ResetPassword Auth Event:', event)
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && sess)) {
        recoveryActive.value = true
        ready.value = true
      }
    })

    // 2. Tenter l'échange du code PKCE si présent dans l'URL
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    if (code) {
      console.log('ResetPassword: Code PKCE détecté, échange en cours...')
      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          // Si "code already used" → la session a déjà été créée par detectSessionInUrl
          if (exchangeError.message?.includes('already') || exchangeError.message?.includes('expired')) {
            console.warn('ResetPassword: Code déjà utilisé, vérification session existante...')
          } else {
            throw exchangeError
          }
        } else if (data?.session) {
          console.log('ResetPassword: Code échangé avec succès')
          recoveryActive.value = true
          ready.value = true
        }
      } catch (e) {
        console.error('ResetPassword: Erreur échange code PKCE:', e.message)
      }
    }

    // 3. Fallback Implicit Flow (hash avec access_token)
    const hash = window.location.hash
    if (!recoveryActive.value && hash && hash.includes('access_token')) {
      console.log('ResetPassword: Tokens détectés dans URL (Implicit)')
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token) {
        const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token: refresh_token || '' })
        if (!sessErr) {
          recoveryActive.value = true
          ready.value = true
        }
      }
    }

    // 4. Vérifier si une session existe déjà (code échangé par detectSessionInUrl)
    if (!recoveryActive.value) {
      // Petit délai pour laisser detectSessionInUrl finir
      await new Promise(r => setTimeout(r, 500))
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        console.log('ResetPassword: Session existante détectée')
        recoveryActive.value = true
        ready.value = true
      }
    }

    // 5. Retry polling si toujours rien
    if (!recoveryActive.value) {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 800))
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          console.log('ResetPassword: Session trouvée (polling tentative ' + (i + 1) + ')')
          recoveryActive.value = true
          ready.value = true
          break
        }
      }
    }
  } catch (e) {
    console.error('ResetPassword Error:', e)
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
    msg.value = 'Le mot de passe doit contenir au moins 8 caractères.'
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
      msg.value = 'Mot de passe modifié avec succès. Redirection...'
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
  