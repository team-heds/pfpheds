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
      <div class="flex flex-wrap gap-2 mb-3">
        <div class="flex-1" style="min-width: 140px">
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
        <div class="flex-1" style="min-width: 140px">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-purple-100 border-circle p-2"><i class="pi pi-briefcase text-purple-500 text-xl"></i></div>
              <div>
                <h3 class="text-xl font-bold text-900 m-0">{{ stats.totalStages }}</h3>
                <p class="text-600 m-0 text-xs">Stages</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1" style="min-width: 140px">
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
        <div class="flex-1" style="min-width: 140px">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-cyan-100 border-circle p-2"><i class="pi pi-send text-cyan-500 text-xl"></i></div>
              <div>
                <h3 class="text-xl font-bold text-cyan-600 m-0">{{ stats.attributed }}</h3>
                <p class="text-600 m-0 text-xs">Attribués</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1" style="min-width: 140px">
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
        <div class="flex-1" style="min-width: 140px">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-red-100 border-circle p-2"><i class="pi pi-times-circle text-red-500 text-xl"></i></div>
              <div>
                <h3 class="text-xl font-bold text-red-600 m-0">{{ stats.failed }}</h3>
                <p class="text-600 m-0 text-xs">Échecs / Arrêts</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1" style="min-width: 140px">
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

          <!-- Critères -->
          <Column header="Critères" style="min-width: 180px">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1" v-if="data.criteria && Object.values(data.criteria).some(v => v)">
                <Tag v-for="c in criteriaLabels" :key="c" v-show="data.criteria[c]" :value="c" class="text-xs criteria-tag" severity="info" />
              </div>
              <span v-else class="text-400 text-xs">—</span>
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

          <!-- Remarques (depuis Validation Places → student_result_vote.remarques) -->
          <Column field="assignmentNotes" header="Remarques" style="min-width: 160px">
            <template #body="{ data }">
              <span v-if="data.assignmentNotes" class="text-xs text-700" :title="data.assignmentNotes">{{ truncate(data.assignmentNotes, 30) }}</span>
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

          <!-- Prioritaire -->
          <Column field="isPrioritaire" header="Prio." sortable style="min-width: 70px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <i v-if="data.isPrioritaire" class="pi pi-star-fill text-yellow-500" v-tooltip.top="'Étudiant prioritaire'"></i>
                <span v-else class="text-400 text-xs">—</span>
              </div>
            </template>
          </Column>

          <!-- CPT -->
          <Column field="cpt" header="CPT" sortable style="min-width: 80px">
            <template #body="{ data }">
              <div class="flex align-items-center justify-content-center gap-1">
                <i v-if="data.cpt === true" class="pi pi-check text-green-500" v-tooltip.top="'Validé'"></i>
                <i v-else-if="data.cpt === false" class="pi pi-times text-red-500" v-tooltip.top="'Non conforme'"></i>
                <i v-else class="pi pi-circle text-400" style="opacity:0.6" v-tooltip.top="'Non renseigné'"></i>
                <i v-if="data.cptComment" class="pi pi-comment text-blue-500 text-xs" v-tooltip.top="data.cptComment"></i>
              </div>
            </template>
          </Column>

          <!-- Évaluation -->
          <Column field="eval" header="Eval" sortable style="min-width: 80px">
            <template #body="{ data }">
              <div class="flex align-items-center justify-content-center gap-1">
                <i v-if="data.eval === true" class="pi pi-check text-green-500" v-tooltip.top="'Validé'"></i>
                <i v-else-if="data.eval === false" class="pi pi-times text-red-500" v-tooltip.top="'Non conforme'"></i>
                <i v-else class="pi pi-circle text-400" style="opacity:0.6" v-tooltip.top="'Non renseigné'"></i>
                <i v-if="data.evalComment" class="pi pi-comment text-blue-500 text-xs" v-tooltip.top="data.evalComment"></i>
              </div>
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

// Raw data kept for multi-sheet Excel export
const rawInstitutions = ref([])
const rawPlaces = ref([])
const rawAssignments = ref([])
const rawNotes = ref([])
const rawSuivis = ref([])
const rawCptEval = ref([])
const priorityUserIdsMap = ref(new Map())

const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const pfpTypes = ['PFP1', 'PFP2', 'PFP3', 'PFP4']
const pfpOptions = ['PFP1', 'PFP2', 'PFP3', 'PFP4']

