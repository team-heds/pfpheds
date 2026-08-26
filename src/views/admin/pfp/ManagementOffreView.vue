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
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP1A.classe }} · {{ stats.pfpStats.PFP1A.etudiantsAnnee }} étudiant(s)</h4>
                <p class="text-600 m-0 text-sm">PFP1A · places dispo brutes: {{ stats.pfpStats.PFP1A.placesBrutes }}</p>
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
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP1B.classe }} · {{ stats.pfpStats.PFP1B.etudiantsAnnee }} étudiant(s)</h4>
                <p class="text-600 m-0 text-sm">PFP1B · places dispo brutes: {{ stats.pfpStats.PFP1B.placesBrutes }}</p>
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
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP2.classe }} · {{ stats.pfpStats.PFP2.etudiantsAnnee }} étudiant(s)</h4>
                <p class="text-600 m-0 text-sm">PFP2 · places dispo brutes: {{ stats.pfpStats.PFP2.placesBrutes }}</p>
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
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP3.classe }} · {{ stats.pfpStats.PFP3.etudiantsAnnee }} étudiant(s)</h4>
                <p class="text-600 m-0 text-sm">PFP3 · places dispo brutes: {{ stats.pfpStats.PFP3.placesBrutes }}</p>
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
                <h4 class="text-xl font-bold text-900 m-0">{{ stats.pfpStats.PFP4.classe }} · {{ stats.pfpStats.PFP4.etudiantsAnnee }} étudiant(s)</h4>
                <p class="text-600 m-0 text-sm">PFP4 · places dispo brutes: {{ stats.pfpStats.PFP4.placesBrutes }}</p>
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
                  <Dropdown :options="years" optionLabel="label" optionValue="value" v-model="selectedYear" class="w-9rem" @change="refreshPlaces" />
                </div>
                <Button
                  icon="pi pi-copy"
                  label="Reprendre N-1 (propositions)"
                  outlined
                  :loading="isCopyingPreviousYear"
                  @click="copyPreviousYearPropositions"
                />
                <Button
                  icon="pi pi-copy"
                  label="Reprendre N-1 (offres)"
                  outlined
                  severity="success"
                  :loading="isCopyingPreviousYearOffers"
                  @click="copyPreviousYearOffers"
                />
                <div class="flex align-items-center gap-2">
                  <span class="text-600">PFP</span>
                  <Dropdown :options="pfpOptions" optionLabel="label" optionValue="value" v-model="selectedPFP" class="w-8rem" />
                </div>
                <div class="flex align-items-center gap-2">
                  <InputSwitch v-model="hideZeroOffers" />
                  <span class="text-600">Masquer offres à 0</span>
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
          <Column header="Critères place" class="w-18rem">
            <template #body="slotProps">
              <div v-if="isEditingRow(slotProps.data)" class="criteria-edit-grid">
                <div v-for="criterion in criteriaDefinitions" :key="criterion.key" class="criteria-edit-item">
                  <span class="text-600 text-sm">{{ criterion.key }}</span>
                  <InputSwitch v-model="editBuffer[criterion.bufferField]" />
                </div>
              </div>
              <div v-else class="criteria-tags">
                <Tag
                  v-for="criterion in activeCriteriaForPlace(slotProps.data)"
                  :key="criterion"
                  :value="criterion"
                  severity="success"
                  class="text-xs"
                />
                <span v-if="activeCriteriaForPlace(slotProps.data).length === 0" class="text-500 text-sm">Aucun</span>
              </div>
            </template>
          </Column>
          <!-- Colonnes Offre (données de PlacesViewPHYFP.vue) -->
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Offre PFP3" class="w-8rem">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <span class="font-semibold text-green-600">{{ (slotProps.data.PFP3 && (slotProps.data.PFP3[selectedYear] || (selectedYear === '2028' ? slotProps.data.PFP3['2027'] : null))) || '-' }}</span>
              </div>
            </template>
          </Column>
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
       
          <!-- Colonnes Proposition (champs séparés) -->
          <Column v-if="shouldShowPFPColumn('PFP3')" header="Proposition PFP3" class="w-6rem text-center">
            <template #body="slotProps">
              <div class="flex justify-content-center">
                <InputText v-if="isEditingRow(slotProps.data)" v-model="editBuffer.pfp3_proposition" class="p-inputtext-sm w-6rem text-center" placeholder="0" />
                <span v-else class="font-semibold text-blue-600">{{ getPropositionValue(slotProps.data, 'PFP3') }}</span>
              </div>
            </template>
          </Column>
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
          <Column header="Actions" class="w-10rem">
            <template #body="slotProps">
              <div class="flex justify-content-center gap-1">
                <Button v-if="!isEditingRow(slotProps.data)" icon="pi pi-pencil" class="p-button-outlined p-button-sm" @click="startEditRow(slotProps.data)" v-tooltip.top="'Éditer les propositions'" />
                <template v-else>
                  <Button icon="pi pi-check" class="p-button-success p-button-sm" @click="saveEditRow(slotProps.data)" :loading="savingRowId === slotProps.data.PlaceId" v-tooltip.top="'Sauvegarder'" />
                  <Button icon="pi pi-times" class="p-button-danger p-button-sm" @click="cancelEditRow" v-tooltip.top="'Annuler'" />
                </template>
              </div>
              <div v-if="noChangeFeedbackRowId === slotProps.data.PlaceId" class="text-xs text-600 text-center mt-1">
                Aucun changement
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

        <div class="summary-panel mt-3">
          <div class="summary-panel__title">Récapitulatif (places proposées / offertes / disponibles)</div>
          <div class="summary-grid">
            <div class="summary-grid__head">PFP</div>
            <div class="summary-grid__head text-center">Proposées</div>
            <div class="summary-grid__head text-center">Offertes</div>
            <div class="summary-grid__head text-center">Disponibles</div>

            <template v-for="row in pfpSummaryRows" :key="row.code">
              <div class="summary-grid__cell">{{ row.code }}</div>
              <div class="summary-grid__cell text-center">{{ row.propositions }}</div>
              <div class="summary-grid__cell text-center">{{ row.offres }}</div>
              <div class="summary-grid__cell text-center" :class="row.disponibles > 0 ? 'text-green-600 font-semibold' : 'text-700'">{{ row.disponibles }}</div>
            </template>

            <div class="summary-grid__total">Total</div>
            <div class="summary-grid__total text-center">{{ summaryTotals.propositions }}</div>
            <div class="summary-grid__total text-center">{{ summaryTotals.offres }}</div>
            <div class="summary-grid__total text-center" :class="summaryTotals.disponibles > 0 ? 'text-green-700' : 'text-900'">{{ summaryTotals.disponibles }}</div>
          </div>
        </div>
      </div>

   
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
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

