<template>
  <div class="p-4 gamification-manager">
    <!-- Header simplifié -->
    <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border manager-toolbar">
      <div class="flex align-items-center gap-3">
        <div class="bg-red-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center">
          <i class="pi pi-star text-red-500 text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-900 m-0">Badges</h2>
          <p class="text-600 m-0">Créez et gérez vos badges de récompense</p>
        </div>
      </div>
      <Button 
        v-if="canCreateBadges"
        @click="showCreateDialog = true; resetForm()"
        icon="pi pi-plus"
        label="Nouveau Badge"
        class="p-button-success manager-primary-action"
      />
    </div>

    <!-- Filtres et recherche -->
    <div class="mb-4">
      <div class="flex flex-wrap gap-3 align-items-center manager-filters">
        <div class="p-inputgroup manager-search" style="min-width: 300px">
          <span class="p-inputgroup-addon">
            <i class="pi pi-search"></i>
          </span>
          <InputText 
            v-model="searchQuery" 
            aria-label="Rechercher un badge"
            placeholder="Rechercher un badge..."
            @input="filterBadges"
          />
        </div>
        
        <Dropdown 
          v-model="selectedCategory" 
          aria-label="Filtrer les badges par catégorie"
          :options="categoryOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Catégorie"
          @change="filterBadges"
          style="min-width: 150px"
        />
        
        <Dropdown 
          v-model="selectedRarity" 
          aria-label="Filtrer les badges par rareté"
          :options="rarityOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Rareté"
          @change="filterBadges"
          style="min-width: 150px"
        />
      </div>
    </div>

    <!-- Liste des badges -->
    <div style="min-height: 400px">
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6 text-600">
        <ProgressSpinner />
        <p class="mt-3">Chargement des badges...</p>
      </div>
      
      <div v-else-if="filteredBadges.length === 0" class="text-center p-6 text-600">
        <i class="pi pi-star text-6xl mb-3 text-300"></i>
        <h3 class="text-900 mb-2">Aucun badge trouvé</h3>
        <p class="m-0">{{ searchQuery ? 'Aucun badge ne correspond à votre recherche.' : 'Commencez par créer votre premier badge.' }}</p>
      </div>
      
      <div v-else class="grid">
        <div 
          v-for="badge in filteredBadges" 
          :key="badge.id"
          class="col-12 md:col-6 lg:col-4"
        >
          <div class="surface-card p-4 border-round shadow-2 h-full">
            <div class="flex align-items-start gap-3 mb-3">
              <div class="flex-shrink-0">
                <div class="w-4rem h-4rem border-round flex align-items-center justify-content-center text-white text-xl" :style="{ background: getRarityGradient(badge.rarity) }">
                  <i :class="badge.icon || 'pi pi-star'"></i>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-900 font-semibold m-0 mb-2">{{ badge.name }}</h4>
                <div class="flex gap-2 mb-2">
                  <Tag :value="getCategoryLabel(badge.category)" :severity="getCategorySeverity(badge.category)" />
                  <Tag :value="getRarityLabel(badge.rarity)" :severity="getRaritySeverity(badge.rarity)" />
                  <Tag :value="badge.active ? 'Actif' : 'Inactif'" :severity="badge.active ? 'success' : 'secondary'" />
                </div>
              </div>
            </div>
            
            <p class="text-600 line-height-3 mb-3">{{ badge.description }}</p>
            <p class="text-700 font-medium mb-3"><i class="pi pi-check-circle mr-2"></i>{{ badge.conditionLabel }}</p>
            
            <div class="grid text-center mb-3">
              <div class="col-4">
                <div class="text-900 font-semibold">{{ badge.points }}</div>
                <div class="text-600 text-sm">Bonus XP</div>
              </div>
              <div class="col-4">
                <div class="text-900 font-semibold">{{ badge.unlockedCount || 0 }}</div>
                <div class="text-600 text-sm">Débloqués</div>
              </div>
              <div class="col-4">
                <div class="text-900 font-semibold text-sm">{{ formatDate(badge.createdAt) }}</div>
                <div class="text-600 text-sm">Créé</div>
              </div>
            </div>
            
            <div class="flex gap-2 justify-content-end">
              <Button 
                v-if="canEditBadges"
                @click="editBadge(badge)"
                icon="pi pi-pencil"
                :aria-label="`Modifier le badge ${badge.name}`"
                class="p-button-text p-button-info p-button-sm"
                v-tooltip="'Modifier'"
              />
              <Button 
                v-if="canDeleteBadges"
                @click="confirmDeleteBadge(badge)"
                icon="pi pi-trash"
                :aria-label="`Désactiver le badge ${badge.name}`"
                class="p-button-text p-button-danger p-button-sm"
                v-tooltip="'Désactiver'"
              />
              <Button 
                @click="viewBadgeDetails(badge)"
                icon="pi pi-eye"
                :aria-label="`Voir les détails du badge ${badge.name}`"
                class="p-button-text p-button-sm"
                v-tooltip="'Voir détails'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog de création/édition -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      :header="editingBadge ? 'Modifier le Badge' : 'Nouveau Badge'"
      :modal="true"
      :closable="true"
      :style="{ width: 'min(720px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)' }"
      :contentStyle="{ overflowY: 'auto' }"
      class="gamification-form-dialog"
    >
      <div class="badge-form">
        <div class="form-group">
          <label for="badge-name">Nom *</label>
          <InputText 
            id="badge-name"
            v-model="badgeForm.name" 
            placeholder="Nom du badge"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
        
        <div class="form-group">
          <label for="badge-description">Description *</label>
          <Textarea 
            id="badge-description"
            v-model="badgeForm.description" 
            placeholder="Description du badge"
            rows="3"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="badge-category">Catégorie *</label>
            <Dropdown 
              inputId="badge-category"
              aria-label="Catégorie du badge"
              v-model="badgeForm.category" 
              :options="categoryOptions.filter(c => c.value)" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
              :class="{ 'p-invalid': errors.category }"
            />
            <small v-if="errors.category" class="p-error">{{ errors.category }}</small>
          </div>
          
          <div class="form-group">
            <label for="badge-rarity">Rareté *</label>
            <Dropdown 
              inputId="badge-rarity"
              aria-label="Rareté du badge"
              v-model="badgeForm.rarity" 
              :options="rarityOptions.filter(r => r.value)" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner"
              :class="{ 'p-invalid': errors.rarity }"
            />
            <small v-if="errors.rarity" class="p-error">{{ errors.rarity }}</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="badge-points">Points *</label>
            <InputNumber 
              inputId="badge-points"
              aria-label="Points attribués par le badge"
              v-model="badgeForm.points" 
              :min="0"
              :max="500"
              placeholder="Points"
              :class="{ 'p-invalid': errors.points }"
            />
            <small v-if="errors.points" class="p-error">{{ errors.points }}</small>
          </div>
          
          <div class="form-group">
            <label for="badge-icon">Icône</label>
            <InputText 
              id="badge-icon"
              v-model="badgeForm.icon" 
              placeholder="pi pi-star"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="badge-condition-type">Condition *</label>
            <Dropdown inputId="badge-condition-type" aria-label="Condition de déblocage du badge" v-model="badgeForm.conditionType" :options="conditionOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="form-group">
            <label for="badge-condition-target">Valeur cible *</label>
            <InputNumber inputId="badge-condition-target" aria-label="Valeur cible du badge" v-model="badgeForm.conditionTarget" :min="1" />
          </div>
        </div>
        <div v-if="badgeForm.conditionType === 'action_count'" class="form-group">
          <label for="badge-action-type">Action vérifiée *</label>
          <Dropdown inputId="badge-action-type" aria-label="Action vérifiée pour le badge" v-model="badgeForm.actionType" :options="actionOptions" optionLabel="label" optionValue="value" />
        </div>
        <small v-if="errors.condition" class="p-error">{{ errors.condition }}</small>
        <div class="form-group">
          <label for="badge-active">État</label>
          <Dropdown inputId="badge-active" aria-label="État du badge" v-model="badgeForm.isActive" :options="activeOptions" optionLabel="label" optionValue="value" />
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showCreateDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="saveBadge" 
          :label="editingBadge ? 'Modifier' : 'Créer'"
          :loading="saving"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Dialog de confirmation de désactivation -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      header="Confirmer la désactivation"
      :modal="true"
      :closable="true"
      :style="{ width: '400px' }"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <p>Désactiver le badge <strong>"{{ badgeToDelete?.name }}"</strong> ?</p>
        <p class="warning-text">Son historique sera conservé et il restera visible ici.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteBadge" 
          label="Désactiver"
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
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import adminBadgesService, { BADGE_ACTIONS } from '../../service/adminBadgesService'

