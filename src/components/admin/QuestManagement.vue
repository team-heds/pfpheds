<template>
  <div class="p-4 max-w-7xl mx-auto">
    <!-- Header simplifié -->
    <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-flag text-primary text-2xl"></i>
        <h1 class="text-2xl font-semibold m-0 text-900">Gestion des Quêtes</h1>
      </div>
      <div class="flex gap-2">
        <Button 
          @click="navigateToPublicCreation"
          icon="pi pi-external-link"
          label="Vue Publique"
          class="p-button-outlined"
          v-tooltip="'Voir la vue de création publique'"
        />
        <Button 
          v-if="canCreateQuests"
          @click="showCreateDialog = true"
          icon="pi pi-plus"
          label="Nouvelle Quête"
          class="p-button-success"
        />
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="flex flex-wrap gap-3 mb-4">
      <div class="p-inputgroup flex-1" style="min-width: 300px;">
        <span class="p-inputgroup-addon">
          <i class="pi pi-search"></i>
        </span>
        <InputText 
          v-model="searchQuery" 
          placeholder="Rechercher une quête..."
          @input="filterQuests"
        />
      </div>
      
      <Dropdown 
        v-model="selectedStatus" 
        :options="statusOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Statut"
        @change="filterQuests"
        style="min-width: 150px;"
      />
      
      <Dropdown 
        v-model="selectedType" 
        :options="typeOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Type"
        @change="filterQuests"
        style="min-width: 150px;"
      />
    </div>

    <!-- Liste des quêtes -->
    <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6">
      <ProgressSpinner />
      <p class="mt-3 text-600">Chargement des quêtes...</p>
    </div>
    
    <div v-else-if="filteredQuests.length === 0" class="text-center p-6">
      <i class="pi pi-flag text-6xl text-300 mb-3"></i>
      <h3 class="text-900 mb-2">Aucune quête trouvée</h3>
      <p class="text-600 m-0">{{ searchQuery ? 'Aucune quête ne correspond à votre recherche.' : 'Commencez par créer votre première quête.' }}</p>
    </div>
    
    <div v-else class="grid">
      <div 
        v-for="quest in filteredQuests" 
        :key="quest.id"
        class="col-12 md:col-6 lg:col-4"
      >
        <div class="surface-card p-4 border-round shadow-2 h-full">
          <div class="flex align-items-start gap-3 mb-3">
            <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-purple-50 border-circle flex-shrink-0">
              <i class="pi pi-flag text-purple-500 text-xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-900 font-semibold m-0 mb-2">{{ quest.title }}</h4>
              <p class="text-600 text-sm m-0 mb-3 line-height-3">{{ quest.description }}</p>
              <div class="flex gap-2 flex-wrap">
                <Tag 
                  :value="getStatusLabel(quest.status)" 
                  :severity="getStatusSeverity(quest.status)"
                />
                <Tag 
                  :value="getTypeLabel(quest.type)" 
                  :severity="getTypeSeverity(quest.type)"
                />
              </div>
            </div>
          </div>
          
          <div class="flex justify-content-between align-items-center text-sm text-600 mb-3">
            <div class="flex align-items-center gap-1">
              <i class="pi pi-star"></i>
              <span>{{ quest.points }} pts</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-list"></i>
              <span>{{ quest.steps?.length || 0 }} étapes</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-users"></i>
              <span>{{ quest.participantsCount || 0 }}</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-calendar"></i>
              <span>{{ formatDate(quest.createdAt) }}</span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <Button 
              icon="pi pi-eye" 
              class="p-button-outlined p-button-sm flex-1"
              @click="viewQuestDetails(quest)"
              label="Détails"
            />
            <Button 
              v-if="canEditQuests"
              icon="pi pi-pencil" 
              class="p-button-outlined p-button-sm"
              @click="editQuest(quest)"
              v-tooltip="'Modifier'"
            />
            <Button 
              v-if="canDeleteQuests"
              icon="pi pi-trash" 
              class="p-button-outlined p-button-danger p-button-sm"
              @click="confirmDeleteQuest(quest)"
              v-tooltip="'Supprimer'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Dialog de création/édition -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      :header="editingQuest ? 'Modifier la Quête' : 'Nouvelle Quête'"
      :modal="true"
      :closable="true"
      :style="{ width: '700px' }"
    >
      <div class="quest-form">
        <div class="form-group">
          <label for="title">Titre *</label>
          <InputText 
            id="title"
            v-model="questForm.title" 
            placeholder="Titre de la quête"
            :class="{ 'p-invalid': errors.title }"
          />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>
        
        <div class="form-group">
          <label for="description">Description *</label>
          <Textarea 
            id="description"
            v-model="questForm.description" 
            placeholder="Description détaillée de la quête"
            rows="4"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="type">Type *</label>
            <Dropdown 
              id="type"
              v-model="questForm.type" 
              :options="typeOptions.filter(t => t.value)" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
              :class="{ 'p-invalid': errors.type }"
            />
            <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
          </div>
          
          <div class="form-group">
            <label for="difficulty">Difficulté *</label>
            <Dropdown 
              id="difficulty"
              v-model="questForm.difficulty" 
              :options="difficultyOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
              :class="{ 'p-invalid': errors.difficulty }"
            />
            <small v-if="errors.difficulty" class="p-error">{{ errors.difficulty }}</small>
          </div>
          
          <div class="form-group">
            <label for="points">Points *</label>
            <InputNumber 
              id="points"
              v-model="questForm.points" 
              :min="1"
              :max="1000"
              placeholder="Points"
              :class="{ 'p-invalid': errors.points }"
            />
            <small v-if="errors.points" class="p-error">{{ errors.points }}</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">Catégorie</label>
            <InputText 
              id="category"
              v-model="questForm.category" 
              placeholder="Catégorie de la quête"
            />
          </div>
          
          <div class="form-group">
            <label for="status">Statut</label>
            <Dropdown 
              id="status"
              v-model="questForm.status" 
              :options="statusOptions.filter(s => s.value)" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>Étapes de la quête</label>
          <div class="steps-container">
            <div 
              v-for="(step, index) in questForm.steps" 
              :key="index"
              class="step-item"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <InputText 
                v-model="step.title" 
                placeholder="Titre de l'étape"
                class="step-input"
              />
              <Button 
                @click="removeStep(index)"
                icon="pi pi-times"
                class="p-button-text p-button-danger p-button-sm"
              />
            </div>
            <Button 
              @click="addStep"
              icon="pi pi-plus"
              label="Ajouter une étape"
              class="p-button-text"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showCreateDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="saveQuest" 
          :label="editingQuest ? 'Modifier' : 'Créer'"
          :loading="saving"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      header="Confirmer la suppression"
      :modal="true"
      :closable="true"
      :style="{ width: '400px' }"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <p>Êtes-vous sûr de vouloir supprimer la quête <strong>"{{ questToDelete?.title }}"</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteQuest" 
          label="Supprimer"
          :loading="deleting"
          class="p-button-danger"
        />
      </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import adminService from '../../service/adminService'
