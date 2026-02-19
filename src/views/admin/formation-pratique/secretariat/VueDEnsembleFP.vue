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
                <Button icon="pi pi-download" label="Export Excel" outlined class="p-button-sm" @click="exportXLSX" />
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
              <div class="bg-blue-100 border-circle p-2"><i class="pi pi-users text-blue-500 text-xl"></i></div>
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
              <div class="bg-purple-100 border-circle p-2"><i class="pi pi-briefcase text-purple-500 text-xl"></i></div>
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
              <div class="bg-green-100 border-circle p-2"><i class="pi pi-check-circle text-green-500 text-xl"></i></div>
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
              <div class="bg-orange-100 border-circle p-2"><i class="pi pi-clock text-orange-500 text-xl"></i></div>
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
              <div class="bg-red-100 border-circle p-2"><i class="pi pi-times-circle text-red-500 text-xl"></i></div>
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
              <div class="bg-yellow-100 border-circle p-2"><i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i></div>
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
          :value="filteredFlatRows"
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
              <span class="text-xl text-900 font-bold">Détail des stages ({{ filteredFlatRows.length }} lignes)</span>
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
                <div class="student-avatar" :class="getFlatAvatarClass(data)">
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
              <div class="font-semibold text-sm text-900">{{ data.placeName || '—' }}</div>
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
          <Column header="Cas part." style="min-width: 90px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span v-if="data.casColor && data.casColor !== 'blanc'" class="cas-dot" :class="'cas-' + data.casColor" :title="data.casComment || ''"></span>
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
import ExcelJS from 'exceljs'
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
const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
const pfpOptions = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const statutOptions = [
  { label: 'Validé / Réussi', value: 'Réussi' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Échec', value: 'Échec' },
  { label: 'Arrêt', value: 'Arrêt' },
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
  const statuts = pfpTypes.map(p => row[p]?.statut)
  if (statuts.some(s => s === 'Échec' || s === 'Arrêt')) return 'avatar-fail'
  if (statuts.every(s => s === 'Réussi')) return 'avatar-complete'
  if (statuts.some(s => s === 'Réussi' || s === 'Publié' || s === 'En cours')) return 'avatar-partial'
  return 'avatar-none'
}

const getFlatAvatarClass = (row) => {
  if (row.statut === 'Réussi') return 'avatar-complete'
  if (row.statut === 'En cours' || row.statut === 'Publié' || row.statut === 'Brouillon') return 'avatar-partial'
  if (row.statut === 'Échec' || row.statut === 'Arrêt') return 'avatar-fail'
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
  if (statut === 'Échec' || statut === 'Arrêt') return 'danger'
  return 'info'
}

const getNoteBadgeClass = (note) => {
  const n = String(note).trim().toUpperCase()
  if (n === 'F') return 'note-fail'
  if (['A', 'B', 'C', 'D', 'E'].includes(n)) return 'note-pass'
  return 'note-none'
}

const getPfpCellClass = (pfpData) => {
  if (!pfpData) return ''
  const s = pfpData.statut
  if (s === 'Réussi') return 'pfp-cell-success'
  if (s === 'Échec' || s === 'Arrêt') return 'pfp-cell-fail'
  if (s === 'En cours' || s === 'Publié') return 'pfp-cell-progress'
  if (s === 'Brouillon') return 'pfp-cell-draft'
  return ''
}

const stats = computed(() => {
  const rows = filteredFlatRows.value
  const studentIds = new Set(rows.map(r => r.userId))
  return {
    totalStudents: studentIds.size,
    totalStages: rows.length,
    validated: rows.filter(r => r.statut === 'Réussi').length,
    inProgress: rows.filter(r => r.statut === 'En cours' || r.statut === 'Publié' || r.statut === 'Brouillon').length,
    failed: rows.filter(r => r.statut === 'Échec').length,
    casParticuliers: rows.filter(r => r.casColor && r.casColor !== 'blanc').length
  }
})

const flatRows = computed(() => {
  const flat = []
  allRows.value.forEach(r => {
    pfpTypes.forEach(pfpType => {
      const d = r[pfpType] || {}
      let source = '—'
      if (d.attributionType || d.praticienName || (d.statut && ['En cours', 'Publié', 'Brouillon'].includes(d.statut))) source = 'assigned'
      else if (d.statut === 'Réussi' && d.placeName && !d.attributionType) source = 'validated'
      else if (d.note) source = 'notes'
      flat.push({
        _rowKey: `${r.userId}-${pfpType}`,
        userId: r.userId,
        nom: r.nom,
        prenom: r.prenom,
        classe: r.classe,
        pfpType,
        source,
        year: d.year || '',
        placeName: d.placeName || '',
        institutionName: d.institutionName || '',
        praticienName: d.praticienName || '',
        note: d.note || null,
        noteRetake: d.noteRetake || null,
        absences: d.absences || 0,
        remarques: d.remarques || '',
        statut: d.statut || '—',
        casColor: d.casColor || null,
        casComment: d.casComment || null,
        attributionType: d.attributionType || null
      })
    })
  })
  return flat
})

const filteredFlatRows = computed(() => {
  let rows = [...flatRows.value]

  if (searchQuery.value?.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    rows = rows.filter(r =>
      (r.nom || '').toLowerCase().includes(q) ||
      (r.prenom || '').toLowerCase().includes(q) ||
      (r.placeName || '').toLowerCase().includes(q) ||
      (r.institutionName || '').toLowerCase().includes(q)
    )
  }

  if (filterClasse.value) rows = rows.filter(r => r.classe === filterClasse.value)
  if (filterPFP.value) rows = rows.filter(r => r.pfpType === filterPFP.value)
  if (filterStatut.value) rows = rows.filter(r => r.statut === filterStatut.value)

  if (filterType.value) {
    if (filterType.value === 'cas') rows = rows.filter(r => r.casColor && r.casColor !== 'blanc')
    else rows = rows.filter(r => r.source === filterType.value)
  }

  return rows
})

const filteredRows = computed(() => {
  let rows = [...allRows.value]
  if (searchQuery.value?.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    rows = rows.filter(r => (r.nom || '').toLowerCase().includes(q) || (r.prenom || '').toLowerCase().includes(q))
  }
  if (filterClasse.value) rows = rows.filter(r => r.classe === filterClasse.value)
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

const hasGrade = (value) => {
  if (typeof value === 'boolean') return false
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized !== '' && normalized !== '-' && normalized !== 'false' && normalized !== 'true'
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
  return null
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
      supabase.from('places').select('PlaceId, NomPlace, InstitutionId, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE'),
      supabase.from('institutions').select('InstitutionId, Name'),
      supabase.from('praticiens_formateurs').select('id, nom, prenom'),
      supabase.from('suivi_cas_particuliers').select('*'),
      supabase.from('StudentsPhysio').select('*')
    ])

    const instMap = new Map()
    if (institutionsResult.data) institutionsResult.data.forEach(i => instMap.set(i.InstitutionId, i.Name))

    const placesMap = new Map()
    if (placesResult.data) placesResult.data.forEach(p => {
      placesMap.set(p.PlaceId, { name: p.NomPlace, institution: instMap.get(p.InstitutionId) || '' })
    })

    const pratMap = new Map()
    if (praticiensResult.data) praticiensResult.data.forEach(p => {
      pratMap.set(String(p.id), `${p.prenom || ''} ${p.nom || ''}`.trim())
    })

    const suiviMap = new Map()
    if (suiviResult.data) suiviResult.data.forEach(s => {
      if (!suiviMap.has(s.user_id)) suiviMap.set(s.user_id, {})
      suiviMap.get(s.user_id)[s.pfp_field] = { couleur: s.couleur, commentaire: s.commentaire }
    })

    const notesMap = new Map()
    if (notesResult.data) notesResult.data.forEach(n => {
      notesMap.set(n.user_id, n)
    })

    const assignMap = new Map()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (!a.user_id || !a.pfp_type) return
        const key = `${a.user_id}__${a.pfp_type}`
        if (!assignMap.has(key)) assignMap.set(key, a)
      })
    }

    const validatedMap = new Map()
    if (physioResult.data) {
      physioResult.data.forEach(physio => {
        if (!physio.pfp_valided) return
        parsePfpValided(physio.pfp_valided).forEach(stage => {
          const pfpType = stage.pfp_type || stage.pfpLevel || ''
          if (!pfpType) return
          const key = `${physio.user_id}__${pfpType}`
          if (!validatedMap.has(key)) validatedMap.set(key, stage)
        })
      })
    }

    const pfpNoteKeys = { 'PFP1A': 'pfp1a', 'PFP1B': 'pfp1b', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }
    const pfpSuiviKeys = { 'PFP1A': 'pfp1', 'PFP1B': 'pfp1', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }

    const rows = []
    studentsData.forEach(s => {
      const userId = s.id
      const notesData = notesMap.get(userId)
      const suiviData = suiviMap.get(userId)

      const row = {
        userId,
        nom: s.Nom || '',
        prenom: s.Prenom || '',
        classe: s.Classe || '-'
      }

      pfpTypes.forEach(pfpType => {
        const key = `${userId}__${pfpType}`
        const assignment = assignMap.get(key)
        const validatedStage = validatedMap.get(key)
        const noteKey = pfpNoteKeys[pfpType]
        const noteVal = notesData?.[noteKey] || null
        const noteRetake = notesData?.[noteKey + '_retake'] || null
        const absences = Number(notesData?.[noteKey + '_absences']) || 0
        const remarques = notesData?.[noteKey + '_remarques'] || ''

        const suiviField = pfpSuiviKeys[pfpType]
        const casData = suiviData?.[suiviField]

        let placeName = ''
        let institutionName = ''
        let praticienName = ''
        let year = ''
        let statut = '—'
        let attributionType = null

        if (assignment) {
          const placeInfo = assignment.assigned_place_id ? placesMap.get(assignment.assigned_place_id) : null
          placeName = assignment.assigned_place_name || placeInfo?.name || ''
          institutionName = assignment.assigned_institution_name || placeInfo?.institution || ''
          year = assignment.year || ''
          if (assignment.assigned_praticien_id) praticienName = pratMap.get(String(assignment.assigned_praticien_id)) || ''
          if (assignment.assigned_rank === 99) attributionType = 'Aléatoire'
          else if (assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) attributionType = `Choix ${assignment.assigned_rank}`

          statut = 'En cours'
          if (assignment.pfp_validee) statut = 'Réussi'
          else if (assignment.pfp_echec) statut = 'Échec'
          else if (assignment.pfp_arret) statut = 'Arrêt'
          else if (assignment.status === 'published') statut = 'Publié'
          else if (assignment.status === 'draft') statut = 'Brouillon'

        } else if (validatedStage) {
          const placeId = validatedStage.PlaceId || validatedStage.ID_PFP || validatedStage.id_pfp
          const placeInfo = placeId ? placesMap.get(placeId) : null
          placeName = validatedStage.NomPlace || validatedStage.nom_pfp || placeInfo?.name || ''
          institutionName = validatedStage.Institution || validatedStage.institution_name || placeInfo?.institution || ''
          year = validatedStage.year || ''
          statut = 'Réussi'
        }

        if (hasGrade(noteVal)) {
          const noteStatus = getPfpFinalStatus(noteVal, noteRetake)
          if (noteStatus) statut = noteStatus
        }

        row[pfpType] = {
          placeName,
          institutionName,
          praticienName,
          year,
          note: hasGrade(noteVal) ? noteVal : null,
          noteRetake: hasGrade(noteRetake) ? noteRetake : null,
          absences,
          remarques,
          statut,
          attributionType,
          casColor: casData?.couleur || null,
          casComment: casData?.commentaire || null
        }
      })

      rows.push(row)
    })

    const collator = new Intl.Collator('fr', { sensitivity: 'base' })
    rows.sort((a, b) => collator.compare(a.nom, b.nom))

    allRows.value = rows

    const uniqueClasses = [...new Set(rows.map(r => r.classe).filter(c => c && c !== '-'))].sort()
    if (uniqueClasses.length > 0) classesList.value = uniqueClasses

  } catch (e) {
    console.error('Erreur fetchAllData:', e)
  } finally {
    loading.value = false
  }
}

