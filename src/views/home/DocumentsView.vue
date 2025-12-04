<template>
  <!-- Insertion du composant Navbar -->
  <Navbar />

  <div class="grid scrollable-container">
    <!-- Parcours de chaque dossier -->
    <div class="col-12 md:col-12">
      <div class="grid">
        <div v-for="folder in folders" :key="folder.id" class="col-12">
          <div class="card mb-3">
            <!-- En-tête du dossier -->
            <div class="flex align-items-center mb-2">
              <i :class="[folder.icon, 'text-2xl', 'mr-3']"></i>
              <h3 class="m-0">{{ folder.name }}</h3>
            </div>

            <!-- CAS 1 : Dossier avec sous-sections -->
            <template v-if="folder.subFolders && folder.subFolders.length > 0">
              <div class="grid">
                <div v-for="sub in folder.subFolders" :key="sub.id" class="col-12 md:col-6">
                  <div class="border-round border-1 surface-border p-2 mb-3">
                    <h4 class="mb-2">{{ sub.name }}</h4>
                    <div v-if="sub.files && sub.files.length > 0">
                      <ul class="pl-3">
                        <li v-for="file in sub.files" :key="file.id" class="mb-2">
                          <a
                            :href="file.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary hover:underline"
                          >
                            {{ file.name }}
                          </a>
                          <!-- Bouton d'édition pour admin -->
                          <button
                            v-if="isAdmin"
                            @click="openEditModal(file)"
                            class="p-button p-component p-button-text ml-2"
                          >
                            🖋
                          </button>
                          <!-- Bouton de suppression pour admin -->
                          <button
                            v-if="isAdmin"
                            @click="deleteFile(file.id)"
                            class="p-button p-component p-button-text ml-2"
                          >
                            🗑️
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <p class="text-600 m-0">Aucun fichier pour cette sous-section.</p>
                    </div>
                    <!-- Bouton d'ajout pour ce sous-dossier -->
                    <div v-if="isAdmin" class="add-file-button mt-2">
                      <button
                        @click="openAddModalForSubFolder(folder.id, sub.id)"
                        class="p-button p-component"
                      >
                        Ajouter un nouveau fichier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- CAS 2 : Dossier sans sous-sections -->
            <template v-else>
              <div v-if="folder.files && folder.files.length > 0">
                <ul class="pl-3">
                  <li v-for="file in folder.files" :key="file.id" class="mb-2">
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      {{ file.name }}
                    </a>
                    <!-- Bouton d'édition pour admin -->
                    <button
                      v-if="isAdmin"
                      @click="openEditModal(file)"
                      class="p-button p-component p-button-text ml-2"
                    >
                      Edit
                    </button>
                    <!-- Bouton de suppression pour admin -->
                    <button
                      v-if="isAdmin"
                      @click="deleteFile(file.id)"
                      class="p-button p-component p-button-text ml-2"
                    >
                      🗑️
                    </button>
                  </li>
                </ul>
              </div>
              <div v-else>
                <p class="text-600 m-0">Aucun fichier n'est disponible.</p>
              </div>
              <!-- Bouton d'ajout pour ce dossier -->
              <div v-if="isAdmin" class="add-file-button mt-2">
                <button
                  @click="openAddModalForFolder(folder.id)"
                  class="p-button p-component"
                >
                  Ajouter un nouveau fichier
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal d'édition -->
  <EditFileDocPFP
    v-if="showEditModal"
    :file="editForm"
    @close="closeEditModal"
    @save="saveFileEdit"
  />

  <!-- Modal d'ajout -->
  <AddFileDocPFP
    v-if="showAddModal"
    @close="closeAddModal"
    @save="saveNewFile"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db, auth } from 'root/firebase.js'
import { ref as dbRef, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { useDocumentStore } from '@/stores/documentStore'
import Navbar from '@/components/common/utils/Navbar.vue'
import EditFileDocPFP from '@/components/home/EditFileDocPFP.vue'
import AddFileDocPFP from '@/components/home/AddFileDocPFP.vue'

// Store Pinia pour les documents
const documentStore = useDocumentStore()

// Variables réactives pour l'auth et l'affichage des modales
const isAdmin = ref(false)
const showEditModal = ref(false)
const showAddModal = ref(false)
const editForm = ref({
  id: '',
  name: '',
  url: ''
})

// Variables pour stocker la cible d'ajout (folder et sous-dossier éventuel)
const targetFolderId = ref(null)
const targetSubFolderId = ref(null)

// Computed pour utiliser les folders du store
const folders = computed(() => documentStore.folders)

// Vérification du profil utilisateur (chemin "Users/{uid}")
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userProfileRef = dbRef(db, `Users/${user.uid}`)
    onValue(userProfileRef, (snapshot) => {
      const profile = snapshot.val()
      isAdmin.value = profile && profile.Roles && profile.Roles.admin === true
      console.log("✅ [DocumentsView] isAdmin =", isAdmin.value)
    })
  } else {
    isAdmin.value = false
  }
})

// Récupérer les dossiers depuis Firebase via le store
onMounted(async () => {
  try {
    await documentStore.loadFoldersTree()
  } catch (error) {
    console.error('❌ [DocumentsView] Erreur chargement:', error)
  }
})


// --- Gestion de la modale d'édition ---
const openEditModal = (file) => {
  editForm.value = { ...file }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveFileEdit = async (editedFile) => {
  try {
    await documentStore.updateFile(editedFile.id, {
      name: editedFile.name,
      url: editedFile.url
    })
    console.log("✅ [DocumentsView] Fichier mis à jour")
    closeEditModal()
  } catch (error) {
    console.error("❌ [DocumentsView] Erreur mise à jour fichier:", error)
  }
}

// --- Gestion de la suppression ---
const deleteFile = async (fileId) => {
  if (!confirm("Voulez-vous vraiment supprimer ce fichier ?")) return
  
  try {
    await documentStore.deleteFile(fileId)
    console.log("✅ [DocumentsView] Fichier supprimé")
  } catch (error) {
    console.error("❌ [DocumentsView] Erreur suppression fichier:", error)
  }
}

// --- Gestion de la modale d'ajout ---
const openAddModalForFolder = (folderId) => {
  targetFolderId.value = folderId
  targetSubFolderId.value = null
  showAddModal.value = true
}

const openAddModalForSubFolder = (folderId, subFolderId) => {
  targetFolderId.value = folderId
  targetSubFolderId.value = subFolderId
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const saveNewFile = async (newFile) => {
  try {
    await documentStore.addFile(newFile, targetFolderId.value, targetSubFolderId.value)
    console.log("✅ [DocumentsView] Fichier ajouté")
    closeAddModal()
  } catch (error) {
    console.error("❌ [DocumentsView] Erreur ajout fichier:", error)
  }
}
</script>

<style scoped>
.admin-panel {
  text-align: right;
  margin-bottom: 1rem;
}
.add-file-button {
  margin-top: 1rem;
  text-align: center;
}

.scrollable-container {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 12rem;
}
.scrollable-container::-webkit-scrollbar {
  display: none;
}
</style>
