<template>
  <div>
    
    <div class="p-4 max-w-7xl mx-auto gamification-manager">
      <!-- Header simplifié -->
      <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border manager-toolbar">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-trophy text-primary text-2xl"></i>
          <h2 class="text-2xl font-semibold m-0 text-900">Défis</h2>
        </div>
        <div class="flex gap-2 manager-actions">
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
      <div class="flex flex-wrap gap-3 mb-4 manager-filters">
        <div class="p-inputgroup flex-1 manager-search" style="min-width: 300px;">
          <span class="p-inputgroup-addon">
            <i class="pi pi-search"></i>
          </span>
          <InputText 
            v-model="searchQuery" 
            aria-label="Rechercher un défi"
            placeholder="Rechercher un défi..."
            @input="filterChallenges"
          />
        </div>
        
        <Dropdown 
          v-model="selectedStatus" 
          aria-label="Filtrer les défis par statut"
          :options="statusOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Statut"
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
                </div>
              </div>
            </div>
            
            <div class="flex justify-content-between align-items-center text-sm text-600 mb-3">
              <div class="flex align-items-center gap-1">
                <i class="pi pi-bolt"></i>
                <span>{{ getActionLabel(challenge.actionType) }}</span>
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
                :aria-label="`Modifier le défi ${challenge.title}`"
                v-tooltip="'Modifier'"
              />
              <Button 
                v-if="canDeleteChallenges"
                icon="pi pi-trash" 
                class="p-button-outlined p-button-danger p-button-sm"
                @click="confirmDeleteChallenge(challenge)"
                :aria-label="`Archiver le défi ${challenge.title}`"
                v-tooltip="'Archiver'"
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
      :style="{ width: 'min(720px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)' }"
      :contentStyle="{ overflowY: 'auto' }"
      class="gamification-form-dialog"
    >
      <div class="challenge-form">
        <div class="form-group">
          <label for="challenge-title">Titre *</label>
          <InputText 
            id="challenge-title"
            v-model="challengeForm.title" 
            placeholder="Titre du défi"
            :class="{ 'p-invalid': errors.title }"
          />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>
        
        <div class="form-group">
          <label for="challenge-description">Description *</label>
          <Textarea 
            id="challenge-description"
            v-model="challengeForm.description" 
            placeholder="Description détaillée du défi"
            rows="4"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="challenge-action-type">Action vérifiée *</label>
            <Dropdown 
              inputId="challenge-action-type"
              aria-label="Action vérifiée par le défi"
              v-model="challengeForm.actionType"
              :options="actionOptions"
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
              :class="{ 'p-invalid': errors.actionType }"
            />
            <small v-if="errors.actionType" class="p-error">{{ errors.actionType }}</small>
          </div>
          
          <div class="form-group">
            <label for="challenge-points">Points *</label>
            <InputNumber 
              inputId="challenge-points"
              aria-label="Points attribués par le défi"
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
            <label for="challenge-target">Nombre requis *</label>
            <InputNumber
              inputId="challenge-target"
              aria-label="Nombre d’actions requis"
              v-model="challengeForm.target"
              :min="1"
              :max="1000"
              :class="{ 'p-invalid': errors.target }"
            />
            <small v-if="errors.target" class="p-error">{{ errors.target }}</small>
          </div>
          
          <div class="form-group">
            <label for="challenge-status">Statut</label>
            <Dropdown 
              inputId="challenge-status"
              aria-label="Statut du défi"
              v-model="challengeForm.status" 
              :options="statusOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="challenge-start-date">Début *</label>
            <Calendar inputId="challenge-start-date" aria-label="Date de début du défi" v-model="challengeForm.startDate" dateFormat="dd/mm/yy" showIcon />
          </div>
          <div class="form-group">
            <label for="challenge-end-date">Fin *</label>
            <Calendar inputId="challenge-end-date" aria-label="Date de fin du défi" v-model="challengeForm.endDate" dateFormat="dd/mm/yy" showIcon />
          </div>
        </div>
        <small v-if="errors.dates" class="p-error">{{ errors.dates }}</small>
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

    <!-- Dialog de confirmation d’archivage -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      header="Confirmer l’archivage"
      :modal="true"
      :closable="true"
      :style="{ width: '400px' }"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <p>Archiver le défi <strong>"{{ challengeToDelete?.title }}"</strong> ?</p>
        <p class="warning-text">Les progressions et l’historique seront conservés.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteChallenge" 
          label="Archiver"
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
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import adminChallengesService from '../../service/adminChallengesService'

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

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingChallenge = ref(null)
const challengeToDelete = ref(null)

// Formulaire
const challengeForm = reactive({
  title: '',
  description: '',
  points: 10,
  target: 1,
  actionType: null,
  status: 'draft',
  startDate: null,
  endDate: null
})

const errors = ref({})

// Options pour les dropdowns
const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Planifié', value: 'scheduled' },
  { label: 'Actif', value: 'active' },
  { label: 'Terminé', value: 'completed' },
  { label: 'Archivé', value: 'archived' }
]

const actionOptions = [
  { label: 'Connexion quotidienne', value: 'daily_login' },
  { label: 'Publication', value: 'create_post' },
  { label: 'Mise à jour du profil', value: 'update_profile' }
]

// Permissions supprimées - accès libre pour le développement
const canCreateChallenges = computed(() => true)
const canEditChallenges = computed(() => true)
const canDeleteChallenges = computed(() => true)

