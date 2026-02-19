<template>
  <AdminLayout>
    <div class="vue-ensemble-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-th-large text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Vue d'ensemble Formation Pratique</h1>
              <p class="text-600 m-0 mt-1">Vision globale des stages, notes, critères et cas particuliers par étudiant</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Nom ou prénom..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown v-model="filterClasse" :options="classesList" placeholder="Toutes" class="w-full md:w-8rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown v-model="filterPFP" :options="pfpOptions" placeholder="Tous" class="w-full md:w-8rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut :</label>
              <Dropdown v-model="filterStatut" :options="statutOptions" optionLabel="label" optionValue="value" placeholder="Tous" class="w-full md:w-10rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Type :</label>
              <Dropdown v-model="filterType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Tous" class="w-full md:w-10rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export Excel" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchAllData" v-tooltip="'Rafraîchir'" :loading="loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-3">
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-blue-100 border-circle p-2">
                <i class="pi pi-users text-blue-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-900 m-0">{{ stats.totalStudents }}</h3>
                <p class="text-600 m-0 text-xs">Étudiants</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-purple-100 border-circle p-2">
                <i class="pi pi-briefcase text-purple-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-900 m-0">{{ stats.totalStages }}</h3>
                <p class="text-600 m-0 text-xs">Stages (lignes)</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-green-100 border-circle p-2">
                <i class="pi pi-check-circle text-green-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-green-600 m-0">{{ stats.validated }}</h3>
                <p class="text-600 m-0 text-xs">Validés</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-orange-100 border-circle p-2">
                <i class="pi pi-clock text-orange-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-orange-600 m-0">{{ stats.inProgress }}</h3>
                <p class="text-600 m-0 text-xs">En cours</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-red-100 border-circle p-2">
                <i class="pi pi-times-circle text-red-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-red-600 m-0">{{ stats.failed }}</h3>
                <p class="text-600 m-0 text-xs">Échecs</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-2">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-yellow-100 border-circle p-2">
                <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-yellow-700 m-0">{{ stats.casParticuliers }}</h3>
                <p class="text-600 m-0 text-xs">Cas particuliers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table principale -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredRows"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="50"
          :rowsPerPageOptions="[20, 50, 100, 200]"
          :rowHover="true"
          dataKey="_rowKey"
          scrollable
          scrollHeight="flex"
          class="ensemble-table p-datatable-sm"
          :sortField="'nom'"
          :sortOrder="1"
          :globalFilterFields="['nom', 'prenom', 'classe', 'pfpType', 'year', 'placeName', 'institutionName']"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Détail des stages ({{ filteredRows.length }} lignes)</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune donnée trouvée</p>
            </div>
          </template>

          <!-- Étudiant -->
          <Column field="nom" header="Étudiant" sortable :frozen="true" style="min-width: 180px">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <div class="student-avatar" :class="getAvatarClass(data)">
                  {{ getInitials(data) }}
                </div>
                <div>
                  <div class="font-semibold text-900 text-sm">{{ data.nom }} {{ data.prenom }}</div>
                  <div class="text-xs text-500">{{ data.classe }}</div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Classe -->
          <Column field="classe" header="Classe" sortable style="min-width: 80px">
            <template #body="{ data }">
              <Tag :value="data.classe" severity="info" class="text-xs" />
            </template>
          </Column>

          <!-- PFP -->
          <Column field="pfpType" header="PFP" sortable style="min-width: 80px">
            <template #body="{ data }">
              <Tag :value="data.pfpType" class="text-xs" :severity="getPfpSeverity(data.pfpType)" />
            </template>
          </Column>

          <!-- Source -->
          <Column field="source" header="Source" sortable style="min-width: 90px">
            <template #body="{ data }">
              <Tag v-if="data.source !== '—'" :value="data.source === 'validated' ? 'Validé' : data.source === 'assigned' ? 'Assigné' : 'Notes'" :severity="data.source === 'validated' ? 'success' : data.source === 'assigned' ? 'warning' : 'info'" class="text-xs" />
              <span v-else class="text-400 text-xs">—</span>
            </template>
          </Column>

          <!-- Année -->
          <Column field="year" header="Année" sortable style="min-width: 70px">
            <template #body="{ data }">
              <span class="text-sm font-semibold">{{ data.year || '—' }}</span>
            </template>
          </Column>

          <!-- Place -->
          <Column field="placeName" header="Place de stage" sortable style="min-width: 180px">
            <template #body="{ data }">
              <div>
                <div class="font-semibold text-sm text-900">{{ data.placeName || '—' }}</div>
              </div>
            </template>
          </Column>

          <!-- Institution -->
          <Column field="institutionName" header="Institution" sortable style="min-width: 160px">
            <template #body="{ data }">
              <span class="text-sm">{{ data.institutionName || '—' }}</span>
            </template>
          </Column>

          <!-- Praticien -->
          <Column field="praticienName" header="Praticien" sortable style="min-width: 140px">
            <template #body="{ data }">
              <span class="text-sm">{{ data.praticienName || '—' }}</span>
            </template>
          </Column>

          <!-- Note -->
          <Column field="note" header="Note" sortable style="min-width: 70px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span v-if="data.note" class="note-badge" :class="getNoteBadgeClass(data.note)">{{ data.note }}</span>
                <span v-else class="text-400">—</span>
              </div>
            </template>
          </Column>

          <!-- Rattrapage -->
          <Column field="noteRetake" header="Rattrap." sortable style="min-width: 70px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span v-if="data.noteRetake" class="note-badge" :class="getNoteBadgeClass(data.noteRetake)">{{ data.noteRetake }}</span>
                <span v-else class="text-400">—</span>
              </div>
            </template>
          </Column>

          <!-- Critères -->
          <Column header="Critères" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1" v-if="data.criteria && Object.keys(data.criteria).length > 0">
                <Tag v-for="crit in criteriaLabels" :key="crit"
                  :value="crit"
                  :severity="data.criteria[crit] ? 'success' : 'danger'"
                  class="text-xs px-1 py-0"
                  style="font-size: 0.6rem"
                />
              </div>
              <span v-else class="text-400 text-xs">—</span>
            </template>
          </Column>

          <!-- Absences -->
          <Column field="absences" header="Abs." sortable style="min-width: 60px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span v-if="data.absences > 0" class="text-orange-600 font-bold text-sm">{{ data.absences }}</span>
                <span v-else class="text-400">—</span>
              </div>
            </template>
          </Column>

          <!-- Remarques -->
          <Column field="remarques" header="Remarques" style="min-width: 160px">
            <template #body="{ data }">
              <span v-if="data.remarques" class="text-xs text-700" :title="data.remarques">{{ truncate(data.remarques, 30) }}</span>
              <span v-else class="text-400 text-xs">—</span>
            </template>
          </Column>

          <!-- Statut -->
          <Column field="statut" header="Statut" sortable style="min-width: 100px">
            <template #body="{ data }">
              <Tag :value="data.statut" :severity="getStatutSeverity(data.statut)" class="text-xs" />
            </template>
          </Column>

          <!-- Cas particulier -->
          <Column field="casParticulier" header="Cas part." sortable style="min-width: 90px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span v-if="data.casParticulierCouleur && data.casParticulierCouleur !== 'blanc'" class="cas-dot" :class="'cas-' + data.casParticulierCouleur" :title="data.casParticulierComment || ''"></span>
                <span v-else class="text-400 text-xs">—</span>
              </div>
            </template>
          </Column>

          <!-- Attribution -->
          <Column field="attributionType" header="Attribution" sortable style="min-width: 100px">
            <template #body="{ data }">
              <Tag v-if="data.attributionType" :value="data.attributionType" :severity="data.attributionType === 'Aléatoire' ? 'danger' : 'success'" class="text-xs" />
              <span v-else class="text-400 text-xs">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import studentsService from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'

