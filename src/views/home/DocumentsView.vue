<template>
  <!-- Insertion du composant Navbar -->
  <Navbar />

  <div class="documents-container scrollable-container">
    <div class="documents-wrapper">
      <!-- Header Section -->
      <div class="page-header-section">
        <div class="header-content-wrapper">
          <div class="header-icon-box">
            <i class="pi pi-folder-open"></i>
          </div>
          <div class="header-text-content">
            <h1 class="page-main-title">Documents PFP</h1>
            <p class="page-description">Accédez à tous vos documents officiels organisés par catégorie</p>
          </div>
          <!-- Badge DEBUG admin -->
          <div class="admin-debug-badge" :class="{ 'is-admin': isAdmin }">
            <i class="pi" :class="isAdmin ? 'pi-check-circle' : 'pi-times-circle'"></i>
            <span>{{ isAdmin ? 'Mode Admin' : 'Mode Lecture' }}</span>
            <small v-if="debugInfo">{{ debugInfo }}</small>
          </div>
        </div>
      </div>

      <!-- Documents Grid -->
      <div class="documents-grid">
        <div v-for="folder in folders" :key="folder.id" class="folder-container">
          <div class="folder-content-card">
            <!-- Folder Header (cliquable) -->
            <div 
              class="folder-header-row clickable" 
              @click="toggleFolder(folder.id)"
              :class="{ 'folder-open': isFolderOpen(folder.id) }"
            >
              <div class="folder-icon-title">
                <div class="folder-icon-container">
                  <i :class="[folder.icon]"></i>
                </div>
                <h3 class="folder-title-text">{{ folder.name }}</h3>
              </div>
              <i 
                class="pi toggle-icon" 
                :class="isFolderOpen(folder.id) ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </div>

            <!-- CAS 1 : Dossier avec sous-sections -->
            <div v-show="isFolderOpen(folder.id)" class="folder-content-wrapper">
            <template v-if="folder.subFolders && folder.subFolders.length > 0">
              <div class="subfolders-container">
                <div v-for="sub in folder.subFolders" :key="sub.id" class="subfolder-section">
                  <div class="subfolder-header">
                    <div class="subfolder-title-wrapper">
                      <i class="pi pi-folder text-sm mr-2"></i>
                      <h4 class="subfolder-title">{{ sub.name }}</h4>
                    </div>
                    <span v-if="sub.files && sub.files.length" class="file-count-badge">
                      {{ sub.files.length }} fichier{{ sub.files.length > 1 ? 's' : '' }}
                    </span>
                  </div>
                  
                  <div v-if="sub.files && sub.files.length > 0" class="files-list-container">
                    <div v-for="file in sub.files" :key="file.id" class="file-item-row">
                      <a
                        :href="file.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="file-link-wrapper"
                      >
                        <i class="pi pi-file-pdf file-type-icon"></i>
                        <span class="file-name-text">{{ file.name }}</span>
                      </a>
                      <div v-if="isAdmin" class="file-admin-actions">
                        <button
                          @click="openEditModal(file)"
                          class="admin-action-btn edit-action"
                          title="Modifier"
                        >
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button
                          @click="deleteFile(file.id)"
                          class="admin-action-btn delete-action"
                          title="Supprimer"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="empty-state-message">
                    <i class="pi pi-inbox"></i>
                    <span>Aucun fichier disponible</span>
                  </div>
                  
                  <button
                    v-if="isAdmin"
                    @click="openAddModalForSubFolder(folder.id, sub.id)"
                    class="add-file-button-custom"
                  >
                    <i class="pi pi-plus mr-2"></i>
                    Ajouter un fichier
                  </button>
                </div>
              </div>
            </template>

            <!-- CAS 2 : Dossier sans sous-sections -->
            <template v-else>
              <div v-if="folder.files && folder.files.length > 0" class="files-list-container">
                <div v-for="file in folder.files" :key="file.id" class="file-item-row">
                  <a
                    :href="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="file-link-wrapper"
                  >
                    <i class="pi pi-file-pdf file-type-icon"></i>
                    <span class="file-name-text">{{ file.name }}</span>
                  </a>
                  <div v-if="isAdmin" class="file-admin-actions">
                    <button
                      @click="openEditModal(file)"
                      class="admin-action-btn edit-action"
                      title="Modifier"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      @click="deleteFile(file.id)"
                      class="admin-action-btn delete-action"
                      title="Supprimer"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state-message">
                <i class="pi pi-inbox"></i>
                <span>Aucun fichier disponible</span>
              </div>
              
              <button
                v-if="isAdmin"
                @click="openAddModalForFolder(folder.id)"
                class="add-file-button-custom"
              >
                <i class="pi pi-plus mr-2"></i>
                Ajouter un fichier
              </button>
            </template>
            </div>
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
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useDocumentStore } from '@/stores/documentStore'
import Navbar from '@/components/common/utils/Navbar.vue'
import EditFileDocPFP from '@/components/home/EditFileDocPFP.vue'
import AddFileDocPFP from '@/components/home/AddFileDocPFP.vue'

