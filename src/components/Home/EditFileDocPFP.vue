<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h4>Éditer le fichier</h4>
      <label>
        Nom du fichier :
        <input v-model="localFile.name" type="text" />
      </label>
      <label>
        URL :
        <input v-model="localFile.url" type="text" />
      </label>
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
import { reactive, watch } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const emits = defineEmits(['close', 'save'])

// Créer une copie locale du fichier pour l'édition
const localFile = reactive({
  id: '',
  name: '',
  url: ''
})

// Synchroniser la copie locale avec la prop reçue
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

// Émettre l'événement "save" avec les données modifiées
const handleSave = () => {
  emits('save', { ...localFile })
}

// Émettre l'événement "close" pour fermer la modal
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #0B213F;
  padding: 1rem;
  border-radius: 4px;
  width: 300px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
