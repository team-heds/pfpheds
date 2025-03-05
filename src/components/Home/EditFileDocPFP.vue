<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h4>Éditer le fichier</h4>

      <!-- Nom du fichier -->
      <label>
        Nom du fichier :
        <input v-model="localFile.name" type="text" />
      </label>
      <br />

      <!-- URL actuelle (utilisée s’il n’y a pas d’upload) -->
      <label>
        URL :
        <input v-model="localFile.url" type="text" />
      </label>
      <br />

      <!-- Possibilité de remplacer le fichier actuel par un nouveau upload -->
      <p>Ou téléverser un nouveau fichier pour remplacer l'actuel :</p>
      <input type="file" @change="handleFileChange" />

      <div class="modal-actions">
        <button @click="handleSave" class="p-button p-component">
          Sauvegarder
        </button>
        <button @click="handleClose" class="p-button p-component p-button-secondary">
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import { defineProps, defineEmits } from 'vue'
import { storage } from '@/firebase.js'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// --- Récupère la prop "file" (l'élément à éditer) ---
const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['close', 'save'])

// Copie réactive locale de l'objet reçu (nom, url, id, etc.)
const localFile = reactive({
  id: '',
  name: '',
  url: ''
})

// On stocke ici le "nouveau fichier" sélectionné (s'il y en a un).
const selectedFile = ref(null)

// Synchronise localFile avec la prop "file" reçue.
watch(
  () => props.file,
  (newFile) => {
    if (newFile) {
      localFile.id = newFile.id
      localFile.name = newFile.name
      localFile.url = newFile.url
    }
  },
  { immediate: true }
)

// Gère la sélection d'un nouveau fichier (input type="file")
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

// Lors du clic sur "Sauvegarder"
const handleSave = async () => {
  // Si un nouveau fichier a été sélectionné, on l'upload pour récupérer une nouvelle URL
  if (selectedFile.value) {
    try {
      const filePath = `documentPFP/${Date.now()}_${selectedFile.value.name}`
      const storageReference = storageRef(storage, filePath)

      // 1) Upload dans Firebase Storage
      const snapshot = await uploadBytes(storageReference, selectedFile.value)
      // 2) Récupérer l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref)

      // On met à jour l'URL dans localFile
      localFile.url = downloadURL
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier :", error)
    }
  }

  // On émet l'objet modifié (nom/URL) vers le parent
  emits('save', { ...localFile })
}

// Fermer la modale
const handleClose = () => {
  emits('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Couche translucide en fond */
  background-color: rgba(0, 0, 0, 0.5); 
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #0B213F;
  padding: 1rem;
  border-radius: 4px;
  width: 320px;
  color: #fff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
