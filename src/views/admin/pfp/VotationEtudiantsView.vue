<template>
  <AdminLayout>
    <Toast />
    <div class="votation-etudiants-page p-4">
      <!-- En-tête avec design moderne sans fond blanc -->
      <div class="header-card p-4 border-round mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Étudiants</h1>
              <p class="text-600 m-0 mt-1">Gestion des choix de stages des étudiants</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined @click="exportData" />
            <Button icon="pi pi-envelope" label="Relancer non-votants" severity="warning" @click="remindAllNonVoters" />
          </div>
        </div>
      </div>

      <!-- Configuration active -->
      <div class="config-banner p-3 border-round mb-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-calendar text-sm"></i>
          <span class="text-sm font-medium">Configuration active :</span>
          <Tag v-for="pfp in ACTIVE_CONFIG.activePFPs" :key="pfp" :value="pfp" severity="success" class="text-xs" />
          <span class="text-sm">•</span>
          <Tag v-for="year in ACTIVE_CONFIG.activeYears" :key="year" :value="year" severity="info" class="text-xs" />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stat-card p-4 border-round">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Total Étudiants</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.completed }}</h3>
                <p class="text-600 m-0">Ont Voté</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-hourglass text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0">En Attente</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.incomplete }}</h3>
                <p class="text-600 m-0">Incomplets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-card p-4 border-round mb-4">
        <div class="flex justify-content-between align-items-center mb-3">
          <span class="text-lg font-semibold">Filtres</span>
          <Button 
            icon="pi pi-filter-slash" 
            label="Réinitialiser" 
            outlined 
            size="small" 
            @click="resetFilters"
          />
        </div>
        <div class="grid">
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="Tous les PFP" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterYear" :options="years" placeholder="Toutes les années" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Toutes les classes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-2">
            <InputText v-model="searchQuery" placeholder="Rechercher un étudiant..." class="w-full" />
          </div>
          <div class="col-12 md:col-3">
            <small class="text-500">
              <i class="pi pi-info-circle"></i> 
              Votes chargés: <strong>{{ allVotes.length }}</strong> | 
              Lignes affichées: <strong>{{ filteredVotationsList.length }}</strong>
            </small>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="tabs-card p-4 border-round">
        <TabView v-model:activeIndex="activeTab">
          <!-- Onglet 1: Vue Étudiants -->
          <TabPanel header="Vue par Étudiants">
            <div v-if="allVotes.length === 0" class="bg-yellow-50 border-round p-4 mb-3">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
                <div>
                  <h4 class="m-0 text-yellow-900">Aucun vote chargé</h4>
                  <p class="m-0 mt-2 text-yellow-800">
                    Les votes ne peuvent pas être chargés. Vérifiez les permissions RLS (Row Level Security) sur la table <code>student_votes</code>.
                    Les administrateurs doivent avoir accès en lecture à tous les votes.
                  </p>
                </div>
              </div>
            </div>
            <DataTable 
              :value="filteredVotationsList" 
              :loading="loading" 
              responsiveLayout="scroll" 
              :paginator="true" 
              :rows="25"
              :rowsPerPageOptions="[25, 50, 100, 200]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} étudiants"
              sortField="nom"
              :sortOrder="1"
              class="votations-table"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="text-xl text-900 font-bold">Votes des Étudiants ({{ filteredVotationsList.length }})</span>
                  <div class="flex gap-2">
                    <Button icon="pi pi-sort-alpha-down" label="Trier A-Z" outlined size="small" @click="sortAlphabetically" />
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="text-center p-4">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucune votation trouvée</p>
                </div>
              </template>
              <Column field="nom" header="Nom" sortable :style="{ minWidth: '150px' }"></Column>
              <Column field="prenom" header="Prénom" sortable :style="{ minWidth: '150px' }"></Column>
              <Column field="classe" header="Classe" sortable :style="{ minWidth: '100px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.classe" severity="info" />
                </template>
              </Column>
              <Column field="pfpType" header="PFP" sortable :style="{ minWidth: '100px' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.pfpType" :value="slotProps.data.pfpType" />
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="year" header="Année" sortable :style="{ minWidth: '80px' }"></Column>
              <Column header="Choix 1" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix1" class="choice-cell p-2 bg-blue-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-blue-500">1</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix1 }}</div>
                        <div v-if="slotProps.data.choix1Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix1Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice1PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice1PlaceId).top1" severity="success" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 2" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix2" class="choice-cell p-2 bg-cyan-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-cyan-500">2</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix2 }}</div>
                        <div v-if="slotProps.data.choix2Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix2Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice2PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice2PlaceId).top2" severity="info" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 3" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix3" class="choice-cell p-2 bg-orange-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-orange-500">3</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix3 }}</div>
                        <div v-if="slotProps.data.choix3Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix3Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice3PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice3PlaceId).top3" severity="warning" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 4" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix4" class="choice-cell p-2 bg-gray-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-gray-500">4</span>
                      <div class="flex-1">
                        <div class="font-medium text-900 text-sm">{{ slotProps.data.choix4 }}</div>
                        <div v-if="slotProps.data.choix4Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix4Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice4PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice4PlaceId).top4" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 5" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix5" class="choice-cell p-2 bg-gray-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-gray-500">5</span>
                      <div class="flex-1">
                        <div class="font-medium text-900 text-sm">{{ slotProps.data.choix5 }}</div>
                        <div v-if="slotProps.data.choix5Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix5Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice5PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice5PlaceId).top5" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="nbChoix" header="Nb Choix" sortable :style="{ minWidth: '100px', textAlign: 'center' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.nbChoix" :value="slotProps.data.nbChoix" severity="success" rounded />
                  <Tag v-else value="0" severity="secondary" rounded />
                </template>
              </Column>
              <Column field="dateVote" header="Date Vote" sortable :style="{ minWidth: '150px' }">
                <template #body="slotProps">
                  <span v-if="slotProps.data.dateVote" class="text-sm">{{ formatDate(slotProps.data.dateVote) }}</span>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="status" header="Statut" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column header="Actions" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <div class="flex gap-1">
                    <Button 
                      v-if="slotProps.data.status !== 'Non voté'" 
                      icon="pi pi-eye" 
                      class="p-button-text p-button-sm" 
                      @click="viewDetails(slotProps.data)"
                      v-tooltip.top="'Voir les détails'"
                    />
                    <Button 
                      v-if="slotProps.data.status === 'Non voté'" 
                      icon="pi pi-send" 
                      class="p-button-text p-button-sm" 
                      severity="warning"
                      @click="remindStudent(slotProps.data)"
                      v-tooltip.top="'Relancer l\'étudiant'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          
          <!-- Onglet 2: Vue Places -->
          <TabPanel header="Vue par Places">
            <DataTable 
              :value="filteredPlacesByPFP" 
              :loading="loading" 
              responsiveLayout="scroll"
              :scrollable="true"
              scrollHeight="60vh"
              :paginator="true" 
              :rows="25"
              :rowsPerPageOptions="[25, 50, 100, 200]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} places"
              sortField="InstitutionName"
              :sortOrder="1"
              class="places-stats-table"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center mb-3">
                  <span class="text-xl text-900 font-bold">Statistiques par Places ({{ filteredPlacesByPFP.length }})</span>
                  <div class="flex gap-2">
                    <Button 
                      label="Tous" 
                      :class="{ 'p-button-outlined': filterPlacesPFP !== null }"
                      size="small"
                      @click="filterPlacesPFP = null"
                    />
                    <Button 
                      label="PFP1A" 
                      severity="success"
                      :class="{ 'p-button-outlined': filterPlacesPFP !== 'PFP1A' }"
                      size="small"
                      @click="filterPlacesPFP = 'PFP1A'"
                    />
                    <Button 
                      label="PFP1B" 
                      severity="info"
                      :class="{ 'p-button-outlined': filterPlacesPFP !== 'PFP1B' }"
                      size="small"
                      @click="filterPlacesPFP = 'PFP1B'"
                    />
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="text-center p-4">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucune place trouvée</p>
                </div>
              </template>
              
              <!-- Colonnes du tableau places -->
              <Column header="Institution" sortable field="InstitutionName" :style="{ minWidth: '200px' }">
                <template #body="slotProps">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-building text-primary"></i>
                    <span class="font-medium">{{ slotProps.data.InstitutionName }}</span>
                  </div>
                </template>
              </Column>
              
              <Column header="Nom de la Place" sortable field="NomPlace" :style="{ minWidth: '180px' }">
                <template #body="slotProps">
                  <span class="font-medium">{{ slotProps.data.NomPlace }}</span>
                </template>
              </Column>
              
              <Column header="Catégorie" sortable field="InstitutionCategory" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
                </template>
              </Column>
              
              <Column header="PFP" sortable field="pfpType" :style="{ minWidth: '80px' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.pfpType" :value="slotProps.data.pfpType" />
                </template>
              </Column>
              
              <Column header="Année" sortable field="year" :style="{ minWidth: '80px' }"></Column>
              
              <!-- Colonnes de votes Top 1 à 5 -->
              <Column v-for="i in 5" :key="'top-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '70px' }">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.votes['top'+i] || 0"
                    :severity="slotProps.data.votes['top'+i] > 0 ? 'success' : 'secondary'"
                    rounded
                    @click="showStudentsForPlace(slotProps.data, i)"
                    class="cursor-pointer"
                    v-tooltip.top="`${slotProps.data.votes['top'+i] || 0} étudiants ont choisi cette place en top ${i}`"
                  />
                </template>
              </Column>
              
              <Column header="Total" :style="{ textAlign: 'center', width: '80px' }">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.votes.total || 0"
                    severity="contrast"
                    rounded
                    class="font-semibold"
                    @click="showStudentsForPlace(slotProps.data, 0)"
                    v-tooltip.top="`${slotProps.data.votes.total || 0} votes au total`"
                  />
                </template>
              </Column>
              
              <Column header="Étudiants" :style="{ minWidth: '150px' }">
                <template #body="slotProps">
                  <Button 
                    icon="pi pi-users" 
                    label="Voir" 
                    size="small" 
                    outlined
                    @click="showStudentsForPlace(slotProps.data, 0)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import votesBackendService from '@/stores/votesBackendService'

