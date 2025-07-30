<template>
  <div class="notes-main">
    <Navbar />
    <!-- Dialog création classeur -->
    <Dialog v-model:visible="showNotebookDialog" header="Nouveau classeur" :modal="true" :closable="false">
      <div class="p-fluid">
        <InputText v-model="newNotebookName" placeholder="Nom du classeur" />
      </div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showNotebookDialog = false" />
        <Button label="Créer" icon="pi pi-check" @click="addNotebook" :disabled="!newNotebookName.trim()" />
      </template>
    </Dialog>
    <!-- Dialog renommage classeur -->
    <Dialog v-model:visible="showEditNotebookDialog" header="Renommer le classeur" :modal="true" :closable="false">
      <div class="p-fluid">
        <InputText v-model="editNotebookName" placeholder="Nouveau nom du classeur" />
      </div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showEditNotebookDialog = false" />
        <Button label="Renommer" icon="pi pi-check" @click="renameNotebook" :disabled="!editNotebookName.trim()" />
      </template>
    </Dialog>
    <!-- Dialog suppression classeur -->
    <Dialog v-model:visible="showDeleteNotebookDialog" header="Supprimer le classeur" :modal="true" :closable="false">
      <div class="p-mb-3">Confirmer la suppression du classeur <b>{{ notebookToDelete?.name }}</b> ?</div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showDeleteNotebookDialog = false" />
        <Button label="Supprimer" icon="pi pi-trash" severity="danger" @click="deleteNotebookConfirm" />
      </template>
    </Dialog>
    <!-- Dialog création feuille -->
    <Dialog v-model:visible="showPageDialog" header="Nouvelle feuille" :modal="true" :closable="false">
      <div class="p-fluid">
        <InputText v-model="newPageTitle" placeholder="Titre de la feuille" />
      </div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showPageDialog = false" />
        <Button label="Créer" icon="pi pi-check" @click="addPage" :disabled="!newPageTitle.trim()" />
      </template>
    </Dialog>
    <!-- Dialog renommage feuille -->
    <Dialog v-model:visible="showEditPageDialog" header="Renommer la feuille" :modal="true" :closable="false">
      <div class="p-fluid">
        <InputText v-model="editPageTitle" placeholder="Nouveau titre de la feuille" />
      </div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showEditPageDialog = false" />
        <Button label="Renommer" icon="pi pi-check" @click="renamePage" :disabled="!editPageTitle.trim()" />
      </template>
    </Dialog>
    <!-- Dialog suppression feuille -->
    <Dialog v-model:visible="showDeletePageDialog" header="Supprimer la feuille" :modal="true" :closable="false">
      <div class="p-mb-3">Confirmer la suppression de la feuille <b>{{ pageToDelete?.title }}</b> ?</div>
      <template #footer>
        <Button label="Annuler" class="p-button-text" @click="showDeletePageDialog = false" />
        <Button label="Supprimer" icon="pi pi-trash" severity="danger" @click="deletePageConfirm" />
      </template>
    </Dialog>
    <div class="notes-workspace">
      <div class="sidebar-col">
        <NotebookSidebar
          :notebooks="notebooks"
          @select="selectNotebook"
          @create-notebook="showNotebookDialog = true"
          @edit-notebook="openEditNotebook"
          @delete-notebook="openDeleteNotebook"
        />
      </div>
      <div class="pages-col" v-if="selectedNotebook">
        <PageList
          :pages="pages"
          @select="selectPage"
          @create-page="showPageDialog = true"
          @edit-page="openEditPage"
          @delete-page="openDeletePage"
        />
      </div>
      <div class="editor-col" v-if="selectedPage">
        <TiptapSimpleEditor :page="selectedPage" @save="savePage" />
      </div>
      <div v-else-if="selectedNotebook" class="editor-col empty-editor">Sélectionne ou crée une feuille</div>
      <div v-else class="editor-col empty-editor">Sélectionne ou crée un classeur</div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/common/utils/Navbar.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NotebookSidebar from '@/components/editor/notes/NotebookSidebar.vue'
import PageList from '@/components/editor/notes/PageList.vue'
import TiptapSimpleEditor from '@/components/editor/notes/TiptapSimpleEditor.vue'
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import * as notesService from '@/service/notesService.js'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const notebooks = ref([])
const pages = ref([])
const selectedNotebook = ref(null)
const selectedPage = ref(null)

// Dialogs
const showNotebookDialog = ref(false)
const newNotebookName = ref('')
const showEditNotebookDialog = ref(false)
const editNotebookName = ref('')
let notebookToEdit = null
const showDeleteNotebookDialog = ref(false)
let notebookToDelete = null
const showPageDialog = ref(false)
const newPageTitle = ref('')
const showEditPageDialog = ref(false)
const editPageTitle = ref('')
let pageToEdit = null
const showDeletePageDialog = ref(false)
let pageToDelete = null

