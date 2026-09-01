<template>
  <AdminLayout>
    <div class="validation-pfp-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Validation PFP</h1>
              <p class="text-600 m-0 mt-1">Validation des stages PFP</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter PDF" outlined />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" outlined />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-map-marker text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.totalPlaces }}</h3>
                <p class="text-600 m-0">Places Totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.validated }}</h3>
                <p class="text-600 m-0">Validées</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.failed }}</h3>
                <p class="text-600 m-0">Échecs</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-pause text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.stopped }}</h3>
                <p class="text-600 m-0">Arrêts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-2 flex align-items-center gap-2">
            <InputSwitch v-model="showAllStudents" />
            <span class="text-600">Tous les étudiants</span>
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterType" :options="typesPFP" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Classe" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterStatus" :options="statusList" optionLabel="label" optionValue="value" placeholder="Résultat" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Validation PFP -->
      <div class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-end gap-2 mb-3 flex-wrap">
          <div class="flex flex-column gap-1">
            <label class="text-sm font-semibold text-700">Validation en masse</label>
            <Dropdown
              v-model="bulkValidatePfpType"
              :options="typesPFP"
              optionLabel="label"
              optionValue="value"
              placeholder="Choisir un PFP"
              class="w-12rem"
            />
          </div>
          <Button
            icon="pi pi-check"
            label="Valider tout ce PFP"
            severity="success"
            @click="bulkValidateSelectedPfp"
            :disabled="!canBulkValidate"
            :loading="bulkValidating"
          />
          <span class="text-xs" :class="canBulkValidate ? 'text-500' : 'text-orange-600'">
            {{ canBulkValidate ? 'Applique la validation aux lignes actuellement filtrées' : bulkValidationLockMessage }}
          </span>
        </div>

        <div class="surface-ground border-round border-1 surface-border p-3 mb-3">
          <div class="flex justify-content-between align-items-center mb-2">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list text-primary"></i>
              <span class="font-semibold text-900">Historique des actions admin</span>
              <Tag :value="adminActionHistory.length" severity="secondary" rounded />
            </div>
            <Button icon="pi pi-trash" text size="small" label="Vider" @click="clearAdminActionHistory" :disabled="adminActionHistory.length === 0" />
          </div>
          <div v-if="adminActionHistory.length === 0" class="text-600 text-sm">Aucune action enregistrée pour ce contexte.</div>
          <div v-else class="flex flex-column gap-2">
            <div v-for="entry in adminActionHistory.slice(0, 10)" :key="entry.id" class="p-2 border-round border-1 surface-border bg-white">
              <div class="flex justify-content-between align-items-center gap-2">
                <span class="font-semibold text-900">{{ entry.action }}</span>
                <span class="text-xs text-500">{{ formatActionDate(entry.at) }}</span>
              </div>
              <div class="text-sm text-700 mt-1">{{ entry.detail }}</div>
            </div>
          </div>
        </div>

        <DataTable :value="filteredPlacesList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="25">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Validations</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune validation trouvée</p>
            </div>
          </template>
          <Column field="student_name" header="Étudiant" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="(slotProps.data.student_name || '').charAt(0)" shape="circle" />
                <span>{{ slotProps.data.student_name }}</span>
              </div>
            </template>
          </Column>
          <Column field="student_class" header="Classe" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.student_class" :value="slotProps.data.student_class" severity="info" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="year" header="Année" sortable></Column>
          <Column field="pfp_type" header="PFP" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.pfp_type" :value="slotProps.data.pfp_type" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="place_name" header="Place attribuée" sortable></Column>
          <Column field="institution_name" header="Institution" sortable></Column>
          <Column field="praticien_formateur" header="Praticien formateur" sortable></Column>
          
          <!-- Checkboxes de validation -->
          <Column header="Résultat PFP" style="min-width: 430px;">
            <template #body="slotProps">
              <div class="pfp-outcome-editor flex flex-column gap-2">
                <SelectButton
                  v-model="slotProps.data._outcomeDraft"
                  :options="PFP_OUTCOME_OPTIONS"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                  :disabled="slotProps.data._outcomeSaving || !slotProps.data.id"
                  :aria-label="`Résultat PFP de ${slotProps.data.student_name}`"
                />
                <Textarea
                  v-if="slotProps.data._outcomeDraft === PFP_OUTCOMES.STOPPED"
                  v-model="slotProps.data._outcomeComment"
                  rows="2"
                  maxlength="2000"
                  placeholder="Motif obligatoire de l'arrêt"
                  :disabled="slotProps.data._outcomeSaving"
                  :aria-label="`Motif de l'arrêt de ${slotProps.data.student_name}`"
                  class="w-full"
                />
                <small v-if="!slotProps.data.id" class="text-orange-600">
                  Aucune affectation ne peut être modifiée sur cette ligne.
                </small>
                <small v-if="slotProps.data._outcomeError" class="text-red-600" role="alert">
                  {{ slotProps.data._outcomeError }}
                </small>
                <small v-else-if="slotProps.data._outcomeSaved" class="text-green-600" role="status">
                  Résultat enregistré.
                </small>
                <div v-if="isOutcomeDirty(slotProps.data)" class="flex gap-2">
                  <Button
                    label="Enregistrer"
                    icon="pi pi-save"
                    size="small"
                    :loading="slotProps.data._outcomeSaving"
                    @click="saveOutcomeRow(slotProps.data)"
                  />
                  <Button
                    label="Annuler"
                    icon="pi pi-undo"
                    size="small"
                    outlined
                    :disabled="slotProps.data._outcomeSaving"
                    @click="resetOutcomeDraft(slotProps.data)"
                  />
                </div>
              </div>
            </template>
          </Column>

        </DataTable>

        <div class="flex justify-content-end mt-3">
          <Button icon="pi pi-file-excel" label="Exporter Excel" severity="success" outlined @click="exportExcel" />
        </div>
      </div>
    </div>

  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentDirectoryService'
