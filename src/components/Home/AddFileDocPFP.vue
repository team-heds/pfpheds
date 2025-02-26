<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h4>Ajouter un nouveau fichier</h4>
        <label>
          Nom du fichier :
          <input v-model="localFile.name" type="text" />
        </label>
        <label>
          Sélectionner le fichier :
          <input type="file" @change="handleFileChange" />
        </label>
        <div class="modal-actions">
          <button @click="handleUpload" class="p-button p-component">
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
  import { storage } from '@/firebase.js'
  import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
  
  const emits = defineEmits(['close', 'save'])
  
  // État local pour le nouveau fichier
  const localFile = vueRef({
    name: ''
  })
  
  // Variable pour stocker le fichier sélectionné
  const selectedFile = vueRef(null)
  
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      selectedFile.value = file
    }
  }
  
  const handleUpload = async () => {
    if (!selectedFile.value) {
      alert("Veuillez sélectionner un fichier à uploader.")
      return
    }
    try {
      // Utilisation du chemin "documentPFP/" conforme aux règles
      const filePath = `documentPFP/${Date.now()}_${selectedFile.value.name}`
      const storageReference = storageRef(storage, filePath)
      const snapshot = await uploadBytes(storageReference, selectedFile.value)
      const downloadURL = await getDownloadURL(snapshot.ref)
      const newFile = {
        id: Date.now().toString(),
        name: localFile.value.name || selectedFile.value.name,
        url: downloadURL
      }
      emits('save', newFile)
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier :", error)
    }
  }
  
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
  