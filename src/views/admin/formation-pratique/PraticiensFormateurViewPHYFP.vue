<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Praticiens Formateurs</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-plus text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Praticiens Formateurs</h1>
              <p class="text-600 m-0 mt-2">Référentiel des praticiens formateurs</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <InputText v-model="search" placeholder="Rechercher (nom, email, institution)" class="w-16rem" />
            <Button icon="pi pi-file-excel" label="Excel" outlined severity="success" @click="exportExcel" />
            <Button icon="pi pi-filter-slash" label="Reset filtres" outlined severity="secondary" @click="resetFilters" />
            <Button icon="pi pi-plus" label="Ajouter" outlined @click="openCreate" />
            <Button icon="pi pi-refresh" outlined :disabled="loading" @click="refresh" />
          </div>
        </div>
        <ProgressBar v-if="loading" mode="indeterminate" style="height: 4px" class="mt-3" />
      </div>

      <div class="grid mb-3" v-if="globalKpisReady">
        <div class="col-6 md:col-3" v-for="kpi in globalKpis" :key="kpi.label">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold" :class="kpi.colorClass">{{ kpi.value }}</div>
            <div class="text-600 text-sm mt-1">{{ kpi.label }}</div>
          </div>
        </div>
      </div>

      <div class="grid mb-3" v-if="items.length">
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ stats.total }}</div>
            <div class="text-600 text-sm mt-1">Total</div>
          </div>
        </div>
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-green-400">{{ stats.withInstitution }}</div>
            <div class="text-600 text-sm mt-1">Avec institution</div>
          </div>
        </div>
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ stats.withoutInstitution }}</div>
            <div class="text-600 text-sm mt-1">Sans institution</div>
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <div class="text-600 mb-2">{{ total }} praticien(s)</div>
        <DataTable
          :value="items"
          :loading="loading"
          dataKey="id"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[20, 30, 50, 100]"
          :rowHover="true"
          sortMode="multiple"
          :multiSortMeta="multiSortMeta"
          :scrollable="true"
          scrollHeight="65vh"
        >
          <template #empty>Aucun praticien formateur trouvé.</template>
          <template #loading>Chargement des données...</template>

          <Column header="Nom" sortField="nom" :sortable="true" style="min-width: 14rem">
            <template #body="{ data }">
              <div class="font-semibold">{{ (data.nom || '').toUpperCase() }} {{ data.prenom || '' }}</div>
            </template>
          </Column>
          <Column field="mail" header="Email" :sortable="true" style="min-width: 12rem"></Column>
          <Column header="Institution" :sortable="true" style="min-width: 12rem">
            <template #body="{ data }">
              {{ getInstitutionName(data) }}
            </template>
          </Column>
          <Column header="Localité" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag v-if="data.localite" :value="data.localite" severity="info" />
              <span v-else class="text-400">—</span>
            </template>
          </Column>
          <Column header="Actions" style="min-width: 10rem">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" size="small" v-tooltip.top="'Modifier'" @click="openEdit(data)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" v-tooltip.top="'Supprimer'" @click="onDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <Dialog 
        v-model:visible="editorVisible" 
        :modal="true" 
        :header="form.id ? 'Modifier un praticien formateur' : 'Ajouter un praticien formateur'" 
        :style="{ width: '450px' }"
      >
        <div class="p-fluid">
          <div class="field mb-3">
            <label for="prenom" class="font-semibold">Prénom *</label>
            <InputText 
              id="prenom" 
              v-model="form.prenom" 
              placeholder="Ex: Jean"
              :class="{ 'p-invalid': submitted && !form.prenom }"
            />
            <small v-if="submitted && !form.prenom" class="p-error">Le prénom est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="nom" class="font-semibold">Nom *</label>
            <InputText 
              id="nom" 
              v-model="form.nom" 
              placeholder="Ex: Dupont"
              :class="{ 'p-invalid': submitted && !form.nom }"
            />
            <small v-if="submitted && !form.nom" class="p-error">Le nom est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="mail" class="font-semibold">Email *</label>
            <InputText 
              id="mail" 
              v-model="form.mail" 
              type="email"
              placeholder="Ex: jean.dupont@email.ch"
              :class="{ 'p-invalid': submitted && !form.mail }"
            />
            <small v-if="submitted && !form.mail" class="p-error">L'email est requis</small>
          </div>
          
          <div class="field mb-3">
            <label for="institution" class="font-semibold">Institution</label>
            <Dropdown 
              id="institution"
              v-model="form.selectedInstitutionId" 
              :options="institutionOptions" 
              optionLabel="label" 
              optionValue="value" 
              filter 
              filterPlaceholder="Rechercher une institution..."
              placeholder="Sélectionner une institution" 
              :loading="instStore.loading"
              showClear
              class="w-full"
            />
            <small class="text-500">Optionnel - Lien vers l'institution associée</small>
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="closeDialog" />
          <Button 
            :label="form.id ? 'Mettre à jour' : 'Créer'" 
            icon="pi pi-check" 
            :loading="saving" 
            @click="save" 
          />
        </template>
      </Dialog>
    </div>
  <ConfirmDialog />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import ConfirmDialog from 'primevue/confirmdialog'
