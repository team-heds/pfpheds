<template>
  <AdminLayout>
    <div class="suivi-offres-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-600">Secrétariat</span>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Suivi offres et propositions</span>
      </div>

      <!-- Header -->
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-send text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Suivi des offres et propositions</h1>
              <p class="text-600 m-0 mt-1">Offres et propositions rapprochées par institution</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Nom d'institution..." class="w-full md:w-12rem" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown v-model="selectedYear" :options="yearOptions" optionLabel="label" optionValue="value" placeholder="Toutes" class="w-full md:w-10rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown v-model="selectedPFP" :options="pfpOptions" optionLabel="label" optionValue="value" placeholder="Tous" class="w-full md:w-8rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Canton :</label>
              <Dropdown v-model="filterCanton" :options="cantonOptions" placeholder="Tous" class="w-full md:w-8rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Statut :</label>
              <Dropdown v-model="filterStatus" :options="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Tous" class="w-full md:w-12rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-file-excel" label="Excel" severity="success" outlined class="p-button-sm" @click="exportExcel" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadAll" v-tooltip="'Rafraîchir'" :loading="loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="reconciliation.anomalies.length" class="surface-card p-3 border-round shadow-2 mb-3" role="status">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-exclamation-triangle text-orange-400"></i>
          <span class="font-semibold">{{ reconciliation.anomalies.length }} anomalie(s) de correspondance à corriger.</span>
        </div>
        <span class="text-sm text-600">Ces enregistrements ne sont pas attribués à une autre institution et ne faussent pas les totaux.</span>
      </div>

      <!-- Stats par année × PFP (vue globale quand pas de filtre) -->
      <div v-if="!selectedYear && !selectedPFP" class="grid mb-4">
        <div v-for="yr in years" :key="yr.value" class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center justify-content-between mb-3">
              <span class="font-bold text-900 text-lg">{{ yr.label }}</span>
              <Tag :value="`${globalYearStats(yr.value).sent} / ${globalYearStats(yr.value).total}`"
                   :severity="globalYearStats(yr.value).pct === 100 ? 'success' : 'warning'" />
            </div>
            <div class="flex align-items-center gap-2 mb-3">
              <div class="flex-1 bg-surface-200 border-round" style="height:6px">
                <div class="bg-green-500 border-round" :style="`height:6px;width:${globalYearStats(yr.value).pct}%`"></div>
              </div>
              <span class="text-sm text-600 font-semibold">{{ globalYearStats(yr.value).pct }}%</span>
            </div>
            <!-- Stats par PFP pour cette année -->
            <div class="grid gap-1">
              <div v-for="pfp in PFP_FIELDS" :key="pfp" class="col-6">
                <div class="flex align-items-center gap-1 text-xs">
                  <span :class="pfpYearStats(yr.value, pfp).sent > 0 ? 'text-green-500' : 'text-red-400'" class="font-semibold" style="min-width:3rem">{{ pfp }}</span>
                  <div class="flex-1 bg-surface-200 border-round" style="height:4px">
                    <div class="bg-green-400 border-round" :style="`height:4px;width:${pfpYearStats(yr.value, pfp).pct}%`"></div>
                  </div>
                  <span class="text-400">{{ pfpYearStats(yr.value, pfp).sent }}/{{ pfpYearStats(yr.value, pfp).total }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats filtrées (quand un filtre est actif) -->
      <div v-else class="grid mb-4">
        <div v-for="col in activeColumns" :key="col.key" class="col-12" :class="`md:col-${Math.max(2, Math.floor(12 / activeColumns.length))}`">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="font-bold text-900">{{ col.label }}</span>
              <Tag :value="`${filteredColStats(col).sent}/${filteredColStats(col).total}`"
                   :severity="filteredColStats(col).pct === 100 ? 'success' : 'warning'" />
            </div>
            <div class="flex align-items-center gap-2">
              <div class="flex-1 bg-surface-200 border-round" style="height:6px">
                <div class="bg-green-500 border-round" :style="`height:6px;width:${filteredColStats(col).pct}%`"></div>
              </div>
              <span class="text-sm text-600">{{ filteredColStats(col).pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable
          ref="dt"
          :value="filteredInstitutions"
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="25"
          :rowsPerPageOptions="[10, 25, 50, 100]"
          :rowHover="true"
          dataKey="InstitutionId"
          scrollable
          class="suivi-table p-datatable-sm"
          sortField="Name"
          :sortOrder="1"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Institutions ({{ filteredInstitutions.length }})</span>
              <span class="text-sm text-500">Vert = proposition reçue · Rouge = proposition manquante</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune institution trouvée</p>
            </div>
          </template>

          <Column field="Name" header="Institution" sortable style="min-width: 14rem" frozen>
            <template #body="{ data }">
              <div class="flex flex-column">
                <span class="font-semibold text-900">{{ data.Name || '-' }}</span>
                <span class="text-xs text-500" v-if="data.Category">{{ data.Category }}</span>
              </div>
            </template>
          </Column>

          <Column field="Locality" header="Localité" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <div class="flex align-items-center gap-1">
                <span class="text-sm">{{ data.Locality || '-' }}</span>
                <Tag v-if="data.Canton" :value="data.Canton" severity="info" class="text-xs" />
              </div>
            </template>
          </Column>

          <Column header="Places" style="min-width: 5rem">
            <template #body="{ data }">
              <span class="text-sm text-600">{{ getPlaceCount(data.InstitutionId) }}</span>
            </template>
          </Column>

          <!-- Colonnes dynamiques selon filtres -->
          <Column v-for="col in activeColumns" :key="col.key" :header="col.label" style="min-width: 9rem">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <span
                  class="status-badge"
                  :class="hasSent(data.InstitutionId, col.year, col.pfp) ? 'sent' : 'missing'"
                  v-tooltip.top="getTooltip(data.InstitutionId, col.year, col.pfp)"
                >
                  <i :class="hasSent(data.InstitutionId, col.year, col.pfp) ? 'pi pi-check' : 'pi pi-times'"></i>
                </span>
                <span v-if="hasSent(data.InstitutionId, col.year, col.pfp)" class="text-xs text-500">
                  {{ getTotal(data.InstitutionId, col.year, col.pfp) }}
                </span>
              </div>
            </template>
          </Column>

          <Column header="Contact" style="min-width: 7rem">
            <template #body="{ data }">
              <Button
                v-if="data.MailChef"
                icon="pi pi-envelope"
                class="p-button-rounded p-button-text p-button-sm"
                @click="copyMail(data.MailChef)"
                v-tooltip.top="data.MailChef"
              />
              <span v-else class="text-400 text-sm">-</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'
import * as XLSX from 'xlsx'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { getReconciliationMetric, reconcileOfferProposals } from '@/service/offerProposalMatchingService'

const toast = useToast()
const dt = ref(null)
const loading = ref(false)

const institutions = ref([])
const places = ref([])

const searchQuery = ref('')
const selectedYear = ref(null)
const selectedPFP = ref(null)
const filterCanton = ref(null)
const filterStatus = ref(null)

const years = [
  { label: '2025-2026', value: '2026' },
  { label: '2026-2027', value: '2027' },
  { label: '2027-2028', value: '2028' },
]
const yearOptions = years

const PFP_FIELDS = ['PFP3', 'PFP2', 'PFP1A', 'PFP1B', 'PFP4']

const pfpOptions = PFP_FIELDS.map(p => ({ label: p, value: p }))

const statusFilterOptions = [
  { label: 'Au moins un manquant', value: 'some_missing' },
  { label: 'Tout reçu', value: 'all_sent' },
  { label: 'Rien reçu', value: 'none_sent' },
]

const cantonOptions = computed(() =>
  [...new Set(institutions.value.map(i => i.Canton).filter(Boolean))].sort()
)

const reconciliation = computed(() => reconcileOfferProposals({
  institutions: institutions.value,
  places: places.value,
  years: years.map(year => year.value),
  pfpTypes: PFP_FIELDS
}))

const institutionById = computed(() => new Map(
  reconciliation.value.institutions.map(institution => [institution.institutionId, institution])
))

function getInstitution(institutionId) {
  return institutionById.value.get(String(institutionId ?? '').trim())
}

// Colonnes actives selon les filtres année/PFP
const activeColumns = computed(() => {
  const yrs = selectedYear.value ? [years.find(y => y.value === selectedYear.value)] : years
  const pfps = selectedPFP.value ? [selectedPFP.value] : PFP_FIELDS
  const cols = []
  for (const yr of yrs) {
    for (const pfp of pfps) {
      cols.push({ key: `${yr.value}-${pfp}`, label: `${yr.label} · ${pfp}`, year: yr.value, pfp })
    }
  }
  return cols
})

// Est-ce qu'une institution a une valeur pour year+pfp ?
function hasSent(institutionId, year, pfp) {
  return getReconciliationMetric(getInstitution(institutionId), year, pfp).hasProposal
}

// Total des propositions pour year+pfp
function getTotal(institutionId, year, pfp) {
  return getReconciliationMetric(getInstitution(institutionId), year, pfp).proposals
}

function getTooltip(institutionId, year, pfp) {
  const institution = getInstitution(institutionId)
  if (!institution?.placeCount) return 'Aucune place enregistrée'
  const metric = getReconciliationMetric(institution, year, pfp)
  if (!metric.hasProposal) return `Aucune proposition ${pfp} pour cette année`
  return `Propositions : ${metric.proposals} · Offres : ${metric.offers}`
}

function getPlaceCount(institutionId) {
  return getInstitution(institutionId)?.placeCount || 0
}

// Stats globales par année (sans filtre PFP)
function globalYearStats(year) {
  const reconciled = reconciliation.value.institutions
  const total = reconciled.length
  const sent = reconciled.filter(i =>
    PFP_FIELDS.some(pfp => hasSent(i.InstitutionId, year, pfp))
  ).length
  const pct = total ? Math.round((sent / total) * 100) : 0
  return { total, sent, missing: total - sent, pct }
}

// Stats par année ET pfp
function pfpYearStats(year, pfp) {
  const reconciled = reconciliation.value.institutions
  const total = reconciled.length
  const sent = reconciled.filter(i => hasSent(i.InstitutionId, year, pfp)).length
  const pct = total ? Math.round((sent / total) * 100) : 0
  return { total, sent, pct }
}

// Stats pour une colonne active sur les institutions filtrées
function filteredColStats(col) {
  const total = filteredInstitutions.value.length
  const sent = filteredInstitutions.value.filter(i => hasSent(i.InstitutionId, col.year, col.pfp)).length
  const pct = total ? Math.round((sent / total) * 100) : 0
  return { total, sent, pct }
}

const filteredInstitutions = computed(() => {
  let list = [...reconciliation.value.institutions]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(i => i.Name?.toLowerCase().includes(q) || i.Locality?.toLowerCase().includes(q))
  }
  if (filterCanton.value) list = list.filter(i => i.Canton === filterCanton.value)

  if (filterStatus.value) {
    const cols = activeColumns.value
    if (filterStatus.value === 'all_sent') {
      list = list.filter(i => cols.every(c => hasSent(i.InstitutionId, c.year, c.pfp)))
    } else if (filterStatus.value === 'none_sent') {
      list = list.filter(i => cols.every(c => !hasSent(i.InstitutionId, c.year, c.pfp)))
    } else if (filterStatus.value === 'some_missing') {
      list = list.filter(i => cols.some(c => !hasSent(i.InstitutionId, c.year, c.pfp)))
    }
  }

  return list
})

async function loadAll() {
  loading.value = true
  try {
    const [instRes, placesRes] = await Promise.all([
      supabase.from('institutions').select('InstitutionId, Name, Locality, Canton, Category, MailChef').order('Name'),
      supabase.from('places').select('PlaceId, InstitutionId, PFP1A, PFP1B, PFP2, PFP3, PFP4, pfp1a_proposition, pfp1b_proposition, pfp2_proposition, pfp3_proposition, pfp4_proposition')
    ])
    if (instRes.error) throw instRes.error
    if (placesRes.error) throw placesRes.error

    institutions.value = instRes.data || []
    places.value = placesRes.data || []
  } catch (e) {
    console.error('Erreur chargement:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 3000 })
  } finally {
    loading.value = false
  }
}

function copyMail(mail) {
  navigator.clipboard.writeText(mail).catch(() => {})
  toast.add({ severity: 'info', summary: 'Copié', detail: mail, life: 2000 })
}

function exportExcel() {
  const wb = XLSX.utils.book_new()

  // Feuille 1 : Vue par institution (toutes années × tous PFP)
  const allCols = []
  for (const yr of years) {
    for (const pfp of PFP_FIELDS) {
      allCols.push({ key: `${yr.value}-${pfp}`, label: `${yr.label} · ${pfp}`, year: yr.value, pfp })
    }
  }

  const header1 = [
    'Institution',
    'Localité',
    'Canton',
    'Nb places',
    'Email contact',
    ...allCols.map(c => `Proposition reçue ${c.label}`),
    ...allCols.map(c => `Total propositions ${c.label}`)
  ]
  const rows1 = filteredInstitutions.value.map(i => [
    i.Name || '',
    i.Locality || '',
    i.Canton || '',
    getPlaceCount(i.InstitutionId),
    i.MailChef || '',
    ...allCols.map(c => hasSent(i.InstitutionId, c.year, c.pfp) ? 'Oui' : 'Non'),
    ...allCols.map(c => getTotal(i.InstitutionId, c.year, c.pfp))
  ])
  const ws1 = XLSX.utils.aoa_to_sheet([header1, ...rows1])

  // Largeurs colonnes
  ws1['!cols'] = [
    { wch: 35 }, { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 32 },
    ...allCols.map(() => ({ wch: 16 })),
    ...allCols.map(() => ({ wch: 14 }))
  ]

  // Couleurs header
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'E8F0FE' } } }
  for (let c = 0; c < header1.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c })
    if (ws1[cell]) ws1[cell].s = headerStyle
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Suivi par institution')

  // Feuille 2 : Résumé par année × PFP
  const header2 = ['Année', 'PFP', 'Institutions avec proposition', 'Total institutions', '% complétude', 'Total propositions']
  const rows2 = []
  for (const yr of years) {
    for (const pfp of PFP_FIELDS) {
      const stats = pfpYearStats(yr.value, pfp)
      const totalPropositions = reconciliation.value.institutions.reduce((sum, i) => sum + getTotal(i.InstitutionId, yr.value, pfp), 0)
      rows2.push([yr.label, pfp, stats.sent, stats.total, `${stats.pct}%`, totalPropositions])
    }
  }
  const ws2 = XLSX.utils.aoa_to_sheet([header2, ...rows2])
  ws2['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Résumé par année & PFP')

  // Feuilles 3-5 : une par année
  for (const yr of years) {
    const headerYr = ['Institution', 'Localité', 'Canton', 'Nb places', 'Email', ...PFP_FIELDS, 'Total propositions', 'Statut']
    const rowsYr = filteredInstitutions.value.map(i => {
      const pfpValues = PFP_FIELDS.map(pfp => getTotal(i.InstitutionId, yr.value, pfp))
      const totalRow = pfpValues.reduce((a, b) => a + b, 0)
      const sent = PFP_FIELDS.some(pfp => hasSent(i.InstitutionId, yr.value, pfp))
      return [
        i.Name || '',
        i.Locality || '',
        i.Canton || '',
        getPlaceCount(i.InstitutionId),
        i.MailChef || '',
        ...pfpValues,
        totalRow,
        sent ? 'Reçu' : 'Manquant'
      ]
    })
    // Trier : manquants en premier (à relancer)
    rowsYr.sort((a, b) => {
      if (a[a.length - 1] === b[b.length - 1]) return a[0].localeCompare(b[0])
      return a[a.length - 1] === 'Manquant' ? -1 : 1
    })
    const wsYr = XLSX.utils.aoa_to_sheet([headerYr, ...rowsYr])
    wsYr['!cols'] = [{ wch: 35 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 30 }, ...PFP_FIELDS.map(() => ({ wch: 9 })), { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsYr, yr.label)
  }

  // Feuille suivante : Institutions manquantes (à relancer)
  const header3 = ['Institution', 'Localité', 'Canton', 'Email', 'Années manquantes', 'PFP manquants']
  const rows3 = []
  for (const inst of filteredInstitutions.value) {
    const manquantesAnnees = new Set()
    const manquantsPFP = new Set()
    for (const yr of years) {
      for (const pfp of PFP_FIELDS) {
        if (!hasSent(inst.InstitutionId, yr.value, pfp)) {
          manquantesAnnees.add(yr.label)
          manquantsPFP.add(pfp)
        }
      }
    }
    if (manquantesAnnees.size > 0) {
      rows3.push([
        inst.Name || '',
        inst.Locality || '',
        inst.Canton || '',
        inst.MailChef || '',
        [...manquantesAnnees].join(', '),
        [...manquantsPFP].join(', ')
      ])
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet([header3, ...rows3])
  ws3['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 8 }, { wch: 32 }, { wch: 30 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'À relancer')

  if (reconciliation.value.anomalies.length) {
    const anomalyRows = reconciliation.value.anomalies.map(anomaly => [
      anomaly.type,
      anomaly.institutionId || '',
      anomaly.placeId || '',
      anomaly.field || '',
      anomaly.year || ''
    ])
    const wsAnomalies = XLSX.utils.aoa_to_sheet([
      ['Type', 'InstitutionId', 'PlaceId', 'Champ', 'Année'],
      ...anomalyRows
    ])
    wsAnomalies['!cols'] = [{ wch: 30 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsAnomalies, 'Anomalies')
  }

  const fileName = `suivi-offres-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
  toast.add({ severity: 'success', summary: 'Export Excel', detail: fileName, life: 3000 })
}

onMounted(loadAll)
</script>

<style scoped>
.suivi-offres-page {
  min-height: 100%;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  border: 2px solid;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.status-badge.sent {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

.status-badge.missing {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.suivi-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.6rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  font-size: 0.82rem;
}

.suivi-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.5rem;
  vertical-align: middle;
}
</style>
