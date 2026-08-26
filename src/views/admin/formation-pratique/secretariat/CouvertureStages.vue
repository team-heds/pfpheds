<template>
  <AdminLayout>
    <main class="coverage-page p-3 md:p-4" aria-labelledby="coverage-title">
      <nav class="breadcrumb-section mb-3" aria-label="Fil d’Ariane">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">
          <i class="pi pi-home mr-1" aria-hidden="true"></i>Formation Pratique
        </router-link>
        <i class="pi pi-angle-right text-400 mx-2" aria-hidden="true"></i>
        <span class="text-600">Secrétariat</span>
        <i class="pi pi-angle-right text-400 mx-2" aria-hidden="true"></i>
        <span class="text-900 font-medium">Couverture des stages</span>
      </nav>

      <section class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="coverage-header">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-chart-pie text-primary text-3xl" aria-hidden="true"></i>
            <div>
              <h1 id="coverage-title" class="text-2xl font-bold text-900 m-0">Couverture des stages</h1>
              <p class="text-600 m-0 mt-1">Repérez les institutions qui n’accueillent aucun étudiant pour une période donnée.</p>
            </div>
          </div>

          <div class="coverage-actions">
            <Button
              icon="pi pi-file-excel"
              label="Exporter"
              severity="success"
              outlined
              :disabled="loading || !!loadError || !filteredRows.length"
              @click="exportExcel"
            />
            <Button
              icon="pi pi-refresh"
              label="Actualiser"
              outlined
              :loading="loading"
              @click="loadAll"
            />
          </div>
        </div>

        <div class="filters-grid mt-4">
          <div class="field m-0">
            <label for="coverage-year" class="font-semibold text-sm">Année académique <span aria-hidden="true">*</span></label>
            <Dropdown
              inputId="coverage-year"
              v-model="selectedYear"
              :options="yearOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              aria-required="true"
            />
          </div>
          <div class="field m-0">
            <label for="coverage-pfp" class="font-semibold text-sm">PFP <span aria-hidden="true">*</span></label>
            <Dropdown
              inputId="coverage-pfp"
              v-model="selectedPfp"
              :options="pfpOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              aria-required="true"
            />
          </div>
          <div class="field m-0">
            <label for="coverage-search" class="font-semibold text-sm">Recherche</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" aria-hidden="true" />
              <InputText id="coverage-search" v-model="searchQuery" placeholder="Institution ou localité" class="w-full" />
            </span>
          </div>
          <div class="field m-0">
            <label for="coverage-canton" class="font-semibold text-sm">Canton</label>
            <Dropdown
              inputId="coverage-canton"
              v-model="selectedCanton"
              :options="cantonOptions"
              placeholder="Tous les cantons"
              showClear
              class="w-full"
            />
          </div>
          <div class="field m-0">
            <label for="coverage-status" class="font-semibold text-sm">Couverture</label>
            <Dropdown
              inputId="coverage-status"
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tous les statuts"
              showClear
              class="w-full"
            />
          </div>
          <div class="include-control">
            <Checkbox inputId="include-without-offer" v-model="includeWithoutOffer" :binary="true" />
            <label for="include-without-offer">Inclure les institutions sans offre</label>
          </div>
        </div>
      </section>

      <section v-if="loadError" class="error-state surface-card border-round shadow-2 p-4 mb-4" role="alert">
        <i class="pi pi-exclamation-circle text-red-400 text-3xl" aria-hidden="true"></i>
        <div>
          <h2 class="text-lg m-0 mb-1">Les données n’ont pas pu être chargées</h2>
          <p class="text-600 m-0">{{ loadError }}</p>
        </div>
        <Button label="Réessayer" icon="pi pi-refresh" @click="loadAll" />
      </section>

      <template v-else>
        <section class="stats-grid mb-4" aria-label="Résumé de la couverture">
          <article class="coverage-stat surface-card border-round shadow-2">
            <span class="stat-icon eligible"><i class="pi pi-building" aria-hidden="true"></i></span>
            <div><strong>{{ coverage.totals.eligible }}</strong><span>Institutions éligibles</span></div>
          </article>
          <article class="coverage-stat surface-card border-round shadow-2">
            <span class="stat-icon covered"><i class="pi pi-users" aria-hidden="true"></i></span>
            <div><strong>{{ coverage.totals.withStudents }}</strong><span>Avec étudiant</span></div>
          </article>
          <article class="coverage-stat surface-card border-round shadow-2">
            <span class="stat-icon uncovered"><i class="pi pi-user-minus" aria-hidden="true"></i></span>
            <div><strong>{{ coverage.totals.withoutStudents }}</strong><span>Sans étudiant</span></div>
          </article>
        </section>

        <section v-if="coverage.anomalies.length" class="anomaly-state surface-card border-round shadow-2 p-3 mb-4" role="status">
          <div class="anomaly-summary">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-exclamation-triangle text-orange-400" aria-hidden="true"></i>
              <strong>{{ coverage.anomalies.length }} anomalie(s) de correspondance</strong>
            </div>
            <span class="text-sm text-600">Les affectations ambiguës sont exclues des totaux afin de ne pas attribuer un étudiant à la mauvaise institution.</span>
            <details class="mt-2">
              <summary>Afficher les détails</summary>
              <ul class="text-sm mb-0 pl-4">
                <li v-for="(anomaly, index) in coverage.anomalies.slice(0, 10)" :key="`${anomaly.type}-${index}`">
                  {{ formatAnomaly(anomaly) }}
                </li>
              </ul>
              <p v-if="coverage.anomalies.length > 10" class="text-xs text-500 mb-0">
                {{ coverage.anomalies.length - 10 }} autre(s) anomalie(s) sont disponibles dans l’export.
              </p>
            </details>
          </div>
        </section>

        <section class="surface-card border-round shadow-2 p-3 md:p-4" aria-labelledby="coverage-table-title">
          <DataTable
            :value="filteredRows"
            :loading="loading"
            dataKey="InstitutionId"
            paginator
            :rows="25"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            responsiveLayout="scroll"
            scrollable
            rowHover
            sortField="institutionName"
            :sortOrder="1"
            class="p-datatable-sm"
          >
            <template #header>
              <div class="table-heading">
                <div>
                  <h2 id="coverage-table-title" class="text-xl m-0">Institutions ({{ filteredRows.length }})</h2>
                  <span class="text-sm text-600">{{ selectedYearLabel }} · {{ selectedPfp }}</span>
                </div>
                <Tag :value="`${coverage.totals.withoutStudents} à vérifier`" severity="warning" />
              </div>
            </template>
            <template #empty>
              <div class="empty-state">
                <i class="pi pi-check-circle text-green-400 text-4xl" aria-hidden="true"></i>
                <strong>Aucune institution ne correspond à ces filtres.</strong>
                <span>Modifiez les filtres ou actualisez les données.</span>
              </div>
            </template>

            <Column field="institutionName" header="Institution" sortable frozen style="min-width: 17rem">
              <template #body="{ data }">
                <div class="flex flex-column gap-1">
                  <span class="font-semibold">{{ data.institutionName }}</span>
                  <span class="text-xs text-500">{{ data.Locality || 'Localité non renseignée' }}</span>
                </div>
              </template>
            </Column>
            <Column field="Canton" header="Canton" sortable style="min-width: 7rem">
              <template #body="{ data }"><Tag :value="data.Canton || '—'" severity="info" /></template>
            </Column>
            <Column field="eligiblePlaceCount" header="Places éligibles" sortable style="min-width: 9rem" />
            <Column field="offeredCapacity" header="Capacité offerte" sortable style="min-width: 9rem" />
            <Column field="assignedStudentCount" header="Étudiants affectés" sortable style="min-width: 10rem">
              <template #body="{ data }"><strong>{{ data.assignedStudentCount }}</strong></template>
            </Column>
            <Column field="coverageStatus" header="Statut" sortable style="min-width: 11rem">
              <template #body="{ data }">
                <Tag
                  v-if="data.eligible"
                  :value="data.assignedStudentCount ? 'Avec étudiant' : 'Sans étudiant'"
                  :severity="data.assignedStudentCount ? 'success' : 'warning'"
                />
                <Tag v-else value="Sans offre" severity="secondary" />
              </template>
            </Column>
            <Column header="Contact" style="min-width: 13rem">
              <template #body="{ data }">
                <a v-if="data.MailChef" :href="`mailto:${data.MailChef}`" class="text-primary no-underline">{{ data.MailChef }}</a>
                <span v-else class="text-500">Non renseigné</span>
              </template>
            </Column>
          </DataTable>
        </section>
      </template>
    </main>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/supabase'