import { savePfpOutcome } from '@/service/pfpOutcomeApi'
import {
  PFP_OUTCOMES,
  PFP_OUTCOME_OPTIONS,
  buildPfpOutcomePayload,
  createPfpOutcomeDraft,
  getPfpOutcome,
  hasPfpOutcomeChanged,
  validatePfpOutcome
} from '@/service/pfpOutcomeService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'

const loading = ref(false)
const searchQuery = ref('')
const filterType = ref(null)
const filterYear = ref(null)
const filterClasse = ref(null)
const filterStatus = ref(null)
const placesList = ref([])
const allStudents = ref([])
const showAllStudents = ref(false)
const bulkValidatePfpType = ref(null)
const bulkValidating = ref(false)
const adminActionHistory = ref([])

const canBulkValidate = computed(() => {
  return !!filterYear.value && !!bulkValidatePfpType.value
})

const bulkValidationLockMessage = computed(() => {
  const missing = []
  if (!filterYear.value) missing.push('Année')
  if (!bulkValidatePfpType.value) missing.push('PFP')
  return `Sélection requise: ${missing.join(' + ')}`
})

const adminActionStorageKey = computed(() => {
  const year = filterYear.value || 'none'
  const pfp = bulkValidatePfpType.value || filterType.value || 'none'
  return `pfp-admin-actions:validation:${year}:${pfp}`
})

const loadAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(adminActionStorageKey.value)
    if (!raw) {
      adminActionHistory.value = []
      return
    }
    const parsed = JSON.parse(raw)
    adminActionHistory.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    adminActionHistory.value = []
  }
}

const saveAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(adminActionStorageKey.value, JSON.stringify(adminActionHistory.value))
  } catch (error) {
    // ignore localStorage write errors
  }
}

const addAdminAction = (action, detail) => {
  adminActionHistory.value = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      action,
      detail
    },
    ...adminActionHistory.value
  ].slice(0, 80)
}

const clearAdminActionHistory = () => {
  adminActionHistory.value = []
}

