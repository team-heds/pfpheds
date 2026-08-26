<template>
  <AdminLayout>
    <ConfirmDialog />
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Étudiants</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Étudiants</h1>
              <p class="text-600 m-0 mt-2">Liste des étudiants avec permission EtudiantPhysio</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <Dropdown
              v-model="filterCohort"
              :options="cohortOptions"
              placeholder="Toutes les cohortes"
              showClear
              class="w-12rem"
            />
            <InputText v-model="globalSearch" placeholder="Rechercher (nom, email)" class="w-16rem" />
            <Button icon="pi pi-file-excel" label="Excel" outlined severity="success" @click="exportExcel" />
            <Button icon="pi pi-filter-slash" label="Réinitialiser" outlined severity="secondary" @click="resetFilters" />
            <Button icon="pi pi-refresh" outlined :disabled="loading" @click="loadStudents" />
          </div>
        </div>
        <ProgressBar v-if="loading" mode="indeterminate" style="height: 4px" class="mt-3" />
      </div>

      <div v-if="dashboardFocusPreset" class="surface-card fp-dark p-3 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="text-900 font-medium">
            Filtre dashboard actif :
            <span class="text-primary">{{ dashboardFocusPresetLabel }}</span>
          </div>
          <Button icon="pi pi-times" label="Retirer le preset" outlined size="small" @click="clearDashboardPreset" />
        </div>
      </div>

      <div class="grid mb-3" v-if="globalKpisReady">
        <div class="col-6 md:col-3" v-for="kpi in globalKpis" :key="kpi.label">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold" :class="kpi.colorClass">{{ kpi.value }}</div>
            <div class="text-600 text-sm mt-1">{{ kpi.label }}</div>
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <div class="text-600 mb-2">{{ filteredRows.length }} étudiant(s)</div>
        <DataTable
          :value="filteredRows"
          :loading="loading"
          dataKey="user_id"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[20, 30, 50, 100]"
          :rowHover="true"
          sortMode="multiple"
          :multiSortMeta="multiSortMeta"
          :scrollable="true"
          scrollHeight="65vh"
        >
          <template #empty>Aucun étudiant trouvé.</template>
          <template #loading>Chargement des données...</template>

          <Column header="Étudiant" sortField="family_name" :sortable="true" style="min-width: 14rem">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <Avatar
                  v-if="data.avatar_url"
                  :image="data.avatar_url"
                  shape="circle"
                  size="normal"
                />
                <Avatar
                  v-else
                  :label="initials(data)"
                  shape="circle"
                  size="normal"
                  style="background: var(--primary-100); color: var(--primary-700)"
                />
                <div>
                  <div class="font-semibold">{{ (data.family_name || '').toUpperCase() }} {{ data.forname || '' }}</div>
                  <div class="text-sm text-color-secondary">{{ data.email }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="cohort" header="Cohorte" :sortable="true" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag v-if="data.cohort" :value="data.cohort" severity="info" />
              <span v-else class="text-400">—</span>
            </template>
          </Column>

          <Column field="classe" header="Classe" :sortable="true" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag v-if="data.classe" :value="data.classe" severity="secondary" />
              <span v-else class="text-400">—</span>
            </template>
          </Column>

          <Column field="is_active" header="Statut" :sortable="true" style="min-width: 6rem">
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Actif' : 'Inactif'" :severity="data.is_active ? 'success' : 'danger'" />
            </template>
          </Column>

          <Column header="Actions" style="min-width: 10rem">
            <template #body="{ data }">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-info mr-2" size="small" v-tooltip.top="'Voir profil'" @click="goToProfile(data)" />
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" size="small" v-tooltip.top="'Modifier'" @click="goToEdit(data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" v-tooltip.top="'Supprimer'" @click="handleDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog de modification -->
      <Dialog
        v-model:visible="editVisible"
        modal
        header="Modifier l'étudiant"
        :style="{ width: '30rem' }"
      >
        <div class="p-fluid">
          <div class="field mb-3">
            <label class="font-semibold">Nom *</label>
            <InputText v-model="editForm.family_name" />
          </div>
          <div class="field mb-3">
            <label class="font-semibold">Prénom *</label>
            <InputText v-model="editForm.forname" />
          </div>
          <div class="field mb-3">
            <label class="font-semibold">Email *</label>
            <InputText v-model="editForm.email" type="email" />
          </div>
          <div class="field mb-3">
            <label class="font-semibold">Classe</label>
            <InputText v-model="editForm.classe" />
          </div>
          <div class="field mb-3">
            <label class="font-semibold">Statut</label>
            <Dropdown v-model="editForm.is_active" :options="[{ label: 'Actif', value: true }, { label: 'Inactif', value: false }]" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="editVisible = false" />
          <Button label="Mettre à jour" icon="pi pi-check" :loading="editSaving" @click="submitEdit" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentDirectoryService'
import { SUPABASE_SELECTS } from '@/service/supabaseContracts'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import ProgressBar from 'primevue/progressbar'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const rows = ref([])
const loading = ref(false)
const globalSearch = ref('')
const debouncedGlobalSearch = ref('')
const filterCohort = ref(null)
const multiSortMeta = ref([{ field: 'family_name', order: 1 }])
const FILTERS_KEY = 'fp_phy_etudiants_filters'
const DASHBOARD_FOCUS_KEY = 'fp_phy_etudiants_dashboard_focus'
const globalKpisReady = ref(false)
const globalKpisData = ref({ activeStudents: 0, openPlaces: 0, publishedAssignments: 0, incompleteFiles: 0 })
const dashboardFocusPreset = ref(null)

const dashboardFocusPresetLabel = computed(() => {
  if (dashboardFocusPreset.value === 'incomplete') return 'Dossiers incomplets'
  return dashboardFocusPreset.value
})

let searchDebounceTimer = null
watch(globalSearch, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedGlobalSearch.value = val
  }, 250)
}, { immediate: true })