// Stores Pinia
const documentStore = useDocumentStore()
const authStore = useAuthStore()

// Variables réactives pour l'auth et l'affichage des modales
const isAdmin = ref(false)
const debugInfo = ref('')
const showEditModal = ref(false)
const showAddModal = ref(false)
const editForm = ref({
  id: '',
  name: '',
  url: ''
})

// Gestion de l'accordéon (dossiers ouverts/fermés)
const openFolders = ref(new Set())

const toggleFolder = (folderId) => {
  if (openFolders.value.has(folderId)) {
    openFolders.value.delete(folderId)
  } else {
    openFolders.value.add(folderId)
  }
}

const isFolderOpen = (folderId) => {
  return openFolders.value.has(folderId)
}

// Variables pour stocker la cible d'ajout (folder et sous-dossier éventuel)
const targetFolderId = ref(null)
const targetSubFolderId = ref(null)

// Computed pour utiliser les folders du store
const folders = computed(() => documentStore.folders)

// Vérification des droits admin depuis Supabase
const checkAdminRights = async () => {
  try {
    console.log('🔍 [DocumentsView] Vérification droits admin...')
    
    const user = authStore.user
    
    if (!user) {
      console.log('ℹ️ [DocumentsView] Aucun utilisateur connecté (mode public)')
      debugInfo.value = 'Mode Lecture'
      isAdmin.value = false
      return
    }

    console.log('👤 [DocumentsView] Utilisateur:', user.email)
    debugInfo.value = `User: ${user.email}`
    
    // Vérifier si l'utilisateur est admin dans user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (error) {
      console.warn('⚠️ [DocumentsView] Erreur profil (mode lecture activé):', error.message)
      debugInfo.value = 'Mode Lecture'
      isAdmin.value = false
      return
    }
    
    if (!data) {
      console.log('ℹ️ [DocumentsView] Pas de profil (mode lecture)')
      debugInfo.value = 'Mode Lecture'
      isAdmin.value = false
      return
    }
    
    // Vérifier si le rôle est admin ou editor
    const hasAdminRights = data.role === 'admin' || data.role === 'editor'
    isAdmin.value = hasAdminRights
    debugInfo.value = hasAdminRights ? `Admin: ${data.role}` : 'Mode Lecture'
    
    console.log('✅ [DocumentsView] Mode:', hasAdminRights ? 'Admin' : 'Lecture')
    
  } catch (err) {
    console.warn('⚠️ [DocumentsView] Erreur vérification (mode lecture):', err.message)
    debugInfo.value = 'Mode Lecture'
    isAdmin.value = false
  }
}

// Watcher sur authStore.user pour vérifier les droits quand l'utilisateur est chargé
watch(
  () => authStore.user,
  async (newUser) => {
    console.log('👁️ [DocumentsView] Watcher authStore.user:', newUser?.email)
    if (newUser) {
      await checkAdminRights()
    } else {
      isAdmin.value = false
      debugInfo.value = 'Déconnecté'
    }
  },
  { immediate: true }
)

