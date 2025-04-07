<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h4>Ajouter un nouveau fichier ou lien</h4>

      <!-- CHOIX : Téléverser un fichier OU fournir un lien URL -->
      <label>
        <input type="checkbox" v-model="useExternalLink" />
        Utiliser seulement une URL externe
      </label>

      <br /><br />

      <!-- Nom du document (commun aux deux modes) -->
      <label>
        Nom du fichier / lien :
        <input v-model="localFile.name" type="text" />
      </label>

      <br /><br />

      <!-- Si l'utilisateur coche "Utiliser une URL", on affiche un champ "URL" -->
      <div v-if="useExternalLink">
        <label>
          URL du lien :
          <input v-model="localFile.url" type="text" placeholder="https://..." />
        </label>
      </div>

      <!-- Sinon, on propose l'upload d'un fichier -->
      <div v-else>
        <label>
          Sélectionner le fichier :
          <input type="file" @change="handleFileChange" />
        </label>
      </div>

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

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const handleClose = () => {
  emits('close')
}

const handleSave = async () => {
  // Vérifier que le champ "name" n'est pas vide
  if (!localFile.value.name) {
    alert("Veuillez saisir un nom.")
    return
  }

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
    // Upload dans Firebase Storage
    const filePath = `documentPFP/${Date.now()}_${selectedFile.value.name}`
    const storageReference = storageRef(storage, filePath)
    const snapshot = await uploadBytes(storageReference, selectedFile.value)
    const downloadURL = await getDownloadURL(snapshot.ref)

    // Construire l'objet "newFile" avec la downloadURL
    const newFile = {
      id: Date.now().toString(),
      name: localFile.value.name || selectedFile.value.name,
      url: downloadURL
    }

    // Émettre vers le parent
    emits('save', newFile)
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier :", error)
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