const statutOptions = [
  { label: 'Validé / Réussi', value: 'Réussi' },
  { label: 'Attribué', value: 'Attribué' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Échec', value: 'Échec' },
  { label: 'Arrêt', value: 'Arrêt' },
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
  if (statuts.some(s => s === 'Réussi' || s === 'En cours' || s === 'Attribué')) return 'avatar-partial'
  return 'avatar-none'
}

const getFlatAvatarClass = (row) => {
  if (row.statut === 'Réussi') return 'avatar-complete'
  if (row.statut === 'En cours' || row.statut === 'Attribué' || row.statut === 'Brouillon') return 'avatar-partial'
  if (row.statut === 'Échec' || row.statut === 'Arrêt') return 'avatar-fail'
  return 'avatar-none'
}

const getPfpSeverity = (pfp) => {
  if (pfp === 'PFP1') return 'info'
  if (pfp === 'PFP2') return 'warning'
  if (pfp === 'PFP3') return 'success'
  if (pfp === 'PFP4') return 'secondary'
  return null
}

const getStatutSeverity = (statut) => {
  if (statut === 'Réussi') return 'success'
  if (statut === 'Attribué') return 'info'
  if (statut === 'En cours') return 'warning'
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
  const withData = rows.filter(r => r.statut !== '—')
  return {
    totalStudents: studentIds.size,
    totalStages: withData.length,
    validated: rows.filter(r => r.statut === 'Réussi').length,
    attributed: rows.filter(r => r.statut === 'Attribué' || r.statut === 'Brouillon').length,
    inProgress: rows.filter(r => r.statut === 'En cours').length,
    failed: rows.filter(r => r.statut === 'Échec' || r.statut === 'Arrêt').length,
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
      const prioSet = priorityUserIdsMap.value.get(pfpType)
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
        assignmentNotes: d.assignmentNotes || '',
        statut: d.statut || '—',
        casColor: d.casColor || null,
        casComment: d.casComment || null,
        attributionType: d.attributionType || null,
        isPrioritaire: prioSet ? prioSet.has(r.userId) : false,
        cpt: d.cpt ?? null,
        cptComment: d.cptComment || '',
        eval: d.eval ?? null,
        evalComment: d.evalComment || '',
        criteria: d.criteria || {}
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
      notesResult,
      cptEvalResult,
      prioSessionsResult
    ] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, pfp_valided'),
      supabase.from('student_result_vote').select('*').order('year', { ascending: false }),
      supabase.from('places').select('*'),
      supabase.from('institutions').select('*'),
      supabase.from('praticiens_formateurs').select('id, nom, prenom'),
      supabase.from('suivi_cas_particuliers').select('*'),
      supabase.from('StudentsPhysio').select('*'),
      supabase.from('recap_cpt_evaluation').select('*'),
      supabase.from('votation_sessions').select('pfp_type, priority_user_ids').eq('is_priority', true)
    ])

    // Build priority user IDs map (pfp_type -> Set of user_ids), normalise PFP1A/PFP1B → PFP1
    const normPfpType = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
    const prioMap = new Map()
    if (prioSessionsResult.data) {
      prioSessionsResult.data.forEach(s => {
        if (s.pfp_type && Array.isArray(s.priority_user_ids)) {
          const key = normPfpType(s.pfp_type)
          const existing = prioMap.get(key) || new Set()
          s.priority_user_ids.forEach(id => existing.add(id))
          prioMap.set(key, existing)
        }
      })
    }
    priorityUserIdsMap.value = prioMap

    const instMap = new Map()
    if (institutionsResult.data) institutionsResult.data.forEach(i => instMap.set(i.InstitutionId, i.Name))

    const placesMap = new Map()
    if (placesResult.data) placesResult.data.forEach(p => {
      placesMap.set(p.PlaceId, {
        name: p.NomPlace,
        institution: instMap.get(p.InstitutionId) || '',
        MSQ: !!p.MSQ, SYSINT: !!p.SYSINT, NEUROGER: !!p.NEUROGER,
        AIGU: !!p.AIGU, REHAB: !!p.REHAB, AMBU: !!p.AMBU, FR: !!p.FR, DE: !!p.DE
      })
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

    // Normaliser PFP1A/PFP1B → PFP1
    const normalizePfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
    const assignMap = new Map()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (!a.user_id || !a.pfp_type) return
        const key = `${a.user_id}__${normalizePfp(a.pfp_type)}`
        if (!assignMap.has(key)) assignMap.set(key, a)
      })
    }

    // Helper: extract normalized criteria from a stage object (supports upper+lower case keys)
    const extractCriteria = (obj) => {
      if (!obj) return { MSQ: false, SYSINT: false, NEUROGER: false, AIGU: false, REHAB: false, AMBU: false, FR: false, DE: false }
      return {
        MSQ: !!(obj.MSQ || obj.msq), SYSINT: !!(obj.SYSINT || obj.sysint), NEUROGER: !!(obj.NEUROGER || obj.neuroger),
        AIGU: !!(obj.AIGU || obj.aigu), REHAB: !!(obj.REHAB || obj.rehab), AMBU: !!(obj.AMBU || obj.ambu),
        FR: !!(obj.FR || obj.fr), DE: !!(obj.DE || obj.de)
      }
    }

    // Default PFP type by array index in pfp_valided (legacy Firebase convention)
    // index 0 = PFP1, index 1 = PFP2, index 2 = PFP3, index 3 = PFP4
    const pfpTypeByIndex = ['PFP1', 'PFP2', 'PFP3', 'PFP4']

    const validatedMap = new Map()
    // Also build a per-user map of ALL stage criteria from pfp_valided (like VerificationCriteresEtudiants)
    const allStageCriteriaMap = new Map()
    if (physioResult.data) {
      physioResult.data.forEach(physio => {
        if (!physio.pfp_valided) return
        const pfpArray = parsePfpValided(physio.pfp_valided)
        pfpArray.forEach((stage, idx) => {
          const rawType = stage.pfp_type || stage.pfpLevel || pfpTypeByIndex[idx] || ''
          const pfpType = normalizePfp(rawType)
          if (!pfpType) return
          const key = `${physio.user_id}__${pfpType}`
          if (!validatedMap.has(key)) validatedMap.set(key, stage)
        })
        // Store all stages for criteria aggregation
        allStageCriteriaMap.set(physio.user_id, pfpArray)
      })
    }

    // Also process pfp2_data (separate PFP2 data for BA24)
    if (notesResult.data) {
      notesResult.data.forEach(physio => {
        if (!physio.pfp2_data) return
        let pfp2Arr = []
        if (Array.isArray(physio.pfp2_data)) pfp2Arr = physio.pfp2_data
        else if (typeof physio.pfp2_data === 'object') pfp2Arr = [physio.pfp2_data]
        pfp2Arr.forEach(stage => {
          const pfpType = stage.pfp_type || 'PFP2'
          const key = `${physio.user_id}__${pfpType}`
          if (!validatedMap.has(key)) validatedMap.set(key, stage)
        })
        // Merge into allStageCriteriaMap
        const existing = allStageCriteriaMap.get(physio.user_id) || []
        allStageCriteriaMap.set(physio.user_id, [...existing, ...pfp2Arr])
      })
    }

    // Pour PFP1, les notes peuvent être dans pfp1a ou pfp1b — on prend celle qui a une valeur
    const getPfp1NoteKey = (notesData) => {
      if (notesData?.pfp1b) return 'pfp1b'
      return 'pfp1a'
    }
    const pfpSuiviKeys = { 'PFP1': 'pfp1', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }
    const pfpCptKeys = { 'PFP1': 'pfp1', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }

    const cptMap = new Map()
    if (cptEvalResult.data) cptEvalResult.data.forEach(c => {
      cptMap.set(c.user_id, c)
    })

    const rows = []
    studentsData.forEach(s => {
      const userId = s.id
      const notesData = notesMap.get(userId)
      const suiviData = suiviMap.get(userId)
      const cptData = cptMap.get(userId)

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
        const noteKey = pfpType === 'PFP1' ? getPfp1NoteKey(notesData) : { 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }[pfpType]
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
        let placeId = null

        if (assignment) {
          placeId = assignment.assigned_place_id || null
          const placeInfo = placeId ? placesMap.get(placeId) : null
          placeName = assignment.assigned_place_name || placeInfo?.name || ''
          institutionName = assignment.assigned_institution_name || placeInfo?.institution || ''
          year = assignment.year || ''
          if (assignment.assigned_praticien_id) praticienName = pratMap.get(String(assignment.assigned_praticien_id)) || ''
          if (assignment.assigned_rank === 99) attributionType = 'Aléatoire'
          else if (assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) attributionType = `Choix ${assignment.assigned_rank}`

          if (assignment.pfp_validee) statut = 'Réussi'
          else if (assignment.pfp_echec) statut = 'Échec'
          else if (assignment.pfp_arret) statut = 'Arrêt'
          else if (assignment.status === 'published') statut = 'En cours'
          else if (assignment.status === 'draft') statut = 'Brouillon'
          else statut = 'Attribué'

        } else if (validatedStage) {
          placeId = validatedStage.PlaceId || validatedStage.ID_PFP || validatedStage.id_pfp
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

        const cptKey = pfpCptKeys[pfpType]
        const cptVal = cptData?.[cptKey + '_cpt']
        const evalVal = cptData?.[cptKey + '_eval']
        const cptComment = cptData?.[cptKey + '_cpt_comment'] || ''
        const evalComment = cptData?.[cptKey + '_eval_comment'] || ''

        // Resolve criteria: from places table first, then fallback to embedded criteria in pfp_valided stage object
        const placeInfo = placeId ? placesMap.get(placeId) : null
        let criteria
        if (placeInfo) {
          criteria = extractCriteria(placeInfo)
        } else if (validatedStage) {
          criteria = extractCriteria(validatedStage)
        } else {
          criteria = extractCriteria(null)
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
          assignmentNotes: assignment?.remarques || '',
          statut,
          attributionType,
          casColor: casData?.couleur || null,
          casComment: casData?.commentaire || null,
          cpt: cptVal,
          cptComment,
          eval: evalVal,
          evalComment,
          criteria
        }
      })

      rows.push(row)
    })

    const collator = new Intl.Collator('fr', { sensitivity: 'base' })
    rows.sort((a, b) => collator.compare(a.nom, b.nom))

    allRows.value = rows

    // Store raw data for multi-sheet export
    rawInstitutions.value = institutionsResult.data || []
    rawPlaces.value = placesResult.data || []
    rawAssignments.value = assignmentsResult.data || []
    rawNotes.value = notesResult.data || []
    rawSuivis.value = suiviResult.data || []
    rawCptEval.value = cptEvalResult.data || []

    const uniqueClasses = [...new Set(rows.map(r => r.classe).filter(c => c && c !== '-'))].sort()
    if (uniqueClasses.length > 0) classesList.value = uniqueClasses

  } catch (e) {
    console.error('Erreur fetchAllData:', e)
  } finally {
    loading.value = false
  }
}

