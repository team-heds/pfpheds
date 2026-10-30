<template>
  <main class="p-4 max-w-7xl mx-auto">
    <header class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-trophy text-primary text-2xl" aria-hidden="true"></i>
        <h1 class="text-2xl font-semibold m-0 text-900">Gestion des défis</h1>
      </div>
      <Button
        v-if="canCreateChallenges"
        label="Nouveau défi"
        icon="pi pi-plus"
        class="p-button-success"
        @click="openCreateDialog"
      />
    </header>

    <div class="flex flex-wrap gap-3 mb-4">
      <div class="p-inputgroup flex-1" style="min-width: 250px">
        <span class="p-inputgroup-addon"><i class="pi pi-search" aria-hidden="true"></i></span>
        <InputText v-model="searchQuery" placeholder="Rechercher un défi..." aria-label="Rechercher un défi" />
      </div>
      <Dropdown
        v-model="selectedStatus"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Tous les statuts"
        aria-label="Filtrer par statut"
        style="min-width: 180px"
      />
      <Dropdown
        v-model="selectedAction"
        :options="actionOptions"
        option-label="label"
        option-value="value"
        placeholder="Toutes les actions"
        aria-label="Filtrer par action"
        style="min-width: 220px"
      />
    </div>

    <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6" role="status">
      <ProgressSpinner />
      <p class="mt-3 text-600">Chargement des défis...</p>
    </div>

    <div v-else-if="loadError" class="text-center p-6 surface-card border-round">
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-3" aria-hidden="true"></i>
      <h2 class="text-xl text-900 mb-2">Impossible de charger les défis</h2>
      <p class="text-600">{{ loadError }}</p>
      <Button label="Réessayer" icon="pi pi-refresh" @click="loadChallenges" />
    </div>

    <div v-else-if="filteredChallenges.length === 0" class="text-center p-6">
      <i class="pi pi-trophy text-6xl text-300 mb-3" aria-hidden="true"></i>
      <h2 class="text-xl text-900 mb-2">Aucun défi trouvé</h2>
      <p class="text-600 m-0">
        {{ challenges.length ? 'Modifiez vos filtres pour afficher les défis.' : 'Aucun défi n’est encore enregistré dans Supabase.' }}
      </p>
    </div>

    <div v-else class="grid">
      <article v-for="challenge in filteredChallenges" :key="challenge.id" class="col-12 md:col-6 lg:col-4">
        <div class="surface-card p-4 border-round shadow-2 h-full flex flex-column">
          <div class="flex align-items-start gap-3 mb-3">
            <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-primary-50 border-circle flex-shrink-0">
              <i class="pi pi-trophy text-primary text-xl" aria-hidden="true"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg text-900 font-semibold m-0 mb-2">{{ challenge.name }}</h2>
              <p class="text-600 text-sm m-0 line-height-3">{{ challenge.description || 'Aucune description.' }}</p>
            </div>
          </div>

          <div class="flex gap-2 flex-wrap mb-3">
            <Tag :value="challenge.is_active ? 'Actif' : 'Inactif'" :severity="challenge.is_active ? 'success' : 'secondary'" />
            <Tag :value="actionLabel(challenge.action_type)" severity="info" />
          </div>

          <div class="text-sm text-600 mb-3 challenge-meta">
            <span><i class="pi pi-chart-line" aria-hidden="true"></i> Objectif : {{ challenge.target_value }}</span>
            <span><i class="pi pi-star" aria-hidden="true"></i> {{ challenge.xp_reward || 0 }} XP</span>
            <span v-if="challenge.start_date || challenge.end_date">
              <i class="pi pi-calendar" aria-hidden="true"></i>
              {{ formatDate(challenge.start_date) }} – {{ formatDate(challenge.end_date) }}
            </span>
            <span v-if="challenge.badge_reward"><i class="pi pi-shield" aria-hidden="true"></i> Badge associé</span>
          </div>

          <div class="flex gap-2 mt-auto">
            <Button label="Détails" icon="pi pi-eye" class="p-button-outlined p-button-sm flex-1" @click="viewChallengeDetails(challenge)" />
            <Button
              v-if="canEditChallenges"
              icon="pi pi-pencil"
              class="p-button-outlined p-button-sm"
              :aria-label="`Modifier ${challenge.name}`"
              @click="editChallenge(challenge)"
            />
            <Button
              v-if="canEditChallenges"
              :icon="challenge.is_active ? 'pi pi-pause' : 'pi pi-play'"
              :class="challenge.is_active ? 'p-button-outlined p-button-warning p-button-sm' : 'p-button-outlined p-button-success p-button-sm'"
              :aria-label="challenge.is_active ? `Désactiver ${challenge.name}` : `Activer ${challenge.name}`"
              :loading="updatingId === challenge.id"
              @click="toggleChallenge(challenge)"
            />
          </div>
        </div>
      </article>
    </div>

    <Dialog
      v-model:visible="showFormDialog"
      :header="editingChallenge ? 'Modifier le défi' : 'Nouveau défi'"
      :modal="true"
      :style="{ width: 'min(650px, 95vw)' }"
    >
      <form class="challenge-form" @submit.prevent="saveChallenge">
        <div class="form-group">
          <label for="challenge-name">Nom *</label>
          <InputText id="challenge-name" v-model="challengeForm.name" maxlength="120" autofocus />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
        </div>

        <div class="form-group">
          <label for="challenge-description">Description</label>
          <Textarea id="challenge-description" v-model="challengeForm.description" rows="3" auto-resize />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="challenge-action">Action suivie *</label>
            <Dropdown
              id="challenge-action"
              v-model="challengeForm.action_type"
              :options="supportedActionOptions"
              option-label="label"
              option-value="value"
              placeholder="Sélectionner une action"
            />
            <small v-if="errors.action_type" class="p-error">{{ errors.action_type }}</small>
          </div>
          <div class="form-group">
            <label for="challenge-target">Nombre d’actions requis *</label>
            <InputNumber id="challenge-target" v-model="challengeForm.target_value" :min="1" :max="100000" :use-grouping="false" />
            <small v-if="errors.target_value" class="p-error">{{ errors.target_value }}</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="challenge-xp">Récompense XP</label>
            <InputNumber id="challenge-xp" v-model="challengeForm.xp_reward" :min="0" :max="100000" :use-grouping="false" />
            <small v-if="errors.xp_reward" class="p-error">{{ errors.xp_reward }}</small>
          </div>
          <div class="form-group">
            <label for="challenge-badge">Badge récompense</label>
            <Dropdown
              id="challenge-badge"
              v-model="challengeForm.badge_reward"
              :options="badgeOptions"
              option-label="name"
              option-value="id"
              placeholder="Aucun badge"
              show-clear
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="challenge-start">Date de début</label>
            <input id="challenge-start" v-model="challengeForm.start_date" class="p-inputtext p-component" type="date" />
          </div>
          <div class="form-group">
            <label for="challenge-end">Date de fin</label>
            <input id="challenge-end" v-model="challengeForm.end_date" class="p-inputtext p-component" type="date" />
          </div>
        </div>
        <small v-if="errors.dates" class="p-error">{{ errors.dates }}</small>

        <div class="form-row">
          <div class="form-group">
            <label for="challenge-week">Semaine (optionnel)</label>
            <InputNumber id="challenge-week" v-model="challengeForm.week_number" :min="1" :max="53" :use-grouping="false" />
          </div>
          <div class="form-group">
            <label for="challenge-year">Année (optionnel)</label>
            <InputNumber id="challenge-year" v-model="challengeForm.year" :min="2000" :max="2200" :use-grouping="false" />
          </div>
        </div>

        <div class="flex align-items-center gap-2 mt-3">
          <Checkbox id="challenge-active" v-model="challengeForm.is_active" binary />
          <label for="challenge-active">Défi actif</label>
        </div>
      </form>

      <template #footer>
        <Button label="Annuler" class="p-button-text" :disabled="saving" @click="showFormDialog = false" />
        <Button :label="editingChallenge ? 'Enregistrer' : 'Créer le défi'" icon="pi pi-check" :loading="saving" @click="saveChallenge" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showDetailsDialog" header="Détails du défi" :modal="true" :style="{ width: 'min(500px, 95vw)' }">
      <div v-if="detailsChallenge" class="challenge-details">
        <h2 class="text-xl text-900 mt-0">{{ detailsChallenge.name }}</h2>
        <p class="text-600">{{ detailsChallenge.description || 'Aucune description.' }}</p>
        <dl>
          <dt>Action</dt><dd>{{ actionLabel(detailsChallenge.action_type) }}</dd>
          <dt>Objectif</dt><dd>{{ detailsChallenge.target_value }}</dd>
          <dt>Récompense XP</dt><dd>{{ detailsChallenge.xp_reward || 0 }}</dd>
          <dt>Statut</dt><dd>{{ detailsChallenge.is_active ? 'Actif' : 'Inactif' }}</dd>
          <dt>Période</dt><dd>{{ formatDate(detailsChallenge.start_date) }} – {{ formatDate(detailsChallenge.end_date) }}</dd>
          <dt>Semaine / année</dt><dd>{{ detailsChallenge.week_number || '—' }} / {{ detailsChallenge.year || '—' }}</dd>
          <dt>Créé le</dt><dd>{{ formatDate(detailsChallenge.created_at) }}</dd>
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
import adminChallengesService from '@/service/adminChallengesService'

