<template>
  <div class="p-4">
    <h2 class="text-2xl font-semibold mb-2">Test Upload FTP</h2>
    <p class="text-sm text-gray-500 mb-4">
      Cette page permet de tester l'envoi de fichiers (images, PDF, Word, PowerPoint, etc.) vers le serveur FTP.
      Les fichiers seront rangés dans: <code>{{ baseDir }}</code>/<code>{{ institution || 'general' }}</code>/<code>{{ effectiveUserId }}</code>/<code>{{ folder || '' }}</code>
    </p>

    <div class="grid gap-3 max-w-2xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">Institution</label>
          <input v-model="institution" type="text" class="w-full p-inputtext p-component" placeholder="ex: CHVR, HEdS, Clinique-X" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Sous-dossier (optionnel)</label>
          <input v-model="folder" type="text" class="w-full p-inputtext p-component" placeholder="ex: syllabus, feed, contrats" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Utilisateur (détecté)</label>
        <input :value="effectiveUserId" type="text" class="w-full p-inputtext p-component" disabled />
      </div>

      <div class="border-2 border-dashed rounded-md p-4 text-center bg-gray-50"
           @dragover.prevent
           @drop.prevent="onDrop">
        <p class="mb-2">Glissez-déposez des fichiers ici, ou cliquez pour choisir</p>
        <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange" />
        <button class="p-button p-component" type="button" @click="() => fileInput?.click()">Choisir des fichiers</button>
        <div v-if="files.length" class="mt-3 text-left">
          <p class="text-sm font-medium mb-1">Fichiers sélectionnés ({{ files.length }})</p>
          <ul class="list-disc pl-5 text-sm">
            <li v-for="(f, i) in files" :key="i">{{ f.name }} ({{ formatSize(f.size) }})</li>
          </ul>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="p-button p-component" :disabled="isUploading || !files.length" @click="upload">
          <span v-if="!isUploading">Envoyer vers FTP</span>
          <span v-else>Envoi en cours...</span>
        </button>
        <span v-if="message" :class="{'text-green-600': success, 'text-red-600': !success}" class="text-sm">{{ message }}</span>
      </div>

      <div v-if="uploaded.length" class="mt-4">
        <h3 class="font-semibold mb-2">Résultats</h3>
        <ul class="list-disc pl-5 text-sm">
          <li v-for="(it, idx) in uploaded" :key="idx">
            {{ it.originalname }} → {{ it.remotePath }} ({{ it.mimetype }}, {{ formatSize(it.size) }})
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import apiClient from '@/service/apiClient'
import { useAuthStore } from '@/stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const baseDir = '/uploads'

const auth = useAuthStore()
const institution = ref('general')
const folder = ref('')
const files = ref([])
const fileInput = ref(null)
const isUploading = ref(false)
const message = ref('')
const success = ref(false)
const uploaded = ref([])

const effectiveUserId = computed(() => {
  const u = auth.user
  return u?.id || u?.uid || 'public'
})

function onFileChange(e) {
  files.value = Array.from(e.target.files || [])
}

function onDrop(e) {
  const dropped = Array.from(e.dataTransfer?.files || [])
  if (dropped.length) files.value = dropped
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes) return ''
  const units = ['B','KB','MB','GB']
  let i = 0
  let b = bytes
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++ }
  return `${b.toFixed(1)} ${units[i]}`
}

async function upload() {
  try {
    isUploading.value = true
    message.value = ''
    success.value = false
    uploaded.value = []

    if (!files.value.length) {
      message.value = 'Veuillez sélectionner au moins un fichier.'
      return
    }

    const fd = new FormData()
    fd.append('institution', institution.value || 'general')
    if (folder.value) fd.append('folder', folder.value)
    for (const f of files.value) fd.append('files', f)

    const { data } = await apiClient.post('/ftp/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })

    if (data?.ok) {
      success.value = true
      message.value = `Upload réussi (${data.count} fichier(s))`
      uploaded.value = data.files || []
      files.value = []
      if (fileInput.value) fileInput.value.value = ''
    } else {
      success.value = false
      message.value = data?.error || 'Erreur inconnue'
    }
  } catch (e) {
    success.value = false
    message.value = e?.response?.data?.error || e?.message || String(e)
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
/* Utilise les classes utilitaires existantes (PrimeVue/Tailwind). Styles minimes ici. */
</style>