const loading = ref(false)
const allRows = ref([])
const searchQuery = ref('')
const filterClasse = ref(null)
const filterPFP = ref(null)
const filterStatut = ref(null)
const filterType = ref(null)
const classesList = ref([])

const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const pfpOptions = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const statutOptions = [
  { label: 'Validé / Réussi', value: 'Réussi' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Échec', value: 'Échec' },
  { label: 'Arrêt', value: 'Arrêt' },
  { label: 'Non noté', value: 'Non noté' },
  { label: 'Publié', value: 'Publié' },
  { label: 'Brouillon', value: 'Brouillon' }
]

const typeOptions = [
  { label: 'Stages validés', value: 'validated' },
  { label: 'Assignations (votation)', value: 'assigned' },
  { label: 'Notes PFP', value: 'notes' },
  { label: 'Cas particuliers', value: 'cas' }
]

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '…' : text
}

const getInitials = (row) => ((row.nom?.[0] || '') + (row.prenom?.[0] || '')).toUpperCase()

const getAvatarClass = (row) => {
  if (row.statut === 'Réussi') return 'avatar-complete'
  if (row.statut === 'En cours' || row.statut === 'Publié' || row.statut === 'Brouillon') return 'avatar-partial'
  if (row.statut === 'Échec') return 'avatar-fail'
  return 'avatar-none'
}