const toast = useToast()
const loading = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterStatus = ref(null)
const filterPFP = ref(null)
const filterYear = ref(null)
const filterPlacesPFP = ref(null)
const votationsList = ref([])
const allStudents = ref([])
const allVotes = ref([])
const votesAggregation = ref({})
const placesWithStats = ref([])
const activeTab = ref(0)
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

// ============================================
// CONFIGURATION CENTRALISÉE - Facile à modifier
// ============================================
const ACTIVE_CONFIG = {
  // Années actives pour les votations
  activeYears: ['2026'],
  
  // Types de PFP actifs
  activePFPs: ['PFP1A', 'PFP1B'],
  
  // Configuration complète pour extension future
  allYears: ['2024', '2025', '2026', '2027', '2028'],
  allPFPs: [
    { label: 'PFP1A', value: 'PFP1A', active: true },
    { label: 'PFP1B', value: 'PFP1B', active: true },
    { label: 'PFP2', value: 'PFP2', active: false },
    { label: 'PFP3', value: 'PFP3', active: false },
    { label: 'PFP4', value: 'PFP4', active: false }
  ]
}

// Filtrer pour n'afficher que les PFP actifs
const pfpTypes = ref(
  ACTIVE_CONFIG.allPFPs.filter(pfp => pfp.active)
)

