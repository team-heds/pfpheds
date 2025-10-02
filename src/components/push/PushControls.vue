<script setup>
import { onMounted, ref } from 'vue'
import { usePushStore } from '@/stores/pushStore'
 import { supabase } from '@/supabase'

onMounted(() => push.refreshStatus())
 
const push = usePushStore()
const userProfile = ref(null)
const currentUserId = ref(null)
const currentUserRole = ref(null)
<<<<<<< HEAD
 
=======
const adminCount = ref(0)

>>>>>>> 8c6a0e4 (piush admin)
async function loadUserProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      currentUserId.value = session.user.id
      
      // Récupérer le profil utilisateur avec le rôle
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, email, forname, family_name')
        .eq('user_id', session.user.id)
        .single()
      
      if (error) {
        console.error('Erreur lors du chargement du profil:', error)
        currentUserRole.value = 'non défini'
      } else {
        userProfile.value = profile
        currentUserRole.value = profile?.role || 'user'
      }
    }
  } catch (e) {
    console.error('Erreur loadUserProfile:', e)
  }
}
 
onMounted(async () => {
  await push.refreshStatus()
  await loadUserProfile()
  // Charger le nombre d'admins
  adminCount.value = await push.getAdminCount()
})
 
async function onEnable () { await push.enable() }
async function onDisable () { await push.disable() }
 
async function onSendTest () {
  try {
    const row = await push.sendTest({ title: 'Hello 👋', body: 'Test push', url: '/' })
    // row contient au moins id, status='pending'
    alert(`Commande push créée ✅\nID: ${row?.id || 'inconnu'}\nStatus: ${row?.status || 'pending'}`)
  } catch (e) {
    alert(`Erreur: ${e?.message || e}`)
  }
}
 
async function onSendToAdmins () {
  try {
    const result = await push.sendToAllAdmins({
      title: 'Notification Admin 🔔',
      body: 'Ceci est un message pour tous les administrateurs',
      url: '/admin'
    })
    alert(`✅ Notifications envoyées à TOUS les admins\n(y compris vous-même)\n\nTotal: ${result.total} admin(s)\nRéussi: ${result.success}\nÉchec: ${result.failed}`)
  } catch (e) {
    alert(`❌ Erreur: ${e?.message || e}`)
  }
}
</script>
 
 
<template>
  <div class="p-4 border rounded max-w-md">
    <h2 class="font-semibold mb-2">Push Notifications</h2>
 
    <div class="text-sm mb-2">
      <div>Permission : <strong>{{ push.permission }}</strong></div>
      <div>Abonné : <strong>{{ push.isSubscribed ? 'oui' : 'non' }}</strong></div>
      <div v-if="push.endpoint" class="break-all text-xs opacity-70">Endpoint: {{ push.endpoint }}</div>
      <div class="text-xs mt-1" :class="push.error ? 'text-red-600' : 'text-green-700'">{{ msg }}</div>
    </div>
 
    <div class="flex gap-2 mb-2">
<<<<<<< HEAD
 
    <div class="text-sm mb-3 p-2 rounded">
=======

    <div class="text-sm mb-3 p-2 bg-gray-100 rounded">
>>>>>>> 8c6a0e4 (piush admin)
      <div class="font-semibold mb-1">👤 Utilisateur connecté :</div>
      <div class="text-xs">
        <div><strong>ID :</strong> <span class="font-mono">{{ currentUserId || 'Non connecté' }}</span></div>
        <div><strong>Rôle :</strong> <span class="px-2 py-0.5 rounded" :class="currentUserRole === 'admin' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'">{{ currentUserRole || 'Non défini' }}</span></div>
        <div v-if="userProfile?.email"><strong>Email :</strong> {{ userProfile.email }}</div>
        <div v-if="userProfile?.forname || userProfile?.family_name"><strong>Nom :</strong> {{ userProfile.forname }} {{ userProfile.family_name }}</div>
      </div>
    </div>

    <div class="text-sm mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
      <div class="flex items-center gap-2">
        <span class="text-lg">👥</span>
        <div>
          <div class="font-semibold text-orange-800">Administrateurs actifs :</div>
          <div class="text-2xl font-bold text-orange-600">{{ adminCount }}</div>
        </div>
      </div>
    </div>
 
    <div class="flex gap-2 mb-2 flex-wrap">
      <button class="px-3 py-2 rounded bg-blue-600 text-white" @click="onEnable" :disabled="push.loading">Activer</button>
      <button class="px-3 py-2 rounded bg-gray-600 text-white" @click="onDisable" :disabled="push.loading">Désactiver</button>
      <button class="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
              @click="onSendTest"
              :disabled="!push.isSubscribed || push.loading">
        {{ push.loading ? 'Envoi…' : 'Envoyer un test' }}
      </button>
      <button class="px-3 py-2 rounded bg-orange-600 text-white disabled:opacity-60"
              @click="onSendToAdmins"
              :disabled="push.loading">
        {{ push.loading ? 'Envoi…' : '🔔 Notifier tous les admins' }}
      </button>
    </div>
 
    <p class="text-xs mt-3 opacity-70">
      iOS : la PWA doit être installée (écran d’accueil) et la permission doit être demandée après un clic.
    </p>
  </div>
  </div>
</template>
 
 