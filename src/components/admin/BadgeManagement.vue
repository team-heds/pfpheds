<template>
  <main class="p-4 max-w-7xl mx-auto">
    <header class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-3">
        <div class="bg-red-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center" aria-hidden="true">
          <i class="pi pi-star text-red-500 text-xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-900 m-0">Gestion des badges</h1>
          <p class="text-600 m-0">Créez et gérez les récompenses de gamification</p>
        </div>
      </div>
      <Button label="Nouveau badge" icon="pi pi-plus" class="p-button-success" @click="openCreateDialog" />
    </header>

    <div class="flex flex-wrap gap-3 mb-4">
      <div class="p-inputgroup flex-1" style="min-width: 250px">
        <span class="p-inputgroup-addon"><i class="pi pi-search" aria-hidden="true"></i></span>
        <InputText v-model="searchQuery" placeholder="Rechercher un badge..." aria-label="Rechercher un badge" />
      </div>
      <Dropdown v-model="selectedCategory" :options="categoryOptions" option-label="label" option-value="value" placeholder="Toutes les catégories" aria-label="Filtrer par catégorie" style="min-width: 180px" />
      <Dropdown v-model="selectedRarity" :options="rarityOptions" option-label="label" option-value="value" placeholder="Toutes les raretés" aria-label="Filtrer par rareté" style="min-width: 180px" />
      <Dropdown v-model="selectedActive" :options="activeOptions" option-label="label" option-value="value" placeholder="Tous les statuts" aria-label="Filtrer par statut" style="min-width: 170px" />
    </div>

    <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6" role="status">
      <ProgressSpinner />
      <p class="mt-3 text-600">Chargement des badges...</p>
    </div>
    <div v-else-if="loadError" class="text-center p-6 surface-card border-round">
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-3" aria-hidden="true"></i>
      <h2 class="text-xl text-900 mb-2">Impossible de charger les badges</h2>
      <p class="text-600">{{ loadError }}</p>
      <Button label="Réessayer" icon="pi pi-refresh" @click="loadBadges" />
    </div>
    <div v-else-if="filteredBadges.length === 0" class="text-center p-6 text-600">
      <i class="pi pi-star text-6xl mb-3 text-300" aria-hidden="true"></i>
      <h2 class="text-xl text-900 mb-2">Aucun badge trouvé</h2>
      <p class="m-0">{{ badges.length ? 'Modifiez vos filtres pour afficher les badges.' : 'Aucun badge n’est encore enregistré dans Supabase.' }}</p>
    </div>
    <div v-else class="grid">
      <article v-for="badge in filteredBadges" :key="badge.id" class="col-12 md:col-6 lg:col-4">
        <div class="surface-card p-4 border-round shadow-2 h-full flex flex-column">
          <div class="flex align-items-start gap-3 mb-3">
            <div class="badge-icon flex-shrink-0" :style="{ background: getRarityGradient(badge.rarity) }" aria-hidden="true">
              <i :class="badge.icon || 'pi pi-star'"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg text-900 font-semibold m-0 mb-2">{{ badge.name }}</h2>
              <div class="flex gap-2 flex-wrap">
                <Tag :value="getCategoryLabel(badge.conditions?.category)" severity="info" />
                <Tag :value="getRarityLabel(badge.rarity)" :severity="getRaritySeverity(badge.rarity)" />
                <Tag :value="badge.is_active ? 'Actif' : 'Inactif'" :severity="badge.is_active ? 'success' : 'secondary'" />
              </div>
            </div>
          </div>
          <p class="text-600 line-height-3 mb-3">{{ badge.description || 'Aucune description.' }}</p>
          <div class="badge-stats text-sm text-600 mb-3">
            <span><i class="pi pi-star" aria-hidden="true"></i> Bonus : {{ badge.xp_bonus || 0 }} XP</span>
            <span><i class="pi pi-users" aria-hidden="true"></i> Obtenu par : {{ unlockCounts[badge.id] ?? '—' }}</span>
            <span><i class="pi pi-check-circle" aria-hidden="true"></i> {{ conditionLabel(badge.conditions) }}</span>
            <span><i class="pi pi-calendar" aria-hidden="true"></i> Créé le {{ formatDate(badge.created_at) }}</span>
          </div>
          <div class="badge-actions mt-auto">
            <Button icon="pi pi-eye" label="Détails" class="p-button-outlined p-button-sm w-full" @click="viewBadgeDetails(badge)" />
            <div class="badge-actions-row">
              <Button icon="pi pi-pencil" label="Modifier" class="p-button-outlined p-button-info p-button-sm w-full" @click="editBadge(badge)" />
              <Button
                :icon="badge.is_active ? 'pi pi-pause' : 'pi pi-play'"
                :label="badge.is_active ? 'Désactiver' : 'Activer'"
                :class="badge.is_active ? 'p-button-outlined p-button-warning p-button-sm w-full' : 'p-button-outlined p-button-success p-button-sm w-full'"
                :loading="updatingId === badge.id"
                @click="toggleBadge(badge)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>

    <Dialog v-model:visible="showFormDialog" :header="editingBadge ? 'Modifier le badge' : 'Nouveau badge'" :modal="true" :style="{ width: 'min(650px, 95vw)' }">
      <form class="badge-form" @submit.prevent="saveBadge">
        <div class="form-group">
          <label for="badge-name">Nom *</label>
          <InputText id="badge-name" v-model="badgeForm.name" maxlength="120" :class="{ 'p-invalid': errors.name }" :aria-invalid="Boolean(errors.name)" aria-describedby="badge-name-error" />
          <small id="badge-name-error" v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>
        <div class="form-group">
          <label for="badge-description">Description</label>
          <Textarea id="badge-description" v-model="badgeForm.description" rows="3" auto-resize />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="badge-category">Catégorie d’affichage</label>
            <Dropdown id="badge-category" v-model="badgeForm.category" :options="categoryOptions.filter((option) => option.value)" option-label="label" option-value="value" placeholder="Général" />
            <small class="text-600">Métadonnée d’affichage; elle ne détermine pas l’obtention.</small>
          </div>
          <div class="form-group">
            <label for="badge-rarity">Rareté *</label>
            <Dropdown id="badge-rarity" v-model="badgeForm.rarity" :options="rarityOptions.filter((option) => option.value)" option-label="label" option-value="value" placeholder="Sélectionner" :class="{ 'p-invalid': errors.rarity }" />
            <small v-if="errors.rarity" class="p-error">{{ errors.rarity }}</small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="badge-xp">Bonus XP</label>
            <InputNumber id="badge-xp" v-model="badgeForm.xp_bonus" :min="0" :max="100000" :use-grouping="false" />
            <small class="text-600">Attribué par le moteur lors du déblocage.</small>
          </div>
          <div class="form-group">
            <label for="badge-icon">Icône PrimeIcons</label>
            <InputText id="badge-icon" v-model="badgeForm.icon" placeholder="pi pi-star" />
          </div>
        </div>

        <fieldset class="condition-fieldset">
          <legend>Condition d’obtention *</legend>
          <p class="text-600 mt-0">Le moteur accepte une seule condition par badge.</p>
          <div class="form-group">
            <label for="badge-condition">Critère</label>
            <Dropdown id="badge-condition" v-model="badgeForm.condition_type" :options="conditionOptions" option-label="label" option-value="value" placeholder="Choisir un critère" :class="{ 'p-invalid': errors.condition_type }" />
            <small v-if="errors.condition_type" class="p-error">{{ errors.condition_type }}</small>
          </div>
          <div v-if="badgeForm.condition_type" class="form-row">
            <div class="form-group">
              <label for="badge-threshold">Seuil *</label>
              <InputNumber id="badge-threshold" v-model="badgeForm.condition_value" :min="1" :max="1000000" :use-grouping="false" :class="{ 'p-invalid': errors.condition_value }" />
              <small v-if="errors.condition_value" class="p-error">{{ errors.condition_value }}</small>
            </div>
            <div v-if="badgeForm.condition_type === 'action_count'" class="form-group">
              <label for="badge-action">Action comptabilisée *</label>
              <Dropdown id="badge-action" v-model="badgeForm.action_type" :options="actionOptions" option-label="label" option-value="value" placeholder="Sélectionner une action" :class="{ 'p-invalid': errors.action_type }" />
              <small v-if="errors.action_type" class="p-error">{{ errors.action_type }}</small>
            </div>
          </div>
          <small v-if="errors.condition" class="p-error">{{ errors.condition }}</small>
          <div v-if="badgeForm.unsupportedCondition" class="p-message p-message-warn mt-3" role="status">
            Cette condition existante n’est pas interprétée par le moteur actuel. Sélectionnez un critère pris en charge avant d’enregistrer; sinon, fermez sans sauvegarder.
          </div>
        </fieldset>
        <div class="flex align-items-center gap-2">
          <Checkbox id="badge-active" v-model="badgeForm.is_active" binary />
          <label for="badge-active">Badge actif et attribuable</label>
        </div>
      </form>
      <template #footer>
        <Button label="Annuler" class="p-button-text" :disabled="saving" @click="showFormDialog = false" />
        <Button :label="editingBadge ? 'Enregistrer' : 'Créer le badge'" icon="pi pi-check" :loading="saving" @click="saveBadge" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showDetailsDialog" header="Détails du badge" :modal="true" :style="{ width: 'min(500px, 95vw)' }">
      <div v-if="detailsBadge">
        <h2 class="text-xl text-900 mt-0">{{ detailsBadge.name }}</h2>
        <p class="text-600">{{ detailsBadge.description || 'Aucune description.' }}</p>
        <dl class="badge-details">
          <dt>Rareté</dt><dd>{{ getRarityLabel(detailsBadge.rarity) }}</dd>
          <dt>Catégorie</dt><dd>{{ getCategoryLabel(detailsBadge.conditions?.category) }}</dd>
          <dt>Condition</dt><dd>{{ conditionLabel(detailsBadge.conditions) }}</dd>
          <dt>Bonus XP</dt><dd>{{ detailsBadge.xp_bonus || 0 }}</dd>
          <dt>Statut</dt><dd>{{ detailsBadge.is_active ? 'Actif' : 'Inactif' }}</dd>
          <dt>Débloqué par</dt><dd>{{ unlockCounts[detailsBadge.id] ?? 'Statistique indisponible' }}</dd>
          <dt>Créé le</dt><dd>{{ formatDate(detailsBadge.created_at) }}</dd>
        </dl>
      </div>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import adminBadgesService from '@/service/adminBadgesService'