const getPfpSeverity = (pfp) => {
  if (pfp === 'PFP1A' || pfp === 'PFP1B') return 'info'
  if (pfp === 'PFP2') return 'warning'
  if (pfp === 'PFP3') return 'success'
  if (pfp === 'PFP4') return 'secondary'
  return null
}

const getStatutSeverity = (statut) => {
  if (statut === 'Réussi') return 'success'
  if (statut === 'En cours' || statut === 'Publié') return 'warning'
  if (statut === 'Brouillon') return 'secondary'
  if (statut === 'Échec') return 'danger'
  if (statut === 'Arrêt') return 'danger'
  return 'info'
}

const getNoteBadgeClass = (note) => {
  const n = String(note).trim().toUpperCase()
  if (n === 'F') return 'note-fail'
  if (['A', 'B', 'C', 'D', 'E'].includes(n)) return 'note-pass'
  return 'note-none'
}

const stats = computed(() => {
  const rows = filteredRows.value
  const studentIds = new Set(rows.map(r => r.userId))
  return {
    totalStudents: studentIds.size,
    totalStages: rows.length,
    validated: rows.filter(r => r.statut === 'Réussi').length,
    inProgress: rows.filter(r => r.statut === 'En cours' || r.statut === 'Publié' || r.statut === 'Brouillon').length,
    failed: rows.filter(r => r.statut === 'Échec').length,
    casParticuliers: rows.filter(r => r.casParticulierCouleur && r.casParticulierCouleur !== 'blanc').length
  }
})

const filteredRows = computed(() => {
  let rows = [...allRows.value]

  if (searchQuery.value?.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    rows = rows.filter(r =>
      (r.nom || '').toLowerCase().includes(q) ||
      (r.prenom || '').toLowerCase().includes(q) ||
      (r.placeName || '').toLowerCase().includes(q) ||
      (r.institutionName || '').toLowerCase().includes(q)
    )
  }

  if (filterClasse.value) {
    rows = rows.filter(r => r.classe === filterClasse.value)
  }

  if (filterPFP.value) {
    rows = rows.filter(r => r.pfpType === filterPFP.value)
  }

  if (filterStatut.value) {
    rows = rows.filter(r => r.statut === filterStatut.value)
  }

  if (filterType.value) {
    if (filterType.value === 'cas') {
      rows = rows.filter(r => r.casParticulierCouleur && r.casParticulierCouleur !== 'blanc')
    } else {
      rows = rows.filter(r => r.source === filterType.value)
    }
  }

  return rows
})

