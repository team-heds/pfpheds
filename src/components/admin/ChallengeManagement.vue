<template>
  <div>
    
    <div class="p-4 max-w-7xl mx-auto">
      <!-- Header simplifié -->
      <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-trophy text-primary text-2xl"></i>
          <h1 class="text-2xl font-semibold m-0 text-900">Gestion des Défis</h1>
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
            v-if="canCreateChallenges"
            @click="showCreateDialog = true"
            icon="pi pi-plus"
            label="Nouveau Défi"
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
            placeholder="Rechercher un défi..."
            @input="filterChallenges"
          />
        </div>
        
        <Dropdown 
          v-model="selectedStatus" 
          :options="statusOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Statut"
          @change="filterChallenges"
          style="min-width: 150px;"
        />
        
        <Dropdown 
          v-model="selectedDifficulty" 
          :options="difficultyOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Difficulté"
          @change="filterChallenges"
          style="min-width: 150px;"
        />
      </div>

      <!-- Liste des défis -->
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement des défis...</p>
      </div>
      
      <div v-else-if="filteredChallenges.length === 0" class="text-center p-6">
        <i class="pi pi-trophy text-6xl text-300 mb-3"></i>
        <h3 class="text-900 mb-2">Aucun défi trouvé</h3>
        <p class="text-600 m-0">{{ searchQuery ? 'Aucun défi ne correspond à votre recherche.' : 'Commencez par créer votre premier défi.' }}</p>
      </div>
      
      <div v-else class="grid">
        <div 
          v-for="challenge in filteredChallenges" 
          :key="challenge.id"
          class="col-12 md:col-6 lg:col-4"
        >
          <div class="surface-card p-4 border-round shadow-2 h-full">
            <div class="flex align-items-start gap-3 mb-3">
              <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-primary-50 border-circle flex-shrink-0">
                <i class="pi pi-trophy text-primary text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-900 font-semibold m-0 mb-2">{{ challenge.title }}</h4>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">{{ challenge.description }}</p>
                <div class="flex gap-2 flex-wrap">
                  <Tag 
                    :value="getStatusLabel(challenge.status)" 
                    :severity="getStatusSeverity(challenge.status)"
                  />
                  <Tag 
                    :value="getDifficultyLabel(challenge.difficulty)" 
                    :severity="getDifficultySeverity(challenge.difficulty)"
                  />
                </div>
              </div>
            </div>
            
            <div class="flex justify-content-between align-items-center text-sm text-600 mb-3">
              <div class="flex align-items-center gap-1">
                <i class="pi pi-users"></i>
                <span>{{ challenge.participantsCount || 0 }}</span>
              </div>
              <div class="flex align-items-center gap-1">
                <i class="pi pi-star"></i>
                <span>{{ challenge.points }} pts</span>
              </div>
              <div class="flex align-items-center gap-1">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(challenge.createdAt) }}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye" 
                class="p-button-outlined p-button-sm flex-1"
                @click="viewChallengeDetails(challenge)"
                label="Détails"
              />
              <Button 
                v-if="canEditChallenges"
                icon="pi pi-pencil" 
                class="p-button-outlined p-button-sm"
                @click="editChallenge(challenge)"
                v-tooltip="'Modifier'"
              />
              <Button 
                v-if="canDeleteChallenges"
                icon="pi pi-trash" 
                class="p-button-outlined p-button-danger p-button-sm"
                @click="confirmDeleteChallenge(challenge)"
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
      :header="editingChallenge ? 'Modifier le Défi' : 'Nouveau Défi'"
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
    >
      <div class="challenge-form">
        <div class="form-group">
          <label for="title">Titre *</label>
          <InputText 
            id="title"
            v-model="challengeForm.title" 
            placeholder="Titre du défi"
            :class="{ 'p-invalid': errors.title }"
          />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>
        
        <div class="form-group">
          <label for="description">Description *</label>
          <Textarea 
            id="description"
            v-model="challengeForm.description" 
            placeholder="Description détaillée du défi"
            rows="4"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="difficulty">Difficulté *</label>
            <Dropdown 
              id="difficulty"
              v-model="challengeForm.difficulty" 
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
              v-model="challengeForm.points" 
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
              v-model="challengeForm.category" 
              placeholder="Catégorie du défi"
            />
          </div>
          
          <div class="form-group">
            <label for="status">Statut</label>
            <Dropdown 
              id="status"
              v-model="challengeForm.status" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="requirements">Prérequis</label>
          <Textarea 
            id="requirements"
            v-model="challengeForm.requirements" 
            placeholder="Prérequis pour ce défi (optionnel)"
            rows="2"
          />
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showCreateDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="saveChallenge" 
          :label="editingChallenge ? 'Modifier' : 'Créer'"
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
        <p>Êtes-vous sûr de vouloir supprimer le défi <strong>"{{ challengeToDelete?.title }}"</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteChallenge" 
          label="Supprimer"
          :loading="deleting"
          class="p-button-danger"
        />
      </template>
    </Dialog>
  </div>
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

