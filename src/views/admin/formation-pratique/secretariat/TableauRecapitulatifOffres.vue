<template>
  <AdminLayout>
    <div class="offre-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-briefcase text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Tableau Récapitulatif des Offres</h1>
              <p class="text-600 m-0 mt-1">Vue d'ensemble des offres de places - Lecture seule</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-briefcase text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Places Totales</p>
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
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.actives }}</h3>
                <p class="text-600 m-0">Places avec Offres</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-map-marker text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.places }}</h3>
                <p class="text-600 m-0">Offres Disponibles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statistiques PFP -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <div class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-purple-100 border-circle p-2">
                <i class="pi pi-book text-purple-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP1A.propositions }} / {{ stats.pfpStats.PFP1A.offres }}</h4>
                <p class="text-600 m-0 text-sm">PFP1A</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-cyan-100 border-circle p-2">
                <i class="pi pi-book text-cyan-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP1B.propositions }} / {{ stats.pfpStats.PFP1B.offres }}</h4>
                <p class="text-600 m-0 text-sm">PFP1B</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-indigo-100 border-circle p-2">
                <i class="pi pi-book text-indigo-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP2.propositions }} / {{ stats.pfpStats.PFP2.offres }}</h4>
                <p class="text-600 m-0 text-sm">PFP2</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-pink-100 border-circle p-2">
                <i class="pi pi-book text-pink-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP3.propositions }} / {{ stats.pfpStats.PFP3.offres }}</h4>
                <p class="text-600 m-0 text-sm">PFP3</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-2">
              <div class="bg-amber-100 border-circle p-2">
                <i class="pi pi-book text-amber-500 text-xl"></i>
              </div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP4.propositions }} / {{ stats.pfpStats.PFP4.offres }}</h4>
                <p class="text-600 m-0 text-sm">PFP4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table des places -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable 
          :value="placesData" 
          :loading="placesStore.loading" 
          responsiveLayout="scroll" 
          :paginator="!showAll" 
          :rows="rowsPerPage"
          :globalFilterFields="['Institution_name', 'NomPlace']"
          v-model:filters="filters"
          filterDisplay="row"
          scrollable
          scrollHeight="flex"
          class="p-datatable-sm"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Places de Formation</span>
              <div class="flex gap-2 align-items-center">
                <div class="flex align-items-center gap-2">
                  <span class="text-600">Année</span>
                  <Dropdown :options="years" v-model="selectedYear" class="w-6rem" />
                </div>
                <div class="flex align-items-center gap-2">
                  <span class="text-600">PFP</span>
                  <Dropdown :options="pfpOptions" optionLabel="label" optionValue="value" v-model="selectedPFP" class="w-8rem" />
                </div>
                <div class="flex align-items-center gap-2">
                  <span class="text-600">Afficher</span>
                  <Dropdown :options="rowsOptions" optionLabel="label" optionValue="value" v-model="rowsPerPage" class="w-8rem" />
                  <div class="flex align-items-center gap-2">
                    <InputSwitch v-model="showAll" />
                    <span class="text-600">Tout</span>
                  </div>
                </div>
                <InputText v-model="filters['global'].value" placeholder="Rechercher..." />
                <Button icon="pi pi-refresh" outlined @click="refreshPlaces" />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune place disponible</p>
            </div>
          </template>
          <Column field="Institution_name" header="Institution" sortable class="w-20rem"></Column>
          <Column field="NomPlace" header="Nom de la place" sortable class="w-25rem"></Column>
          
          <!-- Colonnes Offre -->
          <Column v-if="shouldShowPFPColumn('PFP2')" header="Offre PFP2" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP2 && slotProps.data.PFP2[selectedYear]) || '-' }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1A')" header="Offre PFP1A" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP1A && slotProps.data.PFP1A[selectedYear]) || '-' }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1B')" header="Offre PFP1B" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP1B && slotProps.data.PFP1B[selectedYear]) || '-' }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP4')" header="Offre PFP4" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP4 && slotProps.data.PFP4[selectedYear]) || '-' }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Offre PFP3" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP3 && slotProps.data.PFP3[selectedYear]) || '-' }}</span>
              </div>
            </template>
          </Column>
       
          <!-- Colonnes Proposition (lecture seule) -->
          <Column v-if="shouldShowPFPColumn('PFP2')" header="Proposition PFP2" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP2') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1A')" header="Proposition PFP1A" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP1A') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1B')" header="Proposition PFP1B" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP1B') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP4')" header="Proposition PFP4" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP4') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Proposition PFP3" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP3') }}</span>
              </div>
            </template>
          </Column>
          
          <!-- Colonnes Analyse -->
          <Column v-if="shouldShowPFPColumn('PFP2')" header="Analyse PFP2" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getAssignmentAnalysisClass(getAssignmentAnalysis(slotProps.data, 'PFP2').status)">
                  {{ getAssignmentAnalysis(slotProps.data, 'PFP2').display }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1A')" header="Analyse PFP1A" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getAssignmentAnalysisClass(getAssignmentAnalysis(slotProps.data, 'PFP1A').status)">
                  {{ getAssignmentAnalysis(slotProps.data, 'PFP1A').display }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1B')" header="Analyse PFP1B" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getAssignmentAnalysisClass(getAssignmentAnalysis(slotProps.data, 'PFP1B').status)">
                  {{ getAssignmentAnalysis(slotProps.data, 'PFP1B').display }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP4')" header="Analyse PFP4" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getAssignmentAnalysisClass(getAssignmentAnalysis(slotProps.data, 'PFP4').status)">
                  {{ getAssignmentAnalysis(slotProps.data, 'PFP4').display }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Analyse PFP3" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getAssignmentAnalysisClass(getAssignmentAnalysis(slotProps.data, 'PFP3').status)">
                  {{ getAssignmentAnalysis(slotProps.data, 'PFP3').display }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Analyse Total" class="w-8rem">
            <template #body="slotProps">
              <div class="text-center">
                <span :class="getTotalAnalysisClass(getTotalAnalysisValue(slotProps.data))">
                  {{ getTotalAnalysisValue(slotProps.data) }}
                </span>
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
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'

const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const selectedYear = ref('2026')
const years = ref(['2025', '2026'])
const selectedPFP = ref('all')
const pfpOptions = ref([
  { label: 'Tous', value: 'all' },
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const rowsPerPage = ref(1000)
const rowsOptions = ref([
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'Toutes', value: 1000 }
])
const showAll = ref(true)

const stats = computed(() => {
  const places = placesData.value
  const totalPlaces = places.length
  const year = selectedYear.value
  
  const placesWithOffers = places.filter(place => {
    return (
      (place.OffrePFP1A && place.OffrePFP1A[year] && place.OffrePFP1A[year] !== '') ||
      (place.OffrePFP1B && place.OffrePFP1B[year] && place.OffrePFP1B[year] !== '') ||
      (place.OffrePFP2 && place.OffrePFP2[year] && place.OffrePFP2[year] !== '') ||
      (place.OffrePFP3 && place.OffrePFP3[year] && place.OffrePFP3[year] !== '') ||
      (place.OffrePFP4 && place.OffrePFP4[year] && place.OffrePFP4[year] !== '')
    )
  }).length
  
  const pfpStats = {
    PFP1A: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP1A?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP1A?.[year]) || 0), 0)
    },
    PFP1B: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP1B?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP1B?.[year]) || 0), 0)
    },
    PFP2: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP2?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP2?.[year]) || 0), 0)
    },
    PFP3: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP3?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP3?.[year]) || 0), 0)
    },
    PFP4: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP4?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP4?.[year]) || 0), 0)
    }
  }
  
  const totalOffers = Object.values(pfpStats).reduce((sum, pfp) => sum + pfp.offres, 0)
  
  return {
    total: totalPlaces,
    actives: placesWithOffers,
    places: totalOffers,
    pfpStats
  }
})

