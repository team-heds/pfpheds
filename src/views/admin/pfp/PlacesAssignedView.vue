<template>
  <AdminLayout>
    <Toast />
    <div class="places-assigned-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map-marker text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Places Assignées</h1>
              <p class="text-600 m-0 mt-1">Vue d'ensemble et gestion des assignations de stages par PFP</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <Dropdown v-model="selectedYear" :options="yearOptions" placeholder="Année" class="w-8rem" />
            <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadAllData" :loading="loading" v-tooltip="'Rafraîchir'" />
            <Button icon="pi pi-file-excel" label="Export Excel" severity="success" outlined class="p-button-sm" @click="exportExcel" />
          </div>
        </div>
      </div>

      <!-- Onglets PFP -->
      <div class="surface-card border-round shadow-2 mb-4">
        <div class="flex flex-wrap border-bottom-1 surface-border">
          <button
            v-for="tab in pfpTabs"
            :key="tab.value"
            class="pfp-tab px-4 py-3 font-semibold cursor-pointer border-none bg-transparent text-600"
            :class="{ 'pfp-tab-active': selectedPFP === tab.value }"
            @click="selectedPFP = tab.value"
          >
            {{ tab.label }}
            <Badge v-if="getTabCount(tab.value) > 0" :value="getTabCount(tab.value)" severity="info" class="ml-2" />
          </button>
        </div>

        <!-- Statistiques du PFP sélectionné -->
        <div class="p-3">
          <div class="flex flex-wrap gap-3">
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-users text-blue-500"></i>
              <span class="text-600 text-sm">Étudiants:</span>
              <span class="font-bold text-900">{{ currentStats.totalStudents }}</span>
            </div>
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-check-circle text-green-500"></i>
              <span class="text-600 text-sm">Assignés:</span>
              <span class="font-bold text-green-600">{{ currentStats.assigned }}</span>
            </div>
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-clock text-orange-500"></i>
              <span class="text-600 text-sm">Non assignés:</span>
              <span class="font-bold text-orange-600">{{ currentStats.unassigned }}</span>
            </div>
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-building text-purple-500"></i>
              <span class="text-600 text-sm">Places proposées:</span>
              <span class="font-bold text-purple-600">{{ currentStats.offeredPlaces }}</span>
            </div>
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-star text-yellow-600"></i>
              <span class="text-600 text-sm">Prioritaires:</span>
              <span class="font-bold text-yellow-700">{{ currentStats.priorityCount }}</span>
            </div>
            <div class="flex align-items-center gap-2 px-3 py-2 border-round surface-100">
              <i class="pi pi-send text-cyan-500"></i>
              <span class="text-600 text-sm">Publiés:</span>
              <span class="font-bold text-cyan-600">{{ currentStats.published }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="flex flex-wrap gap-3 align-items-center">
          <span class="p-input-icon-left flex-1" style="min-width: 200px">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher un étudiant, une place..." class="w-full" />
          </span>
          <Dropdown v-model="filterClasse" :options="classesList" placeholder="Classe" class="w-8rem" showClear />
          <Dropdown v-model="filterSource" :options="sourceOptions" optionLabel="label" optionValue="value" placeholder="Source" class="w-10rem" showClear />
          <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Statut" class="w-10rem" showClear />
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="showAllStudents" />
            <span class="text-600 text-sm white-space-nowrap">Tous les étudiants</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="surface-card p-5 border-round shadow-2 text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <p class="text-600">Chargement des données...</p>
      </div>

      <!-- Table -->
      <div v-else class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredRows"
          :paginator="true"
          :rows="30"
          :rowsPerPageOptions="[20, 30, 50, 100]"
          responsiveLayout="scroll"
          stripedRows
          sortField="student_sort_name"
          :sortOrder="1"
          :rowClass="rowClass"
        >
          <template #header>
            <div class="flex align-items-center justify-content-between">
              <span class="text-lg font-bold text-900">
                {{ selectedPFPLabel }} — {{ selectedYear }} 
                <span class="text-sm font-normal text-500">({{ filteredRows.length }} lignes)</span>
              </span>
            </div>
          </template>

          <template #empty>
            <div class="text-center p-5">
              <i class="pi pi-inbox text-5xl text-400 mb-3"></i>
              <p class="text-600">Aucun résultat pour {{ selectedPFPLabel }} — {{ selectedYear }}</p>
            </div>
          </template>

          <Column field="student_sort_name" header="Étudiant" sortable :style="{ minWidth: '200px' }">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <Avatar :label="(data.student_name || '?').charAt(0)" shape="circle" size="small" />
                <div>
                  <div class="font-semibold">{{ data.student_name }}</div>
                  <div v-if="data.student_class" class="text-xs text-500">{{ data.student_class }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="source_label" header="Source" sortable :style="{ width: '160px' }">
            <template #body="{ data }">
              <Tag :value="data.source_label" :severity="data.source_severity" :icon="data.source_icon" />
            </template>
          </Column>

          <Column field="assigned_place_name" header="Place attribuée" sortable :style="{ minWidth: '200px' }">
            <template #body="{ data }">
              <div v-if="data.assigned_place_id">
                <div class="font-semibold">{{ data.assigned_place_name }}</div>
                <small class="text-500">{{ data.assigned_institution_name }}</small>
              </div>
              <span v-else class="text-400 font-italic">Non assigné</span>
            </template>
          </Column>

          <Column field="praticien_display" header="Praticien formateur" sortable :style="{ minWidth: '180px' }">
            <template #body="{ data }">
              <span v-if="data.praticien_display">{{ data.praticien_display }}</span>
              <span v-else class="text-400">—</span>
            </template>
          </Column>

          <Column field="rank_label" header="Critères" sortable :style="{ width: '150px', textAlign: 'center' }">
            <template #body="{ data }">
              <Tag v-if="data.assigned_rank === 99" value="Hors choix" severity="danger" icon="pi pi-exclamation-triangle" />
              <Tag v-else-if="data.assigned_rank >= 1" :value="`${data.assigned_rank} crit. couvert${data.assigned_rank > 1 ? 's' : ''}`" :severity="getCritSeverity(data.assigned_rank)" icon="pi pi-check-circle" />
              <Tag v-else-if="data.assigned_rank === 0 && data.assigned_place_id" value="0 critère" severity="warning" icon="pi pi-exclamation-circle" />
              <span v-else class="text-400">—</span>
            </template>
          </Column>

          <Column field="status" header="Statut" sortable :style="{ width: '130px' }">
            <template #body="{ data }">
              <Tag v-if="data.status === 'published'" value="Publié" severity="success" icon="pi pi-check" />
              <Tag v-else-if="data.status === 'draft'" value="Brouillon" severity="warning" icon="pi pi-clock" />
              <Tag v-else-if="data.status === 'manual'" value="Manuel" severity="info" icon="pi pi-pencil" />
              <Tag v-else value="Non assigné" severity="secondary" />
            </template>
          </Column>

          <Column header="Actions" :style="{ width: '180px', textAlign: 'center' }">
            <template #body="{ data }">
              <div class="flex gap-1 justify-content-center">
                <Button
                  v-if="!data.assigned_place_id"
                  icon="pi pi-plus"
                  label="Assigner"
                  severity="success"
                  text
                  size="small"
                  @click="openAssignDialog(data)"
                  v-tooltip.top="'Assigner manuellement une place'"
                />
                <Button
                  v-if="data.assigned_place_id"
                  icon="pi pi-pencil"
                  severity="info"
                  text
                  size="small"
                  @click="openAssignDialog(data)"
                  v-tooltip.top="'Modifier la place'"
                />
                <Button
                  v-if="data.assigned_place_id && data.status !== 'published'"
                  icon="pi pi-check-circle"
                  severity="success"
                  text
                  size="small"
                  @click="publishOne(data)"
                  v-tooltip.top="'Publier'"
                />
                <Button
                  v-if="data.status === 'published'"
                  icon="pi pi-times-circle"
                  severity="warning"
                  text
                  size="small"
                  @click="unpublishOne(data)"
                  v-tooltip.top="'Dépublier'"
                />
                <Button
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  size="small"
                  @click="viewProfile(data)"
                  v-tooltip.top="'Voir profil'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog d'assignation manuelle -->
      <Dialog
        v-model:visible="assignDialogVisible"
        modal
        :header="assignDialogTitle"
        :style="{ width: '55rem' }"
      >
        <div v-if="editingRow">
          <div class="mb-4 p-3 surface-100 border-round">
            <div class="flex align-items-center gap-3">
              <Avatar :label="(editingRow.student_name || '?').charAt(0)" shape="circle" />
              <div>
                <div class="text-lg font-bold">{{ editingRow.student_name }}</div>
                <div class="text-sm text-500">{{ editingRow.student_class }} — {{ selectedPFPLabel }} {{ selectedYear }}</div>
              </div>
            </div>
          </div>

          <div v-if="editingRow.assigned_place_id" class="mb-3">
            <label class="block mb-2 font-semibold text-600">Place actuelle</label>
            <div class="p-3 border-1 surface-border border-round">
              <div class="font-semibold">{{ editingRow.assigned_place_name }}</div>
              <small class="text-500">{{ editingRow.assigned_institution_name }}</small>
            </div>
          </div>

          <Divider />

          <div class="mb-3">
            <label class="block mb-2 font-semibold">Rechercher une place</label>
            <InputText v-model="placeSearch" placeholder="Nom de la place ou institution..." class="w-full" />
          </div>

          <div class="places-selection-list" style="max-height: 400px; overflow-y: auto;">
            <div v-if="filteredPlacesForAssign.length === 0" class="text-center p-4 text-500">
              Aucune place trouvée pour {{ selectedPFPLabel }}
            </div>
            <div
              v-for="place in filteredPlacesForAssign"
              :key="place.PlaceId"
              class="place-option p-3 mb-2 border-round cursor-pointer"
              :class="{ 'selected-place': selectedPlace?.PlaceId === place.PlaceId }"
              @click="selectedPlace = place"
            >
              <div class="flex align-items-center justify-content-between">
                <div class="flex-1">
                  <div class="font-semibold">{{ place.NomPlace || 'Place sans nom' }}</div>
                  <div class="text-sm text-500 mt-1">{{ place.InstitutionName || place.Institution_name || 'Institution inconnue' }}</div>
                  <div class="flex gap-2 mt-1">
                    <Tag v-if="place._capacity" :value="`Capacité: ${place._capacity}`" severity="info" class="text-xs" />
                    <Tag v-if="place._assigned" :value="`Assignés: ${place._assigned}`" :severity="place._assigned >= place._capacity ? 'danger' : 'success'" class="text-xs" />
                  </div>
                </div>
                <i v-if="selectedPlace?.PlaceId === place.PlaceId" class="pi pi-check-circle text-3xl text-primary"></i>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Annuler" severity="secondary" @click="assignDialogVisible = false" />
          <Button
            label="Enregistrer"
            severity="success"
            icon="pi pi-check"
            @click="saveAssignment"
            :disabled="!selectedPlace"
            :loading="saving"
          />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Dropdown from 'primevue/dropdown'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

// ── État global ──
const loading = ref(false)
const saving = ref(false)
const selectedYear = ref('2026')
const selectedPFP = ref('PFP1')
const searchQuery = ref('')
const filterClasse = ref(null)
const filterSource = ref(null)
const filterStatus = ref(null)
const showAllStudents = ref(true)

// ── Données brutes ──
const allStudents = ref([])
const allAssignments = ref([])
const allPlaces = ref([])
const allPraticiens = ref([])
const allPrioritySessions = ref([])

// ── Dialog d'assignation ──
const assignDialogVisible = ref(false)
const editingRow = ref(null)
const selectedPlace = ref(null)
const placeSearch = ref('')

// ── Options ──
const yearOptions = ref(['2025', '2026', '2027'])
const classesList = ref(['BA23', 'BA24', 'BA25', 'BA26'])

const pfpTabs = [
  { label: 'PFP 1', value: 'PFP1' },
  { label: 'PFP 2', value: 'PFP2' },
  { label: 'PFP 3', value: 'PFP3' },
  { label: 'PFP 4', value: 'PFP4' }
]

const sourceOptions = [
  { label: 'Prioritaire', value: 'priority' },
  { label: 'Votation', value: 'votation' },
  { label: 'Algorithme', value: 'algorithm' },
  { label: 'Aléatoire', value: 'random' },
  { label: 'Manuel', value: 'manual' },
  { label: 'Non assigné', value: 'none' }
]

const statusOptions = [
  { label: 'Publié', value: 'published' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Non assigné', value: 'unassigned' }
]

// ── Helpers ──
const normalizePfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
const dbPfpTypes = (pfp) => pfp === 'PFP1' ? ['PFP1A', 'PFP1B'] : [pfp]
const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

const getPropositionFieldsForPfp = (pfp) => {
  if (pfp === 'PFP1') return ['pfp1a_proposition', 'pfp1b_proposition']
  return [`${pfp.toLowerCase()}_proposition`]
}

const getPropositionCapacityForPlace = (place, pfp, year) => {
  const yearKeys = getAcademicYearKeys(year)
  const propositionFields = getPropositionFieldsForPfp(pfp)
  let total = 0

  propositionFields.forEach((field) => {
    const proposition = place?.[field]
    if (!proposition) return

    yearKeys.some((yearKey) => {
      const raw = proposition?.[yearKey]
      const parsed = parseInt(raw, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) return false
      total += parsed
      return true
    })
  })

  return total
}

const selectedPFPLabel = computed(() => pfpTabs.find(t => t.value === selectedPFP.value)?.label || selectedPFP.value)

const getStudentName = (s) => {
  if (!s) return 'N/A'
  const nom = s.Nom || s.nom || s.family_name || ''
  const prenom = s.Prenom || s.prenom || s.forname || ''
  return s.display_name || `${nom.toUpperCase()} ${prenom}`.trim() || 'N/A'
}

const getStudentClass = (s) => s?.Classe || s?.classe || s?.class || null

const getStudentSortName = (s) => {
  if (!s) return 'zzz'
  const nom = s.Nom || s.nom || s.family_name || ''
  const prenom = s.Prenom || s.prenom || s.forname || ''
  return `${nom} ${prenom}`.trim().toLowerCase()
}

const getPraticienFullName = (p) => {
  if (!p) return ''
  const prenom = p.prenom || p.Prenom || ''
  const nom = p.nom || p.Nom || ''
  return `${prenom} ${nom}`.trim()
}

const getRankSeverity = (rank) => {
  if (rank === 1) return 'success'
  if (rank === 2) return 'info'
  if (rank === 3) return 'warning'
  return 'secondary'
}

const getCritSeverity = (count) => {
  if (count >= 3) return 'success'
  if (count >= 2) return 'info'
  if (count >= 1) return 'warning'
  return 'danger'
}

const rowClass = (data) => {
  if (!data.assigned_place_id) return 'row-unassigned'
  return ''
}

// ── Déterminer la source d'une assignation ──
const getSource = (assignment) => {
  if (!assignment) return { label: 'Non assigné', severity: 'secondary', icon: 'pi pi-minus', key: 'none' }
  
  const notes = (assignment.notes || '').toLowerCase()
  const isPriorityFromNotes = notes.includes('priorit')
  const isAlgorithmFromNotes = notes.includes('algorith')

  if (notes.includes('manuel') || notes.includes('manual assignment')) {
    return { label: 'Manuel', severity: 'info', icon: 'pi pi-pencil', key: 'manual' }
  }
  if (assignment.assigned_rank === 99) {
    return { label: 'Aléatoire', severity: 'danger', icon: 'pi pi-question-circle', key: 'random' }
  }
  if (isPriorityFromNotes) {
    return { label: 'Prioritaire', severity: 'warning', icon: 'pi pi-star', key: 'priority' }
  }
  if (assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) {
    return { label: 'Votation', severity: 'success', icon: 'pi pi-check', key: 'votation' }
  }
  if (isAlgorithmFromNotes || assignment.assigned_place_id) {
    return { label: 'Algorithme', severity: 'info', icon: 'pi pi-cog', key: 'algorithm' }
  }
  return { label: 'Non assigné', severity: 'secondary', icon: 'pi pi-minus', key: 'none' }
}

// ── Priority user IDs pour le PFP courant ──
const priorityUserIds = computed(() => {
  const types = dbPfpTypes(selectedPFP.value)
  const ids = new Set()
  allPrioritySessions.value.forEach(s => {
    if (types.includes(s.pfp_type) && Array.isArray(s.priority_user_ids)) {
      s.priority_user_ids.forEach(id => ids.add(id))
    }
  })
  return ids
})

// ── Praticiens par ID (lookup) ──
const praticiensById = computed(() => {
  const map = new Map()
  allPraticiens.value.forEach(p => {
    const id = p.id ?? p.PraticienId
    if (id != null) {
      map.set(String(id), getPraticienFullName(p))
      map.set(Number(id), getPraticienFullName(p))
    }
  })
  return map
})

// ── Construire les rows enrichies ──
const enrichedRows = computed(() => {
  const types = dbPfpTypes(selectedPFP.value)
  const year = selectedYear.value

  // Assignments filtrées par PFP + année
  const assignMap = new Map()
  allAssignments.value.forEach(a => {
    if (types.includes(a.pfp_type) && a.year === year) {
      assignMap.set(a.user_id, a)
    }
  })

  // Lookup étudiants
  const studentsById = new Map()
  allStudents.value.forEach(s => {
    const uid = s.user_id || s.id
    if (uid) studentsById.set(uid, s)
  })

  // Lookup places
  const placesById = new Map()
  allPlaces.value.forEach(p => { if (p.PlaceId) placesById.set(p.PlaceId, p) })

  // ── Critères : calcul des critères manquants par étudiant ──
  const CRIT_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
  const studentCriteriaCache = new Map()
  const getStudentMissingCriteria = (userId) => {
    if (studentCriteriaCache.has(userId)) return studentCriteriaCache.get(userId)
    const s = studentsById.get(userId)
    const validated = {} 
    CRIT_KEYS.forEach(c => { validated[c] = 0 })
    // From pfp_valided
    if (s) {
      let pv = s.pfp_valided || s.pfp_validated || []
      if (typeof pv === 'string') try { pv = JSON.parse(pv) } catch { pv = [] }
      if (pv && !Array.isArray(pv)) pv = Object.values(pv)
      if (Array.isArray(pv)) {
        pv.forEach(entry => {
          const pid = entry.PlaceId || entry.ID_PFP
          if (pid) {
            const pl = placesById.get(pid)
            if (pl) CRIT_KEYS.forEach(c => { if (pl[c] === true || pl[c] === 'true' || pl[c] === 1) validated[c]++ })
          }
        })
      }
    }
    // From other PFP assignments (not current PFP)
    allAssignments.value.forEach(a => {
      if (a.user_id === userId && !types.includes(a.pfp_type) && a.assigned_place_id) {
        const pl = placesById.get(a.assigned_place_id)
        if (pl) CRIT_KEYS.forEach(c => { if (pl[c] === true || pl[c] === 'true' || pl[c] === 1) validated[c]++ })
      }
    })
    const missing = CRIT_KEYS.filter(c => validated[c] === 0)
    studentCriteriaCache.set(userId, missing)
    return missing
  }
  const getPlaceCriteria = (place) => {
    if (!place) return []
    return CRIT_KEYS.filter(c => place[c] === true || place[c] === 'true' || place[c] === 1)
  }

  const rows = []

  // 1. Tous les étudiants assignés
  assignMap.forEach((a, userId) => {
    const s = studentsById.get(userId)
    const place = a.assigned_place_id ? placesById.get(a.assigned_place_id) : null
    const source = getSource(a)
    const isPriorityUser = priorityUserIds.value.has(userId)
    const displaySource = isPriorityUser && source.key === 'algorithm'
      ? { label: 'Prioritaire', severity: 'warning', icon: 'pi pi-star', key: 'priority' }
      : source

    const praticiensList = Array.isArray(place?.praticiensFormateurs) ? place.praticiensFormateurs : []
    const praticienAssigned = a.assigned_praticien_id
      ? (praticiensById.value.get(a.assigned_praticien_id) || praticiensById.value.get(String(a.assigned_praticien_id)) || null)
      : null
    const praticienFromPlace = praticiensList.length
      ? praticiensList.map(pid => praticiensById.value.get(pid) || praticiensById.value.get(String(pid))).filter(Boolean).join(', ')
      : null

    const missingCrit = getStudentMissingCriteria(userId)
    const placeCrit = getPlaceCriteria(place)

    rows.push({
      user_id: userId,
      student_name: getStudentName(s),
      student_class: getStudentClass(s),
      student_sort_name: getStudentSortName(s),
      assigned_place_id: a.assigned_place_id,
      assigned_place_name: a.assigned_place_name || place?.NomPlace || '',
      assigned_institution_name: a.assigned_institution_name || place?.InstitutionName || '',
      assigned_rank: a.assigned_rank,
      rank_label: a.assigned_rank === 99 ? 'Hors choix' : (a.assigned_rank >= 0 && a.assigned_place_id ? `${a.assigned_rank} crit.` : ''),
      status: a.status || 'draft',
      source_label: displaySource.label,
      source_severity: displaySource.severity,
      source_icon: displaySource.icon,
      source_key: displaySource.key,
      praticien_display: praticienAssigned || praticienFromPlace || null,
      is_priority: isPriorityUser,
      missing_criteria: missingCrit.join(', '),
      place_criteria: placeCrit.join(', '),
      _assignment_id: a.id,
      _pfp_type_db: a.pfp_type
    })
  })

  // 2. Étudiants non assignés (si showAllStudents)
  if (showAllStudents.value) {
    allStudents.value.forEach(s => {
      const uid = s.user_id || s.id
      if (assignMap.has(uid)) return

      const source = getSource(null)
      const missingCrit = getStudentMissingCriteria(uid)

      rows.push({
        user_id: uid,
        student_name: getStudentName(s),
        student_class: getStudentClass(s),
        student_sort_name: getStudentSortName(s),
        assigned_place_id: null,
        assigned_place_name: '',
        assigned_institution_name: '',
        assigned_rank: null,
        rank_label: '',
        status: 'unassigned',
        source_label: source.label,
        source_severity: source.severity,
        source_icon: source.icon,
        source_key: source.key,
        praticien_display: null,
        is_priority: priorityUserIds.value.has(uid),
        missing_criteria: missingCrit.join(', '),
        place_criteria: '',
        _assignment_id: null,
        _pfp_type_db: null
      })
    })
  }

  return rows
})

// ── Filtrage ──
const filteredRows = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  return enrichedRows.value.filter(row => {
    if (filterClasse.value && row.student_class !== filterClasse.value) return false
    if (filterSource.value && row.source_key !== filterSource.value) return false
    if (filterStatus.value && row.status !== filterStatus.value) return false
    if (q) {
      const match =
        (row.student_name || '').toLowerCase().includes(q) ||
        (row.assigned_place_name || '').toLowerCase().includes(q) ||
        (row.assigned_institution_name || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
})

// ── Stats du PFP courant ──
const currentStats = computed(() => {
  const types = dbPfpTypes(selectedPFP.value)
  const year = selectedYear.value

  const assignmentsForPfp = allAssignments.value.filter(a => types.includes(a.pfp_type) && a.year === year)
  const assigned = assignmentsForPfp.filter(a => a.assigned_place_id).length
  const published = assignmentsForPfp.filter(a => a.status === 'published').length

  // Places proposées pour ce PFP/année
  let offeredPlaces = 0
  allPlaces.value.forEach(place => {
    offeredPlaces += getPropositionCapacityForPlace(place, selectedPFP.value, year)
  })

  return {
    totalStudents: enrichedRows.value.length,
    assigned,
    unassigned: enrichedRows.value.length - assigned,
    offeredPlaces,
    priorityCount: enrichedRows.value.filter(r => r.is_priority).length,
    published
  }
})

// ── Comptage par onglet ──
const getTabCount = (pfpValue) => {
  const types = pfpValue === 'PFP1' ? ['PFP1A', 'PFP1B'] : [pfpValue]
  return allAssignments.value.filter(a => types.includes(a.pfp_type) && a.year === selectedYear.value && a.assigned_place_id).length
}

// ── Places disponibles pour l'assignation manuelle ──
const filteredPlacesForAssign = computed(() => {
  const types = dbPfpTypes(selectedPFP.value)
  const year = selectedYear.value
  const q = (placeSearch.value || '').trim().toLowerCase()

  // Compter les assignations par place
  const assignCountByPlace = new Map()
  allAssignments.value.forEach(a => {
    if (types.includes(a.pfp_type) && a.year === year && a.assigned_place_id) {
      assignCountByPlace.set(a.assigned_place_id, (assignCountByPlace.get(a.assigned_place_id) || 0) + 1)
    }
  })

  return allPlaces.value
    .map(place => {
      // Calculer la capacité de proposition pour ce PFP (année simple + année académique)
      const capacity = getPropositionCapacityForPlace(place, selectedPFP.value, year)
      
      const assigned = assignCountByPlace.get(place.PlaceId) || 0
      return { ...place, _capacity: capacity, _assigned: assigned }
    })
    .filter(place => {
      if (place._capacity <= 0) return false
      if (q) {
        const nameMatch = (place.NomPlace || '').toLowerCase().includes(q)
        const instMatch = (place.InstitutionName || place.Institution_name || '').toLowerCase().includes(q)
        if (!nameMatch && !instMatch) return false
      }
      return true
    })
    .sort((a, b) => (a.NomPlace || '').localeCompare(b.NomPlace || ''))
})

const assignDialogTitle = computed(() => {
  if (!editingRow.value) return ''
  return editingRow.value.assigned_place_id ? 'Modifier la place assignée' : 'Assigner une place manuellement'
})

// ── Chargement des données ──
const loadAllData = async () => {
  loading.value = true
  try {
    const [
      studentsResult,
      assignmentsResult,
      placesResult,
      praticiensResult,
      prioResult
    ] = await Promise.all([
      getAllStudents(),
      supabase.from('student_result_vote').select('*').order('assigned_rank', { ascending: true }),
      supabase.from('places').select('*'),
      supabase.from('praticiens_formateurs').select('*'),
      supabase.from('votation_sessions').select('pfp_type, priority_user_ids').eq('is_priority', true)
    ])

    allStudents.value = studentsResult || []
    allAssignments.value = assignmentsResult.data || []
    allPlaces.value = placesResult.data || []
    allPraticiens.value = praticiensResult.data || []
    allPrioritySessions.value = prioResult.data || []

    console.log(`✅ Données chargées: ${allStudents.value.length} étudiants, ${allAssignments.value.length} assignations, ${allPlaces.value.length} places`)
  } catch (e) {
    console.error('❌ Erreur chargement:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données: ' + e.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

// ── Ouvrir le dialog d'assignation ──
const openAssignDialog = (row) => {
  editingRow.value = row
  selectedPlace.value = null
  placeSearch.value = ''
  assignDialogVisible.value = true
}

// ── Sauvegarder l'assignation ──
const saveAssignment = async () => {
  if (!selectedPlace.value || !editingRow.value) return
  saving.value = true

  try {
    const placeName = selectedPlace.value.NomPlace || 'Place sans nom'
    const institutionName = selectedPlace.value.InstitutionName || selectedPlace.value.Institution_name || 'Institution inconnue'
    const userId = editingRow.value.user_id
    const pfpType = editingRow.value._pfp_type_db || dbPfpTypes(selectedPFP.value)[0]
    const year = selectedYear.value

    if (editingRow.value._assignment_id) {
      // Mise à jour d'une assignation existante
      const { error } = await supabase
        .from('student_result_vote')
        .update({
          assigned_place_id: selectedPlace.value.PlaceId,
          assigned_place_name: placeName,
          assigned_institution_name: institutionName,
          notes: 'Manuel — modifié le ' + new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRow.value._assignment_id)

      if (error) throw error
    } else {
      // Nouvelle assignation manuelle
      const { error } = await supabase
        .from('student_result_vote')
        .insert({
          user_id: userId,
          pfp_type: pfpType,
          year: year,
          assigned_place_id: selectedPlace.value.PlaceId,
          assigned_place_name: placeName,
          assigned_institution_name: institutionName,
          assigned_rank: 0,
          status: 'draft',
          notes: 'Manuel — manual assignment le ' + new Date().toISOString()
        })

      if (error) throw error
    }

    toast.add({ severity: 'success', summary: 'Succès', detail: `Place assignée pour ${editingRow.value.student_name}`, life: 3000 })
    assignDialogVisible.value = false
    await loadAllData()
  } catch (e) {
    console.error('❌ Erreur assignation:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'enregistrer: ' + e.message, life: 5000 })
  } finally {
    saving.value = false
  }
}

// ── Publier / Dépublier ──
const publishOne = async (row) => {
  if (!row._assignment_id) return
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', row._assignment_id)
    if (error) throw error
    toast.add({ severity: 'success', summary: 'Publié', detail: `Assignation de ${row.student_name} publiée`, life: 3000 })
    await loadAllData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 })
  }
}

const unpublishOne = async (row) => {
  if (!row._assignment_id) return
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', row._assignment_id)
    if (error) throw error
    toast.add({ severity: 'info', summary: 'Dépublié', detail: `Assignation de ${row.student_name} en brouillon`, life: 3000 })
    await loadAllData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 5000 })
  }
}

// ── Navigation ──
const viewProfile = (row) => {
  if (!row.user_id) return
  router.push({ name: 'ProfileAdmin', params: { id: row.user_id } })
}

// ── Export Excel ──
const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const rows = filteredRows.value.map(r => ({
    'Étudiant': r.student_name || '',
    'Classe': r.student_class || '',
    'Source': r.source_label || '',
    'Place': r.assigned_place_name || '',
    'Institution': r.assigned_institution_name || '',
    'Praticien': r.praticien_display || '',
    'Rang': r.rank_label || '',
    'Critères manquants étudiant': r.missing_criteria || '',
    'Critères validés par la place': r.place_criteria || '',
    'Statut': r.status || '',
    'Prioritaire': r.is_priority ? 'Oui' : 'Non'
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${selectedPFP.value} ${selectedYear.value}`)
  XLSX.writeFile(wb, `places_${selectedPFP.value}_${selectedYear.value}.xlsx`)

  toast.add({ severity: 'success', summary: 'Export', detail: `${rows.length} lignes exportées`, life: 3000 })
}

// ── Watchers ──
watch([selectedPFP, selectedYear], () => {
  filterClasse.value = null
  filterSource.value = null
  filterStatus.value = null
  searchQuery.value = ''
})

// ── Init ──
onMounted(async () => {
  await loadAllData()
})
</script>

<style scoped>
.places-assigned-page {
  min-height: calc(100vh - 100px);
}

.pfp-tab {
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  outline: none;
}

.pfp-tab:hover {
  color: var(--primary-color);
  background: var(--surface-hover);
}

.pfp-tab-active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 700;
}

.places-selection-list {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0.5rem;
}

.place-option {
  border: 2px solid var(--surface-border);
  transition: all 0.2s;
  background: var(--surface-card);
}

.place-option:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.place-option.selected-place {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

:deep(.row-unassigned) {
  opacity: 0.65;
}
</style>
