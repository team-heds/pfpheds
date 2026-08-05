<template>
  <div class="admin-scrollable">
    <Navbar />
    <div class="institution-list-page">
      <PageHeader title="Liste des institutions" description="Recherchez, consultez et gérez les institutions partenaires." />
      <DataTable
        :value="filteredInstitutions"
        :paginator="true"
        :rows="10"
        dataKey="InstitutionId"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        :globalFilterFields="['Name', 'Address', 'Locality', 'Canton', 'InstitutionId']"
      >
        <template #header>
          <DataTableToolbar v-model:query="searchTerm" :result-count="filteredInstitutions.length" placeholder="Rechercher une institution…">
            <template #primary><Button label="Ajouter une institution" icon="pi pi-plus" @click="goToInstitutionForm" /></template>
          </DataTableToolbar>
        </template>
        <template #empty><EmptyState title="Aucune institution trouvée" description="Modifiez votre recherche ou ajoutez une nouvelle institution." action-label="Ajouter une institution" @action="goToInstitutionForm" /></template>
        <template #loading><LoadingState label="Chargement des institutions…" /></template>
        <Column field="InstitutionId" header="ID">
          <template #body="{ data }">{{ data.InstitutionId }}</template>
        </Column>
        <Column field="Name" header="Nom de l'institution">
          <template #body="{ data }">{{ data.Name }}</template>
        </Column>
        <Column field="Address" header="Adresse">
          <template #body="{ data }">{{ data.Address }}</template>
        </Column>
        <Column field="Locality" header="Localité">
          <template #body="{ data }">{{ data.Locality }}</template>
        </Column>
        <Column field="Canton" header="Canton">
          <template #body="{ data }">{{ data.Canton }}</template>
        </Column>
        <Column field="AccordCadreDate" header="Accord Cadre">
          <template #body="{ data }">
            {{ formatDateFr(data.AccordCadreDate) }}
          </template>
        </Column>
        <Column field="ConventionDate" header="Date de convention">
          <template #body="{ data }">
            {{ formatDateFr(data.ConventionDate) }}
          </template>
        </Column>
        <Column header="Action">
          <template #body="{ data }"><div class="institution-row-actions">
            <Button label="Détails" class="mb-2 mr-2" size="small" outlined @click="goToDetails(data.InstitutionId)" />
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToInstitutionFormModif(data.InstitutionId)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="supprimerInstitution(data.InstitutionId)" />
          </div></template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Navbar from '@/components/common/utils/Navbar.vue'
import PageHeader from '@/components/common/layout/PageHeader.vue'
import DataTableToolbar from '@/components/common/tables/DataTableToolbar.vue'
import EmptyState from '@/components/common/states/EmptyState.vue'
import LoadingState from '@/components/common/states/LoadingState.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'

const router = useRouter()
const toast = useToast()
const institutionsStore = useInstitutionsStore()

const institutions = ref([])
const filters = ref({})
const loading = ref(true)
const searchTerm = ref('')

const filteredInstitutions = computed(() => {
  if (!searchTerm.value) {
    return institutions.value
  }
  return institutions.value.filter(institution =>
    institution.Name && institution.Name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

onMounted(async () => {
  await fetchInstitutions()
})

async function fetchInstitutions() {
  loading.value = true
  try {
    await institutionsStore.fetchInstitutions()
    institutions.value = institutionsStore.institutions
    console.log('✅ Institutions chargées depuis Supabase:', institutions.value.length)
  } catch (error) {
    console.error('❌ Erreur de récupération des institutions:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les institutions.', life: 4000 })
  } finally {
    loading.value = false
  }
}

async function supprimerInstitution(InstitutionId) {
  if (!InstitutionId) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: "ID de l'institution est manquant ou incorrect.", life: 4000 })
    return
  }

  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette institution ?")) {
    try {
      await institutionsStore.deleteInstitution(InstitutionId)
      toast.add({ severity: 'success', summary: 'Succès', detail: "L'institution a été supprimée avec succès.", life: 4000 })
      institutions.value = institutions.value.filter(inst => inst.InstitutionId !== InstitutionId)
    } catch (error) {
      console.error("Erreur lors de la suppression de l'institution:", error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Une erreur est survenue lors de la suppression de l'institution.", life: 4000 })
    }
  }
}

function goToInstitutionForm() {
  router.push({ name: 'InstitutionForm' })
}

function goToInstitutionFormModif(id) {
  router.push({ name: 'InstitutionFormModif', params: { id } })
}

function goToDetails(id) {
  if (id) {
    router.push({ name: 'InstitutionView', params: { id: id } })
  } else {
    console.error("ID is undefined for this institution.")
  }
}

function formatDateFr(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}-${month}-${year}`
}
</script>

<style scoped>
.admin-scrollable {
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 2rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.institution-list-page { margin: clamp(1rem, 3vw, 2rem); }
.institution-row-actions { display:flex; align-items:center; gap:.5rem; white-space:nowrap; }
.institution-row-actions :deep(.p-button) { margin:0 !important; }
:deep(.p-datatable-wrapper) { max-height: calc(100dvh - 20rem); }
:deep(.p-datatable-thead > tr > th) { position: sticky; top: 0; z-index: 2; background: var(--surface-card); }
@media(max-width:768px){
  .admin-scrollable { height:auto; min-height:100dvh; overflow:visible; }
  .institution-list-page{margin:.75rem}
  :deep(.p-datatable-wrapper) { max-height:none; }
  :deep(.p-paginator) { justify-content:flex-start; overflow-x:auto; flex-wrap:nowrap; }
}
</style>