const exportXLSX = async () => {
  const rows = filteredRows.value
  if (rows.length === 0) return

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Plateforme HEdS'
  wb.created = new Date()
  const ws = wb.addWorksheet('Vue d\'ensemble FP')

  // --- Colors ---
  const COL_BLUE = 'FF1E3A5F'
  const COL_WHITE = 'FFFFFFFF'
  const COL_LIGHT_BLUE = 'FFE8F0FE'
  const COL_LIGHT_GREEN = 'FFE6F4EA'
  const COL_LIGHT_RED = 'FFFCE8E6'
  const COL_LIGHT_ORANGE = 'FFFFF3E0'
  const COL_LIGHT_GRAY = 'FFF5F5F5'
  const COL_GREEN_TEXT = 'FF1B7A3D'
  const COL_RED_TEXT = 'FFC62828'
  const COL_ORANGE_TEXT = 'FFE65100'

  // --- PFP sub-columns ---
  const pfpSubCols = ['Place', 'Institution', 'Praticien', 'Note', 'Rattrap.', 'Statut', 'Attribution', 'Abs.', 'Remarques', 'Cas part.']
  const pfpSubCount = pfpSubCols.length

  // --- Build columns ---
  const baseCols = [
    { header: 'Nom', key: 'nom', width: 16 },
    { header: 'Prénom', key: 'prenom', width: 14 },
    { header: 'Classe', key: 'classe', width: 10 }
  ]

  const allCols = [...baseCols]
  pfpTypes.forEach(pfp => {
    pfpSubCols.forEach(sub => {
      allCols.push({ header: `${pfp} ${sub}`, key: `${pfp}_${sub}`, width: sub === 'Place' ? 22 : sub === 'Institution' ? 20 : sub === 'Praticien' ? 18 : sub === 'Remarques' ? 20 : sub === 'Cas part.' ? 14 : 10 })
    })
  })

  ws.columns = allCols

  // --- Row 1: PFP group headers (merged) ---
  const groupRow = ws.getRow(1)
  groupRow.height = 28
  // Base columns: merge cells 1-3
  ws.mergeCells(1, 1, 1, 3)
  const infoCell = ws.getCell(1, 1)
  infoCell.value = 'INFORMATIONS ÉTUDIANT'
  infoCell.font = { bold: true, color: { argb: COL_WHITE }, size: 11 }
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_BLUE } }
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
  infoCell.border = { bottom: { style: 'medium', color: { argb: COL_BLUE } } }

  // PFP group headers
  const pfpColors = {
    'PFP1A': 'FF1565C0',
    'PFP1B': 'FF1976D2',
    'PFP2': 'FFE65100',
    'PFP3': 'FF2E7D32',
    'PFP4': 'FF6A1B9A'
  }

  pfpTypes.forEach((pfp, idx) => {
    const startCol = 4 + idx * pfpSubCount
    const endCol = startCol + pfpSubCount - 1
    ws.mergeCells(1, startCol, 1, endCol)
    const cell = ws.getCell(1, startCol)
    cell.value = pfp
    cell.font = { bold: true, color: { argb: COL_WHITE }, size: 12 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pfpColors[pfp] } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: pfpColors[pfp] } } }
  })

  // --- Row 2: Sub-column headers ---
  const headerRow = ws.getRow(2)
  headerRow.height = 22
  headerRow.values = allCols.map(c => {
    const parts = c.header.split(' ')
    if (parts.length > 1 && pfpTypes.includes(parts[0])) return parts.slice(1).join(' ')
    return c.header
  })

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 9, color: { argb: 'FF333333' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
    }
  })

  // --- Data rows ---
  rows.forEach((r, rowIndex) => {
    const rowData = { nom: r.nom, prenom: r.prenom, classe: r.classe }

    pfpTypes.forEach(pfp => {
      const d = r[pfp] || {}
      rowData[`${pfp}_Place`] = d.placeName || ''
      rowData[`${pfp}_Institution`] = d.institutionName || ''
      rowData[`${pfp}_Praticien`] = d.praticienName || ''
      rowData[`${pfp}_Note`] = d.note || ''
      rowData[`${pfp}_Rattrap.`] = d.noteRetake || ''
      rowData[`${pfp}_Statut`] = (d.statut && d.statut !== '—') ? d.statut : ''
      rowData[`${pfp}_Attribution`] = d.attributionType || ''
      rowData[`${pfp}_Abs.`] = d.absences || ''
      rowData[`${pfp}_Remarques`] = d.remarques || ''
      rowData[`${pfp}_Cas part.`] = (d.casColor && d.casColor !== 'blanc') ? `${d.casColor}${d.casComment ? ': ' + d.casComment : ''}` : ''
    })

    const excelRow = ws.addRow(rowData)
    const isEven = rowIndex % 2 === 0
    const bgColor = isEven ? COL_WHITE : COL_LIGHT_GRAY

    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
        right: { style: 'hair', color: { argb: 'FFE0E0E0' } }
      }
    })

    // Style base columns
    excelRow.getCell(1).font = { bold: true, size: 9 }
    excelRow.getCell(2).font = { bold: true, size: 9 }

    // Style PFP sub-columns
    pfpTypes.forEach((pfp, pfpIdx) => {
      const baseCol = 4 + pfpIdx * pfpSubCount
      const d = r[pfp] || {}

      // Background tint per PFP status
      let pfpBg = bgColor
      if (d.statut === 'Réussi') pfpBg = COL_LIGHT_GREEN
      else if (d.statut === 'Échec' || d.statut === 'Arrêt') pfpBg = COL_LIGHT_RED
      else if (d.statut === 'En cours' || d.statut === 'Publié') pfpBg = COL_LIGHT_ORANGE
      else if (d.statut === 'Brouillon') pfpBg = COL_LIGHT_BLUE

      for (let i = 0; i < pfpSubCount; i++) {
        const cell = excelRow.getCell(baseCol + i)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pfpBg } }
      }

      // Note color
      const noteCell = excelRow.getCell(baseCol + 3)
      if (d.note) {
        const n = String(d.note).trim().toUpperCase()
        if (n === 'F') noteCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
        else if (['A', 'B', 'C', 'D', 'E'].includes(n)) noteCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      }

      // Retake color
      const retakeCell = excelRow.getCell(baseCol + 4)
      if (d.noteRetake) {
        const n = String(d.noteRetake).trim().toUpperCase()
        if (n === 'F') retakeCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
        else if (['A', 'B', 'C', 'D', 'E'].includes(n)) retakeCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      }

      // Statut color
      const statutCell = excelRow.getCell(baseCol + 5)
      if (d.statut === 'Réussi') statutCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (d.statut === 'Échec' || d.statut === 'Arrêt') statutCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
      else if (d.statut === 'En cours' || d.statut === 'Publié') statutCell.font = { bold: true, size: 9, color: { argb: COL_ORANGE_TEXT } }

      // Absences color
      const absCell = excelRow.getCell(baseCol + 7)
      if (d.absences > 0) absCell.font = { bold: true, size: 9, color: { argb: COL_ORANGE_TEXT } }

      // Separator border on last sub-col of each PFP
      const lastCell = excelRow.getCell(baseCol + pfpSubCount - 1)
      lastCell.border = {
        ...lastCell.border,
        right: { style: 'thin', color: { argb: 'FF999999' } }
      }
    })
  })

  // --- Separator borders on header row 2 ---
  pfpTypes.forEach((pfp, pfpIdx) => {
    const lastCol = 3 + (pfpIdx + 1) * pfpSubCount
    const cell2 = headerRow.getCell(lastCol)
    cell2.border = { ...cell2.border, right: { style: 'thin', color: { argb: 'FF999999' } } }
  })

  // --- Freeze panes ---
  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 2 }]

  // --- Auto-filter ---
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2 + rows.length, column: allCols.length } }

  // --- Download ---
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `vue-ensemble-fp-${new Date().toISOString().slice(0, 10)}.xlsx`
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

.pfp-cell {
  padding: 0.35rem 0.4rem;
  border-radius: 6px;
  min-height: 2.5rem;
  border-left: 3px solid transparent;
}

.pfp-cell-success { border-left-color: #22c55e; background: rgba(34, 197, 94, 0.06); }
.pfp-cell-fail { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.06); }
.pfp-cell-progress { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.06); }
.pfp-cell-draft { border-left-color: #94a3b8; background: rgba(148, 163, 184, 0.06); }

.pfp-place { line-height: 1.2; word-break: break-word; }
.pfp-inst { line-height: 1.1; }

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

.note-badge-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
}

.note-pass { background: #DCFCE7; color: #166534; }
.note-fail { background: #FEE2E2; color: #991B1B; }
.note-none { background: #F1F5F9; color: #64748B; }

.cas-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: help;
}

.cas-vert { background: #28a745; }
.cas-orange { background: #fd7e14; }
.cas-rouge { background: #dc3545; }
.cas-noir { background: #343a40; }

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
  padding: 0.25rem 0.2rem;
  vertical-align: top;
}

.ensemble-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

.ensemble-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}
</style>