import { buildStageCoverage, STAGE_COVERAGE_PFP_TYPES } from '@/service/stageCoverageService'
import { getAcademicYearKeys } from '@/service/offerProposalMatchingService'

const toast = useToast()
const loading = ref(false)
const loadError = ref('')
const institutions = ref([])
const places = ref([])
const assignments = ref([])

const currentDate = new Date()
const currentAcademicEndYear = currentDate.getMonth() >= 8 ? currentDate.getFullYear() + 1 : currentDate.getFullYear()
const selectedYear = ref(String(currentAcademicEndYear))
const selectedPfp = ref('PFP1A')
const searchQuery = ref('')
const selectedCanton = ref(null)
const selectedStatus = ref(null)
const includeWithoutOffer = ref(false)

const yearOptions = Array.from({ length: 5 }, (_, index) => {
  const endYear = currentAcademicEndYear - 2 + index
  return { label: `${endYear - 1}-${endYear}`, value: String(endYear) }
})
const pfpOptions = STAGE_COVERAGE_PFP_TYPES.map(value => ({ label: value, value }))
const statusOptions = computed(() => [
  { label: 'Avec étudiant', value: 'with_students' },
  { label: 'Sans étudiant', value: 'without_students' },
  ...(includeWithoutOffer.value ? [{ label: 'Sans offre', value: 'without_offer' }] : [])
])