try {
  const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}')
  if (typeof saved.globalSearch === 'string') globalSearch.value = saved.globalSearch
  if (typeof saved.filterCohort === 'string' || saved.filterCohort === null) filterCohort.value = saved.filterCohort
  if (Array.isArray(saved.multiSortMeta) && saved.multiSortMeta.length) multiSortMeta.value = saved.multiSortMeta
} catch {
  localStorage.removeItem(FILTERS_KEY)
}

try {
  const focus = JSON.parse(localStorage.getItem(DASHBOARD_FOCUS_KEY) || '{}')
  if (focus?.preset) {
    dashboardFocusPreset.value = focus.preset
    localStorage.removeItem(DASHBOARD_FOCUS_KEY)
  }
} catch {
  localStorage.removeItem(DASHBOARD_FOCUS_KEY)
}

watch([globalSearch, filterCohort, multiSortMeta], () => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({
      globalSearch: globalSearch.value,
      filterCohort: filterCohort.value,
      multiSortMeta: multiSortMeta.value,
    }))
  } catch (e) {
    console.warn('Erreur sauvegarde filtres étudiants:', e)
  }
})

function resetFilters() {
  globalSearch.value = ''
  filterCohort.value = null
  multiSortMeta.value = [{ field: 'family_name', order: 1 }]
  try {
    localStorage.removeItem(FILTERS_KEY)
  } catch (e) {
    console.warn('Erreur reset filtres étudiants:', e)
  }
}

function initials(u) {
  const s = `${u.family_name || ''} ${u.forname || ''}`.trim() || '?'
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'U'
}

function getCohort(u) {
  const perms = Array.isArray(u?.permissions) ? u.permissions : []
  const found = perms.find(p => /^BA\d+-PHY$/.test(p))
  return found || null
}

const cohortOptions = computed(() => {
  const keys = new Set()
  for (const u of rows.value) {
    const c = u.cohort
    if (c) keys.add(c)
  }
  return [...keys].sort().reverse()
})

const filteredRows = computed(() => {
  let list = rows.value

  if (filterCohort.value) {
    list = list.filter(u => u.cohort === filterCohort.value)
  }

  if (debouncedGlobalSearch.value.trim()) {
    const q = debouncedGlobalSearch.value.trim().toLowerCase()
    list = list.filter(u =>
      (u.family_name || '').toLowerCase().includes(q) ||
      (u.forname || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.classe || '').toLowerCase().includes(q)
    )
  }

  if (dashboardFocusPreset.value === 'incomplete') {
    list = list.filter((u) => !u.family_name || !u.forname || !u.email || !u.classe)
  }

  return list
})

function clearDashboardPreset() {
  dashboardFocusPreset.value = null
}

const globalKpis = computed(() => ([
  { label: 'Étudiants actifs', value: globalKpisData.value.activeStudents, colorClass: 'text-green-400' },
  { label: 'Places ouvertes', value: globalKpisData.value.openPlaces, colorClass: 'text-blue-400' },
  { label: 'Attributions publiées', value: globalKpisData.value.publishedAssignments, colorClass: 'text-yellow-400' },
  { label: 'Dossiers incomplets', value: globalKpisData.value.incompleteFiles, colorClass: 'text-red-400' },
]))

async function loadGlobalKpis() {
  try {
    const [profiles, placesRes, assignmentsRes] = await Promise.all([
      getAllStudents(),
      supabase.from('places').select('PlaceId, InstitutionId, NomPlace'),
      supabase.from('student_result_vote').select('id').eq('status', 'published'),
    ])

    const activeStudents = profiles.filter((p) => p.is_active !== false).length
    const incompleteFiles = profiles.filter((p) => {
      return !p.family_name || !p.forname || !p.email || !p.Classe
    }).length

    const places = placesRes.data || []
    const openPlaces = places.filter((p) => p.InstitutionId && p.NomPlace).length

    globalKpisData.value = {
      activeStudents,
      openPlaces,
      publishedAssignments: (assignmentsRes.data || []).length,
      incompleteFiles,
    }
  } catch (error) {
    console.warn('Erreur chargement KPI globaux étudiants:', error)
  } finally {
    globalKpisReady.value = true
  }
}

