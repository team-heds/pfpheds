<template>
  <div class="modal-overlay">
    <form class="modal-content" role="dialog" aria-modal="true" aria-labelledby="add-document-title" @submit.prevent="handleSave">
      <h4 id="add-document-title">Ajouter un fichier ou un lien</h4>
      <label><input v-model="useExternalLink" type="checkbox" :disabled="uploading" /> Utiliser une URL externe</label>
      <label>Nom du fichier / lien<input v-model="localFile.name" type="text" required :disabled="uploading" /></label>
      <label v-if="useExternalLink">URL du lien<input v-model="localFile.url" type="url" placeholder="https://…" required :disabled="uploading" /></label>
      <label v-else>Sélectionner le fichier<input type="file" :accept="DOCUMENT_ACCEPT" required :disabled="uploading" @change="handleFileChange" /></label>
      <p v-if="!useExternalLink" class="file-help">PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP ou TXT · 20 Mo maximum</p>
      <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
      <div class="modal-actions">
        <button type="submit" class="p-button p-component" :disabled="uploading">{{ uploading ? 'Téléversement…' : 'Sauvegarder' }}</button>
        <button type="button" class="p-button p-component p-button-secondary" :disabled="uploading" @click="emits('close')">Annuler</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { DOCUMENT_ACCEPT, uploadFilePhysioDocument, validateDocumentUrl } from '@/service/filePhysioMediaService'

const emits = defineEmits(['close', 'save'])
const localFile = ref({ name: '', url: '' })
const useExternalLink = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)
const errorMessage = ref('')

const handleFileChange = event => { selectedFile.value = event.target.files?.[0] || null }

async function handleSave() {
  if (uploading.value) return
  errorMessage.value = ''
  if (!localFile.value.name.trim()) {
    errorMessage.value = 'Saisissez le nom du document.'
    return
  }
  uploading.value = true
  try {
    const url = useExternalLink.value
      ? validateDocumentUrl(localFile.value.url)
      : (await uploadFilePhysioDocument(selectedFile.value)).url
    emits('save', { id: crypto.randomUUID(), name: localFile.value.name.trim(), url })
  } catch (error) {
    errorMessage.value = error.message || 'Le document n’a pas pu être téléversé.'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgb(0 0 0 / 50%); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-content { width: min(100%, 420px); background: var(--surface-card, #0b213f); color: var(--text-color, #fff); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--surface-border); }
label { display: block; margin-top: 1rem; }
input:not([type=checkbox]) { display: block; width: 100%; margin-top: .4rem; padding: .6rem; box-sizing: border-box; background: var(--surface-ground, #071425); color: inherit; border: 1px solid var(--surface-border); border-radius: 6px; }
.file-help { font-size: .8rem; color: var(--text-color-secondary); }
.form-error { color: var(--red-300, #fca5a5); }
.modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.5rem; }
</style>
