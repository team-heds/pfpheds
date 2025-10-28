<template>
  <div class="admin-scrollable">
    <Navbar />
    <h1 style="margin: 2rem 0 1rem 0; text-align: center;" class="m-8">Liste des institutions</h1>
    <div style="margin: 0 2rem;">
      <DataTable
        :value="filteredInstitutions"
        :paginator="true"
        :rows="10"
        dataKey="InstitutionId"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['Name', 'Address', 'Locality', 'Canton', 'InstitutionId']"
      >
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;" class="mr-5" >
            <Button label="Ajouter une institution" icon="pi pi-plus" outlined @click="goToInstitutionForm" class="ml-5"  />
            <span style="flex: 1"></span>
            <span>
              <InputText v-model="searchTerm" placeholder="Rechercher" />
              <i class="pi pi-search" style="margin-left: -2rem; color: #aaa;"></i>
            </span>
          </div>
        </template>
        <template #empty> Aucune institution trouvée. </template>
        <template #loading> Chargement des données des institutions. Veuillez patienter. </template>
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
          <template #body="{ data }">
            <Button label="Détails" class="mb-2 mr-2" size="small" outlined @click="goToDetails(data.InstitutionId)" />
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToInstitutionFormModif(data.InstitutionId)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="supprimerInstitution(data.InstitutionId)" />
          </template>
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
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Navbar from '@/components/common/utils/Navbar.vue'
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
</style>