const placesData = computed(() => {
  return placesStore.places || []
})

const getPropositionValue = (place, pfpType) => {
  if (!place || !place[`${pfpType.toLowerCase()}_proposition`]) return '-'
  return place[`${pfpType.toLowerCase()}_proposition`][selectedYear.value] || '-'
}

const getTotalAnalysisValue = (place) => {
  const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
  let totalOffre = 0
  let totalProposition = 0
  
  pfpTypes.forEach(pfpType => {
    const offre = parseInt(place[pfpType]?.[selectedYear.value]) || 0
    const propositionKey = `${pfpType.toLowerCase()}_proposition`
    const proposition = parseInt(place[propositionKey]?.[selectedYear.value]) || 0
    
    totalOffre += offre
    totalProposition += proposition
  })
  
  const result = totalProposition - totalOffre
  return result === 0 ? '0' : (result > 0 ? `+${result}` : result.toString())
}

const getTotalAnalysisClass = (value) => {
  const num = parseInt(value) || 0
  if (num === 0) return 'text-green-600 font-semibold'
  if (num > 0) return 'text-orange-600 font-semibold'
  return 'text-red-600 font-semibold'
}

const getAssignmentAnalysis = (place, pfpType) => {
  const year = selectedYear.value
  const offre = parseInt(place[pfpType]?.[year]) || 0
  const propositionKey = `${pfpType.toLowerCase()}_proposition`
  const proposition = parseInt(place[propositionKey]?.[year]) || 0
  
  const difference = proposition - offre
  const status = difference === 0 ? 'balanced' : difference > 0 ? 'over' : 'under'
  
  return {
    proposition,
    offre,
    difference,
    status,
    display: difference === 0 ? '0' : (difference > 0 ? `+${difference}` : difference.toString())
  }
}

const shouldShowPFPColumn = (pfpType) => {
  return selectedPFP.value === 'all' || selectedPFP.value === pfpType
}

const getAssignmentAnalysisClass = (status) => {
  switch (status) {
    case 'balanced':
      return 'text-green-600 font-semibold'
    case 'over':
      return 'text-orange-600 font-semibold'
    case 'under':
      return 'text-red-600 font-semibold'
    default:
      return 'text-600'
  }
}

const refreshPlaces = async () => {
  await placesStore.fetchPlaces()
}

const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

onMounted(async () => {
  await Promise.all([
    placesStore.fetchPlaces(),
    institutionsStore.fetchInstitutions()
  ])
})
</script>

<style scoped>
.offre-page {
  min-height: calc(100vh - 100px);
}

.p-datatable .p-datatable-tbody > tr > td {
  padding: 0.5rem !important;
  vertical-align: middle !important;
}

.p-datatable .p-datatable-thead > tr > th {
  padding: 0.75rem 0.5rem !important;
  font-weight: 600;
  background-color: var(--surface-100);
  border-bottom: 2px solid var(--primary-color);
}

.p-datatable .p-datatable-tbody > tr:hover {
  background-color: var(--surface-50);
}

.text-center {
  text-align: center;
}

@media (max-width: 1400px) {
  .w-25rem {
    width: 18rem !important;
  }
  .w-20rem {
    width: 15rem !important;
  }
}

@media (max-width: 1200px) {
  .w-25rem {
    width: 14rem !important;
  }
  .w-20rem {
    width: 12rem !important;
  }
  .w-8rem {
    width: 6rem !important;
  }
}
</style>