const toast = useToast()
const badges = ref([])
const unlockCounts = ref({})
const loading = ref(true)
const saving = ref(false)
const updatingId = ref(null)
const loadError = ref('')
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedRarity = ref(null)
const selectedActive = ref(null)
const showFormDialog = ref(false)
const showDetailsDialog = ref(false)
const editingBadge = ref(null)
const detailsBadge = ref(null)
const errors = ref({})

const categoryOptions = [
  { label: 'Toutes', value: null },
  { label: 'Démarrage', value: 'debut' },
  { label: 'Social', value: 'social' },
  { label: 'Académique', value: 'academique' },
  { label: 'Progression', value: 'progression' },
  { label: 'Compétition', value: 'competition' },
  { label: 'Engagement', value: 'engagement' },
  { label: 'Loyauté', value: 'loyaute' },
  { label: 'Spécial', value: 'special' },
  { label: 'Général', value: 'general' }
]
const rarityOptions = [
  { label: 'Commun', value: 'common' },
  { label: 'Peu commun', value: 'uncommon' },
  { label: 'Rare', value: 'rare' },
  { label: 'Épique', value: 'epic' },
  { label: 'Légendaire', value: 'legendary' },
  { label: 'Mythique', value: 'mythic' }
]
const activeOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Actifs', value: true },
  { label: 'Inactifs', value: false }
]
const conditionOptions = [
  { label: 'XP total minimum', value: 'total_xp' },
  { label: 'Niveau minimum', value: 'level' },
  { label: 'Nombre d’actions', value: 'action_count' }
]
const actionOptions = [
  { label: 'Connexion quotidienne (LOGIN)', value: 'LOGIN' },
  { label: 'Profil mis à jour (PROFILE_UPDATE)', value: 'PROFILE_UPDATE' },
  { label: 'Publication créée (POST)', value: 'POST' }
]
const emptyForm = () => ({
  name: '', description: '', category: 'general', rarity: 'common', xp_bonus: 0,
  icon: 'pi pi-star', condition_type: '', condition_value: 1, action_type: '',
  is_active: true, unsupportedCondition: false
})
const badgeForm = reactive(emptyForm())