import { usePraticiensFormateursStore } from '@/stores/praticiensFormateursStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentDirectoryService'

const store = usePraticiensFormateursStore()
const instStore = useInstitutionsStore()
const toast = useToast()
const confirmSvc = useConfirm()
const search = ref('')
const multiSortMeta = ref([{ field: 'nom', order: 1 }])
const FILTERS_KEY = 'fp_phy_praticiens_filters'
const globalKpisReady = ref(false)
const globalKpisData = ref({ activeStudents: 0, openPlaces: 0, publishedAssignments: 0, incompleteFiles: 0 })

try {
  const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}')
  if (typeof saved.search === 'string') search.value = saved.search
  if (Array.isArray(saved.multiSortMeta) && saved.multiSortMeta.length) multiSortMeta.value = saved.multiSortMeta
} catch {
  localStorage.removeItem(FILTERS_KEY)
}

watch([search, multiSortMeta], () => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ search: search.value, multiSortMeta: multiSortMeta.value }))
  } catch (e) {
    console.warn('Erreur sauvegarde filtres praticiens:', e)
  }
})

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
    const incompleteFiles = profiles.filter((p) => !p.family_name || !p.forname || !p.email || !p.Classe).length
    const places = placesRes.data || []
    const openPlaces = places.filter((p) => p.InstitutionId && p.NomPlace).length

    globalKpisData.value = {
      activeStudents,
      openPlaces,
      publishedAssignments: (assignmentsRes.data || []).length,
      incompleteFiles,
    }
  } catch (error) {
    console.warn('Erreur chargement KPI globaux praticiens:', error)
  } finally {
    globalKpisReady.value = true
  }
}

function resetFilters() {
  search.value = ''
  multiSortMeta.value = [{ field: 'nom', order: 1 }]
  try {
    localStorage.removeItem(FILTERS_KEY)
  } catch (e) {
    console.warn('Erreur reset filtres praticiens:', e)
  }
}

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const items = computed(() => store.praticiensFormateurs)
const total = computed(() => items.value.length)
const stats = computed(() => {
  const totalCount = items.value.length
  const withInstitution = items.value.filter(i => i.institution).length
  return {
    total: totalCount,
    withInstitution,
    withoutInstitution: totalCount - withInstitution,
  }
})
const saving = ref(false)
const editorVisible = ref(false)
const submitted = ref(false)
const form = ref({ id: null, prenom: '', nom: '', mail: '', institution: '', localite: '', selectedInstitutionId: null })

function fullName(u) {
  return [u.prenom, u.nom].filter(Boolean).join(' ')
}

function getInstitutionName(u) {
  return u.institution || ''
}