const years = ref(ACTIVE_CONFIG.activeYears)
const classes = ref(['BA22', 'BA23', 'BA24', 'BA25', 'BA26'])
const statusOptions = ref(['Complet', 'Incomplet', 'Non voté'])

const stats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  incomplete: 0
})

// Computed property pour filtrer les votations
const filteredVotationsList = computed(() => {
  let filtered = votationsList.value

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(v => 
      v.nom.toLowerCase().includes(query) ||
      v.prenom.toLowerCase().includes(query) ||
      v.classe.toLowerCase().includes(query)
    )
  }

  // Filtre par classe
  if (filterClasse.value) {
    filtered = filtered.filter(v => v.classe === filterClasse.value)
  }

  // Filtre par statut
  if (filterStatus.value) {
    filtered = filtered.filter(v => v.status === filterStatus.value)
  }

  // Filtre par PFP
  if (filterPFP.value) {
    filtered = filtered.filter(v => v.pfpType === filterPFP.value)
  }

  // Filtre par année
  if (filterYear.value) {
    filtered = filtered.filter(v => v.year === filterYear.value)
  }

  return filtered
})

// Computed property pour filtrer les places par PFP
const filteredPlacesByPFP = computed(() => {
  if (!filterPlacesPFP.value) {
    return placesWithStats.value
  }
  
  // Filtrer les places en fonction du PFP sélectionné
  // On garde seulement les places qui ont des votes pour ce PFP
  return placesWithStats.value.filter(place => {
    // Vérifier si cette place a des votes pour le PFP sélectionné
    // en regardant dans allVotes
    const hasVotesForPFP = allVotes.value.some(vote => {
      if (vote.pfp_type !== filterPlacesPFP.value) return false
      
      // Parser choices si nécessaire
      let choices = []
      if (typeof vote.choices === 'string') {
        try {
          choices = JSON.parse(vote.choices)
        } catch (e) {
          return false
        }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      
      // Vérifier si un des choix correspond à ce placeId
      return choices.some(choice => choice.placeId === place.PlaceId)
    })
    
    return hasVotesForPFP
  })
})

const getStatusSeverity = (status) => {
  const severities = {
    'Complet': 'success',
    'Incomplet': 'warning',
    'Non voté': 'danger'
  }
  return severities[status] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sortAlphabetically = () => {
  votationsList.value.sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
    const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })
}