const { scheduleRefresh } = useAutoRefresh(() => refreshPlaces())
const currentVotationYear = new Date().getMonth() >= 8
  ? new Date().getFullYear() + 1
  : new Date().getFullYear()
const MIN_VOTATION_YEAR = 2025
const MAX_VOTATION_YEAR = 2030
const defaultYear = Math.min(Math.max(currentVotationYear, MIN_VOTATION_YEAR), MAX_VOTATION_YEAR)

const selectedYear = ref(String(defaultYear))
const years = computed(() => {
  const size = MAX_VOTATION_YEAR - MIN_VOTATION_YEAR + 1
  return Array.from({ length: size }, (_, i) => {
    const year = String(MIN_VOTATION_YEAR + i)
    const start = String(Number(year) - 1)
    return {
      label: `${start}-${year}`,
      value: year
    }
  })
})
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
const hideZeroOffers = ref(false)
const isCopyingPreviousYear = ref(false)
const isCopyingPreviousYearOffers = ref(false)

// Editing state
const editingRowId = ref(null)
const savingRowId = ref(null)
const noChangeFeedbackRowId = ref(null)
let noChangeFeedbackTimer = null
const editBuffer = ref({
  pfp1a_proposition: '',
  pfp1b_proposition: '',
  pfp2_proposition: '',
  pfp3_proposition: '',
  pfp4_proposition: '',
  msq: false,
  sysint: false,
  neuroger: false,
  aigu: false,
  rehab: false,
  ambu: false,
  fr: false,
  de: false
})

// Published assignments data
const publishedAssignments = ref([])
const loadingAssignments = ref(false)
const studentsToDoByPfp = ref({
  PFP1A: 0,
  PFP1B: 0,
  PFP2: 0,
  PFP3: 0,
  PFP4: 0
})