const parsePfpValided = (pfpVal) => {
  if (!pfpVal) return []
  if (Array.isArray(pfpVal)) return pfpVal
  if (typeof pfpVal === 'string') {
    try {
      const parsed = JSON.parse(pfpVal)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) { return [] }
  }
  if (typeof pfpVal === 'object') return Object.values(pfpVal)
  return []
}

const getNoteStatusByValue = (rawValue) => {
  const normalized = String(rawValue ?? '').trim().toUpperCase()
  if (!normalized || normalized === '-' || normalized === 'FALSE' || normalized === 'TRUE') return null
  if (normalized === 'F') return 'Échec'
  if (['A', 'B', 'C', 'D', 'E'].includes(normalized)) return 'Réussi'
  return null
}

const getPfpFinalStatus = (noteValue, retakeValue) => {
  const initialStatus = getNoteStatusByValue(noteValue)
  if (initialStatus === 'Réussi') return 'Réussi'
  if (initialStatus === 'Échec') {
    const retakeStatus = getNoteStatusByValue(retakeValue)
    if (retakeStatus === 'Réussi') return 'Réussi'
    return 'Échec'
  }
  return 'Non noté'
}

const fetchAllData = async () => {
  loading.value = true
  try {
    const [
      studentsData,
      physioResult,
      assignmentsResult,
      placesResult,
      institutionsResult,
      praticiensResult,
      suiviResult,
      notesResult
    ] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, pfp_valided'),
      supabase.from('student_result_vote').select('*').order('year', { ascending: false }),
      supabase.from('places').select('PlaceId, NomPlace, InstitutionId, praticiensFormateurs, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE'),
      supabase.from('institutions').select('InstitutionId, Name'),
      supabase.from('praticiens_formateurs').select('id, nom, prenom, mail'),
      supabase.from('suivi_cas_particuliers').select('*'),
      supabase.from('StudentsPhysio').select('*')
    ])

    // Build lookup maps
    const instMap = new Map()
    if (institutionsResult.data) institutionsResult.data.forEach(i => instMap.set(i.InstitutionId, i.Name))

    const placesMap = new Map()
    if (placesResult.data) placesResult.data.forEach(p => {
      placesMap.set(p.PlaceId, {
        name: p.NomPlace,
        institution: instMap.get(p.InstitutionId) || '',
        institutionId: p.InstitutionId,
        praticiens: p.praticiensFormateurs || [],
        criteria: {}
      })
      criteriaLabels.forEach(c => {
        placesMap.get(p.PlaceId).criteria[c] = p[c] === true
      })
    })

    const pratMap = new Map()
    if (praticiensResult.data) praticiensResult.data.forEach(p => {
      pratMap.set(String(p.id), `${p.prenom || ''} ${p.nom || ''}`.trim())
    })

    // Suivi cas particuliers map: userId -> { pfpField -> { couleur, commentaire } }
    const suiviMap = new Map()
    if (suiviResult.data) suiviResult.data.forEach(s => {
      if (!suiviMap.has(s.user_id)) suiviMap.set(s.user_id, {})
      suiviMap.get(s.user_id)[s.pfp_field] = { couleur: s.couleur, commentaire: s.commentaire }
    })

    // Notes map: userId -> StudentsPhysio row
    const notesMap = new Map()
    if (notesResult.data) notesResult.data.forEach(n => {
      notesMap.set(n.user_id, n)
    })

    // Student profiles map
    const studentMap = new Map()
    studentsData.forEach(s => {
      studentMap.set(s.id, {
        nom: s.Nom || '',
        prenom: s.Prenom || '',
        classe: s.Classe || '-'
      })
    })

    const rows = []
    let rowIdx = 0

    const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
    const pfpNoteKeys = { 'PFP1A': 'pfp1a', 'PFP1B': 'pfp1b', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }
    const pfpSuiviKeys = { 'PFP1A': 'pfp1', 'PFP1B': 'pfp1', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }

    // Build assignations map: userId -> pfpType -> assignment data
    const assignMap = new Map()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (!a.user_id || !a.pfp_type) return
        const key = `${a.user_id}__${a.pfp_type}`
        // Keep the most recent (already sorted by year desc)
        if (!assignMap.has(key)) assignMap.set(key, a)
      })
    }

    // Build validated stages map: userId -> pfpType -> stage data
    const validatedMap = new Map()
    if (physioResult.data) {
      physioResult.data.forEach(physio => {
        if (!physio.pfp_valided) return
        const pfpArray = parsePfpValided(physio.pfp_valided)
        pfpArray.forEach(stage => {
          const pfpType = stage.pfp_type || stage.pfpLevel || ''
          if (!pfpType) return
          const key = `${physio.user_id}__${pfpType}`
          if (!validatedMap.has(key)) validatedMap.set(key, { ...stage, _userId: physio.user_id })
        })
      })
    }

    // For each student × each PFP → one row
    studentMap.forEach((student, userId) => {
      pfpTypes.forEach(pfpType => {
        const assignKey = `${userId}__${pfpType}`
        const assignment = assignMap.get(assignKey)
        const validatedStage = validatedMap.get(assignKey)
        const notesData = notesMap.get(userId)
        const noteKey = pfpNoteKeys[pfpType]
        const noteVal = notesData?.[noteKey] || null
        const noteRetake = notesData?.[noteKey + '_retake'] || null
        const noteAbsences = Number(notesData?.[noteKey + '_absences']) || 0
        const noteRemarques = notesData?.[noteKey + '_remarques'] || ''

        // Cas particulier
        const suiviData = suiviMap.get(userId)
        const suiviField = pfpSuiviKeys[pfpType]
        let casColor = null
        let casComment = null
        if (suiviData && suiviField && suiviData[suiviField]) {
          casColor = suiviData[suiviField].couleur
          casComment = suiviData[suiviField].commentaire
        }

        let source = '—'
        let placeName = ''
        let institutionName = ''
        let praticienName = ''
        let year = ''
        let criteria = {}
        let statut = '—'
        let attributionType = null

        if (assignment) {
          // Priority 1: assignation data
          source = 'assigned'
          const placeInfo = assignment.assigned_place_id ? placesMap.get(assignment.assigned_place_id) : null
          placeName = assignment.assigned_place_name || placeInfo?.name || ''
          institutionName = assignment.assigned_institution_name || placeInfo?.institution || ''
          year = assignment.year || ''
          criteria = placeInfo?.criteria ? { ...placeInfo.criteria } : {}

          if (assignment.assigned_praticien_id) {
            praticienName = pratMap.get(String(assignment.assigned_praticien_id)) || ''
          }

          if (assignment.assigned_rank === 99) attributionType = 'Aléatoire'
          else if (assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) attributionType = `Choix ${assignment.assigned_rank}`

          statut = 'En cours'
          if (assignment.pfp_validee) statut = 'Réussi'
          else if (assignment.pfp_echec) statut = 'Échec'
          else if (assignment.pfp_arret) statut = 'Arrêt'
          else if (assignment.status === 'published') statut = 'Publié'
          else if (assignment.status === 'draft') statut = 'Brouillon'

        } else if (validatedStage) {
          // Priority 2: validated stage from pfp_valided
          source = 'validated'
          const placeId = validatedStage.PlaceId || validatedStage.ID_PFP || validatedStage.id_pfp
          const placeInfo = placeId ? placesMap.get(placeId) : null
          placeName = validatedStage.NomPlace || validatedStage.nom_pfp || placeInfo?.name || ''
          institutionName = validatedStage.Institution || validatedStage.institution_name || placeInfo?.institution || ''
          year = validatedStage.year || ''
          criteriaLabels.forEach(c => {
            criteria[c] = validatedStage[c] === true || placeInfo?.criteria?.[c] === true
          })
          statut = 'Réussi'

        } else if (hasGrade(noteVal)) {
          // Priority 3: notes only
          source = 'notes'
          year = notesData?.year || ''
        }

        // Override statut with note if available
        if (hasGrade(noteVal)) {
          const noteStatus = getPfpFinalStatus(noteVal, noteRetake)
          if (noteStatus === 'Réussi' || noteStatus === 'Échec') statut = noteStatus
          if (source === '—') source = 'notes'
        }

        rows.push({
          _rowKey: `row-${userId}-${pfpType}-${rowIdx++}`,
          userId,
          nom: student.nom,
          prenom: student.prenom,
          classe: student.classe,
          pfpType,
          source,
          year,
          placeName,
          institutionName,
          praticienName,
          note: hasGrade(noteVal) ? noteVal : null,
          noteRetake: hasGrade(noteRetake) ? noteRetake : null,
          criteria,
          absences: noteAbsences,
          remarques: noteRemarques,
          statut,
          casParticulierCouleur: casColor,
          casParticulierComment: casComment,
          attributionType
        })
      })
    })

    allRows.value = rows

    // Build classes list
    const uniqueClasses = [...new Set(rows.map(r => r.classe).filter(c => c && c !== '-'))].sort()
    if (uniqueClasses.length > 0) classesList.value = uniqueClasses

  } catch (e) {
    console.error('Erreur fetchAllData:', e)
  } finally {
    loading.value = false
  }
}