const formatActionDate = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const years = computed(() => [...new Set((placesList.value || []).map(row => row.year).filter(Boolean))].sort())
const classes = computed(() => [...new Set((allStudents.value || []).map(getStudentClass).filter(Boolean))].sort())
const typesPFP = ref([
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const rows = (filteredPlacesList.value || []).map((r) => ({
    etudiant: r.student_name || '',
    classe: r.student_class || '',
    annee: r.year || '',
    pfp: r.pfp_type || '',
    place: r.place_name || '',
    institution: r.institution_name || '',
    praticien_formateur: r.praticien_formateur || '',
    pfp_validee: r.pfp_validee ? 'Oui' : 'Non',
    pfp_echec: r.pfp_echec ? 'Oui' : 'Non',
    pfp_arret: r.pfp_arret ? 'Oui' : 'Non',
    commentaire_arret: r.commentaire_arret || ''
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'validations')

  const nameParts = ['validations']
  if (filterYear.value) nameParts.push(filterYear.value)
  if (filterType.value) nameParts.push(filterType.value)
  if (filterClasse.value) nameParts.push(filterClasse.value)
  const filename = `${nameParts.join('_')}.xlsx`

  XLSX.writeFile(wb, filename)
}

watch(showAllStudents, (val) => {
  void val
  filterStatus.value = null
})

watch(adminActionStorageKey, () => {
  loadAdminActionHistory()
}, { immediate: true })

watch(adminActionHistory, () => {
  saveAdminActionHistory()
}, { deep: true })

const statusList = ref([
  ...PFP_OUTCOME_OPTIONS,
  { label: 'Tous', value: null }
])

const stats = ref({
  totalPlaces: 0,
  validated: 0,
  failed: 0,
  stopped: 0
})

const getVotationTypeLabel = (assignment) => {
  if (!assignment) return 'Tirage aléatoire'
  if (assignment.assigned_rank && assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) {
    return `Choix ${assignment.assigned_rank}`
  }
  return 'Tirage aléatoire'
}

const getStudentName = (s) => {
  const studentNom = s?.Nom || s?.nom || s?.family_name || ''
  const studentPrenom = s?.Prenom || s?.prenom || s?.forname || ''
  return s?.display_name || `${studentNom.toUpperCase()} ${studentPrenom}`.trim() || 'N/A'
}

const getStudentClass = (s) => {
  return s?.Classe || s?.classe || s?.class || null
}

const getPraticienFullName = (p) => {
  if (!p) return ''
  const prenom = p.prenom || p.Prenom || ''
  const nom = p.nom || p.Nom || ''
  return `${prenom} ${nom}`.trim()
}

const initializeOutcomeState = (row) => {
  const draft = createPfpOutcomeDraft(row)
  return {
    ...row,
    _outcomeDraft: draft.outcome,
    _outcomeComment: draft.comment,
    _outcomeSaving: false,
    _outcomeError: getPfpOutcome(row) === PFP_OUTCOMES.INVALID
      ? 'Cette ancienne ligne contient plusieurs résultats. Choisissez le bon résultat puis enregistrez.'
      : '',
    _outcomeSaved: false
  }
}

const isOutcomeDirty = (row) => hasPfpOutcomeChanged(row, {
  outcome: row._outcomeDraft,
  comment: row._outcomeComment
})

const resetOutcomeDraft = (row) => {
  const draft = createPfpOutcomeDraft(row)
  row._outcomeDraft = draft.outcome === PFP_OUTCOMES.INVALID ? PFP_OUTCOMES.PENDING : draft.outcome
  row._outcomeComment = draft.comment
  row._outcomeError = ''
  row._outcomeSaved = false
}

const applySavedOutcome = (row, outcome, comment, saved = {}) => {
  const canonical = buildPfpOutcomePayload(outcome, comment)
  Object.assign(row, canonical, saved)
  row._outcomeDraft = outcome
  row._outcomeComment = canonical.commentaire_arret
  row._outcomeError = ''
  row._outcomeSaved = true
}

const saveOutcomeRow = async (row, options = {}) => {
  if (!row?.id || row._outcomeSaving) return false

  const validation = validatePfpOutcome(row._outcomeDraft, row._outcomeComment)
  if (!validation.valid) {
    row._outcomeError = validation.message
    row._outcomeSaved = false
    return false
  }

  row._outcomeSaving = true
  row._outcomeError = ''
  row._outcomeSaved = false
  try {
    const saved = await savePfpOutcome(row.id, row._outcomeDraft, row._outcomeComment)
    applySavedOutcome(row, row._outcomeDraft, row._outcomeComment, saved)
    updateStats()
    if (!options.silentHistory) {
      const label = PFP_OUTCOME_OPTIONS.find(option => option.value === row._outcomeDraft)?.label
      addAdminAction('Résultat PFP', `${row.student_name} · ${row.pfp_type} · ${label}`)
    }
    return true
  } catch (error) {
    row._outcomeError = error?.message || "Le résultat n'a pas pu être enregistré."
    return false
  } finally {
    row._outcomeSaving = false
  }
}

const bulkValidateSelectedPfp = async () => {
  if (!bulkValidatePfpType.value || bulkValidating.value) return

  const eligibleRows = filteredPlacesList.value.filter(row =>
    row?.id &&
    row?.assigned_place_id &&
    row?.pfp_type === bulkValidatePfpType.value
  )

  const targetRows = eligibleRows.filter(row =>
    !row.pfp_validee || row.pfp_echec || row.pfp_arret || !!row.commentaire_arret
  )

  if (eligibleRows.length === 0) {
    window.alert(`Aucune ligne attribuée à valider pour ${bulkValidatePfpType.value} avec les filtres actuels.`)
    return
  }

  if (targetRows.length === 0) {
    window.alert(`Toutes les lignes ${bulkValidatePfpType.value} sont déjà validées.`)
    return
  }

  const confirmed = window.confirm(
    `Valider ${targetRows.length} ligne(s) pour ${bulkValidatePfpType.value} ?\n` +
    `${eligibleRows.length - targetRows.length} ligne(s) déjà conformes ne seront pas modifiées.`
  )
  if (!confirmed) return

  bulkValidating.value = true
  try {
    for (const row of targetRows) {
      row._outcomeDraft = PFP_OUTCOMES.PASSED
      row._outcomeComment = ''
      const saved = await saveOutcomeRow(row, { silentHistory: true })
      if (!saved) throw new Error(row._outcomeError || `Échec pour ${row.student_name}`)
    }

    updateStats()
    addAdminAction('Validation en masse', `${targetRows.length} ligne(s) validée(s) pour ${bulkValidatePfpType.value} (${filterYear.value || 'année non précisée'})`)
  } catch (error) {
    console.error('Erreur validation en masse:', error)
    window.alert(error?.message || "La validation en masse n'a pas pu être terminée.")
  } finally {
    bulkValidating.value = false
  }
}

const updateStats = () => {
  const rows = placesList.value || []
  stats.value = {
    totalPlaces: rows.length,
    validated: rows.filter(r => r.pfp_validee).length,
    failed: rows.filter(r => r.pfp_echec).length,
    stopped: rows.filter(r => r.pfp_arret).length
  }
}

const baseRows = computed(() => {
  const assignedOnly = (placesList.value || []).filter(r => r?.assigned_place_id)

  if (!showAllStudents.value) {
    return assignedOnly
  }

  const out = []
  const assignedByUser = new Map()
  ;(placesList.value || []).forEach(r => {
    if (!r?.user_id) return
    const list = assignedByUser.get(r.user_id) || []
    list.push(r)
    assignedByUser.set(r.user_id, list)
  })

  ;(allStudents.value || []).forEach(s => {
    const userId = s?.user_id || s?.id
    const candidates = (assignedByUser.get(userId) || []).filter(r => {
      if (filterYear.value && r.year !== filterYear.value) return false
      if (filterType.value && r.pfp_type !== filterType.value) return false
      return true
    })

    const assignment = candidates[0] || null
    out.push(initializeOutcomeState({
      user_id: userId,
      student_name: getStudentName(s),
      student_class: getStudentClass(s),
      year: assignment?.year || filterYear.value || null,
      pfp_type: assignment?.pfp_type || filterType.value || null,
      votation_type: assignment ? getVotationTypeLabel(assignment) : '-',
      assigned_place_id: assignment?.assigned_place_id || null,
      place_name: assignment?.place_name || '—',
      institution_name: assignment?.institution_name || '—',
      praticien_formateur: assignment?.praticien_formateur || '—',
      status: assignment?.status || 'unassigned',
      place: assignment?.place || null,
      _is_unassigned: !assignment,
      pfp_validee: assignment?.pfp_validee || false,
      pfp_echec: assignment?.pfp_echec || false,
      pfp_arret: assignment?.pfp_arret || false,
      commentaire_arret: assignment?.commentaire_arret || ''
    }))
  })

  return out
})

const filteredPlacesList = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  let filtered = (baseRows.value || []).filter((row) => {
    if (filterYear.value && row.year !== filterYear.value) return false
    if (filterType.value && row.pfp_type !== filterType.value) return false
    if (filterClasse.value && row.student_class !== filterClasse.value) return false
    if (filterStatus.value && getPfpOutcome(row) !== filterStatus.value) return false
    if (!q) return true
    return (
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.place_name || '').toLowerCase().includes(q) ||
      (row.institution_name || '').toLowerCase().includes(q)
    )
  })
  
  // Trier par ordre alphabétique du nom de famille puis prénom
  return filtered.sort((a, b) => {
    // Extraire le nom de famille et prénom en gérant le format avec initiale
    const splitName = (fullName) => {
      if (!fullName) return { lastName: '', firstName: '' }
      
      // Gérer le format "S Samira" (initiale + espace + nom)
      const trimmed = fullName.trim()
      const parts = trimmed.split(' ')
      
      // Si le premier élément est une seule lettre, l'ignorer pour le tri
      if (parts.length > 1 && parts[0].length === 1) {
        const restName = parts.slice(1).join(' ')
        const restParts = restName.split(' ')
        if (restParts.length === 1) {
          return { lastName: restParts[0], firstName: '' }
        }
        return {
          lastName: restParts[restParts.length - 1] || '',
          firstName: restParts.slice(0, -1).join(' ') || ''
        }
      }
      
      // Format normal "Prénom Nom"
      if (parts.length === 1) {
        return { lastName: parts[0], firstName: '' }
      }
      return initializeOutcomeState({
        lastName: parts[parts.length - 1] || '',
        firstName: parts.slice(0, -1).join(' ') || ''
      })
    }
    
    const nameA = splitName(a.student_name)
    const nameB = splitName(b.student_name)
    
    // D'abord comparer le nom de famille
    const lastNameCompare = nameA.lastName.localeCompare(nameB.lastName, 'fr')
    if (lastNameCompare !== 0) return lastNameCompare
    
    // Si même nom de famille, comparer le prénom
    return nameA.firstName.localeCompare(nameB.firstName, 'fr')
  })
})