const criteriaDefinitions = [
  { key: 'MSQ', dbField: 'MSQ', bufferField: 'msq' },
  { key: 'SYSINT', dbField: 'SYSINT', bufferField: 'sysint' },
  { key: 'NEUROGER', dbField: 'NEUROGER', bufferField: 'neuroger' },
  { key: 'AIGU', dbField: 'AIGU', bufferField: 'aigu' },
  { key: 'REHAB', dbField: 'REHAB', bufferField: 'rehab' },
  { key: 'AMBU', dbField: 'AMBU', bufferField: 'ambu' },
  { key: 'FR', dbField: 'FR', bufferField: 'fr' },
  { key: 'DE', dbField: 'DE', bufferField: 'de' }
]

const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
const pfpDisplayOrder = ['PFP2', 'PFP1A', 'PFP1B', 'PFP4', 'PFP3']

const buildBaCode = (year) => {
  const yy = ((year % 100) + 100) % 100
  return `BA${String(yy).padStart(2, '0')}`
}

const parseIntSafe = (value) => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

const normalizePropositionValue = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const normalizeClassCode = (value) => {
  if (!value) return ''
  const normalized = String(value).trim().toUpperCase()
  const match = normalized.match(/BA\s*(\d{2})/)
  return match ? `BA${match[1]}` : normalized
}

const isTrueFlag = (value) => value === true || value === 'true' || value === 1 || value === '1'

const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

const getValueForYearKey = (source, year) => {
  if (!source || typeof source !== 'object') return undefined
  const yearKeys = getAcademicYearKeys(year)
  for (const yearKey of yearKeys) {
    if (Object.prototype.hasOwnProperty.call(source, yearKey)) {
      return source[yearKey]
    }
  }
  return undefined
}

const getOfferForPfp = (place, pfpType, year) => parseIntSafe(getValueForYearKey(place?.[pfpType], year))
const getPropositionForPfp = (place, pfpType, year) => parseIntSafe(getValueForYearKey(place?.[`${pfpType.toLowerCase()}_proposition`], year))

const stats = computed(() => {
  const places = placesData.value
  const totalPlaces = places.length
  const year = selectedYear.value
  const selected = Number(year)
  const ba1 = Number.isFinite(selected) ? buildBaCode(selected - 1) : '-'
  const ba2 = Number.isFinite(selected) ? buildBaCode(selected - 2) : '-'
  const ba3 = Number.isFinite(selected) ? buildBaCode(selected - 3) : '-'
  
  // Calculate places with offers (same source fields as PlacesView: PFP1A/PFP1B/PFP2/PFP3/PFP4)
  const placesWithOffers = places.filter(place => {
    return pfpTypes.some((pfpType) => getOfferForPfp(place, pfpType, year) > 0)
  }).length
  
  // Calculate PFP-specific statistics (Proposition vs Offre vs Assigned)
  const pfpStats = {
    PFP1A: {
      classe: ba1,
      propositions: places.reduce((total, place) => total + getPropositionForPfp(place, 'PFP1A', year), 0),
      offres: places.reduce((total, place) => total + getOfferForPfp(place, 'PFP1A', year), 0),
      etudiantsAnnee: studentsToDoByPfp.value.PFP1A || 0
    },
    PFP1B: {
      classe: ba1,
      propositions: places.reduce((total, place) => total + getPropositionForPfp(place, 'PFP1B', year), 0),
      offres: places.reduce((total, place) => total + getOfferForPfp(place, 'PFP1B', year), 0),
      etudiantsAnnee: studentsToDoByPfp.value.PFP1B || 0
    },
    PFP2: {
      classe: ba2,
      propositions: places.reduce((total, place) => total + getPropositionForPfp(place, 'PFP2', year), 0),
      offres: places.reduce((total, place) => total + getOfferForPfp(place, 'PFP2', year), 0),
      etudiantsAnnee: studentsToDoByPfp.value.PFP2 || 0
    },
    PFP3: {
      classe: ba3,
      propositions: places.reduce((total, place) => total + getPropositionForPfp(place, 'PFP3', year), 0),
      offres: places.reduce((total, place) => total + getOfferForPfp(place, 'PFP3', year), 0),
      etudiantsAnnee: studentsToDoByPfp.value.PFP3 || 0
    },
    PFP4: {
      classe: ba3,
      propositions: places.reduce((total, place) => total + getPropositionForPfp(place, 'PFP4', year), 0),
      offres: places.reduce((total, place) => total + getOfferForPfp(place, 'PFP4', year), 0),
      etudiantsAnnee: studentsToDoByPfp.value.PFP4 || 0
    }
  }

  Object.values(pfpStats).forEach((pfp) => {
    pfp.placesBrutes = pfp.propositions || 0
    pfp.placesDispo = pfp.placesBrutes
    pfp.disponibles = Math.max(0, (pfp.offres || 0) - (pfp.propositions || 0))
  })
  
  const totalAvailable = Object.values(pfpStats).reduce((sum, pfp) => sum + (pfp.placesBrutes || 0), 0)
  
  return {
    total: totalPlaces,
    actives: placesWithOffers,
    places: totalAvailable,
    pfpStats
  }
})