const institutionOptions = computed(() => {
  const arr = Array.isArray(instStore.institutions) ? instStore.institutions : []
  return arr
    .filter(i => i.InstitutionId || i.id) // Filtrer celles qui ont un ID
    .map(i => {
      const id = i.InstitutionId ?? i.id
      const name = i.Name || i.name || `#${id}`
      const locality = i.Locality || i.localite || ''
      const label = locality ? `${name} (${locality})` : name
      return { 
        label, 
        value: id,
        institution: name,
        localite: locality,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
})

function findSelectedInstitutionId(row) {
  if (!row?.institution) return null
  const institution = String(row.institution || '').trim().toLowerCase()
  const locality = String(row.localite || '').trim().toLowerCase()
  const match = institutionOptions.value.find((opt) => {
    const optInstitution = String(opt.institution || '').trim().toLowerCase()
    const optLocality = String(opt.localite || '').trim().toLowerCase()
    return optInstitution === institution && (!locality || optLocality === locality)
  })
  return match?.value ?? null
}

let debounceId = null
onMounted(() => {
  store.fetchPraticiensFormateurs('')
  instStore.fetchInstitutions()
  loadGlobalKpis()
})

watch(search, (v) => {
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(() => {
    store.fetchPraticiensFormateurs(v || '')
  }, 300)
})

watch(institutionOptions, () => {
  if (!editorVisible.value || !form.value.id || form.value.selectedInstitutionId != null) return
  form.value.selectedInstitutionId = findSelectedInstitutionId(form.value)
})

function openCreate() {
  form.value = { id: null, prenom: '', nom: '', mail: '', institution: '', localite: '', selectedInstitutionId: null }
  submitted.value = false
  editorVisible.value = true
}

function openEdit(row) {
  form.value = {
    id: row.id,
    prenom: row.prenom || '',
    nom: row.nom || '',
    mail: row.mail || '',
    institution: row.institution || '',
    localite: row.localite || '',
    selectedInstitutionId: findSelectedInstitutionId(row),
  }
  submitted.value = false
  editorVisible.value = true
}

function closeDialog() {
  editorVisible.value = false
  submitted.value = false
}

async function save() {
  submitted.value = true
  
  // Validation
  if (!form.value.prenom || !form.value.nom || !form.value.mail) {
    toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Prénom, nom et email sont obligatoires.', life: 3500 })
    return
  }

  const email = (form.value.mail || '').trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    toast.add({ severity: 'warn', summary: 'Email invalide', detail: 'Veuillez saisir un email valide (ex: prenom.nom@hopital.ch).', life: 3500 })
    return
  }

  const duplicate = items.value.find((p) => (p.mail || '').trim().toLowerCase() === email && p.id !== form.value.id)
  if (duplicate) {
    toast.add({ severity: 'warn', summary: 'Doublon détecté', detail: 'Cet email existe déjà pour un autre praticien formateur.', life: 3500 })
    return
  }
  
  try {
    saving.value = true
    const payload = { 
      prenom: form.value.prenom.trim(), 
      nom: form.value.nom.trim(), 
      mail: email,
      institution: null,
      localite: null,
    }

    if (form.value.selectedInstitutionId != null) {
      const selected = institutionOptions.value.find((opt) => String(opt.value) === String(form.value.selectedInstitutionId))
      payload.institution = selected?.institution || null
      payload.localite = selected?.localite || null
    } else if (form.value.institution) {
      payload.institution = form.value.institution.trim() || null
      payload.localite = (form.value.localite || '').trim() || null
    }
    
    if (!form.value.id) {
      await store.createPraticienFormateur(payload)
      toast.add({ severity: 'success', summary: 'Création réussie', detail: 'Le praticien formateur a été ajouté.', life: 3000 })
    } else {
      await store.updatePraticienFormateur(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Mise à jour réussie', detail: 'Le praticien formateur a été mis à jour.', life: 3000 })
    }
    
    editorVisible.value = false
    submitted.value = false
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde:', e)
    toast.add({ severity: 'error', summary: 'Sauvegarde impossible', detail: e?.message || 'Vérifiez les données saisies puis réessayez.', life: 5000 })
  } finally {
    saving.value = false
  }
}

function refresh() {
  store.fetchPraticiensFormateurs(search.value || '')
}

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const data = items.value.map(p => ({
    Nom: p.nom || '',
    Prénom: p.prenom || '',
    Email: p.mail || '',
    Institution: getInstitutionName(p),
    Localité: p.localite || ''
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Praticiens Formateurs')
  XLSX.writeFile(wb, 'praticiens_formateurs.xlsx')
}

function onDelete(row) {
  if (!row?.id) return
  confirmSvc.require({
    message: `Supprimer le praticien ${(row.nom || '').toUpperCase()} ${row.prenom || ''} ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: async () => {
      try {
        await store.deletePraticienFormateur(row.id)
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Praticien supprimé.', life: 3000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Suppression impossible', detail: e?.message || 'Le praticien formateur n\'a pas pu être supprimé.', life: 4000 })
      }
    }
  })
}
</script>

<style>
@import '@/assets/styles/fp-dark.css';
</style>