const toast = useToast()

// État réactif
const badges = ref([])
const filteredBadges = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Filtres
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedRarity = ref(null)

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingBadge = ref(null)
const badgeToDelete = ref(null)

// Formulaire
const badgeForm = reactive({
  name: '',
  description: '',
  category: '',
  rarity: '',
  points: 0,
  icon: 'pi pi-star',
  conditionType: 'total_xp',
  conditionTarget: 100,
  actionType: 'POST',
  isActive: true
})

const errors = ref({})

// Options pour les dropdowns
const categoryOptions = [
  { label: 'Tous', value: null },
  { label: 'Académique', value: 'academic' },
  { label: 'Social', value: 'social' },
  { label: 'Créatif', value: 'creative' },
  { label: 'Leadership', value: 'leadership' },
  { label: 'Participation', value: 'participation' }
]

const rarityOptions = [
  { label: 'Tous', value: null },
  { label: 'Commun', value: 'common' },
  { label: 'Rare', value: 'rare' },
  { label: 'Épique', value: 'epic' },
  { label: 'Légendaire', value: 'legendary' }
]

const conditionOptions = [
  { label: 'XP cumulés', value: 'total_xp' },
  { label: 'Niveau atteint', value: 'level' },
  { label: 'Nombre d’actions validées', value: 'action_count' }
]
const actionOptions = BADGE_ACTIONS
const activeOptions = [
  { label: 'Actif — peut progresser', value: true },
  { label: 'Inactif — historique uniquement', value: false }
]

