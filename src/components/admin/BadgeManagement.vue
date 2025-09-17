<template>
  <div class="p-4">
    <!-- Header simplifié -->
    <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-3">
        <div class="bg-red-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center">
          <i class="pi pi-star text-red-500 text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-900 m-0">Gestion des Badges</h2>
          <p class="text-600 m-0">Créez et gérez vos badges de récompense</p>
        </div>
      </div>
      <Button 
        v-if="canCreateBadges"
        @click="showCreateDialog = true; resetForm()"
        icon="pi pi-plus"
        label="Nouveau Badge"
        class="p-button-success"
      />
    </div>

    <!-- Filtres et recherche -->
    <div class="mb-4">
      <div class="flex flex-wrap gap-3 align-items-center">
        <div class="p-inputgroup" style="min-width: 300px">
          <span class="p-inputgroup-addon">
            <i class="pi pi-search"></i>
          </span>
          <InputText 
            v-model="searchQuery" 
            placeholder="Rechercher un badge..."
            @input="filterBadges"
          />
        </div>
        
        <Dropdown 
          v-model="selectedCategory" 
          :options="categoryOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Catégorie"
          @change="filterBadges"
          style="min-width: 150px"
        />
        
        <Dropdown 
          v-model="selectedRarity" 
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
                </div>
              </div>
            </div>
            
            <p class="text-600 line-height-3 mb-3">{{ badge.description }}</p>
            
            <div class="grid text-center mb-3">
              <div class="col-4">
                <div class="text-900 font-semibold">{{ badge.points }}</div>
                <div class="text-600 text-sm">Points</div>
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
                class="p-button-text p-button-info p-button-sm"
                v-tooltip="'Modifier'"
              />
              <Button 
                v-if="canDeleteBadges"
                @click="confirmDeleteBadge(badge)"
                icon="pi pi-trash"
                class="p-button-text p-button-danger p-button-sm"
                v-tooltip="'Supprimer'"
              />
              <Button 
                @click="viewBadgeDetails(badge)"
                icon="pi pi-eye"
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
      :style="{ width: '600px' }"
    >
      <div class="badge-form">
        <div class="form-group">
          <label for="name">Nom *</label>
          <InputText 
            id="name"
            v-model="badgeForm.name" 
            placeholder="Nom du badge"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
        
        <div class="form-group">
          <label for="description">Description *</label>
          <Textarea 
            id="description"
            v-model="badgeForm.description" 
            placeholder="Description du badge"
            rows="3"
            :class="{ 'p-invalid': errors.description }"
          />
          <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">Catégorie *</label>
            <Dropdown 
              id="category"
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
            <label for="rarity">Rareté *</label>
            <Dropdown 
              id="rarity"
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
            <label for="points">Points *</label>
            <InputNumber 
              id="points"
              v-model="badgeForm.points" 
              :min="1"
              :max="500"
              placeholder="Points"
              :class="{ 'p-invalid': errors.points }"
            />
            <small v-if="errors.points" class="p-error">{{ errors.points }}</small>
          </div>
          
          <div class="form-group">
            <label for="icon">Icône</label>
            <InputText 
              id="icon"
              v-model="badgeForm.icon" 
              placeholder="pi pi-star"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="requirements">Conditions d'obtention</label>
          <Textarea 
            id="requirements"
            v-model="badgeForm.requirements" 
            placeholder="Comment obtenir ce badge"
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
          @click="saveBadge" 
          :label="editingBadge ? 'Modifier' : 'Créer'"
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
        <p>Êtes-vous sûr de vouloir supprimer le badge <strong>"{{ badgeToDelete?.name }}"</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteBadge" 
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
  points: 10,
  icon: 'pi pi-star',
  requirements: ''
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

// Permissions supprimées - accès libre pour le développement
const canCreateBadges = computed(() => true)
const canEditBadges = computed(() => true)
const canDeleteBadges = computed(() => true)

// Méthodes
const loadBadges = async () => {
  try {
    loading.value = true
    const data = await adminService.getBadges()
    badges.value = Object.keys(data || {}).map(key => ({
      id: key,
      ...data[key]
    }))
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
    points: 10,
    icon: 'pi pi-star',
    requirements: ''
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
  
  if (!badgeForm.points || badgeForm.points < 1) {
    errors.value.points = 'Les points doivent être supérieurs à 0'
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
      points: badgeForm.points,
      icon: badgeForm.icon.trim() || 'pi pi-star',
      requirements: badgeForm.requirements.trim()
    }
    
    if (editingBadge.value) {
      await adminService.updateBadge(editingBadge.value.id, badgeData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Badge modifié avec succès',
        life: 3000
      })
    } else {
      await adminService.createBadge(badgeData)
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
    points: badge.points || 10,
    icon: badge.icon || 'pi pi-star',
    requirements: badge.requirements || ''
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
    await adminService.deleteBadge(badgeToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Badge supprimé avec succès',
      life: 3000
    })
    
    showDeleteDialog.value = false
    badgeToDelete.value = null
    await loadBadges()
    
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
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
