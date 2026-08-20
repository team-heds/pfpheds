<template>
  <AdminLayout>
    <div class="repondant-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Gestion des signatures</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-edit text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des signatures</h1>
              <p class="text-600 m-0 mt-1">Vue d'ensemble des assignations avec répondants et signataires</p>
            </div>
          </div>
          <div class="flex gap-2">
            <SplitButton
              label="Assignation de masse"
              icon="pi pi-check-square"
              :model="bulkActions"
              severity="warning"
              :disabled="!filteredList.length"
            />
            <Button icon="pi pi-download" label="Exporter PDF" outlined />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" outlined @click="exportExcel" />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.totalPlaces }}</h3>
                <p class="text-600 m-0">Total Assignations</p>
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
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-clock text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0">En attente</p>
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
      <div class="surface-card fp-dark p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-1 flex align-items-center gap-2">
            <InputSwitch v-model="showAllStudents" />
            <span class="text-600 text-sm">Tous</span>
          </div>
          <div class="col-12 md:col-1">
            <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-1">
            <Dropdown v-model="filterType" :options="typesPFP" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-1">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Classe" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterRepondantHES" :options="repondantsHESList" optionLabel="label" optionValue="value" placeholder="Répondant HES" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterSignataireHES" :options="repondantsHESList" optionLabel="label" optionValue="value" placeholder="Signataire HES" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterValidation" :options="validationOptions" optionLabel="label" optionValue="value" placeholder="Validation" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Répondants -->
      <div class="surface-card fp-dark p-4 border-round shadow-2">
        <DataTable :value="filteredList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="25">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Assignations - Répondants HES</span>
              <Button icon="pi pi-filter-slash" label="Réinitialiser" text @click="resetFilters" />
            </div>
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
          <Column field="institution_name" header="Institution" sortable>
            <template #body="slotProps">
              <span v-if="slotProps.data.institution_name">{{ slotProps.data.institution_name }}</span>
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="place_name" header="Nom Place" sortable>
            <template #body="slotProps">
              <span v-if="slotProps.data.place_name">{{ slotProps.data.place_name }}</span>
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="praticien_formateur" header="Praticien formateur" sortable></Column>
          <Column field="repondant_hes" header="Répondant HES" sortable>
            <template #body="slotProps">
              <span v-if="slotProps.data.repondant_hes">{{ slotProps.data.repondant_hes }}</span>
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="signataire_hes" header="Signataire HES" sortable>
            <template #body="slotProps">
              <span v-if="slotProps.data.signataire_hes">{{ slotProps.data.signataire_hes }}</span>
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="lieu_signature" header="Lieu de signature" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.lieu_signature" :value="slotProps.data.lieu_signature" :severity="getLieuSignatureSeverity(slotProps.data.lieu_signature)" />
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column field="is_validated" header="Validé" sortable>
            <template #body="slotProps">
              <Checkbox v-model="slotProps.data.is_validated" :binary="true" @change="toggleValidation(slotProps.data)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" @click="editRow(slotProps.data)" />
              <Button icon="pi pi-print" class="p-button-text p-button-sm" />
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-content-end mt-3">
          <Button icon="pi pi-file-excel" label="Exporter Excel" severity="success" outlined @click="exportExcel" />
        </div>
      </div>

      <!-- Dialog Édition -->
      <Dialog v-model:visible="showDialog" header="Éditer les informations" :style="{ width: '700px' }" modal>
        <div class="flex flex-column gap-3 p-4">
          <div class="grid">
            <div class="col-6">
              <label class="block mb-2 font-semibold">Répondant HES</label>
              <Dropdown
                v-model="editingRow.repondant_hes"
                :options="repondantsHESList"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un répondant"
                class="w-full"
                showClear
              />
            </div>
            <div class="col-6">
              <label class="block mb-2 font-semibold">Signataire HES</label>
              <Dropdown
                v-model="editingRow.signataire_hes"
                :options="repondantsHESList"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner un signataire"
                class="w-full"
                showClear
              />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Lieu de signature</label>
            <Dropdown
              v-model="editingRow.lieu_signature"
              :options="lieuSignatureOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner le lieu"
              class="w-full"
              showClear
            />
          </div>
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="editingRow.is_validated" :binary="true" inputId="validation" />
            <label for="validation" class="font-semibold">Validation effectuée</label>
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Enregistrer" @click="saveRow" severity="success" />
        </template>
      </Dialog>
    </div>
    <ConfirmDialog></ConfirmDialog>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentDirectoryService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'
import Checkbox from 'primevue/checkbox'
import SplitButton from 'primevue/splitbutton'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const { scheduleRefresh } = useAutoRefresh(() => loadPublishedAssignments())