const toast = useToast()
const challenges = ref([])
const badges = ref([])
const loading = ref(true)
const saving = ref(false)
const updatingId = ref(null)
const loadError = ref('')
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedAction = ref(null)
const showFormDialog = ref(false)
const showDetailsDialog = ref(false)
const editingChallenge = ref(null)
const detailsChallenge = ref(null)
const errors = ref({})

const supportedActionOptions = [
  { label: 'Connexion quotidienne', value: 'daily_login' },
  { label: 'Mise à jour du profil', value: 'update_profile' },
  { label: 'Création d’une publication', value: 'create_post' }
]
const actionOptions = [{ label: 'Toutes les actions', value: null }, ...supportedActionOptions]
const statusOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Actifs', value: true },
  { label: 'Inactifs', value: false }
]
const badgeOptions = computed(() => [
  { id: null, name: 'Aucun badge' },
  ...badges.value
])

const emptyForm = () => ({
  name: '',
  description: '',
  action_type: '',
  target_value: 1,
  xp_reward: 0,
  badge_reward: null,
  week_number: null,
  year: null,
  start_date: '',
  end_date: '',
  is_active: true
})
const challengeForm = reactive(emptyForm())

const canCreateChallenges = computed(() => true)
const canEditChallenges = computed(() => true)
const filteredChallenges = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fr')
  return challenges.value.filter((challenge) => {
    const matchesQuery = !query || `${challenge.name} ${challenge.description || ''}`.toLocaleLowerCase('fr').includes(query)
    const matchesStatus = selectedStatus.value === null || challenge.is_active === selectedStatus.value
    const matchesAction = selectedAction.value === null || challenge.action_type === selectedAction.value
    return matchesQuery && matchesStatus && matchesAction
  })
})