// ─── Helper: style a header row ───
const styleHeaderRow = (ws, rowNum, colCount, bgArgb = 'FFE0E0E0') => {
  const row = ws.getRow(rowNum)
  row.height = 22
  row.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > colCount) return
    cell.font = { bold: true, size: 9, color: { argb: 'FF333333' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } }
  })
}

const styleDataCell = (cell, isEven) => {
  cell.font = { size: 9 }
  cell.alignment = { vertical: 'middle', wrapText: true }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF5F5F5' } }
  cell.border = { bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } } }
}

const exportXLSX = async () => {
  const rows = filteredRows.value
  if (rows.length === 0) return

  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Plateforme HEdS'
  wb.created = new Date()

  // ── Shared colors ──
  const COL_BLUE = 'FF1E3A5F'
  const COL_WHITE = 'FFFFFFFF'
  const COL_LIGHT_GREEN = 'FFE6F4EA'
  const COL_LIGHT_RED = 'FFFCE8E6'
  const COL_LIGHT_ORANGE = 'FFFFF3E0'
  const COL_LIGHT_BLUE = 'FFE8F0FE'
  const COL_LIGHT_GRAY = 'FFF5F5F5'
  const COL_GREEN_TEXT = 'FF1B7A3D'
  const COL_RED_TEXT = 'FFC62828'
  const COL_ORANGE_TEXT = 'FFE65100'
  const pfpColors = { 'PFP1': 'FF1565C0', 'PFP2': 'FFE65100', 'PFP3': 'FF2E7D32', 'PFP4': 'FF6A1B9A' }

  // ── Maps for lookups ──
  const instMap = new Map()
  rawInstitutions.value.forEach(i => instMap.set(i.InstitutionId, i))
  const placeInstName = (p) => instMap.get(p.InstitutionId)?.Name || ''

  // ════════════════════════════════════════════
  // SHEET 1: Base données (Institutions + critères)
  // ════════════════════════════════════════════
  const wsBD = wb.addWorksheet('Base données')
  wsBD.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Institutions', key: 'name', width: 35 },
    { header: 'Lieu', key: 'lieu', width: 18 },
    { header: 'MSQ', key: 'MSQ', width: 6 },
    { header: 'Sys Int', key: 'SYSINT', width: 8 },
    { header: 'Neuro-Ger', key: 'NEUROGER', width: 10 },
    { header: 'Aigu', key: 'AIGU', width: 6 },
    { header: 'Réhab', key: 'REHAB', width: 7 },
    { header: 'Cabinet', key: 'AMBU', width: 8 },
    { header: 'Langue', key: 'langue', width: 8 },
    { header: 'Convention', key: 'convention', width: 14 },
    { header: 'Accord-Cadre', key: 'accord', width: 14 }
  ]
  styleHeaderRow(wsBD, 1, 12, COL_BLUE)
  wsBD.getRow(1).eachCell(c => { c.font = { bold: true, size: 9, color: { argb: COL_WHITE } } })

  // Build unique institutions from places (one row per place for criteria)
  const placesForBD = [...rawPlaces.value].sort((a, b) => (placeInstName(a) || '').localeCompare(placeInstName(b) || ''))
  placesForBD.forEach((p, idx) => {
    const inst = instMap.get(p.InstitutionId)
    const fmtDate = (d) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('fr-CH') } catch { return '' } }
    const row = wsBD.addRow({
      id: p.PlaceId || idx + 1,
      name: placeInstName(p) + (p.NomPlace ? ' - ' + p.NomPlace : ''),
      lieu: inst?.Locality || '',
      MSQ: p.MSQ ? 1 : '',
      SYSINT: p.SYSINT ? 1 : '',
      NEUROGER: p.NEUROGER ? 1 : '',
      AIGU: p.AIGU ? 1 : '',
      REHAB: p.REHAB ? 1 : '',
      AMBU: p.AMBU ? 1 : '',
      langue: p.FR ? 'FR' : p.DE ? 'ALL' : '',
      convention: fmtDate(inst?.ConventionDate),
      accord: fmtDate(inst?.AccordCadreDate)
    })
    row.eachCell({ includeEmpty: true }, (cell) => styleDataCell(cell, idx % 2 === 0))
  })
  wsBD.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // ════════════════════════════════════════════
  // SHEET 2: Modèle répartition PDS
  // ════════════════════════════════════════════
  const wsRP = wb.addWorksheet('Modèle répartition PDS')

  // Determine available years from places PFP data
  const availableYears = new Set()
  rawPlaces.value.forEach(p => {
    pfpTypes.forEach(pfp => {
      if (p[pfp] && typeof p[pfp] === 'object') {
        Object.keys(p[pfp]).forEach(y => availableYears.add(y))
      }
    })
  })
  const years = [...availableYears].sort()

  // Build columns: ID, Institution, Domaine, Nom, Prénom, PF, Formateur HES, then PFP counts per year
  const rpBaseCols = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Institution', key: 'institution', width: 30 },
    { header: 'Domaine d\'expertise', key: 'domaine', width: 22 },
    { header: 'Nom étudiant·es', key: 'nom', width: 16 },
    { header: 'Prénom étudiant·es', key: 'prenom', width: 14 },
    { header: 'PF', key: 'pf', width: 20 },
    { header: 'Formateur·trice HES', key: 'formateurHES', width: 20 }
  ]
  const rpPfpCols = []
  years.forEach(y => {
    pfpTypes.forEach(pfp => {
      rpPfpCols.push({ header: `${pfp} ${y}`, key: `${pfp}_${y}`, width: 8 })
    })
  })
  const rpFactCols = [
    { header: 'Absences', key: 'absences', width: 10 },
    { header: 'Notes', key: 'notes', width: 8 }
  ]
  wsRP.columns = [...rpBaseCols, ...rpPfpCols, ...rpFactCols]

  // Row 1: merged title
  const rpTotalCols = rpBaseCols.length + rpPfpCols.length + rpFactCols.length
  wsRP.mergeCells(1, 1, 1, rpTotalCols)
  const rpTitle = wsRP.getCell(1, 1)
  rpTitle.value = 'Répartition Places de Stages - Données Plateforme HEdS'
  rpTitle.font = { bold: true, size: 12, color: { argb: COL_WHITE } }
  rpTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_BLUE } }
  rpTitle.alignment = { horizontal: 'center', vertical: 'middle' }
  wsRP.getRow(1).height = 30

  // Row 2: year group headers
  const rpRow2 = wsRP.getRow(2)
  rpRow2.height = 20
  // Base cols merged
  if (rpBaseCols.length > 1) wsRP.mergeCells(2, 1, 2, rpBaseCols.length)
  wsRP.getCell(2, 1).value = ''
  // Year groups
  let colOffset = rpBaseCols.length + 1
  years.forEach(y => {
    const startC = colOffset
    const endC = colOffset + pfpTypes.length - 1
    if (endC > startC) wsRP.mergeCells(2, startC, 2, endC)
    const cell = wsRP.getCell(2, startC)
    cell.value = `Année ${y}`
    cell.font = { bold: true, size: 9, color: { argb: COL_WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    colOffset += pfpTypes.length
  })

  // Row 3: sub-headers
  const rpRow3 = wsRP.getRow(3)
  rpRow3.height = 22
  const rpHeaders = wsRP.columns.map(c => {
    const parts = (c.header || '').split(' ')
    if (parts.length === 2 && pfpTypes.includes(parts[0])) return parts[0]
    return c.header
  })
  rpRow3.values = rpHeaders
  styleHeaderRow(wsRP, 3, rpTotalCols)

  // Data: one row per place
  const rpPlaces = [...rawPlaces.value].sort((a, b) => (placeInstName(a) || '').localeCompare(placeInstName(b) || ''))
  rpPlaces.forEach((p, idx) => {
    const rowData = {
      id: p.PlaceId,
      institution: placeInstName(p) + (p.NomPlace ? '\n' + p.NomPlace : ''),
      domaine: p.Domaine || p.Category || '',
      nom: '', prenom: '', pf: '', formateurHES: '',
      absences: '', notes: ''
    }
    years.forEach(y => {
      pfpTypes.forEach(pfp => {
        rowData[`${pfp}_${y}`] = parseInt(p[pfp]?.[y]) || 0
      })
    })
    const row = wsRP.addRow(rowData)
    row.eachCell({ includeEmpty: true }, (cell) => styleDataCell(cell, idx % 2 === 0))
  })
  wsRP.views = [{ state: 'frozen', xSplit: 3, ySplit: 3 }]

  // ════════════════════════════════════════════
  // SHEETS: Vérif. BAxx (one per cohort/classe)
  // ════════════════════════════════════════════
  const cohorts = [...new Set(allRows.value.map(r => r.classe).filter(c => c && c !== '-'))].sort()
  const pfpNoteKeysExport = { 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }

  // Build a map of place criteria by PlaceId
  const placeCriteriaMap = new Map()
  rawPlaces.value.forEach(p => {
    placeCriteriaMap.set(p.PlaceId, {
      MSQ: !!p.MSQ, SYSINT: !!p.SYSINT, NEUROGER: !!p.NEUROGER,
      AIGU: !!p.AIGU, REHAB: !!p.REHAB, AMBU: !!p.AMBU, FR: !!p.FR, DE: !!p.DE
    })
  })

  // Build criteria counts per student from row data (already resolved from places + pfp_valided)
  const studentCriteria = new Map()
  allRows.value.forEach(r => {
    const counts = { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 }
    pfpTypes.forEach(pfp => {
      const d = r[pfp]
      if (!d || d.statut === '—') return
      const crit = d.criteria
      if (crit) {
        criteriaLabels.forEach(c => { if (crit[c]) counts[c]++ })
      }
    })
    studentCriteria.set(r.userId, counts)
  })

  cohorts.forEach(cohort => {
    const wsName = `Vérif. ${cohort}`.substring(0, 31)
    const wsV = wb.addWorksheet(wsName)
    wsV.columns = [
      { header: 'Nom', key: 'nom', width: 18 },
      { header: 'Prénom', key: 'prenom', width: 14 },
      { header: 'PFP1', key: 'pfp1', width: 8 },
      { header: 'PFP2', key: 'pfp2', width: 8 },
      { header: 'PFP3', key: 'pfp3', width: 8 },
      { header: 'PFP4', key: 'pfp4', width: 8 },
      { header: 'MSQ', key: 'MSQ', width: 7 },
      { header: 'SYSINT', key: 'SYSINT', width: 8 },
      { header: 'NEURO-GER', key: 'NEUROGER', width: 10 },
      { header: 'AIGU', key: 'AIGU', width: 7 },
      { header: 'REHAB', key: 'REHAB', width: 8 },
      { header: 'AMBU', key: 'AMBU', width: 7 },
      { header: 'FR', key: 'FR', width: 6 },
      { header: 'ALL', key: 'DE', width: 6 },
      { header: 'complet ?', key: 'complet', width: 12 }
    ]
    styleHeaderRow(wsV, 1, 15)

    const cohortStudents = allRows.value.filter(r => r.classe === cohort)
    cohortStudents.forEach((r, idx) => {
      const criteria = studentCriteria.get(r.userId) || {}
      const allOk = criteriaLabels.every(c => (criteria[c] || 0) > 0)
      const row = wsV.addRow({
        nom: r.nom, prenom: r.prenom,
        pfp1: '', pfp2: '', pfp3: '', pfp4: '',
        MSQ: criteria.MSQ || 0,
        SYSINT: criteria.SYSINT || 0,
        NEUROGER: criteria.NEUROGER || 0,
        AIGU: criteria.AIGU || 0,
        REHAB: criteria.REHAB || 0,
        AMBU: criteria.AMBU || 0,
        FR: criteria.FR || 0,
        DE: criteria.DE || 0,
        complet: allOk ? 'complet' : 'incomplet'
      })
      row.eachCell({ includeEmpty: true }, (cell) => styleDataCell(cell, idx % 2 === 0))
      // Color the "complet" cell
      const completCell = row.getCell(15)
      if (allOk) {
        completCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
        completCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_LIGHT_GREEN } }
      } else {
        completCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
        completCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_LIGHT_RED } }
      }
    })
    wsV.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }]
  })

  // ════════════════════════════════════════════
  // SHEETS: PFP xx - BAxx (one per PFP/cohort with assignments)
  // ════════════════════════════════════════════
  // Group assignments by pfp_type + year
  const normPfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
  const assignGroups = new Map()
  rawAssignments.value.forEach(a => {
    if (!a.pfp_type || !a.year) return
    const key = `${normPfp(a.pfp_type)}__${a.year}`
    if (!assignGroups.has(key)) assignGroups.set(key, [])
    assignGroups.get(key).push(a)
  })

  // Also add entries from allRows that have notes but no assignment
  allRows.value.forEach(r => {
    pfpTypes.forEach(pfp => {
      const d = r[pfp]
      if (!d || d.statut === '—') return
      const year = d.year || ''
      if (!year) return
      const key = `${pfp}__${year}`
      // Check if already in assignments
      const existing = rawAssignments.value.find(a => a.user_id === r.userId && normPfp(a.pfp_type) === pfp)
      if (!existing && d.note) {
        if (!assignGroups.has(key)) assignGroups.set(key, [])
        assignGroups.get(key).push({
          user_id: r.userId,
          pfp_type: pfp,
          year,
          assigned_place_name: d.placeName,
          assigned_institution_name: d.institutionName,
          _fromNotes: true
        })
      }
    })
  })

  // Build student lookup
  const studentMap = new Map()
  allRows.value.forEach(r => studentMap.set(r.userId, r))

  // Build notes lookup
  const notesMap = new Map()
  rawNotes.value.forEach(n => notesMap.set(n.user_id, n))

  // Build CPT/Eval lookup
  const cptEvalMap = new Map()
  rawCptEval.value.forEach(c => cptEvalMap.set(c.user_id, c))
  const pfpCptKeysExport = { 'PFP1': 'pfp1', 'PFP2': 'pfp2', 'PFP3': 'pfp3', 'PFP4': 'pfp4' }
  const cptLabel = (val) => val === true ? 'Validé' : val === false ? 'Non conforme' : ''

  // Build praticiens lookup from assignments
  const pratMap = new Map()
  rawAssignments.value.forEach(a => {
    if (a.assigned_praticien_name) pratMap.set(a.assigned_praticien_id, a.assigned_praticien_name)
  })

  // PFP label mapping for sheet names
  const pfpSheetLabels = { 'PFP1': 'PFP 1', 'PFP1A': 'PFP 1', 'PFP1B': 'PFP 1', 'PFP2': 'PFP 2', 'PFP3': 'PFP 3', 'PFP4': 'PFP 4' }

  // Sort keys for consistent ordering
  const sortedKeys = [...assignGroups.keys()].sort((a, b) => {
    const [pfpA, yearA] = a.split('__')
    const [pfpB, yearB] = b.split('__')
    if (yearA !== yearB) return yearA.localeCompare(yearB)
    return pfpTypes.indexOf(pfpA) - pfpTypes.indexOf(pfpB)
  })

  sortedKeys.forEach(groupKey => {
    const [pfpType, year] = groupKey.split('__')
    const assignments = assignGroups.get(groupKey)
    if (!assignments || assignments.length === 0) return

    // Determine cohort from the students in this group
    const cohortSet = new Set()
    assignments.forEach(a => {
      const s = studentMap.get(a.user_id)
      if (s?.classe) cohortSet.add(s.classe)
    })
    const cohortLabel = cohortSet.size === 1 ? [...cohortSet][0] : year

    const sheetName = `${pfpSheetLabels[pfpType] || pfpType} - ${cohortLabel}`.substring(0, 31)
    // Avoid duplicate sheet names
    const existingNames = wb.worksheets.map(w => w.name)
    let finalName = sheetName
    let counter = 2
    while (existingNames.includes(finalName)) {
      finalName = `${sheetName.substring(0, 28)} ${counter}`
      counter++
    }

    const wsPFP = wb.addWorksheet(finalName)

    // Row 1: title
    const pfpSheetColCount = 13
    wsPFP.columns = [
      { header: 'Institution', key: 'institution', width: 30 },
      { header: 'Critères', key: 'criteres', width: 20 },
      { header: 'Domaine d\'expertise', key: 'domaine', width: 22 },
      { header: 'Nom étudiant·es', key: 'nom', width: 16 },
      { header: 'Prénom étudiant·es', key: 'prenom', width: 14 },
      { header: 'PF', key: 'pf', width: 22 },
      { header: 'Formateur·trice HES', key: 'formateurHES', width: 22 },
      { header: 'CPT', key: 'cptStatus', width: 14 },
      { header: 'Évaluation', key: 'evalStatus', width: 14 },
      { header: 'Particularités', key: 'particularites', width: 18 },
      { header: 'Absences en jours', key: 'absences', width: 14 },
      { header: 'Notes', key: 'notes', width: 8 },
      { header: 'Remarques', key: 'remarques', width: 24 }
    ]

    // Row 1: merged title
    wsPFP.mergeCells(1, 1, 1, pfpSheetColCount)
    const titleCell = wsPFP.getCell(1, 1)
    const pfpLabel = pfpSheetLabels[pfpType] || pfpType
    titleCell.value = `Répartition ${cohortLabel} - ${pfpLabel} - Places de stages ${year}`
    titleCell.font = { bold: true, size: 11, color: { argb: COL_WHITE } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pfpColors[pfpType] || COL_BLUE } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    wsPFP.getRow(1).height = 28

    // Row 2: headers
    const hdrRow = wsPFP.getRow(2)
    hdrRow.values = ['Institution', 'Critères', 'Domaine d\'expertise', 'Nom étudiant·es', 'Prénom étudiant·es', 'PF', 'Formateur·trice HES', 'CPT', 'Évaluation', 'Particularités', 'Absences en jours', 'Notes', 'Remarques']
    styleHeaderRow(wsPFP, 2, pfpSheetColCount)

    // Sort assignments by institution then student name
    const sorted = [...assignments].sort((a, b) => {
      const instA = a.assigned_institution_name || a.assigned_place_name || ''
      const instB = b.assigned_institution_name || b.assigned_place_name || ''
      if (instA !== instB) return instA.localeCompare(instB)
      const sA = studentMap.get(a.user_id)
      const sB = studentMap.get(b.user_id)
      return (sA?.nom || '').localeCompare(sB?.nom || '')
    })

    sorted.forEach((a, idx) => {
      const student = studentMap.get(a.user_id)
      const noteData = notesMap.get(a.user_id)
      const noteKey = pfpType === 'PFP1' ? (noteData?.pfp1b ? 'pfp1b' : 'pfp1a') : pfpNoteKeysExport[pfpType]
      const note = noteData?.[noteKey] || ''
      const absences = Number(noteData?.[noteKey + '_absences']) || ''
      const remarques = noteData?.[noteKey + '_remarques'] || ''

      // Get suivi cas particulier
      const suivi = rawSuivis.value.find(s => s.user_id === a.user_id && s.pfp_field === noteKey)
      const particularites = suivi ? `${suivi.couleur || ''}${suivi.commentaire ? ': ' + suivi.commentaire : ''}` : remarques

      // Get CPT/Eval data
      const cptEvalData = cptEvalMap.get(a.user_id)
      const cptKey = pfpCptKeysExport[pfpType]
      const cptVal = cptEvalData?.[cptKey + '_cpt']
      const evalVal = cptEvalData?.[cptKey + '_eval']
      const cptCom = cptEvalData?.[cptKey + '_cpt_comment'] || ''
      const evalCom = cptEvalData?.[cptKey + '_eval_comment'] || ''

      // Resolve place criteria (from places table, fallback to row data)
      const assignPlaceId = a.assigned_place_id || null
      const assignPlaceInfo = assignPlaceId ? placeCriteriaMap.get(assignPlaceId) : null
      const studentRow = studentMap.get(a.user_id)
      const rowCriteria = studentRow?.[pfpType]?.criteria
      const critSource = assignPlaceInfo || rowCriteria || {}
      const assignCriteria = criteriaLabels.filter(c => critSource[c]).join(', ')

      const row = wsPFP.addRow({
        institution: a.assigned_institution_name || a.assigned_place_name || '',
        criteres: assignCriteria,
        domaine: a.assigned_domaine || '',
        nom: student?.nom || '',
        prenom: student?.prenom || '',
        pf: a.assigned_praticien_name || '',
        formateurHES: a.repondant_hes_name || '',
        cptStatus: cptLabel(cptVal) + (cptCom ? ' (' + cptCom + ')' : ''),
        evalStatus: cptLabel(evalVal) + (evalCom ? ' (' + evalCom + ')' : ''),
        particularites,
        absences,
        notes: hasGrade(note) ? note : '',
        remarques: a.notes || ''
      })
      row.eachCell({ includeEmpty: true }, (cell) => styleDataCell(cell, idx % 2 === 0))

      // Col indices: 1=Institution, 2=Critères, 3=Domaine, 4=Nom, 5=Prénom, 6=PF, 7=FormateurHES, 8=CPT, 9=Eval, 10=Particularités, 11=Absences, 12=Notes
      // Color CPT (col 8)
      const cptCell = row.getCell(8)
      if (cptVal === true) cptCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (cptVal === false) cptCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }

      // Color Eval (col 9)
      const evalCell = row.getCell(9)
      if (evalVal === true) evalCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (evalVal === false) evalCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }

      // Color the note (col 12)
      const noteCell = row.getCell(12)
      const n = String(note).trim().toUpperCase()
      if (n === 'F') noteCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
      else if (['A', 'B', 'C', 'D', 'E'].includes(n)) noteCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }

      // Color absences (col 11)
      const absCell = row.getCell(11)
      if (Number(absences) > 0) absCell.font = { bold: true, size: 9, color: { argb: COL_ORANGE_TEXT } }
    })

    wsPFP.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }]
  })

  // ════════════════════════════════════════════
  // LAST SHEET: Vue d'ensemble (original flat export)
  // ════════════════════════════════════════════
  const wsVE = wb.addWorksheet('Vue d\'ensemble FP')
  const pfpSubCols = ['Place', 'Institution', 'Critères', 'Praticien', 'Note', 'Rattrap.', 'Statut', 'Attribution', 'Abs.', 'Remarques', 'Cas part.', 'CPT', 'Eval']
  const pfpSubCount = pfpSubCols.length

  const baseCols = [
    { header: 'Nom', key: 'nom', width: 16 },
    { header: 'Prénom', key: 'prenom', width: 14 },
    { header: 'Classe', key: 'classe', width: 10 }
  ]
  const allCols = [...baseCols]
  pfpTypes.forEach(pfp => {
    pfpSubCols.forEach(sub => {
      allCols.push({ header: `${pfp} ${sub}`, key: `${pfp}_${sub}`, width: sub === 'Place' ? 22 : sub === 'Institution' ? 20 : sub === 'Critères' ? 20 : sub === 'Praticien' ? 18 : sub === 'Remarques' ? 20 : sub === 'Cas part.' ? 14 : sub === 'CPT' ? 14 : sub === 'Eval' ? 14 : 10 })
    })
  })
  wsVE.columns = allCols

  // Row 1: PFP group headers
  const groupRow = wsVE.getRow(1)
  groupRow.height = 28
  wsVE.mergeCells(1, 1, 1, 3)
  const infoCell = wsVE.getCell(1, 1)
  infoCell.value = 'INFORMATIONS ÉTUDIANT'
  infoCell.font = { bold: true, color: { argb: COL_WHITE }, size: 11 }
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL_BLUE } }
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' }

  pfpTypes.forEach((pfp, idx) => {
    const startCol = 4 + idx * pfpSubCount
    const endCol = startCol + pfpSubCount - 1
    wsVE.mergeCells(1, startCol, 1, endCol)
    const cell = wsVE.getCell(1, startCol)
    cell.value = pfp
    cell.font = { bold: true, color: { argb: COL_WHITE }, size: 12 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pfpColors[pfp] } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // Row 2: sub-headers
  const headerRow = wsVE.getRow(2)
  headerRow.height = 22
  headerRow.values = allCols.map(c => {
    const parts = c.header.split(' ')
    if (parts.length > 1 && pfpTypes.includes(parts[0])) return parts.slice(1).join(' ')
    return c.header
  })
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 9, color: { argb: 'FF333333' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } }, right: { style: 'hair', color: { argb: 'FFCCCCCC' } } }
  })

  // Data rows
  rows.forEach((r, rowIndex) => {
    const rowData = { nom: r.nom, prenom: r.prenom, classe: r.classe }
    pfpTypes.forEach(pfp => {
      const d = r[pfp] || {}
      rowData[`${pfp}_Place`] = d.placeName || ''
      rowData[`${pfp}_Institution`] = d.institutionName || ''
      const crit = d.criteria || {}
      rowData[`${pfp}_Critères`] = criteriaLabels.filter(c => crit[c]).join(', ')
      rowData[`${pfp}_Praticien`] = d.praticienName || ''
      rowData[`${pfp}_Note`] = d.note || ''
      rowData[`${pfp}_Rattrap.`] = d.noteRetake || ''
      rowData[`${pfp}_Statut`] = (d.statut && d.statut !== '—') ? d.statut : ''
      rowData[`${pfp}_Attribution`] = d.attributionType || ''
      rowData[`${pfp}_Abs.`] = d.absences || ''
      rowData[`${pfp}_Remarques`] = d.remarques || ''
      rowData[`${pfp}_Cas part.`] = (d.casColor && d.casColor !== 'blanc') ? `${d.casColor}${d.casComment ? ': ' + d.casComment : ''}` : ''
      const cptText = d.cpt === true ? 'Validé' : d.cpt === false ? 'Non conforme' : ''
      rowData[`${pfp}_CPT`] = cptText + (d.cptComment ? ' (' + d.cptComment + ')' : '')
      const evalText = d.eval === true ? 'Validé' : d.eval === false ? 'Non conforme' : ''
      rowData[`${pfp}_Eval`] = evalText + (d.evalComment ? ' (' + d.evalComment + ')' : '')
    })

    const excelRow = wsVE.addRow(rowData)
    const isEven = rowIndex % 2 === 0
    const bgColor = isEven ? COL_WHITE : COL_LIGHT_GRAY

    excelRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } }, right: { style: 'hair', color: { argb: 'FFE0E0E0' } } }
    })

    excelRow.getCell(1).font = { bold: true, size: 9 }
    excelRow.getCell(2).font = { bold: true, size: 9 }

    pfpTypes.forEach((pfp, pfpIdx) => {
      const baseCol = 4 + pfpIdx * pfpSubCount
      const d = r[pfp] || {}
      let pfpBg = bgColor
      if (d.statut === 'Réussi') pfpBg = COL_LIGHT_GREEN
      else if (d.statut === 'Échec' || d.statut === 'Arrêt') pfpBg = COL_LIGHT_RED
      else if (d.statut === 'En cours' || d.statut === 'Publié') pfpBg = COL_LIGHT_ORANGE
      else if (d.statut === 'Brouillon') pfpBg = COL_LIGHT_BLUE

      for (let i = 0; i < pfpSubCount; i++) {
        excelRow.getCell(baseCol + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pfpBg } }
      }

      // Sub-col indices: 0=Place, 1=Institution, 2=Critères, 3=Praticien, 4=Note, 5=Rattrap, 6=Statut, 7=Attribution, 8=Abs, 9=Remarques, 10=Cas part, 11=CPT, 12=Eval
      const noteCell = excelRow.getCell(baseCol + 4)
      if (d.note) {
        const n = String(d.note).trim().toUpperCase()
        if (n === 'F') noteCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
        else if (['A', 'B', 'C', 'D', 'E'].includes(n)) noteCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      }
      const retakeCell = excelRow.getCell(baseCol + 5)
      if (d.noteRetake) {
        const n = String(d.noteRetake).trim().toUpperCase()
        if (n === 'F') retakeCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
        else if (['A', 'B', 'C', 'D', 'E'].includes(n)) retakeCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      }
      const statutCell = excelRow.getCell(baseCol + 6)
      if (d.statut === 'Réussi') statutCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (d.statut === 'Échec' || d.statut === 'Arrêt') statutCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }
      else if (d.statut === 'En cours' || d.statut === 'Publié') statutCell.font = { bold: true, size: 9, color: { argb: COL_ORANGE_TEXT } }

      if (d.absences > 0) excelRow.getCell(baseCol + 8).font = { bold: true, size: 9, color: { argb: COL_ORANGE_TEXT } }

      // CPT color (index 11)
      const cptCell = excelRow.getCell(baseCol + 11)
      if (d.cpt === true) cptCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (d.cpt === false) cptCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }

      // Eval color (index 12)
      const evalCell = excelRow.getCell(baseCol + 12)
      if (d.eval === true) evalCell.font = { bold: true, size: 9, color: { argb: COL_GREEN_TEXT } }
      else if (d.eval === false) evalCell.font = { bold: true, size: 9, color: { argb: COL_RED_TEXT } }

      excelRow.getCell(baseCol + pfpSubCount - 1).border = {
        bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FF999999' } }
      }
    })
  })

  pfpTypes.forEach((pfp, pfpIdx) => {
    const lastCol = 3 + (pfpIdx + 1) * pfpSubCount
    headerRow.getCell(lastCol).border = { bottom: { style: 'thin', color: { argb: 'FF999999' } }, right: { style: 'thin', color: { argb: 'FF999999' } } }
  })

  wsVE.views = [{ state: 'frozen', xSplit: 3, ySplit: 2 }]
  wsVE.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2 + rows.length, column: allCols.length } }

  // ── Download ──
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Base-donnees-FP-${new Date().toISOString().slice(0, 10)}.xlsx`
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

.criteria-tag {
  font-size: 0.6rem !important;
  padding: 0.1rem 0.3rem !important;
  line-height: 1;
}

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