const loading = ref(false)
const showDialog = ref(false)
const searchQuery = ref('')
const filterYear = ref(null)
const filterType = ref(null)
const filterClasse = ref(null)
const filterValidation = ref(null)
const filterRepondantHES = ref(null)
const filterSignataireHES = ref(null)
const placesList = ref([])
const allStudents = ref([])
const studentsPhysioData = ref([])
const repondantsHESList = ref([])
const showAllStudents = ref(false)

const years = computed(() => {
  const yearSet = new Set()
  ;(placesList.value || []).forEach(r => {
    if (r.year) yearSet.add(r.year)
  })
  return [...yearSet].sort()
})
const classes = computed(() => {
  const classSet = new Set()
  ;(placesList.value || []).forEach(r => {
    if (r.student_class) classSet.add(r.student_class)
  })
  return [...classSet].sort()
})
const typesPFP = ref([
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const validationOptions = ref([
  { label: 'Validé', value: true },
  { label: 'Non validé', value: false },
  { label: 'Tous', value: null }
])

const lieuSignatureOptions = ref([
  { label: 'Présence', value: 'Présence' },
  { label: 'Visio-conférence', value: 'Visio-conférence' },
  { label: 'Étudiant', value: 'Étudiant' }
])

const stats = ref({
  totalPlaces: 0,
  validated: 0,
  pending: 0,
  institutions: 0
})

const editingRow = ref({
  id: null,
  repondant_hes: null,
  signataire_hes: null,
  lieu_signature: null,
  is_validated: false
})

const getLieuSignatureSeverity = (lieu) => {
  const severities = {
    'Présence': 'success',
    'Visio-conférence': 'info',
    'Étudiant': 'warning'
  }
  return severities[lieu] || 'secondary'
}

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

watch(showAllStudents, async (val) => {
  if (val && !allStudents.value.length) {
    // Charger tous les étudiants seulement quand nécessaire
    loading.value = true
    try {
      const [students, { data: physio }] = await Promise.all([
        getAllStudents(),
        supabase.from('StudentsPhysio').select('user_id, repondant_hes, class')
      ])
      allStudents.value = students || []
      studentsPhysioData.value = physio || []
    } finally {
      loading.value = false
    }
  }
  if (val) {
    filterValidation.value = null
  }
})

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

  // Map StudentsPhysio par user_id
  const physioByUserId = new Map((studentsPhysioData.value || []).map(sp => [sp.user_id, sp]))

  ;(allStudents.value || []).forEach(s => {
    const userId = s?.user_id || s?.id
    const candidates = (assignedByUser.get(userId) || []).filter(r => {
      if (filterYear.value && r.year !== filterYear.value) return false
      if (filterType.value && r.pfp_type !== filterType.value) return false
      return true
    })

    const assignment = candidates[0] || null
    const studentPhysio = physioByUserId.get(userId)
    const repondantHes = studentPhysio?.repondant_hes || assignment?.repondant_hes || null

    out.push({
      user_id: userId,
      student_name: getStudentName(s),
      student_class: studentPhysio?.class || getStudentClass(s),
      year: assignment?.year || filterYear.value || null,
      pfp_type: assignment?.pfp_type || filterType.value || null,
      votation_type: assignment ? getVotationTypeLabel(assignment) : '-',
      assigned_place_id: assignment?.assigned_place_id || null,
      place_name: assignment?.place_name || '—',
      institution_name: assignment?.institution_name || '—',
      praticien_formateur: assignment?.praticien_formateur || '—',
      repondant_hes: repondantHes,
      signataire_hes: assignment?.signataire_hes || null,
      lieu_signature: assignment?.lieu_signature || null,
      is_validated: assignment?.is_validated || false,
      status: assignment?.status || 'unassigned',
      place: assignment?.place || null,
      _is_unassigned: !assignment
    })
  })

  return out
})

const filteredList = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  return (baseRows.value || []).filter((row) => {
    if (filterYear.value && row.year !== filterYear.value) return false
    if (filterType.value && row.pfp_type !== filterType.value) return false
    if (filterClasse.value && row.student_class !== filterClasse.value) return false
    if (filterValidation.value !== null && row.is_validated !== filterValidation.value) return false
    if (filterRepondantHES.value && row.repondant_hes !== filterRepondantHES.value) return false
    if (filterSignataireHES.value && row.signataire_hes !== filterSignataireHES.value) return false
    if (!q) return true
    return (
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.place_name || '').toLowerCase().includes(q) ||
      (row.institution_name || '').toLowerCase().includes(q) ||
      (row.repondant_hes || '').toLowerCase().includes(q) ||
      (row.signataire_hes || '').toLowerCase().includes(q)
    )
  })
})