const pfpSummaryRows = computed(() => {
  const orderedVisiblePfp = pfpDisplayOrder.filter(code => shouldShowPFPColumn(code))
  return orderedVisiblePfp.map(code => ({
    code,
    propositions: stats.value.pfpStats?.[code]?.propositions || 0,
    offres: stats.value.pfpStats?.[code]?.offres || 0,
    disponibles: stats.value.pfpStats?.[code]?.disponibles || 0
  }))
})

const summaryTotals = computed(() => {
  return pfpSummaryRows.value.reduce((acc, row) => {
    acc.propositions += row.propositions
    acc.offres += row.offres
    acc.disponibles += row.disponibles
    return acc
  }, { propositions: 0, offres: 0, disponibles: 0 })
})

// Computed pour les données des places
const placesData = computed(() => {
  const places = placesStore.places || []
  const year = selectedYear.value

  if (!hideZeroOffers.value || !year) return places

  if (selectedPFP.value === 'all') {
    return places.filter(place => pfpTypes.some((pfpType) => getOfferForPfp(place, pfpType, year) > 0))
  }

  return places.filter(place => getOfferForPfp(place, selectedPFP.value, year) > 0)
})

// Fonction pour récupérer la valeur Proposition selon l'année
const getPropositionValue = (place, pfpType) => {
  if (!place || !place[`${pfpType.toLowerCase()}_proposition`]) return '-'
  const value = getValueForYearKey(place[`${pfpType.toLowerCase()}_proposition`], selectedYear.value)
  return value === undefined || value === null || value === '' ? '-' : value
}

