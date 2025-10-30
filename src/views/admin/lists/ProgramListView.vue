<template>
  <AdminLayout>
    <div class="program-list-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-book text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Programmes</h1>
              <p class="text-600 m-0 mt-1">Administration des programmes de formation</p>
            </div>
          </div>
          <Button icon="pi pi-plus" label="Nouveau Programme" severity="success" @click="showDialog = true" />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-book text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Programmes Totaux</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.actifs }}</h3>
                <p class="text-600 m-0">Actifs</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-users text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.etudiants }}</h3>
                <p class="text-600 m-0">Étudiants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-4">
            <Dropdown v-model="filterFiliere" :options="filieres" placeholder="Toutes les filières" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <InputText v-model="searchQuery" placeholder="Rechercher programme..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Programmes -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="programList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Programmes</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun programme trouvé</p>
            </div>
          </template>
          <Column field="code" header="Code" sortable></Column>
          <Column field="nom" header="Nom du Programme" sortable></Column>
          <Column field="filiere" header="Filière" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.filiere" :severity="getFiliereSeverity(slotProps.data.filiere)" />
            </template>
          </Column>
          <Column field="niveau" header="Niveau" sortable></Column>
          <Column field="credits" header="Crédits ECTS" sortable></Column>
          <Column field="duree" header="Durée" sortable></Column>
          <Column field="etudiants" header="Étudiants" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.etudiants" severity="info" />
            </template>
          </Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
              <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Nouveau Programme -->
      <Dialog v-model:visible="showDialog" header="Nouveau Programme" :style="{ width: '600px' }" modal>
        <div class="flex flex-column gap-3 p-4">
          <div class="grid">
            <div class="col-6">
              <label class="block mb-2 font-semibold">Code *</label>
              <InputText v-model="newProgram.code" class="w-full" />
            </div>
            <div class="col-6">
              <label class="block mb-2 font-semibold">Filière *</label>
              <Dropdown v-model="newProgram.filiere" :options="filieres" class="w-full" />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Nom du Programme *</label>
            <InputText v-model="newProgram.nom" class="w-full" />
          </div>
          <div class="grid">
            <div class="col-4">
              <label class="block mb-2 font-semibold">Niveau</label>
              <Dropdown v-model="newProgram.niveau" :options="niveaux" class="w-full" />
            </div>
            <div class="col-4">
              <label class="block mb-2 font-semibold">Crédits ECTS</label>
              <InputNumber v-model="newProgram.credits" class="w-full" />
            </div>
            <div class="col-4">
              <label class="block mb-2 font-semibold">Durée (semestres)</label>
              <InputNumber v-model="newProgram.duree" class="w-full" />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Description</label>
            <Textarea v-model="newProgram.description" rows="3" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Créer" @click="createProgram" severity="success" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

const loading = ref(false)
const showDialog = ref(false)
const searchQuery = ref('')
const filterFiliere = ref(null)
const filterStatus = ref(null)
const programList = ref([])

const filieres = ref(['Physiothérapie', 'Soins Infirmiers'])
const statusOptions = ref(['Actif', 'Inactif', 'Archivé'])
const niveaux = ref(['Bachelor', 'Master', 'Certificate'])

const stats = ref({
  total: 0,
  actifs: 0,
  etudiants: 0
})

const newProgram = ref({
  code: '',
  nom: '',
  filiere: null,
  niveau: 'Bachelor',
  credits: 180,
  duree: 6,
  description: ''
})

const getStatusSeverity = (status) => {
  const severities = {
    'Actif': 'success',
    'Inactif': 'secondary',
    'Archivé': 'warning'
  }
  return severities[status] || 'secondary'
}

const getFiliereSeverity = (filiere) => {
  return filiere === 'Physiothérapie' ? 'info' : 'success'
}

const viewDetails = (program) => {
  console.log('View details:', program)
}

const createProgram = () => {
  showDialog.value = false
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.program-list-page {
  min-height: calc(100vh - 100px);
}
</style>