// Permissions supprimées - accès libre pour le développement
const canCreateBadges = computed(() => true)
const canEditBadges = computed(() => true)
const canDeleteBadges = computed(() => true)

// Méthodes
const loadBadges = async () => {
  try {
    loading.value = true
    badges.value = await adminBadgesService.getBadges()
    filterBadges()
  } catch (error) {
    console.error('Erreur lors du chargement des badges:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les badges',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterBadges = () => {
  let filtered = [...badges.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(badge => 
      badge.name.toLowerCase().includes(query) ||
      badge.description.toLowerCase().includes(query)
    )
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(badge => badge.category === selectedCategory.value)
  }
  
  if (selectedRarity.value) {
    filtered = filtered.filter(badge => badge.rarity === selectedRarity.value)
  }
  
  filteredBadges.value = filtered
}

const resetForm = () => {
  Object.assign(badgeForm, {
    name: '',
    description: '',
    category: '',
    rarity: '',
    points: 0,
    icon: 'pi pi-star',
    conditionType: 'total_xp',
    conditionTarget: 100,
    actionType: 'POST',
    isActive: true
  })
  errors.value = {}
  editingBadge.value = null
}

const validateForm = () => {
  errors.value = {}
  
  if (!badgeForm.name.trim()) {
    errors.value.name = 'Le nom est requis'
  }
  
  if (!badgeForm.description.trim()) {
    errors.value.description = 'La description est requise'
  }
  
  if (!badgeForm.category) {
    errors.value.category = 'La catégorie est requise'
  }
  
  if (!badgeForm.rarity) {
    errors.value.rarity = 'La rareté est requise'
  }
  
  if (badgeForm.points === null || badgeForm.points < 0) {
    errors.value.points = 'Le bonus XP ne peut pas être négatif'
  }

  if (!badgeForm.conditionTarget || badgeForm.conditionTarget < 1) {
    errors.value.condition = 'La valeur cible doit être supérieure à 0'
  }

  if (badgeForm.conditionType === 'action_count' && !badgeForm.actionType) {
    errors.value.condition = 'L’action vérifiée est requise'
  }
  
  return Object.keys(errors.value).length === 0
}

const saveBadge = async () => {
  if (!validateForm()) return
  
  try {
    saving.value = true
    
    const badgeData = {
      name: badgeForm.name.trim(),
      description: badgeForm.description.trim(),
      category: badgeForm.category,
      rarity: badgeForm.rarity,
      xpBonus: badgeForm.points,
      icon: badgeForm.icon.trim() || 'pi pi-star',
      conditionType: badgeForm.conditionType,
      conditionTarget: badgeForm.conditionTarget,
      actionType: badgeForm.actionType,
      isActive: badgeForm.isActive
    }
    
    if (editingBadge.value) {
      await adminBadgesService.updateBadge(editingBadge.value.id, badgeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Badge modifié avec succès',
        life: 3000
      })
    } else {
      await adminBadgesService.createBadge(badgeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Badge créé avec succès',
        life: 3000
      })
    }
    
    showCreateDialog.value = false
    resetForm()
    await loadBadges()
    
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

const editBadge = (badge) => {
  editingBadge.value = badge
  Object.assign(badgeForm, {
    name: badge.name || '',
    description: badge.description || '',
    category: badge.category || '',
    rarity: badge.rarity || '',
    points: badge.points || 0,
    icon: badge.icon || 'pi pi-star',
    conditionType: badge.condition?.type || 'total_xp',
    conditionTarget: badge.condition?.target || 1,
    actionType: badge.condition?.actionType || 'POST',
    isActive: badge.active
  })
  showCreateDialog.value = true
}

const confirmDeleteBadge = (badge) => {
  badgeToDelete.value = badge
  showDeleteDialog.value = true
}

const deleteBadge = async () => {
  if (!badgeToDelete.value) return
  
  try {
    deleting.value = true
    await adminBadgesService.deactivateBadge(badgeToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Badge désactivé, historique conservé',
      life: 3000
    })
    
    showDeleteDialog.value = false
    badgeToDelete.value = null
    await loadBadges()
    
  } catch (error) {
    console.error('Erreur lors de la désactivation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la désactivation',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const viewBadgeDetails = (badge) => {
  console.log('Voir détails du badge:', badge)
}

// Utilitaires de rôles supprimés - système désactivé

const getCategoryLabel = (category) => {
  const labels = {
    academic: 'Académique',
    social: 'Social',
    creative: 'Créatif',
    leadership: 'Leadership',
    participation: 'Participation'
  }
  return labels[category] || category
}

const getRarityLabel = (rarity) => {
  const labels = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  }
  return labels[rarity] || rarity
}

const getCategorySeverity = (category) => {
  const severities = {
    academic: 'info',
    social: 'success',
    creative: 'warning',
    leadership: 'danger',
    participation: 'secondary'
  }
  return severities[category] || 'info'
}

const getRaritySeverity = (rarity) => {
  const severities = {
    common: 'secondary',
    rare: 'info',
    epic: 'warning',
    legendary: 'danger'
  }
  return severities[rarity] || 'info'
}

const getRarityGradient = (rarity) => {
  const gradients = {
    common: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
    rare: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    epic: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    legendary: 'linear-gradient(135deg, #F59E0B, #D97706)'
  }
  return gradients[rarity] || gradients.common
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

// Lifecycle
onMounted(() => {
  loadBadges()
})
</script>

<style scoped>
.badge-form {
  display: grid;
  gap: 1.25rem;
}

.badge-form .form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.badge-form .form-group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.5rem;
}

.badge-form label {
  font-weight: 600;
  line-height: 1.3;
}

.badge-form :deep(.p-inputtext),
.badge-form :deep(.p-inputnumber),
.badge-form :deep(.p-dropdown) {
  width: 100%;
}

:deep(.gamification-form-dialog .p-dialog-content) {
  overflow-x: hidden;
}

@media (max-width: 640px) {
  .gamification-manager { padding: 1rem 0 !important; }
  .manager-toolbar { align-items: stretch !important; flex-direction: column; gap: 1rem; }
  .manager-primary-action { width: 100%; justify-content: center; }
  .manager-filters { align-items: stretch !important; flex-direction: column; }
  .manager-search { width: 100%; min-width: 0 !important; }
  .manager-filters :deep(.p-dropdown) { width: 100%; min-width: 0 !important; }
  .badge-form .form-row { grid-template-columns: 1fr; }
  :deep(.gamification-form-dialog .p-dialog-header),
  :deep(.gamification-form-dialog .p-dialog-content),
  :deep(.gamification-form-dialog .p-dialog-footer) { padding-left: 1rem; padding-right: 1rem; }
  :deep(.gamification-form-dialog .p-dialog-footer) { display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
  :deep(.gamification-form-dialog .p-dialog-footer .p-button) { width: 100%; justify-content: center; margin: 0; }
}
</style>