const coverage = computed(() => buildStageCoverage({
  institutions: institutions.value,
  places: places.value,
  assignments: assignments.value,
  year: selectedYear.value,
  pfp: selectedPfp.value,
  includeWithoutOffer: includeWithoutOffer.value
}))

const cantonOptions = computed(() => [...new Set(coverage.value.rows.map(row => row.Canton).filter(Boolean))].sort())
const selectedYearLabel = computed(() => yearOptions.find(option => option.value === selectedYear.value)?.label || selectedYear.value)
const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fr')
  return coverage.value.rows.filter(row => {
    if (query && ![row.institutionName, row.Locality, row.MailChef].some(value => String(value || '').toLocaleLowerCase('fr').includes(query))) return false
    if (selectedCanton.value && row.Canton !== selectedCanton.value) return false
    if (selectedStatus.value === 'without_offer' && row.eligible) return false
    if (selectedStatus.value && selectedStatus.value !== 'without_offer' && row.coverageStatus !== selectedStatus.value) return false
    return true
  })
})

let latestRequestId = 0

function assignmentQuery() {
  return supabase
    .from('student_result_vote')
    .select('id, user_id, pfp_type, year, assigned_place_id, status')
    .eq('status', 'published')
    .eq('pfp_type', selectedPfp.value)
    .in('year', getAcademicYearKeys(selectedYear.value))
    .not('assigned_place_id', 'is', null)
}