const loadPublishedAssignments = async () => {
  loading.value = true
  try {
    const { data: assignments, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('status', 'published')

    if (error) throw error

    const students = await getAllStudents()
    allStudents.value = students || []
    const studentsById = new Map((students || []).map(s => [s.user_id || s.id, s]))

    const placeIds = Array.from(
      new Set((assignments || []).map(a => a.assigned_place_id).filter(Boolean))
    )

    const placesById = new Map()
    const institutionsById = new Map()
    const praticiensById = new Map()
    if (placeIds.length > 0) {
      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('PlaceId,NomPlace,InstitutionName,InstitutionId,praticiensFormateurs,PFP1A,PFP1B,PFP2,PFP3,PFP4')
        .in('PlaceId', placeIds)

      if (placesError) throw placesError
      ;(places || []).forEach(p => placesById.set(p.PlaceId, p))

      const institutionIds = Array.from(
        new Set((places || []).map(p => p?.InstitutionId).filter(Boolean))
      )

      if (institutionIds.length > 0) {
        const { data: insts, error: instsError } = await supabase
          .from('institutions')
          .select('InstitutionId,Name')
          .in('InstitutionId', institutionIds)

        if (instsError) throw instsError
        ;(insts || []).forEach(i => {
          if (i?.InstitutionId) institutionsById.set(i.InstitutionId, i?.Name || '')
        })
      }
    }

    const { data: praticiens, error: praticiensError } = await supabase
      .from('praticiens_formateurs')
      .select('*')

    if (praticiensError) throw praticiensError
    ;(praticiens || []).forEach(p => {
      const id = p?.id ?? p?.PraticienId
      if (id === undefined || id === null) return
      praticiensById.set(String(id), getPraticienFullName(p))
      praticiensById.set(Number(id), getPraticienFullName(p))
    })

    placesList.value = (assignments || []).map(a => {
      const s = studentsById.get(a.user_id) || null
      const studentName = getStudentName(s)
      const studentClass = getStudentClass(s)

      const place = placesById.get(a.assigned_place_id) || null
      const placeName = place?.NomPlace || 'N/A'
      const institutionName =
        place?.InstitutionName ||
        place?.Institution_name ||
        place?.institution_name ||
        (place?.InstitutionId ? (institutionsById.get(place.InstitutionId) || null) : null)

      const assignedPraticienId = a?.assigned_praticien_id
      const praticienNameFromAssignment = assignedPraticienId
        ? (praticiensById.get(assignedPraticienId) || praticiensById.get(String(assignedPraticienId)) || null)
        : null

      const praticiensList = Array.isArray(place?.praticiensFormateurs) ? place.praticiensFormateurs : []
      const praticienNameFromPlace = praticiensList.length
        ? praticiensList
            .map((pid) => praticiensById.get(pid) || praticiensById.get(String(pid)) || String(pid))
            .filter(Boolean)
            .join(', ')
        : null

      const praticienFormateur = praticienNameFromAssignment || praticienNameFromPlace || null

      return {
        ...a,
        student_name: studentName,
        student_class: studentClass,
        votation_type: getVotationTypeLabel(a),
        place_name: placeName,
        institution_name: institutionName,
        praticien_formateur: praticienFormateur,
        place,
        pfp_validee: a.pfp_validee || false,
        pfp_echec: a.pfp_echec || false,
        pfp_arret: a.pfp_arret || false,
        commentaire_arret: a.commentaire_arret || ''
      }
    })

    updateStats()
  } catch (e) {
    console.error('Erreur loadPublishedAssignments:', e)
    placesList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  filterStatus.value = null
  await loadPublishedAssignments()
})
</script>

<style scoped>
.validation-pfp-page {
  min-height: calc(100vh - 100px);
}

.pfp-outcome-editor :deep(.p-selectbutton) {
  display: flex;
  flex-wrap: wrap;
}

.pfp-outcome-editor :deep(.p-button) {
  min-height: 2.5rem;
}
</style>