const resetFilters = () => {
  filterPFP.value = null
  filterYear.value = null
  filterClasse.value = null
  filterStatus.value = null
  searchQuery.value = ''
  
  toast.add({
    severity: 'info',
    summary: 'Filtres réinitialisés',
    detail: `Affichage de ${votationsList.value.length} lignes`,
    life: 3000
  })
}

const getVoteCountForPlace = (placeId) => {
  if (!placeId) return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
  
  if (votesAggregation.value[placeId]) {
    return votesAggregation.value[placeId]
  }
  
  return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
}

const loadVoteStatistics = async () => {
  try {
    console.log('📊 Chargement des statistiques de votes...')
    
    // Méthode 1: Essayer d'utiliser la vue d'agrégation
    try {
      const allStats = await votesBackendService.getVotePlaceAggregation()
      
      if (allStats && allStats.length > 0) {
        console.log('✅ Statistiques depuis vue:', allStats.length, 'entrées')
        
        const aggregation = {}
        
        allStats.forEach(agg => {
          const placeId = agg.place_id
          const rank = agg.rank
          const count = agg.vote_count
          
          if (!aggregation[placeId]) {
            aggregation[placeId] = {
              top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
            }
          }
          
          aggregation[placeId][`top${rank}`] = count
          aggregation[placeId].total += count
        })
        
        votesAggregation.value = aggregation
        console.log('✅ Votes agrégés:', Object.keys(aggregation).length, 'places')
        return
      }
    } catch (viewError) {
      console.warn('⚠️ Vue d\'agrégation non disponible:', viewError.message)
    }
    
    // Méthode 2: Calculer manuellement depuis tous les votes
    console.log('📊 Calcul manuel des statistiques depuis les votes...')
    const { data: allVotesData, error: votesError } = await supabase
      .from('student_votes')
      .select('choices')
    
    if (votesError) throw votesError
    
    const aggregation = {}
    
    allVotesData.forEach(vote => {
      // Parser choices si nécessaire
      let choices = []
      if (typeof vote.choices === 'string') {
        try {
          choices = JSON.parse(vote.choices)
        } catch (e) {
          console.error('Erreur parsing choices pour stats:', e)
          return
        }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      
      if (choices && choices.length > 0) {
        choices.forEach((choice, index) => {
          const placeId = choice.placeId
          const rank = choice.rank || (index + 1) // Utiliser choice.rank si disponible, sinon l'index
          
          if (placeId) {
            if (!aggregation[placeId]) {
              aggregation[placeId] = {
                top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
              }
            }
            
            if (rank >= 1 && rank <= 5) {
              aggregation[placeId][`top${rank}`] = (aggregation[placeId][`top${rank}`] || 0) + 1
              aggregation[placeId].total += 1
            }
          }
        })
      }
    })
    
    votesAggregation.value = aggregation
    console.log('✅ Votes agrégés manuellement:', Object.keys(aggregation).length, 'places')
    console.log('📊 Exemple de données:', Object.entries(aggregation).slice(0, 3))
  } catch (error) {
    console.error('❌ Erreur lors du chargement des statistiques:', error)
    votesAggregation.value = {}
  }
}

const buildPlacesWithStats = async () => {
  try {
    console.log('🏥 Construction des statistiques par place...')
    
    // Charger les places et institutions
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()
    
    const places = placesStore.places
    const institutions = institutionsStore.institutions
    
    // Créer un mapping des institutions
    const institutionMap = new Map()
    institutions.forEach(inst => {
      institutionMap.set(inst.InstitutionId, inst)
    })
    
    // Filtrer les places selon les filtres actifs
    let filteredPlaces = places
    
    // Créer la liste des places avec stats
    const placesStats = []
    
    // Pour chaque place, calculer les stats de votes
    filteredPlaces.forEach(place => {
      const institution = institutionMap.get(place.InstitutionId)
      
      // Récupérer les stats de votes pour cette place
      const voteStats = votesAggregation.value[place.PlaceId] || {
        top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
      }
      
      placesStats.push({
        PlaceId: place.PlaceId,
        NomPlace: place.NomPlace,
        InstitutionName: institution?.Name || 'Inconnu',
        InstitutionCategory: institution?.Category || 'Non spécifié',
        InstitutionId: place.InstitutionId,
        pfpType: filterPFP.value || 'Tous',
        year: filterYear.value || new Date().getFullYear().toString(),
        votes: voteStats,
        rawPlace: place
      })
    })
    
    placesWithStats.value = placesStats
    console.log(`✅ ${placesStats.length} places avec statistiques`)
  } catch (error) {
    console.error('❌ Erreur lors de la construction des stats par place:', error)
  }
}

const showStudentsForPlace = (place, rank) => {
  console.log('Afficher les étudiants pour:', place, 'rang:', rank)
  
  // Trouver tous les étudiants qui ont voté pour cette place
  const studentsForPlace = votationsList.value.filter(v => {
    if (rank === 0) {
      // Tous les rangs
      return v.choice1PlaceId === place.PlaceId ||
             v.choice2PlaceId === place.PlaceId ||
             v.choice3PlaceId === place.PlaceId ||
             v.choice4PlaceId === place.PlaceId ||
             v.choice5PlaceId === place.PlaceId
    } else {
      // Rang spécifique
      return v[`choice${rank}PlaceId`] === place.PlaceId
    }
  })
  
  const rankText = rank === 0 ? 'tous rangs confondus' : `en top ${rank}`
  const studentNames = studentsForPlace.map(s => `${s.prenom} ${s.nom}`).join(', ')
  
  toast.add({
    severity: 'info',
    summary: `Étudiants pour ${place.NomPlace}`,
    detail: `${studentsForPlace.length} étudiants ont voté (${rankText}): ${studentNames || 'Aucun'}`,
    life: 8000
  })
  
  // Basculer vers l'onglet étudiants et filtrer
  activeTab.value = 0
  searchQuery.value = ''
}

const loadData = async () => {
  loading.value = true
  try {
    // 1. Charger tous les étudiants
    console.log('📚 Chargement des étudiants...')
    allStudents.value = await getAllStudents()
    console.log(`✅ ${allStudents.value.length} étudiants chargés`)
    
    // 2. Charger les places pour avoir les noms
    console.log('🏥 Chargement des places...')
    await placesStore.fetchPlaces()
    const placesMap = new Map()
    placesStore.places.forEach(place => {
      placesMap.set(place.PlaceId, place.NomPlace)
    })
    console.log(`✅ ${placesMap.size} places chargées`)

    // 3. Charger les statistiques de votes
    await loadVoteStatistics()

    // 4. Charger tous les votes
    console.log('🗳️ Chargement des votes...')
    
    // Essayer de charger avec select *
    let { data: votes, error: votesError } = await supabase
      .from('student_votes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (votesError) {
      console.error('❌ Erreur lors du chargement des votes:', votesError)
      throw votesError
    }
    
    allVotes.value = votes || []
    console.log(`✅ ${allVotes.value.length} votes chargés`)
    
    // Debug supplémentaire si 0 votes
    if (allVotes.value.length === 0) {
      console.warn('⚠️ ATTENTION: Aucun vote chargé !')
      console.warn('⚠️ Vérifiez les permissions RLS sur la table student_votes')
      console.warn('⚠️ La politique RLS doit permettre aux admins de lire tous les votes')
      
      // Essayer de compter les votes pour voir s'ils existent
      const { count, error: countError } = await supabase
        .from('student_votes')
        .select('*', { count: 'exact', head: true })
      
      if (!countError) {
        console.warn(`⚠️ Il y a ${count} votes dans la table mais vous n'y avez pas accès`)
      }
    }
    
    // Debug: afficher un exemple de vote
    if (allVotes.value.length > 0) {
      console.log('📋 Exemple de vote complet:', JSON.stringify(allVotes.value[0], null, 2))
      console.log('📋 Structure choices attendue:', {
        exemple: allVotes.value[0].choices,
        type: typeof allVotes.value[0].choices,
        isArray: Array.isArray(allVotes.value[0].choices),
        length: Array.isArray(allVotes.value[0].choices) ? allVotes.value[0].choices.length : 'N/A'
      })
    }

    // 3. Construire la liste des votations en combinant étudiants et votes
    const votationsMap = new Map()

    // D'abord, ajouter tous les votes existants
    allVotes.value.forEach((vote, index) => {
      const student = allStudents.value.find(s => s.id === vote.user_id)
      
      if (student) {
        // Parser choices si c'est une string JSON, sinon utiliser directement
        let choices = []
        if (typeof vote.choices === 'string') {
          try {
            choices = JSON.parse(vote.choices)
          } catch (e) {
            console.error('Erreur parsing choices:', e)
            choices = []
          }
        } else if (Array.isArray(vote.choices)) {
          choices = vote.choices
        }
        
        const key = `${vote.user_id}-${vote.pfp_type}-${vote.year}`
        
        if (index < 3) {
          console.log(`🔍 Vote ${index + 1}:`, {
            userId: vote.user_id,
            student: `${student.Prenom} ${student.Nom}`,
            pfpType: vote.pfp_type,
            year: vote.year,
            choicesType: typeof vote.choices,
            choicesCount: choices.length,
            choices: choices.slice(0, 2) // Juste les 2 premiers pour éviter trop de log
          })
        }
        
        // Récupérer les noms des places depuis placesMap ou depuis choices
        const getPlaceName = (choice) => {
          if (!choice) return null
          if (choice.placeName) return choice.placeName
          if (choice.placeId && placesMap.has(choice.placeId)) {
            return placesMap.get(choice.placeId)
          }
          return null
        }
        
        votationsMap.set(key, {
          id: vote.id,
          userId: vote.user_id,
          nom: student.Nom || 'N/A',
          prenom: student.Prenom || 'N/A',
          classe: student.Classe || 'N/A',
          pfpType: vote.pfp_type,
          year: vote.year,
          choix1: getPlaceName(choices[0]),
          choix2: getPlaceName(choices[1]),
          choix3: getPlaceName(choices[2]),
          choix4: getPlaceName(choices[3]),
          choix5: getPlaceName(choices[4]),
          choix1Institution: choices[0]?.InstitutionName || null,
          choix2Institution: choices[1]?.InstitutionName || null,
          choix3Institution: choices[2]?.InstitutionName || null,
          choix4Institution: choices[3]?.InstitutionName || null,
          choix5Institution: choices[4]?.InstitutionName || null,
          choice1PlaceId: choices[0]?.placeId || null,
          choice2PlaceId: choices[1]?.placeId || null,
          choice3PlaceId: choices[2]?.placeId || null,
          choice4PlaceId: choices[3]?.placeId || null,
          choice5PlaceId: choices[4]?.placeId || null,
          nbChoix: choices.length,
          dateVote: vote.updated_at,
          status: choices.length >= 3 ? 'Complet' : 'Incomplet',
          rawVote: vote,
          rawStudent: student
        })
      }
    })

    // Ensuite, ajouter les étudiants qui n'ont pas voté pour chaque type de PFP et année
    // Utiliser la configuration centralisée
    const relevantYears = ACTIVE_CONFIG.activeYears
    const relevantPFPs = ACTIVE_CONFIG.activePFPs

    allStudents.value.forEach(student => {
      relevantPFPs.forEach(pfpType => {
        relevantYears.forEach(year => {
          const key = `${student.id}-${pfpType}-${year}`
          
          if (!votationsMap.has(key)) {
            votationsMap.set(key, {
              id: null,
              userId: student.id,
              nom: student.Nom || 'N/A',
              prenom: student.Prenom || 'N/A',
              classe: student.Classe || 'N/A',
              pfpType: pfpType,
              year: year,
              choix1: null,
              choix2: null,
              choix3: null,
              choix4: null,
              choix5: null,
              nbChoix: 0,
              dateVote: null,
              status: 'Non voté',
              rawVote: null,
              rawStudent: student
            })
          }
        })
      })
    })

    votationsList.value = Array.from(votationsMap.values())
    
    console.log(`📋 Total votations créées: ${votationsList.value.length}`)
    console.log('📋 Exemples de votations (3 premières):')
    votationsList.value.slice(0, 3).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.prenom} ${v.nom} - ${v.pfpType} ${v.year}:`, {
        choix1: v.choix1,
        choix2: v.choix2,
        choix3: v.choix3,
        nbChoix: v.nbChoix,
        status: v.status
      })
    })
    
    // Trier alphabétiquement par défaut
    sortAlphabetically()

    // Calculer les statistiques
    updateStats()
    
    // Construire les statistiques par place
    await buildPlacesWithStats()

    console.log(`✅ ${votationsList.value.length} lignes de votations créées`)
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données: ' + error.message,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const total = votationsList.value.length
  const completed = votationsList.value.filter(v => v.status === 'Complet').length
  const incomplete = votationsList.value.filter(v => v.status === 'Incomplet').length
  const notVoted = votationsList.value.filter(v => v.status === 'Non voté').length

  stats.value = {
    total,
    completed,
    pending: notVoted,
    incomplete
  }
}

const viewDetails = (data) => {
  if (!data.rawVote) return
  
  console.log('Détails du vote:', data)
  toast.add({
    severity: 'info',
    summary: 'Détails du vote',
    detail: `${data.prenom} ${data.nom} - ${data.nbChoix} choix`,
    life: 3000
  })
}

const remindStudent = (data) => {
  console.log('Relancer étudiant:', data)
  toast.add({
    severity: 'info',
    summary: 'Relance',
    detail: `Relance envoyée à ${data.prenom} ${data.nom}`,
    life: 3000
  })
}

const remindAllNonVoters = () => {
  const nonVoters = filteredVotationsList.value.filter(v => v.status === 'Non voté')
  
  if (nonVoters.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Aucun étudiant à relancer',
      life: 3000
    })
    return
  }

  console.log(`Relancer ${nonVoters.length} étudiants qui n'ont pas voté`)
  toast.add({
    severity: 'success',
    summary: 'Relances envoyées',
    detail: `${nonVoters.length} relances envoyées aux étudiants n'ayant pas voté`,
    life: 5000
  })
}

const exportData = () => {
  try {
    const dataToExport = filteredVotationsList.value

    // Créer le contenu CSV
    const headers = ['Nom', 'Prénom', 'Classe', 'PFP', 'Année', 'Choix 1', 'Choix 2', 'Choix 3', 'Nb Choix', 'Date Vote', 'Statut']
    const csvContent = [
      headers.join(';'),
      ...dataToExport.map(row => [
        row.nom,
        row.prenom,
        row.classe,
        row.pfpType,
        row.year,
        row.choix1 || '',
        row.choix2 || '',
        row.choix3 || '',
        row.nbChoix,
        row.dateVote ? formatDate(row.dateVote) : '',
        row.status
      ].join(';'))
    ].join('\n')

    // Créer un blob et télécharger
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `votations_etudiants_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `${dataToExport.length} lignes exportées`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter les données',
      life: 5000
    })
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
/* Design cohérent avec le reste de l'application */
.votation-etudiants-page {
  min-height: calc(100vh - 100px);
  background: #e5e7eb;
}

/* En-tête sombre */
.header-card {
  background: #1f2937;
}

.header-card h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.header-card p {
  color: #9ca3af;
}

.header-card .text-primary {
  color: #60a5fa !important;
}

/* Banner de configuration */
.config-banner {
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.config-banner i {
  color: #3b82f6;
}

.config-banner span {
  color: #1e40af;
}

/* Cartes de statistiques sur fond sombre */
.stat-card {
  background: #1f2937;
  border: 1px solid #374151;
}

.stat-card h3 {
}


/* Carte des filtres sur fond sombre */
.filters-card {
  background: #1f2937;
  border: 1px solid #374151;
}

.filters-card .text-lg {
}

/* Carte des onglets sur fond sombre */
.tabs-card {
  background: #1f2937;
  border: 1px solid #374151;
}

/* Onglets avec fond sombre */
:deep(.p-tabview .p-tabview-nav) {
  background: #111827;
  border-bottom: 1px solid #374151;
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
  color: #9ca3af;
  border: none;
}

:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: transparent;
  color: #fbbf24;
  border-bottom: 2px solid #fbbf24;
}

:deep(.p-tabview .p-tabview-panels) {
  background: #1f2937;
}

/* Table avec fond sombre */
:deep(.p-datatable) {
  background: #1f2937;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #111827;
  
  font-weight: 600;
  border: 1px solid #374151;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #1f2937;
  
  border-bottom: 1px solid #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #4b5563 !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border: 1px solid #374151;
  padding: 0.75rem;
}

/* Curseur pointer */
.cursor-pointer {
  cursor: pointer;
  transition: all 0.15s ease;
}

.cursor-pointer:hover {
  opacity: 0.85;
  transform: scale(1.03);
}

/* Cellules de choix avec fond blanc pour contraste */
.choice-cell {
  background-color: white !important;
  transition: all 0.2s ease;
}

.choice-cell:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Style pour les colonnes de choix */
.bg-blue-50 {
  background-color: white !important;
  border-left: 4px solid #3b82f6;
}

.bg-cyan-50 {
  background-color: white !important;
  border-left: 4px solid #06b6d4;
}

.bg-orange-50 {
  background-color: white !important;
  border-left: 4px solid #f97316;
}

.bg-gray-50 {
  background-color: white !important;
  border-left: 4px solid #6b7280;
}

/* Badges de choix */
.choice-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.bg-blue-500 {
  background-color: #3b82f6;
}

.bg-cyan-500 {
  background-color: #06b6d4;
}

.bg-orange-500 {
  background-color: #f97316;
}

.bg-gray-500 {
  background-color: #6b7280;
}

/* Texte dans les choix */
.choice-cell .text-900 {
  color: #111827 !important;
}

.choice-cell .text-600 {
  color: #4b5563 !important;
}

/* Warning banner */
.bg-yellow-50 {
  background: #fef3c7 !important;
}

.text-yellow-600 {
  color: #d97706 !important;
}

.text-yellow-800,
.text-yellow-900 {
  color: #92400e !important;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.filters-card,
.tabs-card {
  animation: fadeIn 0.3s ease-out;
}

/* Responsive */
@media (max-width: 768px) {
  .header-card h1 {
    font-size: 1.25rem;
  }
}
</style>