// Récupérer les dossiers depuis Firebase via le store
onMounted(async () => {
  try {
    console.log('🚀 [DocumentsView] Chargement des documents...')
    
    // Charger les documents en premier (accessible à tous)
    await documentStore.loadFoldersTree()
    
    // Ouvrir tous les dossiers par défaut pour que les documents soient visibles
    if (documentStore.folders && documentStore.folders.length > 0) {
      documentStore.folders.forEach(folder => {
        if (folder.id) openFolders.value.add(folder.id)
      })
      console.log('✅ [DocumentsView] Dossiers ouverts:', openFolders.value.size)
    }
    
    // Vérifier les droits admin en parallèle (non bloquant)
    checkAdminRights()
    
    console.log('✅ [DocumentsView] Documents chargés')
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
/* Container principal */
.documents-container {
  min-height: 100vh;
}

.documents-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 8rem;
}

/* Header Section */
.page-header-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--surface-border);
}

.header-content-wrapper {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon-box {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--primary-600, #2563eb) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.page-main-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.page-description {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

/* Documents Grid */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
}

.folder-container {
  display: flex;
  flex-direction: column;
}

.folder-content-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--surface-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.folder-content-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* Folder Header */
.folder-header-row {
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.folder-header-row.clickable {
  cursor: pointer;
  user-select: none;
}

.folder-header-row.clickable:hover {
  background: var(--surface-hover);
}

.folder-header-row.folder-open {
  margin-bottom: 1rem;
}

.folder-icon-title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.folder-icon-container {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--surface-100);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color, #3b82f6);
  font-size: 1.25rem;
}

.folder-title-text {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.toggle-icon {
  color: var(--text-color-secondary);
  font-size: 1rem;
  transition: transform 0.3s ease;
}

/* Folder Content Wrapper */
.folder-content-wrapper {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Subfolders */
.subfolders-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.subfolder-section {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.subfolder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.subfolder-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subfolder-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.file-count-badge {
  background: var(--primary-color, #3b82f6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Files List */
.files-list-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  transition: all 0.15s ease;
}

.file-item-row:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color, #3b82f6);
  transform: translateX(4px);
}

.file-link-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
  flex: 1;
  min-width: 0;
}

.file-type-icon {
  color: #dc2626;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.file-name-text {
  font-size: 0.9375rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link-wrapper:hover .file-name-text {
  color: var(--primary-color, #3b82f6);
}

/* Admin Actions */
.file-admin-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.admin-action-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.875rem;
}

.edit-action {
  background: #dbeafe;
  color: #2563eb;
}

.edit-action:hover {
  background: #2563eb;
  color: white;
}

.delete-action {
  background: #fee2e2;
  color: #dc2626;
}

.delete-action:hover {
  background: #dc2626;
  color: white;
}

/* Add File Button */
.add-file-button-custom {
  margin-top: 0.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.add-file-button-custom:hover {
  background: var(--primary-600, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Empty State */
.empty-state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: var(--text-color-secondary);
  text-align: center;
  gap: 0.5rem;
}

.empty-state-message i {
  font-size: 2rem;
}

.empty-state-message span {
  font-size: 0.875rem;
}

/* Scroll Container */
.scrollable-container {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollable-container::-webkit-scrollbar {
  display: none;
}

/* Badge DEBUG Admin */
.admin-debug-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #fee2e2;
  border: 2px solid #dc2626;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.875rem;
  margin-left: auto;
}

.admin-debug-badge.is-admin {
  background: #dcfce7;
  border-color: #16a34a;
  color: #16a34a;
}

.admin-debug-badge small {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .documents-wrapper {
    padding: 1rem 1rem 6rem;
  }

  .page-header-section {
    padding: 1.25rem;
  }

  .header-content-wrapper {
    flex-direction: row;
  }

  .header-icon-box {
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }

  .page-main-title {
    font-size: 1.5rem;
  }

  .documents-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .folder-content-card {
    padding: 1rem;
  }

  .folder-header-row {
    padding: 0.625rem;
  }

  .file-item-row {
    padding: 0.625rem;
  }

  .file-name-text {
    font-size: 0.875rem;
  }

  .toggle-icon {
    font-size: 0.875rem;
  }
}
</style>
