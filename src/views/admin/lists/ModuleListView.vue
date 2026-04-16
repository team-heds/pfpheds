<template>
  <AdminLayout>
    <div class="module-list-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-box text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Modules</h1>
              <p class="text-600 m-0 mt-1">Administration des modules d'enseignement</p>
            </div>
          </div>
          <Button icon="pi pi-plus" label="Nouveau Module" severity="success" @click="showDialog = true" />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Total Modules</div>
            <div class="text-2xl font-bold text-900">{{ stats.total }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">En cours</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.enCours }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Planifiés</div>
            <div class="text-2xl font-bold text-orange-500">{{ stats.planifies }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Terminés</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.termines }}</div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterProgram" :options="programs" optionLabel="nom" placeholder="Tous les programmes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterSemestre" :options="semestres" placeholder="Tous les semestres" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <InputText v-model="searchQuery" placeholder="Rechercher module..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Modules -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredModules" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15" dataKey="id">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Modules</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun module trouvé</p>
            </div>
          </template>
          <Column field="code" header="Code" sortable style="min-width: 100px"></Column>
          <Column field="titre" header="Titre" sortable style="min-width: 250px"></Column>
          <Column field="program" header="Programme" sortable></Column>
          <Column field="semestre" header="Semestre" sortable></Column>
          <Column field="credits" header="ECTS" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.credits" />
            </template>
          </Column>
          <Column field="heures" header="Heures" sortable></Column>
          <Column field="enseignant" header="Enseignant" sortable></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions" style="min-width: 150px">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
              <Button icon="pi pi-calendar" class="p-button-text p-button-sm" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Nouveau Module -->
      <Dialog v-model:visible="showDialog" header="Nouveau Module" :style="{ width: '700px' }" modal>
        <div class="flex flex-column gap-3 p-4">
          <div class="grid">
            <div class="col-4">
              <label class="block mb-2 font-semibold">Code *</label>
              <InputText v-model="newModule.code" class="w-full" />
            </div>
            <div class="col-8">
              <label class="block mb-2 font-semibold">Titre *</label>
              <InputText v-model="newModule.titre" class="w-full" />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Programme *</label>
            <Dropdown v-model="newModule.program" :options="programs" optionLabel="nom" class="w-full" />
          </div>
          <div class="grid">
            <div class="col-4">
              <label class="block mb-2 font-semibold">Semestre</label>
              <Dropdown v-model="newModule.semestre" :options="semestres" class="w-full" />
            </div>
            <div class="col-4">
              <label class="block mb-2 font-semibold">Crédits ECTS</label>
              <InputNumber v-model="newModule.credits" class="w-full" :min="1" :max="30" />
            </div>
            <div class="col-4">
              <label class="block mb-2 font-semibold">Heures</label>
              <InputNumber v-model="newModule.heures" class="w-full" :min="1" />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Enseignant responsable</label>
            <Dropdown v-model="newModule.enseignant" :options="enseignants" optionLabel="nom" class="w-full" />
          </div>
          <div>
            <label class="block mb-2 font-semibold">Description</label>
            <Textarea v-model="newModule.description" rows="3" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Créer" @click="createModule" severity="success" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import modulesService from '@/service/modulesService'
import { getSITeachers } from '@/service/academicKpiService'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

const toast = useToast()

const loading = ref(false)
const showDialog = ref(false)
const searchQuery = ref('')
const filterProgram = ref(null)
const filterSemestre = ref(null)
const filterStatus = ref(null)
const moduleList = ref([])

const programs = ref([])
const semestres = ref(['S1', 'S2', 'S3', 'S4', 'S5', 'S6'])
const statusOptions = ref(['En cours', 'Planifié', 'Terminé', 'Annulé'])
const enseignants = ref([])

const stats = ref({
  total: 0,
  enCours: 0,
  planifies: 0,
  termines: 0
})

const newModule = ref({
  code: '',
  titre: '',
  program: null,
  semestre: 'S1',
  credits: 6,
  heures: 60,
  enseignant: null,
  description: ''
})

const normalizedModules = computed(() => {
  return (moduleList.value || []).map((m) => {
    const year = Number(m.year || m.annee || 0)
    const semestreNum = Number(m.semestre || 0)
    const semestre = semestreNum ? `S${semestreNum}` : null
    const responsable = m.responsable || m.responsable_email || '—'
    const status = m.status || (year >= 3 ? 'Terminé' : year >= 2 ? 'Planifié' : 'En cours')

    return {
      id: m.id,
      code: m.code || m.number || '—',
      titre: m.title || m.titre || 'Sans titre',
      program: m.track_id || m.program || 'Soins Infirmiers',
      semestre,
      credits: m.credits || 0,
      heures: m.heures_contact || m.hours || 0,
      enseignant: responsable,
      status,
      raw: m
    }
  })
})

const filteredModules = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()
  return normalizedModules.value.filter((m) => {
    const matchesProgram = !filterProgram.value || m.program === filterProgram.value?.nom
    const matchesSemestre = !filterSemestre.value || m.semestre === filterSemestre.value
    const matchesStatus = !filterStatus.value || m.status === filterStatus.value
    const matchesSearch = !term ||
      String(m.code).toLowerCase().includes(term) ||
      String(m.titre).toLowerCase().includes(term) ||
      String(m.enseignant).toLowerCase().includes(term)
    return matchesProgram && matchesSemestre && matchesStatus && matchesSearch
  })
})

function computeStats(modules) {
  return {
    total: modules.length,
    enCours: modules.filter(m => m.status === 'En cours').length,
    planifies: modules.filter(m => m.status === 'Planifié').length,
    termines: modules.filter(m => m.status === 'Terminé').length
  }
}

const getStatusSeverity = (status) => {
  const severities = {
    'En cours': 'info',
    'Planifié': 'warning',
    'Terminé': 'success',
    'Annulé': 'danger'
  }
  return severities[status] || 'secondary'
}

const viewDetails = (module) => {
  console.log('View details:', module)
}

const createModule = () => {
  toast.add({
    severity: 'info',
    summary: 'Création non implémentée',
    detail: 'Le formulaire est prêt mais la sauvegarde Supabase n\'est pas encore branchée.',
    life: 4000
  })
  showDialog.value = false
}

onMounted(async () => {
  loading.value = true
  try {
    const [mods, teachers] = await Promise.all([
      modulesService.getAllModules(),
      getSITeachers()
    ])

    moduleList.value = mods || []

    const programSet = new Set()
    for (const m of moduleList.value) {
      const p = m.track_id || m.program || 'Soins Infirmiers'
      if (p) programSet.add(p)
    }
    programs.value = [...programSet].sort().map(p => ({ nom: p }))

    enseignants.value = (teachers || [])
      .map(t => ({ nom: t.name, id: t.id, email: t.email }))
      .sort((a, b) => a.nom.localeCompare(b.nom))

    stats.value = computeStats(normalizedModules.value)
  } catch (error) {
    console.error('[ModuleListView] Erreur chargement modules:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les modules depuis Supabase.',
      life: 5000
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.module-list-page {
  min-height: calc(100vh - 100px);
}
</style>