const filteredBadges = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fr')
  return badges.value.filter((badge) => {
    const category = badge.conditions?.category || 'general'
    const matchesQuery = !query || `${badge.name} ${badge.description || ''}`.toLocaleLowerCase('fr').includes(query)
    const matchesCategory = !selectedCategory.value || category === selectedCategory.value
    const matchesRarity = !selectedRarity.value || badge.rarity === selectedRarity.value
    const matchesStatus = selectedActive.value === null || badge.is_active === selectedActive.value
    return matchesQuery && matchesCategory && matchesRarity && matchesStatus
  })
})

const loadBadges = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [loadedBadges, loadedCounts] = await Promise.all([
      adminBadgesService.getBadges(),
      adminBadgesService.getUnlockCounts().catch((error) => {
        console.error('Impossible de charger les statistiques des attributions:', error)
        toast.add({ severity: 'warn', summary: 'Statistiques indisponibles', detail: 'Les badges sont chargés, mais le nombre d’attributions n’est pas accessible.', life: 5000 })
        return null
      })
    ])
    badges.value = loadedBadges
    if (loadedCounts) unlockCounts.value = loadedCounts
  } catch (error) {
    console.error('Erreur lors du chargement des badges Supabase:', error)
    loadError.value = error.message || 'La requête Supabase sur la table badges a échoué.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(badgeForm, emptyForm())
  errors.value = {}
  editingBadge.value = null
}
const openCreateDialog = () => {
  resetForm()
  showFormDialog.value = true
}
const parseCondition = (conditions = {}) => {
  if (Object.hasOwn(conditions, 'total_xp')) return { type: 'total_xp', value: conditions.total_xp }
  if (Object.hasOwn(conditions, 'level')) return { type: 'level', value: conditions.level }
  if (Object.hasOwn(conditions, 'action_count')) {
    return { type: 'action_count', value: conditions.count, action: conditions.action_type }
  }
  return { type: '', value: 1, action: '', unsupported: Object.keys(conditions).some((key) => !['category', 'color', 'type'].includes(key)) }
}
const editBadge = (badge) => {
  const condition = parseCondition(badge.conditions || {})
  editingBadge.value = badge
  Object.assign(badgeForm, {
    ...emptyForm(),
    name: badge.name || '',
    description: badge.description || '',
    category: badge.conditions?.category || badge.conditions?.type || 'general',
    rarity: badge.rarity || 'common',
    xp_bonus: Number(badge.xp_bonus || 0),
    icon: badge.icon || 'pi pi-star',
    condition_type: condition.type,
    condition_value: Number(condition.value || 1),
    action_type: condition.action || '',
    is_active: Boolean(badge.is_active),
    unsupportedCondition: Boolean(condition.unsupported)
  })
  errors.value = {}
  showFormDialog.value = true
}
const validateForm = () => {
  const validationErrors = {}
  if (!badgeForm.name.trim()) validationErrors.name = 'Le nom du badge est requis.'
  if (!badgeForm.rarity) validationErrors.rarity = 'Sélectionnez une rareté.'
  if (!badgeForm.condition_type) validationErrors.condition_type = 'Choisissez une condition prise en charge.'
  if (!Number.isInteger(Number(badgeForm.condition_value)) || Number(badgeForm.condition_value) < 1) validationErrors.condition_value = 'Le seuil doit être un entier supérieur à zéro.'
  if (!Number.isInteger(Number(badgeForm.xp_bonus)) || Number(badgeForm.xp_bonus) < 0) validationErrors.xp_bonus = 'Le bonus XP doit être un entier positif ou nul.'
  if (badgeForm.condition_type === 'action_count' && !actionOptions.some((action) => action.value === badgeForm.action_type)) validationErrors.action_type = 'Sélectionnez une action prise en charge.'
  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}