// Fonction pour calculer l'analyse totale (toutes propositions - toutes offres)
const getTotalAnalysisValue = (place) => {
  const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
  let totalOffre = 0
  let totalProposition = 0
  
  pfpTypes.forEach(pfpType => {
    // Offre = place.PFP1A[year], place.PFP1B[year], etc.
    const offre = getOfferForPfp(place, pfpType, selectedYear.value)
    // Proposition = place.pfp1a_proposition[year], place.pfp1b_proposition[year], etc.
    const proposition = getPropositionForPfp(place, pfpType, selectedYear.value)
    
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

const activeCriteriaForPlace = (place) => {
  if (!place) return []
  return criteriaDefinitions
    .filter(({ dbField }) => place[dbField] === true || place[dbField] === 'true' || place[dbField] === 1)
    .map(({ key }) => key)
}

// Editing functions
const isEditingRow = (row) => {
  return !!row?.PlaceId && editingRowId.value === row.PlaceId
}

const startEditRow = (row) => {
  if (!row?.PlaceId) return

  noChangeFeedbackRowId.value = null
  if (noChangeFeedbackTimer) {
    clearTimeout(noChangeFeedbackTimer)
    noChangeFeedbackTimer = null
  }
  
  const yearKey = selectedYear.value
  editingRowId.value = row.PlaceId
  
  editBuffer.value = {
    pfp1a_proposition: (row.pfp1a_proposition && row.pfp1a_proposition[yearKey]) || '',
    pfp1b_proposition: (row.pfp1b_proposition && row.pfp1b_proposition[yearKey]) || '',
    pfp2_proposition: (row.pfp2_proposition && row.pfp2_proposition[yearKey]) || '',
    pfp3_proposition: (row.pfp3_proposition && row.pfp3_proposition[yearKey]) || '',
    pfp4_proposition: (row.pfp4_proposition && row.pfp4_proposition[yearKey]) || '',
    msq: row.MSQ === true || row.MSQ === 'true' || row.MSQ === 1,
    sysint: row.SYSINT === true || row.SYSINT === 'true' || row.SYSINT === 1,
    neuroger: row.NEUROGER === true || row.NEUROGER === 'true' || row.NEUROGER === 1,
    aigu: row.AIGU === true || row.AIGU === 'true' || row.AIGU === 1,
    rehab: row.REHAB === true || row.REHAB === 'true' || row.REHAB === 1,
    ambu: row.AMBU === true || row.AMBU === 'true' || row.AMBU === 1,
    fr: row.FR === true || row.FR === 'true' || row.FR === 1,
    de: row.DE === true || row.DE === 'true' || row.DE === 1
  }
}

const cancelEditRow = () => {
  editingRowId.value = null
  editBuffer.value = {
    pfp1a_proposition: '',
    pfp1b_proposition: '',
    pfp2_proposition: '',
    pfp3_proposition: '',
    pfp4_proposition: '',
    msq: false,
    sysint: false,
    neuroger: false,
    aigu: false,
    rehab: false,
    ambu: false,
    fr: false,
    de: false
  }
}

const saveEditRow = async (row) => {
  if (!row?.PlaceId) return
  
  savingRowId.value = row.PlaceId
  
  try {
    const yearKey = selectedYear.value

    const currentPfp1a = (row.pfp1a_proposition && row.pfp1a_proposition[yearKey]) || ''
    const currentPfp1b = (row.pfp1b_proposition && row.pfp1b_proposition[yearKey]) || ''
    const currentPfp2 = (row.pfp2_proposition && row.pfp2_proposition[yearKey]) || ''
    const currentPfp3 = (row.pfp3_proposition && row.pfp3_proposition[yearKey]) || ''
    const currentPfp4 = (row.pfp4_proposition && row.pfp4_proposition[yearKey]) || ''

    const nextPfp1a = editBuffer.value.pfp1a_proposition || ''
    const nextPfp1b = editBuffer.value.pfp1b_proposition || ''
    const nextPfp2 = editBuffer.value.pfp2_proposition || ''
    const nextPfp3 = editBuffer.value.pfp3_proposition || ''
    const nextPfp4 = editBuffer.value.pfp4_proposition || ''

    const currentMsq = row.MSQ === true || row.MSQ === 'true' || row.MSQ === 1
    const currentSysint = row.SYSINT === true || row.SYSINT === 'true' || row.SYSINT === 1
    const currentNeuroger = row.NEUROGER === true || row.NEUROGER === 'true' || row.NEUROGER === 1
    const currentAigu = row.AIGU === true || row.AIGU === 'true' || row.AIGU === 1
    const currentRehab = row.REHAB === true || row.REHAB === 'true' || row.REHAB === 1
    const currentAmbu = row.AMBU === true || row.AMBU === 'true' || row.AMBU === 1
    const currentFr = row.FR === true || row.FR === 'true' || row.FR === 1
    const currentDe = row.DE === true || row.DE === 'true' || row.DE === 1

    const nextMsq = !!editBuffer.value.msq
    const nextSysint = !!editBuffer.value.sysint
    const nextNeuroger = !!editBuffer.value.neuroger
    const nextAigu = !!editBuffer.value.aigu
    const nextRehab = !!editBuffer.value.rehab
    const nextAmbu = !!editBuffer.value.ambu
    const nextFr = !!editBuffer.value.fr
    const nextDe = !!editBuffer.value.de

    const hasChanges =
      currentPfp1a !== nextPfp1a ||
      currentPfp1b !== nextPfp1b ||
      currentPfp2 !== nextPfp2 ||
      currentPfp3 !== nextPfp3 ||
      currentPfp4 !== nextPfp4 ||
      currentMsq !== nextMsq ||
      currentSysint !== nextSysint ||
      currentNeuroger !== nextNeuroger ||
      currentAigu !== nextAigu ||
      currentRehab !== nextRehab ||
      currentAmbu !== nextAmbu ||
      currentFr !== nextFr ||
      currentDe !== nextDe

    if (!hasChanges) {
      noChangeFeedbackRowId.value = row.PlaceId
      if (noChangeFeedbackTimer) clearTimeout(noChangeFeedbackTimer)
      noChangeFeedbackTimer = setTimeout(() => {
        if (noChangeFeedbackRowId.value === row.PlaceId) {
          noChangeFeedbackRowId.value = null
        }
      }, 2500)
      cancelEditRow()
      return
    }
    
    const pfp1aProp = { ...(row.pfp1a_proposition || {}) }
    pfp1aProp[yearKey] = nextPfp1a
    
    const pfp1bProp = { ...(row.pfp1b_proposition || {}) }
    pfp1bProp[yearKey] = nextPfp1b
    
    const pfp2Prop = { ...(row.pfp2_proposition || {}) }
    pfp2Prop[yearKey] = nextPfp2
    
    const pfp3Prop = { ...(row.pfp3_proposition || {}) }
    pfp3Prop[yearKey] = nextPfp3
    
    const pfp4Prop = { ...(row.pfp4_proposition || {}) }
    pfp4Prop[yearKey] = nextPfp4
    
    await placesStore.updatePlace(row.PlaceId, {
      pfp1a_proposition: pfp1aProp,
      pfp1b_proposition: pfp1bProp,
      pfp2_proposition: pfp2Prop,
      pfp3_proposition: pfp3Prop,
      pfp4_proposition: pfp4Prop,
      MSQ: nextMsq,
      SYSINT: nextSysint,
      NEUROGER: nextNeuroger,
      AIGU: nextAigu,
      REHAB: nextRehab,
      AMBU: nextAmbu,
      FR: nextFr,
      DE: nextDe
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

const loadStudentsToDoByPfp = async () => {
  const emptyStats = {
    PFP1A: 0,
    PFP1B: 0,
    PFP2: 0,
    PFP3: 0,
    PFP4: 0
  }

  try {
    const selected = Number(selectedYear.value)
    if (!Number.isFinite(selected)) {
      studentsToDoByPfp.value = emptyStats
      return
    }

    const classMap = {
      PFP1A: normalizeClassCode(buildBaCode(selected - 1)),
      PFP1B: normalizeClassCode(buildBaCode(selected - 1)),
      PFP2: normalizeClassCode(buildBaCode(selected - 2)),
      PFP3: normalizeClassCode(buildBaCode(selected - 3)),
      PFP4: normalizeClassCode(buildBaCode(selected - 3))
    }

    const targetClasses = Array.from(new Set(Object.values(classMap)))

    const [{ data: profiles, error: profilesError }, { data: physioRows, error: physioError }, { data: validatedRows, error: validatedError }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id, firebase_id, classe, role, email'),
      supabase
        .from('StudentsPhysio')
        .select('user_id, firebase_id, class'),
      supabase
        .from('student_result_vote')
        .select('user_id, pfp_type, pfp_validee')
    ])

    if (profilesError) throw profilesError
    if (physioError) throw physioError
    if (validatedError) throw validatedError

    const classByIdentity = new Map()
    ;(physioRows || []).forEach((row) => {
      const normalizedClasse = normalizeClassCode(row.class)
      if (!normalizedClasse) return

      if (row.user_id) classByIdentity.set(row.user_id, normalizedClasse)
      if (row.firebase_id) classByIdentity.set(row.firebase_id, normalizedClasse)
    })

    const profilesStudents = (profiles || []).filter((u) => {
      const role = (u.role || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const normalizedClass = normalizeClassCode(u.classe)
      return (
        role.includes('student') ||
        role.includes('etudiant') ||
        role.includes('étudiant') ||
        email.includes('@students.hevs.ch') ||
        targetClasses.includes(normalizedClass)
      )
    })

    const studentMap = new Map()

    profilesStudents.forEach((student) => {
      const classFromProfile = normalizeClassCode(student.classe)
      const normalizedEmail = (student.email || '').trim().toLowerCase()
      const classFromPhysio = classByIdentity.get(student.user_id) || classByIdentity.get(student.firebase_id)
      const resolvedClasse = classFromPhysio || classFromProfile
      if (!resolvedClasse || !targetClasses.includes(resolvedClasse)) return

      const key = student.user_id || student.firebase_id || normalizedEmail
      if (!key) return

      studentMap.set(key, {
        userId: student.user_id || null,
        firebaseId: student.firebase_id || null,
        classe: resolvedClasse
      })
    })

    ;(physioRows || []).forEach((row) => {
      const resolvedClasse = normalizeClassCode(row.class)
      if (!resolvedClasse || !targetClasses.includes(resolvedClasse)) return
      const resolvedUserId = row.user_id || null

      const key = resolvedUserId || row.firebase_id
      if (!key) return

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          userId: resolvedUserId,
          firebaseId: row.firebase_id || null,
          classe: resolvedClasse
        })
      }
    })

    const validatedByPfp = {
      PFP1A: new Set(),
      PFP1B: new Set(),
      PFP2: new Set(),
      PFP3: new Set(),
      PFP4: new Set()
    }

    ;(validatedRows || []).forEach((row) => {
      const pfp = String(row.pfp_type || '').trim().toUpperCase()
      if (!validatedByPfp[pfp]) return
      if (!isTrueFlag(row.pfp_validee)) return
      if (row.user_id) validatedByPfp[pfp].add(row.user_id)
    })

    const studentSetByPfp = {
      PFP1A: new Set(),
      PFP1B: new Set(),
      PFP2: new Set(),
      PFP3: new Set(),
      PFP4: new Set()
    }

    studentMap.forEach((student) => {
      pfpTypes.forEach((pfp) => {
        if (student.classe !== classMap[pfp]) return
        const isValidated =
          (student.userId && validatedByPfp[pfp].has(student.userId)) ||
          (student.firebaseId && validatedByPfp[pfp].has(student.firebaseId))
        if (!isValidated) {
          studentSetByPfp[pfp].add(student.userId || student.firebaseId)
        }
      })
    })

    const nextStats = { ...emptyStats }
    pfpTypes.forEach((pfp) => {
      nextStats[pfp] = studentSetByPfp[pfp].size
    })

    studentsToDoByPfp.value = nextStats
  } catch (error) {
    console.error('Error loading students-to-do by PFP:', error)
    studentsToDoByPfp.value = emptyStats
  }
}

// Function to get assignment analysis for a place (Proposition - Offre)
const getAssignmentAnalysis = (place, pfpType) => {
  const year = selectedYear.value
  
  // Offre = place.PFP1A[year], place.PFP1B[year], etc.
  const offre = getOfferForPfp(place, pfpType, year)
  
  // Proposition = place.pfp1a_proposition[year], place.pfp1b_proposition[year], etc.
  const proposition = getPropositionForPfp(place, pfpType, year)
  
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
    loadPublishedAssignments(),
    loadStudentsToDoByPfp()
  ])
}

const copyPreviousYearPropositions = async () => {
  const targetYear = selectedYear.value
  const targetYearNumber = Number(targetYear)

  if (!Number.isFinite(targetYearNumber)) return

  const previousYear = String(targetYearNumber - 1)
  const pfpScope = selectedPFP.value === 'all' ? pfpTypes : [selectedPFP.value]

  const confirmed = window.confirm(
    `Reprendre les propositions ${previousYear} vers ${targetYear} pour ${pfpScope.join(', ')} ?\n\n` +
    'Les valeurs de l’année sélectionnée seront remplacées uniquement si différentes.'
  )
  if (!confirmed) return

  isCopyingPreviousYear.value = true

  try {
    const { data, error } = await supabase.rpc('copy_previous_year_place_propositions', {
      p_target_year: targetYear,
      p_pfp_type: selectedPFP.value === 'all' ? null : selectedPFP.value
    })

    if (error) {
      if (error.code === 'PGRST202') {
        const fallbackResult = await copyPreviousYearPropositionsFallback(targetYear, previousYear, pfpScope)
        await refreshPlaces()

        if (fallbackResult.updatedFields === 0) {
          window.alert(`Aucune proposition à reprendre depuis ${previousYear}.`)
          return
        }

        window.alert(
          `Reprise terminée (fallback local): ${fallbackResult.updatedFields} champ(s) mis à jour sur ${fallbackResult.updatedPlaces} place(s).`
        )
        return
      }

      throw error
    }

    const updatedPlaces = Number(data?.updated_places || 0)
    const updatedFields = Number(data?.updated_fields || 0)

    await refreshPlaces()

    if (updatedFields === 0) {
      window.alert(`Aucune proposition à reprendre depuis ${previousYear}.`)
      return
    }

    window.alert(
      `Reprise terminée: ${updatedFields} champ(s) mis à jour sur ${updatedPlaces} place(s).`
    )
  } catch (error) {
    console.error('Error while copying previous year propositions:', error)
    window.alert('Erreur pendant la reprise des propositions de l’année précédente.')
  } finally {
    isCopyingPreviousYear.value = false
  }
}

const copyPreviousYearPropositionsFallback = async (targetYear, previousYear, pfpScope) => {
  const propositionFields = pfpScope.map((pfp) => `${pfp.toLowerCase()}_proposition`)
  const places = placesStore.places || []
  let updatedPlaces = 0
  let updatedFields = 0

  for (const place of places) {
    const patch = {}

    propositionFields.forEach((field) => {
      const propositionByYear = place?.[field]
      if (!propositionByYear || typeof propositionByYear !== 'object') return
      if (!Object.prototype.hasOwnProperty.call(propositionByYear, previousYear)) return

      const previousValue = propositionByYear[previousYear]
      const currentValue = propositionByYear[targetYear]

      if (normalizePropositionValue(previousValue) === normalizePropositionValue(currentValue)) {
        return
      }

      patch[field] = {
        ...propositionByYear,
        [targetYear]: previousValue
      }
    })

    if (Object.keys(patch).length === 0) continue

    await placesStore.updatePlace(place.PlaceId, patch)
    updatedPlaces += 1
    updatedFields += Object.keys(patch).length
  }

  return { updatedPlaces, updatedFields }
}

const copyPreviousYearOffers = async () => {
  const targetYear = selectedYear.value
  const targetYearNumber = Number(targetYear)
  if (!Number.isFinite(targetYearNumber)) return

  const previousYear = String(targetYearNumber - 1)
  const pfpScope = selectedPFP.value === 'all' ? pfpTypes : [selectedPFP.value]

  const confirmed = window.confirm(
    `Reprendre les offres ${previousYear} vers ${targetYear} pour ${pfpScope.join(', ')} ?\n\n` +
    "Seules les places sans offre pour l'année cible seront mises à jour."
  )
  if (!confirmed) return

  isCopyingPreviousYearOffers.value = true

  try {
    const places = placesStore.places || []
    let updatedPlaces = 0
    let updatedFields = 0

    for (const place of places) {
      const patch = {}

      for (const pfpType of pfpScope) {
        const offerField = pfpType
        const offerByYear = place?.[offerField]
        if (!offerByYear || typeof offerByYear !== 'object') continue

        const hasPreviousYear = Object.prototype.hasOwnProperty.call(offerByYear, previousYear)
        if (!hasPreviousYear) continue

        const previousValue = offerByYear[previousYear]
        const currentValue = offerByYear[targetYear]

        if (currentValue !== undefined && currentValue !== '' && currentValue !== null) continue

        if (normalizePropositionValue(previousValue) === normalizePropositionValue(currentValue)) continue

        patch[offerField] = {
          ...offerByYear,
          [targetYear]: previousValue
        }
      }

      if (Object.keys(patch).length === 0) continue

      await placesStore.updatePlace(place.PlaceId, patch)
      updatedPlaces += 1
      updatedFields += Object.keys(patch).length
    }

    await refreshPlaces()

    if (updatedFields === 0) {
      window.alert(`Aucune offre à reprendre depuis ${previousYear}. Toutes les places ont déjà des offres pour ${targetYear}.`)
      return
    }

    window.alert(
      `Reprise terminée: ${updatedFields} champ(s) mis à jour sur ${updatedPlaces} place(s).`
    )
  } catch (error) {
    console.error('Error while copying previous year offers:', error)
    window.alert("Erreur pendant la reprise des offres de l'année précédente.")
  } finally {
    isCopyingPreviousYearOffers.value = false
  }
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
    loadPublishedAssignments(),
    loadStudentsToDoByPfp()
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

.criteria-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.criteria-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 0.75rem;
}

.criteria-edit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.summary-panel {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.summary-panel__title {
  font-weight: 600;
  margin-bottom: 0.65rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr;
  gap: 0;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.summary-grid__head,
.summary-grid__cell,
.summary-grid__total {
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid var(--surface-border);
}

.summary-grid__head {
  font-weight: 600;
  background: var(--surface-100);
}

.summary-grid__total {
  font-weight: 700;
  background: var(--surface-100);
  border-bottom: none;
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
