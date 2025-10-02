<script setup>
import { onMounted } from 'vue'
import { usePushStore } from '@/stores/pushStore'

const push = usePushStore()
onMounted(() => push.refreshStatus())

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
      <button class="px-3 py-2 rounded bg-blue-600 text-white" @click="onEnable" :disabled="push.loading">Activer</button>
      <button class="px-3 py-2 rounded bg-gray-600 text-white" @click="onDisable" :disabled="push.loading">Désactiver</button>
      <button class="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
              @click="onSendTest"
              :disabled="!push.isSubscribed || push.loading">
        {{ push.loading ? 'Envoi…' : 'Envoyer un test' }}
      </button>
    </div>

    <p class="text-xs mt-3 opacity-70">
      iOS : la PWA doit être installée (écran d’accueil) et la permission doit être demandée après un clic.
    </p>
  </div>
</template>
