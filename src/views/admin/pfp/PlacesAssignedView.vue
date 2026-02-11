<template>
  <AdminLayout>
    <div class="places-assigned-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map-marker text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Places Assignées</h1>
              <p class="text-600 m-0 mt-1">Vue d'ensemble des assignations de stages</p>
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
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.assigned }}</h3>
                <p class="text-600 m-0">Assignées</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-circle text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.available }}</h3>
                <p class="text-600 m-0">Disponibles</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-building text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.institutions }}</h3>
                <p class="text-600 m-0">Institutions</p>
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
            <Dropdown v-model="filterStatus" :options="statusList" optionLabel="label" optionValue="value" placeholder="Statut" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Places Assignées -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredPlacesList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="25">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Assignations</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune assignation trouvée</p>
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
          <Column field="votation_type" header="Votation" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.votation_type" :severity="slotProps.data.votation_type === 'Tirage aléatoire' ? 'success' : 'info'" />
            </template>
          </Column>
          <Column field="place_name" header="Place attribuée" sortable></Column>
          <Column field="institution_name" header="Institution" sortable></Column>
          <Column field="praticien_formateur" header="Praticien formateur" sortable></Column>

          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="slotProps.data.status === 'published' ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-print" class="p-button-text p-button-sm" />
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
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'

const router = useRouter()

const loading = ref(false)
const searchQuery = ref('')
const filterType = ref(null)
const filterYear = ref(null)
const filterClasse = ref(null)
const filterStatus = ref(null)
const placesList = ref([])
const allStudents = ref([])
const showAllStudents = ref(false)

const years = ref(['2025', '2026'])
const classes = ref(['BA23', 'BA24', 'BA25'])
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
    votation: r.votation_type || '',
    place: r.place_name || '',
    institution: r.institution_name || '',
    praticien_formateur: r.praticien_formateur || '',
    statut: r.status || ''
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'assignations')

  const nameParts = ['assignations']
  if (filterYear.value) nameParts.push(filterYear.value)
  if (filterType.value) nameParts.push(filterType.value)
  if (filterClasse.value) nameParts.push(filterClasse.value)
  const filename = `${nameParts.join('_')}.xlsx`

  XLSX.writeFile(wb, filename)
}

watch(showAllStudents, (val) => {
  if (val) {
    filterStatus.value = null
  } else {
    filterStatus.value = 'published'
  }
})

const statusList = ref([
  { label: 'Publié', value: 'published' },
  { label: 'Non attribué', value: 'unassigned' },
  { label: 'Tous', value: null }
])

const stats = ref({
  totalPlaces: 0,
  assigned: 0,
  available: 0,
  institutions: 0
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
    out.push({
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
      _is_unassigned: !assignment
    })
  })

  return out
})

const filteredPlacesList = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  return (baseRows.value || []).filter((row) => {
    if (filterYear.value && row.year !== filterYear.value) return false
    if (filterType.value && row.pfp_type !== filterType.value) return false
    if (filterClasse.value && row.student_class !== filterClasse.value) return false
    if (filterStatus.value && row.status !== filterStatus.value) return false
    if (!q) return true
    return (
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.place_name || '').toLowerCase().includes(q) ||
      (row.institution_name || '').toLowerCase().includes(q)
    )
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
        place
      }
    })

    stats.value = {
      totalPlaces: placesList.value.length,
      assigned: placesList.value.length,
      available: 0,
      institutions: 0
    }
  } catch (e) {
    console.error('Erreur loadPublishedAssignments:', e)
    placesList.value = []
  } finally {
    loading.value = false
  }
}

const viewDetails = (row) => {
  if (!row?.user_id) return
  router.push({ name: 'ProfileAdmin', params: { id: row.user_id } })
}

onMounted(async () => {
  filterStatus.value = 'published'
  await loadPublishedAssignments()
})
</script>

<style scoped>
.places-assigned-page {
  min-height: calc(100vh - 100px);
}
</style>