// Méthodes
const loadChallenges = async () => {
  try {
    loading.value = true
    challenges.value = await adminChallengesService.getChallenges()
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
      (challenge.title || '').toLowerCase().includes(query) ||
      (challenge.description || '').toLowerCase().includes(query)
    )
  }
  
  // Filtre par statut
  if (selectedStatus.value) {
    filtered = filtered.filter(challenge => challenge.status === selectedStatus.value)
  }
  
  filteredChallenges.value = filtered
}

const resetForm = () => {
  Object.assign(challengeForm, {
    title: '',
    description: '',
    points: 10,
    target: 1,
    actionType: null,
    status: 'draft',
    startDate: null,
    endDate: null
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
  
  if (!challengeForm.actionType) {
    errors.value.actionType = 'L’action vérifiée est requise'
  }
  
  if (!challengeForm.points || challengeForm.points < 1) {
    errors.value.points = 'Les points doivent être supérieurs à 0'
  }

  if (!challengeForm.target || challengeForm.target < 1) {
    errors.value.target = 'Le nombre requis doit être supérieur à 0'
  }

  if (challengeForm.status !== 'draft') {
    if (!challengeForm.startDate || !challengeForm.endDate || challengeForm.endDate < challengeForm.startDate) {
      errors.value.dates = 'Une période valide est obligatoire avant publication'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const saveChallenge = async () => {
  if (!validateForm()) {
    toast.add({ severity: 'warn', summary: 'Défi incomplet', detail: Object.values(errors.value).join(' · '), life: 5000 })
    return
  }
  
  try {
    saving.value = true
    
    const challengeData = {
      title: challengeForm.title.trim(),
      description: challengeForm.description.trim(),
      points: challengeForm.points,
      target: challengeForm.target,
      actionType: challengeForm.actionType,
      status: challengeForm.status,
      startDate: formatDateForDatabase(challengeForm.startDate),
      endDate: formatDateForDatabase(challengeForm.endDate)
    }
    
    if (editingChallenge.value) {
      await adminChallengesService.updateChallenge(editingChallenge.value.id, challengeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Défi modifié avec succès',
        life: 3000
      })
    } else {
      await adminChallengesService.createChallenge(challengeData)
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
    points: challenge.points || 10,
    target: challenge.target || 1,
    actionType: challenge.actionType || null,
    status: challenge.status || 'draft',
    startDate: challenge.startDate ? new Date(`${challenge.startDate}T12:00:00`) : null,
    endDate: challenge.endDate ? new Date(`${challenge.endDate}T12:00:00`) : null
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
    await adminChallengesService.archiveChallenge(challengeToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Défi archivé avec succès',
      life: 3000
    })
    
    showDeleteDialog.value = false
    challengeToDelete.value = null
    await loadChallenges()
    
  } catch (error) {
    console.error('Erreur lors de l’archivage:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de l’archivage',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const viewChallengeDetails = async (challenge) => {
  try {
    const preview = await adminChallengesService.previewChallengeLifecycle(challenge.id)
    const validation = preview.validation || {}
    toast.add({
      severity: validation.valid ? 'info' : 'warn',
      summary: validation.valid ? 'Défi prêt' : 'Défi à compléter',
      detail: validation.valid
        ? `État calculé : ${getStatusLabel(preview.effective_status)}`
        : (validation.errors || []).join(' · '),
      life: 6000
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 })
  }
}

// Utilitaires de rôles supprimés - système désactivé

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    scheduled: 'Planifié',
    completed: 'Terminé',
    archived: 'Archivé',
    draft: 'Brouillon'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    active: 'success',
    scheduled: 'info',
    completed: 'secondary',
    archived: 'contrast',
    draft: 'warning'
  }
  return severities[status] || 'info'
}

const getActionLabel = action => actionOptions.find(option => option.value === action)?.label || action || 'N/A'

const formatDateForDatabase = date => {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

// Navigation vers la vue de création publique
const navigateToPublicCreation = () => {
  router.push('/create-challenge')
}

// Lifecycle
onMounted(() => {
  loadChallenges()
})
</script>

<style scoped>
.challenge-form {
  display: grid;
  gap: 1.25rem;
}

.challenge-form .form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.challenge-form .form-group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.5rem;
}

.challenge-form label {
  font-weight: 600;
  line-height: 1.3;
}

.challenge-form :deep(.p-inputtext),
.challenge-form :deep(.p-inputnumber),
.challenge-form :deep(.p-dropdown),
.challenge-form :deep(.p-calendar) {
  width: 100%;
}

:deep(.gamification-form-dialog .p-dialog-content) {
  overflow-x: hidden;
}

@media (max-width: 640px) {
  .gamification-manager { padding: 1rem 0 !important; }
  .manager-toolbar { align-items: stretch !important; flex-direction: column; gap: 1rem; }
  .manager-actions { width: 100%; flex-direction: column; }
  .manager-actions :deep(.p-button) { width: 100%; justify-content: center; }
  .manager-filters { flex-direction: column; }
  .manager-search { width: 100%; min-width: 0 !important; }
  .manager-filters :deep(.p-dropdown) { width: 100%; min-width: 0 !important; }
  .challenge-form .form-row { grid-template-columns: 1fr; }
  :deep(.gamification-form-dialog .p-dialog-header),
  :deep(.gamification-form-dialog .p-dialog-content),
  :deep(.gamification-form-dialog .p-dialog-footer) { padding-left: 1rem; padding-right: 1rem; }
  :deep(.gamification-form-dialog .p-dialog-footer) { display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
  :deep(.gamification-form-dialog .p-dialog-footer .p-button) { width: 100%; justify-content: center; margin: 0; }
}
</style>
