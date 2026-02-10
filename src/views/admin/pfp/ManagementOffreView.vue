<template>
  <AdminLayout>
    <div class="offre-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-briefcase text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Offres</h1>
              <p class="text-600 m-0 mt-1">Gestion des offres de stages disponibles</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiquess -->
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
                <p class="text-600 m-0 text-sm">PFP1A </p>
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
                <p class="text-600 m-0 text-sm">PFP1B </p>
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
                <p class="text-600 m-0 text-sm">PFP2 </p>
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
                <p class="text-600 m-0 text-sm">PFP3 </p>
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
                <p class="text-600 m-0 text-sm">PFP4 </p>
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
                  <Dropdown :options="years" v-model="selectedYear" class="w-6rem" @change="refreshPlaces" />
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
          <!-- Colonnes Offre (données de PlacesViewPHYFP.vue) -->
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
       
          <!-- Colonnes Proposition (champs séparés) -->
                 <Column v-if="shouldShowPFPColumn('PFP2')" header="Proposition PFP2" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp2_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP2') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1A')" header="Proposition PFP1A" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp1a_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP1A') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP1B')" header="Proposition PFP1B" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp1b_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP1B') }}</span>
              </div>
            </template>
          </Column>
    

          <Column v-if="shouldShowPFPColumn('PFP4')" header="Proposition PFP4" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp4_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP4') }}</span>
              </div>
            </template>
          </Column>
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Proposition PFP3" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp3_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP3') }}</span>
              </div>
            </template>
          </Column>
          <Column header="Actions" class="w-10rem">
            <template #body="slotProps">
              <div class="flex justify-content-center gap-1">
                <Button v-if="!isEditingRow(slotProps.data)" icon="pi pi-pencil" class="p-button-outlined p-button-sm" @click="startEditRow(slotProps.data)" v-tooltip.top="'Éditer les propositions'" />
                <template v-else>
                  <Button icon="pi pi-check" class="p-button-success p-button-sm" @click="saveEditRow(slotProps.data)" :loading="savingRowId === slotProps.data.PlaceId" v-tooltip.top="'Sauvegarder'" />
                  <Button icon="pi pi-times" class="p-button-danger p-button-sm" @click="cancelEditRow" v-tooltip.top="'Annuler'" />
                </template>
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
import { supabase } from '@/supabase'
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

const refreshTimeout = ref(null)
const scheduleRefresh = (delay = 400) => {
  if (refreshTimeout.value) {
    clearTimeout(refreshTimeout.value)
  }
  refreshTimeout.value = setTimeout(() => {
    refreshPlaces()
  }, delay)
}
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

// Pagination options
const rowsPerPage = ref(1000)
const rowsOptions = ref([
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'Toutes', value: 1000 }
])
const showAll = ref(true)

// Editing state
const editingRowId = ref(null)
const savingRowId = ref(null)
const editBuffer = ref({
  pfp1a_proposition: '',
  pfp1b_proposition: '',
  pfp2_proposition: '',
  pfp3_proposition: '',
  pfp4_proposition: ''
})

// Published assignments data
const publishedAssignments = ref([])
const loadingAssignments = ref(false)