const loadPublishedAssignments = async () => {
  loading.value = true
  try {
    // 1. Récupérer les assignations avec toutes les infos directement
    const { data: assignments, error } = await supabase
      .from('student_result_vote')
      .select('id,user_id,pfp_type,year,assigned_place_id,assigned_place_name,assigned_institution_name,assigned_rank,status,assigned_praticien_id,repondant_hes,signataire_hes,lieu_signature,is_validated')
      .eq('status', 'published')

    if (error) throw error
    if (!assignments?.length) {
      placesList.value = []
      return
    }

    // 2. Extraire les IDs nécessaires pour étudiants et praticiens
    const userIds = [...new Set(assignments.map(a => a.user_id).filter(Boolean))]

    // 3. Requêtes parallèles uniquement pour étudiants et praticiens
    const [
      studentDirectory,
      { data: studentsPhysio },
      { data: praticiens }
    ] = await Promise.all([
      getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id,repondant_hes,class').in('user_id', userIds),
      supabase.from('praticiens_formateurs').select('id,prenom,nom')
    ])

    // 4. Créer les maps pour lookup rapide
    const studentsById = new Map(
      studentDirectory.filter((student) => userIds.includes(student.user_id)).map(s => [s.user_id, s])
    )
    const physioByUserId = new Map((studentsPhysio || []).map(sp => [sp.user_id, sp]))

    const praticiensById = new Map()
    ;(praticiens || []).forEach(p => {
      if (p?.id) {
        const name = `${p.prenom || ''} ${p.nom || ''}`.trim()
        praticiensById.set(String(p.id), name)
        praticiensById.set(Number(p.id), name)
      }
    })

    // 5. Construire la liste finale (place_name et institution_name depuis student_result_vote)
    placesList.value = assignments.filter(a => studentsById.has(a.user_id)).map(a => {
      const s = studentsById.get(a.user_id)
      const studentName = s ? `${(s.family_name || '').toUpperCase()} ${s.forname || ''}`.trim() : 'N/A'
      const studentPhysioClass = physioByUserId.get(a.user_id)?.class || null
      const studentClass = studentPhysioClass || s?.Classe || s?.classe || null

      const praticienFormateur = a.assigned_praticien_id
        ? praticiensById.get(a.assigned_praticien_id) || praticiensById.get(String(a.assigned_praticien_id))
        : null

      const studentPhysio = physioByUserId.get(a.user_id)

      return {
        ...a,
        student_name: studentName,
        student_class: studentClass,
        votation_type: getVotationTypeLabel(a),
        place_name: a.assigned_place_name || null,
        institution_name: a.assigned_institution_name || null,
        praticien_formateur: praticienFormateur,
        repondant_hes: studentPhysio?.repondant_hes || a?.repondant_hes || null,
        signataire_hes: a?.signataire_hes || null,
        lieu_signature: a?.lieu_signature || null,
        is_validated: a?.is_validated || false
      }
    })

    const uniqueInstitutions = new Set(placesList.value.map(p => p.institution_name).filter(Boolean))
    const validatedCount = placesList.value.filter(p => p.is_validated).length

    stats.value = {
      totalPlaces: placesList.value.length,
      validated: validatedCount,
      pending: placesList.value.length - validatedCount,
      institutions: uniqueInstitutions.size
    }
  } catch (e) {
    console.error('Erreur loadPublishedAssignments:', e)
    placesList.value = []
  } finally {
    loading.value = false
  }
}

const bulkActions = computed(() => [
  {
    label: 'Tout mettre en Présence',
    icon: 'pi pi-map-marker',
    command: () => confirmMassiveAssignment('Présence')
  },
  {
    label: 'Tout mettre en Visio-conférence',
    icon: 'pi pi-video',
    command: () => confirmMassiveAssignment('Visio-conférence')
  },
  {
    label: 'Tout mettre en Étudiant',
    icon: 'pi pi-user',
    command: () => confirmMassiveAssignment('Étudiant')
  }
])

const confirmMassiveAssignment = (lieu) => {
  const count = filteredList.value.filter(r => r.id).length
  if (count === 0) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Aucune assignation valide à mettre à jour.', life: 3000 })
    return
  }

  confirm.require({
    message: `Voulez-vous assigner le lieu "${lieu}" à ces ${count} assignations filtrées ?`,
    header: 'Confirmation d\'assignation massive',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Confirmer',
    rejectLabel: 'Annuler',
    accept: () => assignMassiveLieu(lieu)
  })
}