async function loadAssignments() {
  const requestId = ++latestRequestId
  loading.value = true
  loadError.value = ''
  try {
    const result = await assignmentQuery()
    if (result.error) throw result.error
    if (requestId === latestRequestId) assignments.value = result.data || []
  } catch (error) {
    if (requestId === latestRequestId) {
      console.error('Erreur chargement affectations pour la couverture des stages:', error)
      loadError.value = 'Impossible de charger la couverture des stages. Réessayez dans quelques instants.'
    }
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

async function loadAll() {
  const requestId = ++latestRequestId
  loading.value = true
  loadError.value = ''
  try {
    const [institutionResult, placeResult, assignmentResult] = await Promise.all([
      supabase.from('institutions').select('InstitutionId, Name, Locality, Canton, Category, MailChef').order('Name'),
      supabase.from('places').select('PlaceId, InstitutionId, PFP1A, PFP1B, PFP2, PFP3, PFP4'),
      assignmentQuery()
    ])
    const failure = [institutionResult, placeResult, assignmentResult].find(result => result.error)
    if (failure?.error) throw failure.error

    if (requestId === latestRequestId) {
      institutions.value = institutionResult.data || []
      places.value = placeResult.data || []
      assignments.value = assignmentResult.data || []
    }
  } catch (error) {
    if (requestId === latestRequestId) {
      console.error('Erreur chargement couverture des stages:', error)
      loadError.value = 'Impossible de charger la couverture des stages. Réessayez dans quelques instants.'
    }
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

function exportExcel() {
  try {
    const rows = filteredRows.value.map(row => ({
      Institution: row.institutionName,
      Localité: row.Locality || '',
      Canton: row.Canton || '',
      'Année académique': selectedYearLabel.value,
      PFP: selectedPfp.value,
      'Places éligibles': row.eligiblePlaceCount,
      'Capacité offerte': row.offeredCapacity,
      'Étudiants affectés': row.assignedStudentCount,
      Statut: row.eligible ? (row.assignedStudentCount ? 'Avec étudiant' : 'Sans étudiant') : 'Sans offre',
      Contact: row.MailChef || ''
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Couverture')
    if (coverage.value.anomalies.length) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(coverage.value.anomalies), 'Anomalies')
    }
    const fileName = `couverture-stages-${selectedYear.value}-${selectedPfp.value}-${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)
    toast.add({ severity: 'success', summary: 'Export créé', detail: fileName, life: 3000 })
  } catch (error) {
    console.error('Erreur export couverture des stages:', error)
    toast.add({ severity: 'error', summary: 'Export impossible', detail: 'Réessayez dans quelques instants.', life: 4000 })
  }
}

function formatAnomaly(anomaly) {
  const context = anomaly.userId || anomaly.institutionId || anomaly.placeId || anomaly.assignmentId || ''
  return `${anomaly.type}${context ? ` — ${context}` : ''}`
}

watch(includeWithoutOffer, enabled => {
  if (!enabled && selectedStatus.value === 'without_offer') selectedStatus.value = null
})
watch([selectedYear, selectedPfp], loadAssignments)

onMounted(loadAll)
</script>

<style scoped>
.coverage-page { min-height: 100%; }
.coverage-header, .table-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.coverage-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
.filters-grid { display: grid; grid-template-columns: repeat(5, minmax(10rem, 1fr)); gap: 1rem; align-items: end; }
.include-control { display: flex; align-items: center; gap: .65rem; min-height: 2.75rem; }
.stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.coverage-stat { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
.coverage-stat strong { display: block; font-size: 1.75rem; line-height: 1; }
.coverage-stat div span { display: block; margin-top: .4rem; color: var(--text-color-secondary); }
.stat-icon { width: 2.75rem; height: 2.75rem; display: grid; place-items: center; border-radius: .75rem; }
.stat-icon.eligible { color: #60a5fa; background: rgb(59 130 246 / 15%); }
.stat-icon.covered { color: #34d399; background: rgb(16 185 129 / 15%); }
.stat-icon.uncovered { color: #fbbf24; background: rgb(245 158 11 / 15%); }
.error-state, .anomaly-state { display: flex; align-items: center; gap: 1rem; }
.anomaly-summary { flex: 1; }
.anomaly-summary summary { cursor: pointer; color: var(--primary-color); font-weight: 600; }
.error-state > div { flex: 1; }
.empty-state { min-height: 12rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; text-align: center; }

@media (max-width: 1200px) {
  .filters-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .filters-grid, .stats-grid { grid-template-columns: 1fr; }
  .coverage-actions, .coverage-actions :deep(.p-button) { width: 100%; }
  .error-state { align-items: flex-start; flex-wrap: wrap; }
}
</style>