const stats = computed(() => {
  const places = placesData.value
  const totalPlaces = places.length
  const year = selectedYear.value
  
  // Calculate places with offers (non-empty OffrePFP fields)
  const placesWithOffers = places.filter(place => {
    return (
      (place.OffrePFP1A && place.OffrePFP1A[year] && place.OffrePFP1A[year] !== '') ||
      (place.OffrePFP1B && place.OffrePFP1B[year] && place.OffrePFP1B[year] !== '') ||
      (place.OffrePFP2 && place.OffrePFP2[year] && place.OffrePFP2[year] !== '') ||
      (place.OffrePFP3 && place.OffrePFP3[year] && place.OffrePFP3[year] !== '') ||
      (place.OffrePFP4 && place.OffrePFP4[year] && place.OffrePFP4[year] !== '')
    )
  }).length
  
  // Calculate PFP-specific statistics (Proposition vs Offre vs Assigned)
  const pfpStats = {
    PFP1A: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP1A?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP1A?.[year]) || 0), 0),
      assignes: getAssignedCount('PFP1A')
    },
    PFP1B: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP1B?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP1B?.[year]) || 0), 0),
      assignes: getAssignedCount('PFP1B')
    },
    PFP2: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP2?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP2?.[year]) || 0), 0),
      assignes: getAssignedCount('PFP2')
    },
    PFP3: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP3?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP3?.[year]) || 0), 0),
      assignes: getAssignedCount('PFP3')
    },
    PFP4: {
      propositions: places.reduce((total, place) => total + (parseInt(place.PFP4?.[year]) || 0), 0),
      offres: places.reduce((total, place) => total + (parseInt(place.OffrePFP4?.[year]) || 0), 0),
      assignes: getAssignedCount('PFP4')
    }
  }
  
  // Calculate total available offers
  const totalOffers = Object.values(pfpStats).reduce((sum, pfp) => sum + pfp.offres, 0)
  
  return {
    total: totalPlaces,
    actives: placesWithOffers,
    places: totalOffers,
    pfpStats
  }
})

// Function to get assigned count for a PFP type
const getAssignedCount = (pfpType) => {
  if (!publishedAssignments.value || publishedAssignments.value.length === 0) return 0
  return publishedAssignments.value.filter(assignment => 
    assignment.pfp_type === pfpType && 
    assignment.year === selectedYear.value &&
    assignment.status === 'published'
  ).length
}

// Computed pour les données des places
const placesData = computed(() => {
  return placesStore.places || []
})

// Fonction pour récupérer la valeur Proposition selon l'année
const getPropositionValue = (place, pfpType) => {
  if (!place || !place[`${pfpType.toLowerCase()}_proposition`]) return '-'
  return place[`${pfpType.toLowerCase()}_proposition`][selectedYear.value] || '-'
}

// Fonction pour calculer l'analyse totale (toutes propositions - toutes offres)
const getTotalAnalysisValue = (place) => {
  const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
  let totalOffre = 0
  let totalProposition = 0
  
  pfpTypes.forEach(pfpType => {
    // Offre = place.PFP1A[year], place.PFP1B[year], etc.
    const offre = parseInt(place[pfpType]?.[selectedYear.value]) || 0
    // Proposition = place.pfp1a_proposition[year], place.pfp1b_proposition[year], etc.
    const propositionKey = `${pfpType.toLowerCase()}_proposition`
    const proposition = parseInt(place[propositionKey]?.[selectedYear.value]) || 0
    
    totalOffre += offre
    totalProposition += proposition
  })
  
  const result = totalProposition - totalOffre
  return result === 0 ? '0' : (result > 0 ? `+${result}` : result.toString())
}

// Fonction pour obtenir la classe CSS selon le résultat de l'analyse totale
const getTotalAnalysisClass = (value) => {
  const num = parseInt(value) || 0
  if (num === 0) return 'text-green-600 font-semibold'
  if (num > 0) return 'text-orange-600 font-semibold'
  return 'text-red-600 font-semibold'
}

// Editing functions
const isEditingRow = (row) => {
  return !!row?.PlaceId && editingRowId.value === row.PlaceId
}

const startEditRow = (row) => {
  if (!row?.PlaceId) return
  
  const yearKey = selectedYear.value
  editingRowId.value = row.PlaceId
  
  editBuffer.value = {
    pfp1a_proposition: (row.pfp1a_proposition && row.pfp1a_proposition[yearKey]) || '',
    pfp1b_proposition: (row.pfp1b_proposition && row.pfp1b_proposition[yearKey]) || '',
    pfp2_proposition: (row.pfp2_proposition && row.pfp2_proposition[yearKey]) || '',
    pfp3_proposition: (row.pfp3_proposition && row.pfp3_proposition[yearKey]) || '',
    pfp4_proposition: (row.pfp4_proposition && row.pfp4_proposition[yearKey]) || ''
  }
}

