<template>
  <AdminLayout>
    <div class="offre-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary">Secrétariat</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Tableau Récapitulatif Offres</span>
      </div>

      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-briefcase text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Récapitulatif des Offres</h1>
              <p class="text-600 m-0 mt-1">Offres et propositions par place de formation — {{ selectedYear }}</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchText" placeholder="Institution ou place..." class="w-full md:w-14rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown :options="years" v-model="selectedYear" class="w-full md:w-6rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Type PFP :</label>
              <Dropdown :options="pfpOptions" optionLabel="label" optionValue="value" v-model="selectedPFP" class="w-full md:w-8rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Affichage :</label>
              <Dropdown :options="displayOptions" optionLabel="label" optionValue="value" v-model="filterDisplay" class="w-full md:w-10rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export" outlined class="p-button-sm" @click="exportCSV" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="refreshPlaces" v-tooltip="'Rafraîchir'" :loading="placesStore.loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques principales -->
      <div class="grid mb-3">
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-briefcase text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Places totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.actives }}</h3>
                <p class="text-600 m-0">Avec offres</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-map-marker text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.totalOffers }}</h3>
                <p class="text-600 m-0">Offres totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-building text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.institutions }}</h3>
                <p class="text-600 m-0">Institutions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques PFP avec barres de progression -->
      <div class="flex gap-2 mb-3 flex-wrap">
        <div v-for="pfp in pfpStatsList" :key="pfp.key" class="flex-1 min-w-0">
          <div class="surface-card p-3 border-round shadow-2 pfp-stat-card" :style="{ borderTop: `3px solid ${pfp.color}` }">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="font-bold text-800 text-sm">{{ pfp.key }}</span>
              <span class="text-xs text-500">prop / offre</span>
            </div>
            <div class="flex align-items-baseline gap-1 mb-2">
              <span class="text-xl font-bold" :style="{ color: pfp.color }">{{ stats.pfpStats[pfp.key].propositions }}</span>
              <span class="text-400 text-sm">/</span>
              <span class="text-xl font-bold text-900">{{ stats.pfpStats[pfp.key].offres }}</span>
            </div>
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                :style="{
                  width: getProgressWidth(stats.pfpStats[pfp.key].propositions, stats.pfpStats[pfp.key].offres) + '%',
                  background: pfp.color
                }"
              ></div>
            </div>
            <div class="flex justify-content-between mt-1">
              <span class="text-xs" :style="{ color: pfp.color }">
                {{ getProgressLabel(stats.pfpStats[pfp.key].propositions, stats.pfpStats[pfp.key].offres) }}
              </span>
              <span class="text-xs text-400">{{ getProgressPercent(stats.pfpStats[pfp.key].propositions, stats.pfpStats[pfp.key].offres) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Légende -->
      <div class="flex gap-3 align-items-center mb-3 px-1">
        <span class="text-sm text-600 font-semibold">Légende :</span>
        <span class="flex align-items-center gap-1">
          <span class="legend-dot bg-green-500"></span>
          <span class="text-xs text-600">Équilibré (0)</span>
        </span>
        <span class="flex align-items-center gap-1">
          <span class="legend-dot bg-orange-500"></span>
          <span class="text-xs text-600">Surproposition (+)</span>
        </span>
        <span class="flex align-items-center gap-1">
          <span class="legend-dot bg-red-500"></span>
          <span class="text-xs text-600">Sous-proposition (−)</span>
        </span>
        <span class="flex align-items-center gap-1 ml-2">
          <span class="offre-pill offre-has-value" style="font-size:0.65rem;height:18px;min-width:20px;padding:0 5px">3</span>
          <span class="text-xs text-600">Offre</span>
        </span>
        <span class="flex align-items-center gap-1">
          <span class="prop-pill prop-has-value" style="font-size:0.65rem;height:18px;min-width:20px;padding:0 5px">2</span>
          <span class="text-xs text-600">Proposition</span>
        </span>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          :value="filteredPlaces"
          :loading="placesStore.loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="50"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          :rowHover="true"
          dataKey="PlaceId"
          scrollable
          scrollHeight="flex"
          class="offre-table p-datatable-sm"
          :sortField="'Institution_name'"
          :sortOrder="1"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Places de Formation ({{ filteredPlaces.length }})</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune place trouvée</p>
            </div>
          </template>

          <!-- Institution -->
          <Column field="Institution_name" header="Institution" sortable :frozen="true" style="min-width: 210px">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <div class="institution-avatar">
                  <i class="pi pi-building text-xs"></i>
                </div>
                <span class="font-semibold text-900 text-sm">{{ data.Institution_name || '-' }}</span>
              </div>
            </template>
          </Column>

          <!-- Place -->
          <Column field="NomPlace" header="Place de formation" sortable style="min-width: 230px">
            <template #body="{ data }">
              <span class="text-700 text-sm">{{ data.NomPlace || '-' }}</span>
            </template>
          </Column>

          <!-- Grouped PFP columns: Offre + Prop + Δ per PFP -->
          <template v-for="(pfp, idx) in visiblePfpTypes" :key="pfp">
            <Column :header="pfp + ' Offre'" :class="'col-pfp-' + (idx % 2)" style="min-width: 75px">
              <template #body="{ data }">
                <div class="flex justify-content-center">
                  <span v-if="getOffreValue(data, pfp) !== '-'" class="offre-pill offre-has-value">
                    {{ getOffreValue(data, pfp) }}
                  </span>
                  <span v-else class="offre-pill offre-empty">—</span>
                </div>
              </template>
            </Column>

            <Column :header="pfp + ' Prop.'" :class="'col-pfp-' + (idx % 2)" style="min-width: 75px">
              <template #body="{ data }">
                <div class="flex justify-content-center">
                  <span v-if="getPropositionValue(data, pfp) !== '-'" class="prop-pill prop-has-value">
                    {{ getPropositionValue(data, pfp) }}
                  </span>
                  <span v-else class="prop-pill prop-empty">—</span>
                </div>
              </template>
            </Column>

            <Column :header="pfp + ' Δ'" :class="'col-pfp-' + (idx % 2)" style="min-width: 65px">
              <template #body="{ data }">
                <div class="flex justify-content-center">
                  <span :class="['analysis-badge', getAnalysisBadgeClass(getAssignmentAnalysis(data, pfp).status)]">
                    {{ getAssignmentAnalysis(data, pfp).display }}
                  </span>
                </div>
              </template>
            </Column>
          </template>

          <!-- Total -->
          <Column header="Δ Total" style="min-width: 80px">
            <template #body="{ data }">
              <div class="flex justify-content-center">
                <span :class="['total-badge', getTotalBadgeClass(getTotalAnalysisValue(data))]">
                  {{ getTotalAnalysisValue(data) }}
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
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'

const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

const selectedYear = ref('2026')
const years = ref(['2025', '2026'])
const selectedPFP = ref('all')
const searchText = ref('')
const filterDisplay = ref('all')

const pfpOptions = [
  { label: 'Tous les PFP', value: 'all' },
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
]

const displayOptions = [
  { label: 'Toutes les places', value: 'all' },
  { label: 'Avec offres', value: 'with_offers' },
  { label: 'Sans offres', value: 'no_offers' }
]

const allPfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const pfpColorMap = {
  PFP1A: '#8B5CF6',
  PFP1B: '#06B6D4',
  PFP2: '#6366F1',
  PFP3: '#EC4899',
  PFP4: '#F59E0B'
}

const pfpStatsList = [
  { key: 'PFP1A', color: '#8B5CF6' },
  { key: 'PFP1B', color: '#06B6D4' },
  { key: 'PFP2', color: '#6366F1' },
  { key: 'PFP3', color: '#EC4899' },
  { key: 'PFP4', color: '#F59E0B' }
]

const visiblePfpTypes = computed(() => {
  if (selectedPFP.value === 'all') return allPfpTypes
  return [selectedPFP.value]
})

const placesData = computed(() => placesStore.places || [])

const hasOffers = (place) => {
  const year = selectedYear.value
  return allPfpTypes.some(pfp => {
    const val = place[pfp]?.[year]
    return val && val !== '' && val !== '0'
  })
}

const stats = computed(() => {
  const places = placesData.value
  const year = selectedYear.value

  const placesWithOffers = places.filter(p => hasOffers(p)).length

  const pfpStats = {}
  allPfpTypes.forEach(pfp => {
    pfpStats[pfp] = {
      propositions: places.reduce((t, p) => t + (parseInt(p[pfp]?.[year]) || 0), 0),
      offres: places.reduce((t, p) => t + (parseInt(p[`Offre${pfp}`]?.[year]) || 0), 0)
    }
  })

  const totalOffers = Object.values(pfpStats).reduce((s, p) => s + p.offres, 0)
  const institutionSet = new Set(places.map(p => p.Institution_name).filter(Boolean))

  return {
    total: places.length,
    actives: placesWithOffers,
    totalOffers,
    institutions: institutionSet.size,
    pfpStats
  }
})

const getProgressWidth = (prop, offre) => {
  if (offre === 0 && prop === 0) return 0
  const max = Math.max(prop, offre, 1)
  return Math.min((prop / max) * 100, 100)
}

const getProgressColor = (prop, offre) => {
  if (offre === 0 && prop === 0) return '#94A3B8'
  if (prop === offre) return '#22C55E'
  if (prop > offre) return '#F97316'
  return '#EF4444'
}

const getProgressLabel = (prop, offre) => {
  const diff = prop - offre
  if (diff === 0) return 'Équilibré'
  if (diff > 0) return `+${diff} sur`
  return `${diff} sous`
}

const getProgressPercent = (prop, offre) => {
  if (offre === 0) return prop > 0 ? '∞' : '0'
  return Math.round((prop / offre) * 100)
}

const filteredPlaces = computed(() => {
  let list = [...placesData.value]

  if (searchText.value && searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    list = list.filter(p =>
      (p.Institution_name || '').toLowerCase().includes(q) ||
      (p.NomPlace || '').toLowerCase().includes(q)
    )
  }

  if (filterDisplay.value === 'with_offers') {
    list = list.filter(p => hasOffers(p))
  } else if (filterDisplay.value === 'no_offers') {
    list = list.filter(p => !hasOffers(p))
  }

  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  list.sort((a, b) => collator.compare(a.Institution_name || '', b.Institution_name || ''))

  return list
})

const getOffreValue = (place, pfpType) => {
  const val = place[pfpType]?.[selectedYear.value]
  return (val && val !== '') ? val : '-'
}

const getPropositionValue = (place, pfpType) => {
  if (!place || !place[`${pfpType.toLowerCase()}_proposition`]) return '-'
  return place[`${pfpType.toLowerCase()}_proposition`][selectedYear.value] || '-'
}

const getTotalAnalysisValue = (place) => {
  let totalOffre = 0
  let totalProposition = 0

  allPfpTypes.forEach(pfp => {
    totalOffre += parseInt(place[pfp]?.[selectedYear.value]) || 0
    totalProposition += parseInt(place[`${pfp.toLowerCase()}_proposition`]?.[selectedYear.value]) || 0
  })

  const result = totalProposition - totalOffre
  return result === 0 ? '0' : (result > 0 ? `+${result}` : result.toString())
}

const getAssignmentAnalysis = (place, pfpType) => {
  const year = selectedYear.value
  const offre = parseInt(place[pfpType]?.[year]) || 0
  const proposition = parseInt(place[`${pfpType.toLowerCase()}_proposition`]?.[year]) || 0

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

const getAnalysisBadgeClass = (status) => {
  switch (status) {
    case 'balanced': return 'analysis-balanced'
    case 'over': return 'analysis-over'
    case 'under': return 'analysis-under'
    default: return ''
  }
}

const getTotalBadgeClass = (value) => {
  const num = parseInt(value) || 0
  if (num === 0) return 'total-balanced'
  if (num > 0) return 'total-over'
  return 'total-under'
}

const exportCSV = () => {
  const pfps = visiblePfpTypes.value
  const headers = [
    'Institution', 'Place',
    ...pfps.flatMap(p => [`Offre ${p}`, `Proposition ${p}`, `Analyse ${p}`]),
    'Analyse Total'
  ]
  const rows = filteredPlaces.value.map(place => [
    place.Institution_name || '',
    place.NomPlace || '',
    ...pfps.flatMap(p => [
      getOffreValue(place, p),
      getPropositionValue(place, p),
      getAssignmentAnalysis(place, p).display
    ]),
    getTotalAnalysisValue(place)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recap-offres-${selectedYear.value}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const refreshPlaces = async () => {
  await placesStore.fetchPlaces({ force: true })
}

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

/* PFP stat cards */
.pfp-stat-card {
  transition: transform 0.2s ease;
}

.pfp-stat-card:hover {
  transform: translateY(-1px);
}

.progress-bar-bg {
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* Institution avatar */
.institution-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #6366F1;
}

/* Pill badges for offre/proposition */
.offre-pill, .prop-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.offre-has-value {
  background: #DCFCE7;
  color: #166534;
}

.offre-empty {
  background: #F1F5F9;
  color: #94A3B8;
}

.prop-has-value {
  background: #DBEAFE;
  color: #1E40AF;
}

.prop-empty {
  background: #F1F5F9;
  color: #94A3B8;
}

/* Analysis badges */
.analysis-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
}

.analysis-balanced {
  background: #DCFCE7;
  color: #166534;
}

.analysis-over {
  background: #FFF7ED;
  color: #C2410C;
}

.analysis-under {
  background: #FEF2F2;
  color: #DC2626;
}

/* Total badge */
.total-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 26px;
  padding: 0 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 800;
}

.total-balanced {
  background: #22C55E;
  color: white;
}

.total-over {
  background: #F97316;
  color: white;
}

.total-under {
  background: #EF4444;
  color: white;
}

/* Legend dot */
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Table styling */
.offre-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
}

.offre-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.3rem;
  vertical-align: middle;
}

.offre-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.offre-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

/* Alternating column group backgrounds */
.offre-table :deep(.col-pfp-1) {
  background: rgba(99, 102, 241, 0.03);
}
</style>