import rolesService, { PERMISSIONS } from '../../service/rolesService'

const toast = useToast()
const router = useRouter()

// État réactif
const quests = ref([])
const filteredQuests = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Filtres
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedType = ref(null)

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingQuest = ref(null)
const questToDelete = ref(null)

// Formulaire
const questForm = reactive({
  title: '',
  description: '',
  type: '',
  difficulty: 'easy',
  points: 50,
  category: '',
  status: 'active',
  steps: [{ title: '' }]
})

const errors = ref({})

// Options pour les dropdowns
const statusOptions = [
  { label: 'Tous', value: null },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Brouillon', value: 'draft' }
]

const difficultyOptions = [
  { label: 'Facile', value: 'easy' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Difficile', value: 'hard' },
  { label: 'Légendaire', value: 'legendary' }
]

const typeOptions = [
  { label: 'Tous', value: null },
  { label: 'Principale', value: 'main' },
  { label: 'Secondaire', value: 'side' },
  { label: 'Événement', value: 'event' },
  { label: 'Quotidienne', value: 'daily' }
]

// Permissions supprimées - accès libre pour le développement
const canCreateQuests = computed(() => true)
const canEditQuests = computed(() => true)
const canDeleteQuests = computed(() => true)

// Méthodes
const loadQuests = async () => {
  try {
    loading.value = true
    const data = await adminService.getQuests()
    quests.value = Object.keys(data || {}).map(key => ({
      id: key,
      ...data[key]
    }))
    filterQuests()
  } catch (error) {
    console.error('Erreur lors du chargement des quêtes:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les quêtes',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterQuests = () => {
  let filtered = [...quests.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quest => 
      quest.title.toLowerCase().includes(query) ||
      quest.description.toLowerCase().includes(query)
    )
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(quest => quest.status === selectedStatus.value)
  }
  
  if (selectedType.value) {
    filtered = filtered.filter(quest => quest.type === selectedType.value)
  }
  
  filteredQuests.value = filtered
}

const resetForm = () => {
  Object.assign(questForm, {
    title: '',
    description: '',
    type: '',
    difficulty: 'easy',
    points: 50,
    category: '',
    status: 'active',
    steps: [{ title: '' }]
  })
  errors.value = {}
  editingQuest.value = null
}

const validateForm = () => {
  errors.value = {}
  
  if (!questForm.title.trim()) {
    errors.value.title = 'Le titre est requis'
  }
  
  if (!questForm.description.trim()) {
    errors.value.description = 'La description est requise'
  }
  
  if (!questForm.type) {
    errors.value.type = 'Le type est requis'
  }
  
  if (!questForm.difficulty) {
    errors.value.difficulty = 'La difficulté est requise'
  }
  
  if (!questForm.points || questForm.points < 1) {
    errors.value.points = 'Les points doivent être supérieurs à 0'
  }
  
  return Object.keys(errors.value).length === 0
}

const addStep = () => {
  questForm.steps.push({ title: '' })
}

const removeStep = (index) => {
  if (questForm.steps.length > 1) {
    questForm.steps.splice(index, 1)
  }
}

const saveQuest = async () => {
  if (!validateForm()) return
  
  try {
    saving.value = true
    
    const questData = {
      title: questForm.title.trim(),
      description: questForm.description.trim(),
      type: questForm.type,
      difficulty: questForm.difficulty,
      points: questForm.points,
      category: questForm.category.trim(),
      status: questForm.status,
      steps: questForm.steps.filter(step => step.title.trim()).map(step => ({
        title: step.title.trim(),
        completed: false
      })),
      rewards: {
        xp: questForm.points,
        badges: [],
        items: []
      }
    }
    
    if (editingQuest.value) {
      await adminService.updateQuest(editingQuest.value.id, questData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Quête modifiée avec succès',
        life: 3000
      })
    } else {
      await adminService.createQuest(questData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Quête créée avec succès',
        life: 3000
      })
    }
    
    showCreateDialog.value = false
    resetForm()
    await loadQuests()
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la sauvegarde',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const editQuest = (quest) => {
  editingQuest.value = quest
  Object.assign(questForm, {
    title: quest.title || '',
    description: quest.description || '',
    type: quest.type || '',
    difficulty: quest.difficulty || 'easy',
    points: quest.points || 50,
    category: quest.category || '',
    status: quest.status || 'active',
    steps: quest.steps?.length ? [...quest.steps] : [{ title: '' }]
  })
  showCreateDialog.value = true
}

const confirmDeleteQuest = (quest) => {
  questToDelete.value = quest
  showDeleteDialog.value = true
}

const deleteQuest = async () => {
  if (!questToDelete.value) return
  
  try {
    deleting.value = true
    await adminService.deleteQuest(questToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Quête supprimée avec succès',
      life: 3000
    })
    
    showDeleteDialog.value = false
    questToDelete.value = null
    await loadQuests()
    
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la suppression',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const viewQuestDetails = (quest) => {
  console.log('Voir détails de la quête:', quest)
}

// Navigation vers la vue de création publique
const navigateToPublicCreation = () => {
  router.push('/gamification/create-quest')
}

// Utilitaires de rôles supprimés - système désactivé

const getTypeLabel = (type) => {
  const labels = {
    main: 'Principale',
    side: 'Secondaire',
    event: 'Événement',
    daily: 'Quotidienne'
  }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    draft: 'Brouillon'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    active: 'success',
    inactive: 'secondary',
    draft: 'warning'
  }
  return severities[status] || 'info'
}

const getTypeSeverity = (type) => {
  const severities = {
    main: 'info',
    side: 'warning',
    event: 'danger',
    daily: 'success'
  }
  return severities[type] || 'info'
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

// Lifecycle
onMounted(() => {
  loadQuests()
})
</script>

<style scoped>
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