const hasGrade = (value) => {
  if (typeof value === 'boolean') return false
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized !== '' && normalized !== '-' && normalized !== 'false' && normalized !== 'true'
}

const exportCSV = () => {
  const rows = filteredRows.value
  if (rows.length === 0) return

  const headers = [
    'Nom', 'Prénom', 'Classe', 'PFP', 'Source', 'Année', 'Place de stage', 'Institution',
    'Praticien', 'Note', 'Rattrapage', ...criteriaLabels,
    'Absences', 'Remarques', 'Statut', 'Cas particulier (couleur)', 'Cas particulier (commentaire)', 'Attribution'
  ]

  const csvRows = rows.map(r => [
    r.nom,
    r.prenom,
    r.classe,
    r.pfpType,
    r.source === 'validated' ? 'Validé' : r.source === 'assigned' ? 'Assigné' : 'Notes',
    r.year || '',
    r.placeName || '',
    r.institutionName || '',
    r.praticienName || '',
    r.note || '',
    r.noteRetake || '',
    ...criteriaLabels.map(c => r.criteria?.[c] ? 'Oui' : 'Non'),
    r.absences || 0,
    r.remarques || '',
    r.statut,
    r.casParticulierCouleur || '',
    r.casParticulierComment || '',
    r.attributionType || ''
  ])

  const csv = [headers, ...csvRows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `vue-ensemble-fp-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.vue-ensemble-page {
  min-height: calc(100vh - 100px);
}

/* Student avatar */
.student-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  flex-shrink: 0;
}

.avatar-complete { background: #DCFCE7; color: #166534; }
.avatar-partial { background: #FEF3C7; color: #92400E; }
.avatar-fail { background: #FEE2E2; color: #991B1B; }
.avatar-none { background: #F1F5F9; color: #64748B; }

/* Note badges */
.note-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.note-pass { background: #DCFCE7; color: #166534; }
.note-fail { background: #FEE2E2; color: #991B1B; }
.note-none { background: #F1F5F9; color: #64748B; }

/* Cas particulier dot */
.cas-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.cas-vert { background: #28a745; }
.cas-orange { background: #fd7e14; }
.cas-rouge { background: #dc3545; }
.cas-noir { background: #343a40; }

/* Table styling */
.ensemble-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.6rem 0.4rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
  font-size: 0.8rem;
}

.ensemble-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.3rem 0.25rem;
  vertical-align: middle;
}

.ensemble-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

.ensemble-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}
</style>