const cancelEditRow = () => {
  editingRowId.value = null
  editBuffer.value = {
    pfp1a_proposition: '',
    pfp1b_proposition: '',
    pfp2_proposition: '',
    pfp3_proposition: '',
    pfp4_proposition: ''
  }
}

const saveEditRow = async (row) => {
  if (!row?.PlaceId) return
  
  savingRowId.value = row.PlaceId
  
  try {
    const yearKey = selectedYear.value
    
    const pfp1aProp = { ...(row.pfp1a_proposition || {}) }
    pfp1aProp[yearKey] = editBuffer.value.pfp1a_proposition || ''
    
    const pfp1bProp = { ...(row.pfp1b_proposition || {}) }
    pfp1bProp[yearKey] = editBuffer.value.pfp1b_proposition || ''
    
    const pfp2Prop = { ...(row.pfp2_proposition || {}) }
    pfp2Prop[yearKey] = editBuffer.value.pfp2_proposition || ''
    
    const pfp3Prop = { ...(row.pfp3_proposition || {}) }
    pfp3Prop[yearKey] = editBuffer.value.pfp3_proposition || ''
    
    const pfp4Prop = { ...(row.pfp4_proposition || {}) }
    pfp4Prop[yearKey] = editBuffer.value.pfp4_proposition || ''
    
    await placesStore.updatePlace(row.PlaceId, {
      pfp1a_proposition: pfp1aProp,
      pfp1b_proposition: pfp1bProp,
      pfp2_proposition: pfp2Prop,
      pfp3_proposition: pfp3Prop,
      pfp4_proposition: pfp4Prop
    })
    
    cancelEditRow()
    scheduleRefresh()
  } finally {
    savingRowId.value = null
  }
}

// Function to load published assignments
const loadPublishedAssignments = async () => {
  loadingAssignments.value = true
  try {
    const { data, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('year', selectedYear.value)
      .in('status', ['published'])
    
    if (error) {
      console.error('Error loading published assignments:', error)
      publishedAssignments.value = []
    } else {
      publishedAssignments.value = data || []
    }
  } catch (error) {
    console.error('Error loading published assignments:', error)
    publishedAssignments.value = []
  } finally {
    loadingAssignments.value = false
  }
}

// Function to get assignment analysis for a place (Proposition - Offre)
const getAssignmentAnalysis = (place, pfpType) => {
  const year = selectedYear.value
  
  // Offre = place.PFP1A[year], place.PFP1B[year], etc.
  const offre = parseInt(place[pfpType]?.[year]) || 0
  
  // Proposition = place.pfp1a_proposition[year], place.pfp1b_proposition[year], etc.
  const propositionKey = `${pfpType.toLowerCase()}_proposition`
  const proposition = parseInt(place[propositionKey]?.[year]) || 0
  
  // Analyse = Proposition - Offre
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

// Function to determine if PFP column should be shown
const shouldShowPFPColumn = (pfpType) => {
  return selectedPFP.value === 'all' || selectedPFP.value === pfpType
}

// Function to get CSS class for assignment analysis
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

// Fonction pour rafraîchir les places
const refreshPlaces = async () => {
  await Promise.all([
    placesStore.fetchPlaces(),
    loadPublishedAssignments()
  ])
}

// Filtres
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})

onMounted(async () => {
  // Charger les places, les institutions et les assignments publiés
  await Promise.all([
    placesStore.fetchPlaces(),
    institutionsStore.fetchInstitutions(),
    loadPublishedAssignments()
  ])
})
</script>

<style scoped>
.offre-page {
  min-height: calc(100vh - 100px);
}

/* Custom styling for better UX */
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

.p-inputtext-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

.p-button-sm {
  width: 2rem;
  height: 2rem;
}

/* Center alignment for numeric columns */
.text-center {
  text-align: center;
}

/* Responsive adjustments */
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

/* Custom grid for 5 columns layout */
@media (min-width: 992px) {
  .lg\:col-2-4 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}
</style>
