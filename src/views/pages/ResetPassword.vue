<template>
    <div class="p-4" style="max-width:520px;margin:0 auto">
      <h1 class="text-2xl mb-3">Réinitialiser le mot de passe</h1>
  
      <div v-if="!ready" class="text-700">Vérification du lien…</div>
  
      <div v-else-if="!recoveryActive" class="text-700">
        Lien invalide ou expiré.
        <div class="mt-2">
          <router-link to="/">Retour</router-link>
        </div>
      </div>
  
      <div v-else class="border-1 surface-border border-round p-3">
        <div class="mb-2 text-800 font-medium">Définir un nouveau mot de passe</div>
  
        <div class="grid" style="row-gap:.5rem">
          <div class="col-12">
            <input v-model="pwd1" type="password" class="w-full p-inputtext" placeholder="Nouveau mot de passe" />
          </div>
          <div class="col-12">
            <input v-model="pwd2" type="password" class="w-full p-inputtext" placeholder="Confirmer le mot de passe" />
          </div>
          <div class="col-12 flex gap-2 justify-content-end">
            <button class="p-button p-component" :disabled="loading" @click="save">
              <span class="p-button-label">{{ loading ? 'Enregistrement…' : 'Enregistrer' }}</span>
            </button>
          </div>
  
          <p v-if="msg" class="mt-2" :class="ok ? 'text-green-700' : 'text-red-700'">{{ msg }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { supabase } from '@/supabase.js'
  
  const ready = ref(false)
  const recoveryActive = ref(false)
  const loading = ref(false)
  const pwd1 = ref('')
  const pwd2 = ref('')
  const msg = ref('')
  const ok = ref(false)
  
  onMounted(async () => {
    // Le lien GoTrue a redirigé ici avec un hash:
    // #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash?.replace(/^#/, '') || ''
    const p = new URLSearchParams(hash)
    const type = p.get('type')
    const access_token = p.get('access_token')
    const refresh_token = p.get('refresh_token')
  
    if (type === 'recovery' && access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (!error) {
        recoveryActive.value = true
        // Nettoie l’URL (retire les tokens du hash)
        history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }
    }
  
    ready.value = true
  })
  
  const save = async () => {
    msg.value = ''
    ok.value = false
    if (pwd1.value.length < 8) {
      msg.value = '8 caractères minimum.'
      return
    }
    if (pwd1.value !== pwd2.value) {
      msg.value = 'Les mots de passe ne correspondent pas.'
      return
    }
    loading.value = true
    const { error } = await supabase.auth.updateUser({ password: pwd1.value })
    loading.value = false
    if (error) {
      msg.value = error.message
    } else {
      ok.value = true
      msg.value = 'Mot de passe modifié. Vous pouvez vous connecter.'
    }
  }
  </script>
  