const assignMassiveLieu = async (lieu) => {
  const targets = filteredList.value.filter(r => r.id)
  const ids = targets.map(r => r.id)

  loading.value = true
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({ lieu_signature: lieu })
      .in('id', ids)

    if (error) throw error

    // Mise à jour locale
    placesList.value = placesList.value.map(p => {
      if (ids.includes(p.id)) {
        return { ...p, lieu_signature: lieu }
      }
      return p
    })

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${ids.length} assignations mises à jour en "${lieu}".`,
      life: 3000
    })

    scheduleRefresh()
  } catch (e) {
    console.error('Erreur assignMassiveLieu:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la mise à jour massive.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const toggleValidation = async (row) => {
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({ is_validated: row.is_validated })
      .eq('id', row.id)

    if (error) throw error

    const validatedCount = placesList.value.filter(p => p.is_validated).length
    stats.value.validated = validatedCount
    stats.value.pending = placesList.value.length - validatedCount

    scheduleRefresh()
  } catch (e) {
    console.error('Erreur toggleValidation:', e)
    row.is_validated = !row.is_validated
  }
}

const editRow = (row) => {
  editingRow.value = {
    id: row.id,
    user_id: row.user_id,
    repondant_hes: row.repondant_hes || '',
    signataire_hes: row.signataire_hes || '',
    lieu_signature: row.lieu_signature || null,
    is_validated: row.is_validated || false
  }
  showDialog.value = true
}

const saveRow = async () => {
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({
        repondant_hes: editingRow.value.repondant_hes,
        signataire_hes: editingRow.value.signataire_hes,
        lieu_signature: editingRow.value.lieu_signature,
        is_validated: editingRow.value.is_validated
      })
      .eq('id', editingRow.value.id)

    if (error) throw error

    const idx = placesList.value.findIndex(p => p.id === editingRow.value.id)
    if (idx !== -1) {
      placesList.value[idx].repondant_hes = editingRow.value.repondant_hes
      placesList.value[idx].signataire_hes = editingRow.value.signataire_hes
      placesList.value[idx].lieu_signature = editingRow.value.lieu_signature
      placesList.value[idx].is_validated = editingRow.value.is_validated
    }

    const validatedCount = placesList.value.filter(p => p.is_validated).length
    stats.value.validated = validatedCount
    stats.value.pending = placesList.value.length - validatedCount

    showDialog.value = false

    scheduleRefresh()
  } catch (e) {
    console.error('Erreur saveRow:', e)
  }
}

const resetFilters = () => {
  filterYear.value = null
  filterType.value = null
  filterClasse.value = null
  filterValidation.value = null
  filterRepondantHES.value = null
  filterSignataireHES.value = null
  searchQuery.value = ''
}

const viewDetails = (row) => {
  if (!row?.user_id) return
  router.push({ name: 'ProfileAdmin', params: { id: row.user_id } })
}

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const rows = (filteredList.value || []).map((r) => ({
    etudiant: r.student_name || '',
    classe: r.student_class || '',
    annee: r.year || '',
    pfp: r.pfp_type || '',
    institution: r.institution_name || '',
    praticien_formateur: r.praticien_formateur || '',
    repondant_hes: r.repondant_hes || '',
    signataire_hes: r.signataire_hes || '',
    lieu_signature: r.lieu_signature || '',
    valide: r.is_validated ? 'Oui' : 'Non'
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'repondants_hes')

  const nameParts = ['repondants_hes']
  if (filterYear.value) nameParts.push(filterYear.value)
  if (filterType.value) nameParts.push(filterType.value)
  if (filterClasse.value) nameParts.push(filterClasse.value)
  const filename = `${nameParts.join('_')}.xlsx`

  XLSX.writeFile(wb, filename)
}

const loadRepondantsHES = async () => {
  try {
    const { data, error } = await supabase
      .from('RepondantPhysioHES')
      .select('id, first_name, last_name, email')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) throw error
    repondantsHESList.value = (data || []).map(r => ({
      id: r.id,
      label: `${r.first_name} ${r.last_name}`,
      value: `${r.first_name} ${r.last_name}`,
      email: r.email
    }))
  } catch (e) {
    console.error('Erreur loadRepondantsHES:', e)
    repondantsHESList.value = []
  }
}

onMounted(async () => {
  // Charger en parallèle pour plus de rapidité
  await Promise.all([
    loadRepondantsHES(),
    loadPublishedAssignments()
  ])
})
</script>

<style>
@import '@/assets/styles/fp-dark.css';
</style>

<style scoped>
.repondant-page {
  min-height: 100%;
}
</style>