const saveBadge = async () => {
  if (saving.value || !validateForm()) return
  saving.value = true
  try {
    if (editingBadge.value) await adminBadgesService.updateBadge(editingBadge.value.id, badgeForm)
    else await adminBadgesService.createBadge(badgeForm)
    toast.add({ severity: 'success', summary: 'Succès', detail: editingBadge.value ? 'Badge modifié dans Supabase.' : 'Badge créé dans Supabase.', life: 3000 })
    showFormDialog.value = false
    resetForm()
    await loadBadges()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du badge Supabase:', error)
    toast.add({ severity: 'error', summary: 'Enregistrement impossible', detail: error.message || 'Vérifiez les autorisations RLS et les valeurs du schéma Supabase.', life: 6000 })
  } finally {
    saving.value = false
  }
}
const toggleBadge = async (badge) => {
  updatingId.value = badge.id
  try {
    await adminBadgesService.setBadgeActive(badge.id, !badge.is_active)
    toast.add({ severity: 'success', summary: 'Badge mis à jour', detail: badge.is_active ? 'Badge désactivé; ses attributions sont conservées.' : 'Badge activé.', life: 3500 })
    await loadBadges()
  } catch (error) {
    console.error('Erreur lors du changement de statut du badge:', error)
    toast.add({ severity: 'error', summary: 'Mise à jour impossible', detail: error.message || 'Vérifiez vos permissions Supabase.', life: 5000 })
  } finally {
    updatingId.value = null
  }
}
const viewBadgeDetails = (badge) => {
  detailsBadge.value = badge
  showDetailsDialog.value = true
}
const conditionLabel = (conditions = {}) => {
  if (Object.hasOwn(conditions, 'total_xp')) return `${conditions.total_xp} XP au total`
  if (Object.hasOwn(conditions, 'level')) return `Niveau ${conditions.level} minimum`
  if (Object.hasOwn(conditions, 'action_count')) return `${conditions.count} ${actionOptions.find((action) => action.value === conditions.action_type)?.label || conditions.action_type || 'actions'}`
  return 'Aucune condition prise en charge'
}
const getCategoryLabel = (category) => categoryOptions.find((option) => option.value === category)?.label || category || 'Général'
const getRarityLabel = (rarity) => rarityOptions.find((option) => option.value === rarity)?.label || rarity || 'Inconnue'
const getRaritySeverity = (rarity) => ({ common: 'secondary', uncommon: 'success', rare: 'info', epic: 'warning', legendary: 'danger', mythic: 'danger' })[rarity] || 'info'
const getRarityGradient = (rarity) => ({
  common: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
  uncommon: 'linear-gradient(135deg, #22C55E, #15803D)',
  rare: 'linear-gradient(135deg, #3B82F6, #2563EB)',
  epic: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  legendary: 'linear-gradient(135deg, #F59E0B, #D97706)',
  mythic: 'linear-gradient(135deg, #EC4899, #7C3AED)'
})[rarity] || 'linear-gradient(135deg, #9CA3AF, #6B7280)'
const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR')
}

onMounted(loadBadges)
</script>

<style scoped>
.badge-icon {
  display: flex;
  width: 3.5rem;
  height: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  color: white;
  font-size: 1.25rem;
}
.badge-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex: 1; flex-direction: column; gap: 0.4rem; min-width: 0; }
.form-row { display: flex; gap: 1rem; }
.condition-fieldset { display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid var(--surface-border); border-radius: 0.5rem; }
.badge-stats { display: flex; flex-direction: column; gap: 0.5rem; }
.badge-stats span { display: flex; align-items: center; gap: 0.5rem; }
.badge-details { display: grid; grid-template-columns: minmax(120px, 1fr) 2fr; gap: 0.75rem; }
.badge-details dt { font-weight: 600; }
.badge-details dd { margin: 0; }
.badge-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.badge-actions-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
.badge-actions :deep(.p-button) { justify-content: center; }
@media (max-width: 600px) { .form-row { flex-direction: column; } }
</style>