async function loadStudents() {
  loading.value = true
  try {
    const profiles = (await getAllStudents()).sort((a, b) =>
      String(a.family_name || '').localeCompare(String(b.family_name || '')) ||
      String(a.forname || '').localeCompare(String(b.forname || ''))
    )

    const userIds = (profiles || []).map(p => p.user_id)
    let physioMap = new Map()
    if (userIds.length > 0) {
      const { data: physioData } = await supabase
        .from('StudentsPhysio')
        .select(SUPABASE_SELECTS.studentPhysioCriteria)
        .in('user_id', userIds)
      ;(physioData || []).forEach(p => physioMap.set(p.user_id, p))
    }

    rows.value = (profiles || []).map(u => {
      const sp = physioMap.get(u.user_id) || {}
      return {
        ...u,
        cohort: getCohort(u),
        classe: sp.class || u.Classe || u.classe || null,
        msq: sp.msq ?? false,
        sysint: sp.sysint ?? false,
        neuroger: sp.neuroger ?? false,
        aigu: sp.aigu ?? false,
        rehab: sp.rehab ?? false,
        ambu: sp.ambu ?? false,
        fr: sp.fr ?? false,
        de: sp.de ?? false,
        sae: sp.sae ?? false,
        cas_particulier: sp.cas_particulier ?? false,
        canton: sp.canton || ''
      }
    })
  } catch (e) {
    console.error('Erreur chargement étudiants:', e)
  } finally {
    loading.value = false
  }
}

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const boolLabel = (v) => v ? 'Oui' : 'Non'
  const data = filteredRows.value.map(u => ({
    Nom: u.family_name || '',
    Prénom: u.forname || '',
    Email: u.email || '',
    Cohorte: u.cohort || '',
    Classe: u.classe || '',
    Canton: u.canton || '',
    Statut: u.is_active ? 'Actif' : 'Inactif',
    MSQ: boolLabel(u.msq),
    SYSINT: boolLabel(u.sysint),
    NEUROGER: boolLabel(u.neuroger),
    AIGU: boolLabel(u.aigu),
    REHAB: boolLabel(u.rehab),
    AMBU: boolLabel(u.ambu),
    FR: boolLabel(u.fr),
    DE: boolLabel(u.de),
    SAE: boolLabel(u.sae),
    'Cas particulier': boolLabel(u.cas_particulier)
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Étudiants')
  const parts = ['etudiants']
  if (filterCohort.value) parts.push(filterCohort.value)
  XLSX.writeFile(wb, `${parts.join('_')}.xlsx`)
}

const goToProfile = (data) => {
  router.push({ name: 'ProfileAdmin', params: { id: data.user_id } })
}

const editVisible = ref(false)
const editSaving = ref(false)
const editForm = ref({ user_id: '', family_name: '', forname: '', email: '', classe: '', is_active: true })

const goToEdit = (data) => {
  editForm.value = {
    user_id: data.user_id,
    family_name: data.family_name || '',
    forname: data.forname || '',
    email: data.email || '',
    classe: data.classe || '',
    is_active: data.is_active !== false
  }
  editVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.value.family_name || !editForm.value.forname || !editForm.value.email) {
    toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Nom, prénom et email sont obligatoires.', life: 3000 })
    return
  }

  const email = (editForm.value.email || '').trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    toast.add({ severity: 'warn', summary: 'Email invalide', detail: 'Veuillez saisir un email valide (ex: prenom.nom@ecole.ch).', life: 3500 })
    return
  }

  const duplicate = rows.value.find(
    (u) => (u.email || '').trim().toLowerCase() === email && u.user_id !== editForm.value.user_id
  )
  if (duplicate) {
    toast.add({ severity: 'warn', summary: 'Doublon détecté', detail: 'Cet email est déjà utilisé par un autre étudiant.', life: 3500 })
    return
  }

  editSaving.value = true
  try {
    const { error: err } = await supabase
      .from('user_profiles')
      .update({
        family_name: editForm.value.family_name.trim(),
        forname: editForm.value.forname.trim(),
        email,
        classe: editForm.value.classe.trim() || null,
        is_active: editForm.value.is_active
      })
      .eq('user_id', editForm.value.user_id)
    if (err) throw err
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Étudiant mis à jour.', life: 3000 })
    editVisible.value = false
    await loadStudents()
    await loadGlobalKpis()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Mise à jour impossible', detail: e?.message || 'Vérifiez les champs saisis puis réessayez.', life: 4000 })
  } finally {
    editSaving.value = false
  }
}

const handleDelete = (data) => {
  confirm.require({
    message: `Supprimer l'étudiant ${(data.family_name || '').toUpperCase()} ${data.forname || ''} ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: async () => {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_active: false })
          .eq('user_id', data.user_id)
        if (error) throw error
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Étudiant désactivé.', life: 3000 })
        await loadStudents()
        await loadGlobalKpis()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Désactivation impossible', detail: e?.message || 'L\'étudiant n\'a pas pu être désactivé.', life: 4000 })
      }
    }
  })
}

onMounted(() => {
  loadStudents()
  loadGlobalKpis()
})
</script>

<style>
@import '@/assets/styles/fp-dark.css';
</style>