let notebooksUnsubscribe = null

onMounted(() => {
  // Temps réel notebooks
  try {
    notebooksUnsubscribe = notesService.onNotebooksChange(async (nbs) => {
      notebooks.value = nbs
      // Si plus de notebooks, auto-select
      if (notebooks.value.length > 0) {
        // Si le notebook sélectionné n'existe plus, sélectionne le premier
        let found = notebooks.value.find(n => selectedNotebook.value && n.id === selectedNotebook.value.id)
        if (!found) found = notebooks.value[0]
        if (found) selectNotebook(found)
      } else {
        selectedNotebook.value = null
        pages.value = []
        selectedPage.value = null
      }
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de chargement des notes', life: 4000 })
  }
})

onBeforeUnmount(() => {
  if (notebooksUnsubscribe) notebooksUnsubscribe()
})

async function loadPages(notebookId) {
  try {
    const currentPageId = selectedPage.value?.id
    pages.value = await notesService.fetchPages(notebookId)
    if (currentPageId) {
      const found = pages.value.find(p => p.id === currentPageId)
      if (found) selectedPage.value = found
    }
  } catch (e) {
    pages.value = []
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de chargement des feuilles', life: 4000 })
  }
}

function selectNotebook(notebook) {
  // Si on change vraiment de notebook, on reset la page sélectionnée
  if (!selectedNotebook.value || notebook.id !== selectedNotebook.value.id) {
    selectedNotebook.value = notebook
    selectedPage.value = null
    loadPages(notebook.id)
  } else {
    // Si c'est une resynchro ou une sélection identique, ne touche pas selectedPage
    selectedNotebook.value = notebook
    loadPages(notebook.id)
  }
}

function selectPage(page) {
  selectedPage.value = page
}

// CRUD notebooks
async function addNotebook() {
  if (!newNotebookName.value.trim()) return
  try {
    const id = await notesService.addNotebook(newNotebookName.value.trim())
    toast.add({ severity: 'success', summary: 'Classeur créé', life: 2000 })
    newNotebookName.value = ''
    showNotebookDialog.value = false
    // La synchro temps réel va rafraîchir la liste
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ajouter le classeur", life: 4000 })
  }
}

function openEditNotebook(notebook) {
  notebookToEdit = notebook
  editNotebookName.value = notebook.name
  showEditNotebookDialog.value = true
}
async function renameNotebook() {
  if (notebookToEdit && editNotebookName.value.trim()) {
    try {
      await notesService.renameNotebook(notebookToEdit.id, editNotebookName.value.trim())
      toast.add({ severity: 'success', summary: 'Classeur renommé', life: 2000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de renommer le classeur", life: 4000 })
    }
  }
  showEditNotebookDialog.value = false
}
function openDeleteNotebook(notebook) {
  notebookToDelete = notebook
  showDeleteNotebookDialog.value = true
}
async function deleteNotebookConfirm() {
  if (notebookToDelete) {
    try {
      await notesService.deleteNotebook(notebookToDelete.id)
      toast.add({ severity: 'success', summary: 'Classeur supprimé', life: 2000 })
      selectedNotebook.value = null
      pages.value = []
      selectedPage.value = null
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de supprimer le classeur", life: 4000 })
    }
  }
  showDeleteNotebookDialog.value = false
}

// CRUD pages
async function addPage() {
  if (!newPageTitle.value.trim() || !selectedNotebook.value) return
  try {
    const pageData = { title: newPageTitle.value.trim(), content: '' }
    await notesService.addPage(selectedNotebook.value.id, pageData)
    toast.add({ severity: 'success', summary: 'Feuille créée', life: 2000 })
    newPageTitle.value = ''
    showPageDialog.value = false
    await loadPages(selectedNotebook.value.id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ajouter la feuille", life: 4000 })
  }
}
function openEditPage(page) {
  pageToEdit = page
  editPageTitle.value = page.title
  showEditPageDialog.value = true
}
async function renamePage() {
  if (pageToEdit && editPageTitle.value.trim() && selectedNotebook.value) {
    try {
      await notesService.updatePage(selectedNotebook.value.id, pageToEdit.id, { ...pageToEdit, title: editPageTitle.value.trim() })
      toast.add({ severity: 'success', summary: 'Feuille renommée', life: 2000 })
      await loadPages(selectedNotebook.value.id)
      // conserve la sélection
      const p = pages.value.find(pg => pg.id === pageToEdit.id)
      if (p) selectPage(p)
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de renommer la feuille", life: 4000 })
    }
  }
  showEditPageDialog.value = false
}
function openDeletePage(page) {
  pageToDelete = page
  showDeletePageDialog.value = true
}
async function deletePageConfirm() {
  if (pageToDelete && selectedNotebook.value) {
    try {
      await notesService.deletePage(selectedNotebook.value.id, pageToDelete.id)
      toast.add({ severity: 'success', summary: 'Feuille supprimée', life: 2000 })
      await loadPages(selectedNotebook.value.id)
      if (selectedPage.value && selectedPage.value.id === pageToDelete.id) {
        selectedPage.value = null
      }
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de supprimer la feuille", life: 4000 })
    }
  }
  showDeletePageDialog.value = false
}
async function savePage(pageData) {
  if (!selectedNotebook.value || !selectedPage.value) return
  try {
    await notesService.updatePage(selectedNotebook.value.id, selectedPage.value.id, pageData)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'enregistrer la feuille", life: 4000 })
  }
}
</script>

<style scoped>
.notes-main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  overflow: hidden;

}
.notes-workspace {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 0;
  overflow: hidden;
}
.notes-workspace .sidebar-col,
.notes-workspace .pages-col,
.notes-workspace .editor-col {
  border-radius: 20px;
  margin: 18px 8px 18px 8px;
  background: var(--surface-card) !important;
  border: 1.5px solid #282a36;
  height: calc(100vh - 36px);
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 32px;
}
.notes-workspace .sidebar-col::-webkit-scrollbar,
.notes-workspace .pages-col::-webkit-scrollbar,
.notes-workspace .editor-col::-webkit-scrollbar {
  display: none;
}
.notes-workspace .sidebar-col {
  min-width: 200px;
  max-width: 320px;
  flex: 0 0 260px;
}
.notes-workspace .pages-col {
  min-width: 220px;
  max-width: 400px;
  flex: 0 0 300px;
}
.notes-workspace .editor-col {
  flex: 1 1 0;
  min-width: 0;
}

/* Boutons PrimeVue visibles et modernes */
.notes-workspace .p-button {
  border-radius: 12px !important;
  font-weight: 600;
  font-size: 1.02em;
  background: linear-gradient(90deg, #ffd700 60%, #ffb400 100%);
  color: #23242a !important;
  border: none !important;
  box-shadow: 0 2px 10px #ffd70033;
  margin: 0.15em 0.2em;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.notes-workspace .p-button.p-button-text {
  background: none !important;
  color: #ffd700 !important;
  border: 2px solid #ffd70033 !important;
  box-shadow: none !important;
}
.notes-workspace .p-button:hover, .notes-workspace .p-button:focus {
  background: linear-gradient(90deg, #ffe066 60%, #ffd700 100%) !important;
  color: #1a1a1a !important;
  box-shadow: 0 4px 16px #ffd70055;
}

/* Pour les boutons d'action (stylo, poubelle, etc.) dans les colonnes */
.notes-workspace :deep(.p-button-icon-only) {
  background: #ffd70022 !important;
  color: #ffd700 !important;
  border-radius: 50% !important;
  box-shadow: none !important;
  margin: 0 0.15em;
  transition: background 0.15s, color 0.15s;
}
.notes-workspace :deep(.p-button-icon-only):hover {
  background: #ffd70055 !important;
  color: #23242a !important;
}

/* Titres et placeholders */
.notes-workspace .p-inputtext {
  border-radius: 8px;
  background: #23242a;
  color: #ffd700;
  border: 1.5px solid #ffd70055;
  font-weight: 500;
}
.notes-workspace .p-inputtext::placeholder {
  color: #ffd70077;
}

/* Dialogs arrondis */
.notes-workspace .p-dialog {
  border-radius: 18px !important;
  overflow: hidden;
}
.notes-workspace .p-dialog .p-dialog-header,
.notes-workspace .p-dialog .p-dialog-footer {
  border-radius: 0 !important;
}

/* Navbar arrondi (si présent) */
.notes-workspace :deep(.navbar) {
  border-radius: 18px 18px 0 0 !important;
  margin: 8px 8px 0 8px !important;
}

/* Responsive ajusté */
@media (max-width: 1100px) {
  .notes-workspace .sidebar-col, .notes-workspace .pages-col {
    margin: 10px 3px;
    min-width: 120px;
    max-width: 180px;
  }
  .notes-workspace .editor-col {
    margin: 10px 3px;
  }
}

/* Empty editor message */
.notes-workspace .empty-editor {
  color: #999;
  font-size: 1.2rem;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