const loadChallenges = async () => {
  loading.value = true
  loadError.value = ''
  try {
    challenges.value = await adminChallengesService.getChallenges()
    try {
      badges.value = await adminChallengesService.getActiveBadges()
    } catch (error) {
      console.error('Impossible de charger les badges disponibles:', error)
      badges.value = []
      toast.add({ severity: 'warn', summary: 'Badges indisponibles', detail: 'La liste des défis est chargée, mais les badges ne peuvent pas être sélectionnés.', life: 5000 })
    }
  } catch (error) {
    console.error('Erreur lors du chargement des défis Supabase:', error)
    loadError.value = error.message || 'La requête Supabase sur la table challenges a échoué.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(challengeForm, emptyForm())
  errors.value = {}
  editingChallenge.value = null
}

const openCreateDialog = () => {
  resetForm()
  showFormDialog.value = true
}

const validateForm = () => {
  const validationErrors = {}
  if (!challengeForm.name.trim()) validationErrors.name = 'Le nom du défi est requis.'
  if (!supportedActionOptions.some((action) => action.value === challengeForm.action_type)) {
    validationErrors.action_type = 'Sélectionnez une action prise en charge par le moteur de gamification.'
  }
  if (!Number.isInteger(Number(challengeForm.target_value)) || Number(challengeForm.target_value) < 1) {
    validationErrors.target_value = 'L’objectif doit être un nombre entier supérieur à zéro.'
  }
  if (!Number.isInteger(Number(challengeForm.xp_reward)) || Number(challengeForm.xp_reward) < 0) {
    validationErrors.xp_reward = 'La récompense XP doit être un entier positif ou nul.'
  }
  if (challengeForm.start_date && challengeForm.end_date && challengeForm.end_date < challengeForm.start_date) {
    validationErrors.dates = 'La date de fin doit être égale ou postérieure à la date de début.'
  }
  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

const saveChallenge = async () => {
  if (saving.value || !validateForm()) return
  saving.value = true
  try {
    if (editingChallenge.value) {
      await adminChallengesService.updateChallenge(editingChallenge.value.id, challengeForm)
    } else {
      await adminChallengesService.createChallenge(challengeForm)
    }
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: editingChallenge.value ? 'Défi modifié.' : 'Défi créé dans Supabase.',
      life: 3000
    })
    showFormDialog.value = false
    resetForm()
    await loadChallenges()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du défi Supabase:', error)
    toast.add({ severity: 'error', summary: 'Enregistrement impossible', detail: error.message || 'Vérifiez la connexion, les autorisations RLS et le schéma Supabase.', life: 6000 })
  } finally {
    saving.value = false
  }
}

