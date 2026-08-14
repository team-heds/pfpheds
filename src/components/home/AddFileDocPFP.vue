<template>
  <div class="modal-overlay">
    <form class="modal-content" @submit.prevent="handleSave">
      <h4>Ajouter un nouveau fichier ou lien</h4>

      <br />

      <!-- Si l'utilisateur coche "Utiliser une URL", on affiche un champ "URL" -->
      <div v-if="useExternalLink">
        <label>
          URL du lien :
          <input className="w-full" v-model="localFile.url" type="text" placeholder="https://..." />
        </label>
      </div>

      <!-- Sinon, on propose l'upload d'un fichier -->
      <div v-else>
        <p id="file-upload-label" class="file-upload-label">Sélectionner le fichier :</p>
        <div
          class="file-dropzone"
          :class="{ 'is-dragging': isDragging, 'has-file': selectedFile }"
          role="button"
          tabindex="0"
          aria-labelledby="file-upload-label"
          @click="openFilePicker"
          @keydown.enter.prevent="openFilePicker"
          @keydown.space.prevent="openFilePicker"
          @dragenter.prevent="isDragging = true"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
        >
          <input
            ref="fileInput"
            type="file"
            class="file-input"
            tabindex="-1"
            @change="handleFileChange"
          />
          <i class="pi pi-upload file-upload-icon" aria-hidden="true"></i>
          <template v-if="selectedFile">
            <span class="file-upload-title">{{ selectedFile.name }}</span>
            <span class="file-upload-meta">{{ formatFileSize(selectedFile.size) }} · Cliquez ou déposez un fichier pour le remplacer</span>
          </template>
          <template v-else>
            <span class="file-upload-title">Glissez-déposez un fichier ici</span>
            <span class="file-upload-meta">ou cliquez pour le sélectionner</span>
          </template>
        </div>
        <button
          v-if="selectedFile"
          type="button"
          class="clear-file-button"
          @click="clearSelectedFile"
        >
          Retirer le fichier
        </button>
      </div>

      <br />


      <!-- Nom du document (commun aux deux modes) -->
      <label>
        Nom du fichier / lien :
        <input v-model="localFile.name" type="text" required />
      </label>

      <br /><br />

      <!-- CHOIX : Téléverser un fichier OU fournir un lien URL -->
      <label>
        <input type="checkbox" v-model="useExternalLink" />
        Utiliser seulement une URL externe
      </label>



      <div class="modal-actions">
        <button type="submit" class="p-button p-component mr-2">
          Sauvegarder
        </button>
        <button type="button" @click="handleClose" class="p-button p-component p-button-secondary">
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref as vueRef } from 'vue'
import { defineEmits } from 'vue'
import { storage } from 'root/firebase.js'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const emits = defineEmits(['close', 'save'])

// État local pour le nouveau fichier ou lien
const localFile = vueRef({
  name: '',
  url: '' // ce champ servira pour l'URL, s'il y en a une
})

// Variable booléenne : true si on veut juste fournir une URL
const useExternalLink = vueRef(false)

// Variable pour stocker le fichier sélectionné
const selectedFile = vueRef(null)
const fileInput = vueRef(null)
const isDragging = vueRef(false)

const setSelectedFile = (file) => {
  if (file) selectedFile.value = file
}

const openFilePicker = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  setSelectedFile(event.target.files[0])
}

const handleFileDrop = (event) => {
  isDragging.value = false
  setSelectedFile(event.dataTransfer.files[0])
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const formatFileSize = (size) => {
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

const handleClose = () => {
  emits('close')
}

const handleSave = async () => {

  // SI l'utilisateur veut utiliser un lien externe
  if (useExternalLink.value) {
    // Vérifier qu'une URL est bien renseignée
    if (!localFile.value.url) {
      alert("Veuillez saisir l'URL du lien.")
      return
    }

    // Construire l'objet "newFile" avec l'URL
    const newFile = {
      id: Date.now().toString(),
      name: localFile.value.name,
      url: localFile.value.url // on stocke directement l'URL
    }

    // Émettre vers le parent pour sauvegarde
    emits('save', newFile)
    return
  }

  // SINON (mode upload de fichier)
  if (!selectedFile.value) {
    alert("Veuillez sélectionner un fichier à uploader ou cocher 'URL'.")
    return
  }

  try {
    console.log('📤 [AddFileDocPFP] Upload vers Firebase Storage...')

    // Créer un nom de fichier unique avec timestamp
    const timestamp = Date.now()
    const fileName = `${timestamp}_${selectedFile.value.name}`
    const filePath = `documentPFP/${fileName}`

    console.log('📁 [AddFileDocPFP] Upload vers:', filePath)

    // Créer la référence Firebase Storage
    const fileRef = storageRef(storage, filePath)

    // Upload le fichier vers Firebase Storage
    const snapshot = await uploadBytes(fileRef, selectedFile.value, {
      contentType: selectedFile.value.type,
      customMetadata: {
        originalName: selectedFile.value.name,
        uploadedAt: new Date().toISOString()
      }
    })

    console.log('✅ [AddFileDocPFP] Fichier uploadé:', snapshot.metadata.fullPath)

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(fileRef)

    console.log('🔗 [AddFileDocPFP] URL du fichier:', downloadURL)

    // Construire l'objet "newFile" avec la downloadURL
    const newFile = {
      id: Date.now().toString(),
      name: localFile.value.name || selectedFile.value.name,
      url: downloadURL
    }

    // Émettre vers le parent
    emits('save', newFile)

  } catch (error) {
    console.error("❌ [AddFileDocPFP] Erreur lors de l'upload du fichier :", error)
    alert(`Erreur d'upload: ${error.message || error}`)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #0B213F;
  padding: 1rem;
  border-radius: 4px;
  width: 300px;
  color: #fff;
}

.file-upload-label {
  margin: 0 0 0.5rem;
}

.file-dropzone {
  display: flex;
  min-height: 8rem;
  padding: 1rem;
  border: 2px dashed rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.file-dropzone:hover,
.file-dropzone.is-dragging {
  border-color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.file-dropzone.has-file {
  border-style: solid;
  border-color: #70d6ff;
}

.file-dropzone:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.file-input {
  display: none;
}

.file-upload-icon {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.file-upload-title {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.file-upload-meta {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.clear-file-button {
  display: block;
  margin: 0.5rem 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.clear-file-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