const toast = useToast()
const router = useRouter()

// État réactif
const challenges = ref([])
const filteredChallenges = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Filtres
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedDifficulty = ref(null)

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingChallenge = ref(null)
const challengeToDelete = ref(null)

// Formulaire
const challengeForm = reactive({
  title: '',
  description: '',
  difficulty: '',
  points: 10,
  category: '',
  status: 'active',
  requirements: ''
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
  { label: 'Tous', value: null },
  { label: 'Facile', value: 'easy' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Difficile', value: 'hard' }
]

// Permissions supprimées - accès libre pour le développement
const canCreateChallenges = computed(() => true)
const canEditChallenges = computed(() => true)
const canDeleteChallenges = computed(() => true)

// Méthodes
const loadChallenges = async () => {
  try {
    loading.value = true
    const data = await adminService.getChallenges()
    challenges.value = Object.keys(data || {}).map(key => ({
      id: key,
      ...data[key]
    }))
    filterChallenges()
  } catch (error) {
    console.error('Erreur lors du chargement des défis:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les défis',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterChallenges = () => {
  let filtered = [...challenges.value]
  
  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(challenge => 
      challenge.title.toLowerCase().includes(query) ||
      challenge.description.toLowerCase().includes(query)
    )
  }
  
  // Filtre par statut
  if (selectedStatus.value) {
    filtered = filtered.filter(challenge => challenge.status === selectedStatus.value)
  }
  
  // Filtre par difficulté
  if (selectedDifficulty.value) {
    filtered = filtered.filter(challenge => challenge.difficulty === selectedDifficulty.value)
  }
  
  filteredChallenges.value = filtered
}

const resetForm = () => {
  Object.assign(challengeForm, {
    title: '',
    description: '',
    difficulty: '',
    points: 10,
    category: '',
    status: 'active',
    requirements: ''
  })
  errors.value = {}
  editingChallenge.value = null
}

const validateForm = () => {
  errors.value = {}
  
  if (!challengeForm.title.trim()) {
    errors.value.title = 'Le titre est requis'
  }
  
  if (!challengeForm.description.trim()) {
    errors.value.description = 'La description est requise'
  }
  
  if (!challengeForm.difficulty) {
    errors.value.difficulty = 'La difficulté est requise'
  }
  
  if (!challengeForm.points || challengeForm.points < 1) {
    errors.value.points = 'Les points doivent être supérieurs à 0'
  }
  
  return Object.keys(errors.value).length === 0
}

const saveChallenge = async () => {
  if (!validateForm()) return
  
  try {
    saving.value = true
    
    const challengeData = {
      title: challengeForm.title.trim(),
      description: challengeForm.description.trim(),
      difficulty: challengeForm.difficulty,
      points: challengeForm.points,
      category: challengeForm.category.trim(),
      status: challengeForm.status,
      requirements: challengeForm.requirements.trim()
    }
    
    if (editingChallenge.value) {
      await adminService.updateChallenge(editingChallenge.value.id, challengeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Défi modifié avec succès',
        life: 3000
      })
    } else {
      await adminService.createChallenge(challengeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Défi créé avec succès',
        life: 3000
      })
    }
    
    showCreateDialog.value = false
    resetForm()
    await loadChallenges()
    
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

const editChallenge = (challenge) => {
  editingChallenge.value = challenge
  Object.assign(challengeForm, {
    title: challenge.title || '',
    description: challenge.description || '',
    difficulty: challenge.difficulty || '',
    points: challenge.points || 10,
    category: challenge.category || '',
    status: challenge.status || 'active',
    requirements: challenge.requirements || ''
  })
  showCreateDialog.value = true
}

const confirmDeleteChallenge = (challenge) => {
  challengeToDelete.value = challenge
  showDeleteDialog.value = true
}

const deleteChallenge = async () => {
  if (!challengeToDelete.value) return
  
  try {
    deleting.value = true
    await adminService.deleteChallenge(challengeToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Défi supprimé avec succès',
      life: 3000
    })
    
    showDeleteDialog.value = false
    challengeToDelete.value = null
    await loadChallenges()
    
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

const viewChallengeDetails = (challenge) => {
  // TODO: Implémenter la vue détaillée
  console.log('Voir détails du défi:', challenge)
}

// Utilitaires de rôles supprimés - système désactivé

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile'
  }
  return labels[difficulty] || difficulty
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

const getDifficultySeverity = (difficulty) => {
  const severities = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return severities[difficulty] || 'info'
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

// Navigation vers la vue de création publique
const navigateToPublicCreation = () => {
  router.push('/gamification/create-challenge')
}

// Lifecycle
onMounted(() => {
  loadChallenges()
})
</script>

<style scoped>
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