const editChallenge = (challenge) => {
  editingChallenge.value = challenge
  Object.assign(challengeForm, {
    ...emptyForm(),
    ...challenge,
    name: challenge.name || '',
    description: challenge.description || '',
    start_date: challenge.start_date || '',
    end_date: challenge.end_date || '',
    badge_reward: challenge.badge_reward || null,
    is_active: Boolean(challenge.is_active)
  })
  errors.value = {}
  showFormDialog.value = true
}

const toggleChallenge = async (challenge) => {
  updatingId.value = challenge.id
  try {
    await adminChallengesService.updateChallenge(challenge.id, { ...challenge, is_active: !challenge.is_active })
    toast.add({ severity: 'success', summary: 'Défi mis à jour', detail: challenge.is_active ? 'Le défi a été désactivé.' : 'Le défi a été activé.', life: 3000 })
    await loadChallenges()
  } catch (error) {
    console.error('Erreur lors du changement de statut du défi:', error)
    toast.add({ severity: 'error', summary: 'Mise à jour impossible', detail: error.message || 'Vérifiez vos permissions Supabase.', life: 5000 })
  } finally {
    updatingId.value = null
  }
}

const viewChallengeDetails = (challenge) => {
  detailsChallenge.value = challenge
  showDetailsDialog.value = true
}

const actionLabel = (actionType) => supportedActionOptions.find((option) => option.value === actionType)?.label || actionType || 'Action inconnue'
const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR')
}

onMounted(loadChallenges)
</script>

<style scoped>
.challenge-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.challenge-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.challenge-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.challenge-details dl {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 2fr;
  gap: 0.75rem;
}

.challenge-details dt {
  font-weight: 600;
}

.challenge-details dd {
  margin: 0;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
