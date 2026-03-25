<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Feuille de charges — Enseignants SI" 
        subtitle="Calcul automatique des périodes pondérées selon les coefficients Pilier 1.1 (1 période = 45 min)" 
        icon="pi pi-chart-bar" 
      />
    </template>

    <div class="workload-page">
      <!-- Toolbar -->
      <div class="toolbar-card">
        <div class="toolbar-row">
          <div class="flex gap-3 align-items-center flex-wrap">
            <div class="field-inline">
              <label>Semestre</label>
              <Dropdown 
                v-model="selectedSemester" 
                :options="semesterOptions" 
                optionLabel="label" 
                optionValue="value" 
                @change="loadWorkload"
                style="width: 220px"
              />
            </div>
            <div class="field-inline">
              <label>Enseignant</label>
              <Dropdown 
                v-model="selectedTeacher" 
                :options="teacherFilterOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Tous"
                showClear
                filter
                style="width: 240px"
              />
            </div>
            <div class="field-inline">
              <label>Classe</label>
              <Dropdown 
                v-model="selectedClass" 
                :options="classFilterOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Toutes"
                showClear
                filter
                style="width: 150px"
              />
            </div>
            <div class="field-inline">
              <label>Module</label>
              <Dropdown 
                v-model="selectedModule" 
                :options="moduleFilterOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Tous"
                showClear
                filter
                style="width: 220px"
              />
            </div>
            <div class="field-inline">
              <label>Type</label>
              <Dropdown 
                v-model="selectedType" 
                :options="typeOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Tous"
                showClear
                style="width: 130px"
              />
            </div>
          </div>
          <div class="flex gap-2 align-items-center">
            <Button v-if="hasActiveFilters" label="Effacer filtres" icon="pi pi-filter-slash" severity="secondary" size="small" text @click="clearFilters" />
            <Button label="Exporter Excel" icon="pi pi-file-excel" severity="success" size="small" @click="exportWorkload" />
          </div>
        </div>
      </div>

      <!-- Référence coefficients -->
      <Panel :toggleable="true" :collapsed="true" class="coeff-panel">
        <template #header>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-info-circle text-blue-500"></i>
            <span class="font-bold">Référence des coefficients</span>
          </div>
        </template>
        <div class="grid">
          <div class="col-12 md:col-8">
            <h4 class="mt-0 mb-2">Pilier 1.1 — Enseignement de base</h4>
            <p class="text-500 text-sm mt-0 mb-3">Inclut préparation, présence et correction d'examens</p>
            <DataTable :value="coefficientRows" size="small" stripedRows class="coeff-table">
              <Column field="label" header="Nb enseignants sur le créneau" />
              <Column field="coeff" header="Coefficient">
                <template #body="{ data }">
                  <Tag :value="'× ' + data.coeff" severity="info" />
                </template>
              </Column>
              <Column header="Exemple (3 périodes)">
                <template #body="{ data }">
                  <span class="text-500">3p × {{ data.coeff }} = <strong>{{ (3 * data.coeff).toFixed(1) }}p</strong></span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="col-12 md:col-4">
            <h4 class="mt-0 mb-2">Ateliers (pratique)</h4>
            <div class="atelier-coeff-card">
              <span class="text-4xl font-bold text-primary">× 1.6</span>
              <p class="text-500 mt-2 mb-0">Coefficient fixe pour tous les ateliers pratiques</p>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Stats résumé -->
      <div class="stats-row" v-if="!loading && workloadData">
        <div class="stat-card">
          <i class="pi pi-users"></i>
          <div>
            <span class="stat-value">{{ workloadData.summary.totalTeachers }}</span>
            <span class="stat-label">Enseignants</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-clock"></i>
          <div>
            <span class="stat-value">{{ workloadData.summary.totalPresencePeriods }}p</span>
            <span class="stat-label">Périodes présence</span>
          </div>
        </div>
        <div class="stat-card highlight">
          <i class="pi pi-chart-bar"></i>
          <div>
            <span class="stat-value">{{ workloadData.summary.totalWeightedPeriods }}p</span>
            <span class="stat-label">Périodes pondérées</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-calendar"></i>
          <div>
            <span class="stat-value">{{ workloadData.summary.totalSlots }}</span>
            <span class="stat-label">Créneaux</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p>Calcul de la feuille de charges...</p>
      </div>

      <!-- Tableau principal : vue liste -->
      <div v-else-if="filteredTeachers.length > 0 && !selectedTeacher">
        <DataTable 
          :value="filteredTeachers" 
          :paginator="filteredTeachers.length > 20"
          :rows="20"
          stripedRows 
          responsiveLayout="scroll"
          sortField="totalWeightedPeriods"
          :sortOrder="-1"
          class="workload-table"
          v-model:expandedRows="expandedRows"
          dataKey="teacher.name"
        >
          <Column :expander="true" style="width: 3rem" />
          <Column field="teacher.name" header="Enseignant" sortable>
            <template #body="{ data }">
              <div class="teacher-name-cell" @click="selectedTeacher = data.teacher.name" style="cursor: pointer">
                <i class="pi pi-user text-primary"></i>
                <div>
                  <strong>{{ data.teacher.name }}</strong>
                  <div v-if="data.teacher.email" class="text-xs text-500">{{ data.teacher.email }}</div>
                </div>
              </div>
            </template>
          </Column>
          <Column field="slots.length" header="Créneaux" sortable style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data.slots.length" severity="secondary" />
            </template>
          </Column>
          <Column field="totalPresencePeriods" header="Périodes présence" sortable style="width: 140px">
            <template #body="{ data }">
              <span>{{ data.totalPresencePeriods }}p</span>
            </template>
          </Column>
          <Column field="totalWeightedPeriods" header="Périodes pondérées" sortable style="width: 160px">
            <template #body="{ data }">
              <strong class="text-primary text-lg">{{ data.totalWeightedPeriods }}p</strong>
            </template>
          </Column>
          <Column header="Répartition" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Tag v-if="data.byActivity.cours.periods > 0" :value="`Cours: ${roundHalf(data.byActivity.cours.periods)}p`" severity="info" />
                <Tag v-if="data.byActivity.atelier.periods > 0" :value="`Atelier: ${roundHalf(data.byActivity.atelier.periods)}p`" severity="warning" />
              </div>
            </template>
          </Column>
          <Column header="Ratio" style="width: 100px">
            <template #body="{ data }">
              <span class="text-500">× {{ data.totalPresencePeriods > 0 ? (data.totalWeightedPeriods / data.totalPresencePeriods).toFixed(2) : '—' }}</span>
            </template>
          </Column>

          <!-- Expanded row rapide -->
          <template #expansion="{ data }">
            <div class="p-3">
              <div class="grid">
                <div class="col-12 md:col-4">
                  <h6 class="mt-0 mb-2">Par coefficient</h6>
                  <div v-for="c in data.byCoefficient" :key="c.label" class="flex justify-content-between align-items-center mb-1">
                    <Tag :value="c.label" :severity="c.coeff === 1.6 ? 'warning' : c.coeff === 4.0 ? 'success' : 'info'" size="small" />
                    <strong class="text-primary text-sm">{{ c.weighted }}p</strong>
                  </div>
                </div>
                <div class="col-12 md:col-4">
                  <h6 class="mt-0 mb-2">Par module</h6>
                  <div v-for="mod in data.byModule" :key="mod.code" class="flex justify-content-between mb-1">
                    <span class="text-sm text-700 overflow-hidden white-space-nowrap text-overflow-ellipsis" style="max-width: 200px">{{ mod.title || mod.code }}</span>
                    <strong class="text-primary text-sm">{{ mod.weighted }}p</strong>
                  </div>
                </div>
                <div class="col-12 md:col-4">
                  <h6 class="mt-0 mb-2">Par classe</h6>
                  <div v-for="cls in data.byClass" :key="cls.code" class="flex justify-content-between mb-1">
                    <Tag :value="cls.code" size="small" />
                    <strong class="text-primary text-sm">{{ cls.weighted }}p</strong>
                  </div>
                </div>
              </div>
              <div class="mt-3 text-center">
                <Button label="Voir le détail complet" icon="pi pi-external-link" size="small" text @click="selectedTeacher = data.teacher.name" />
              </div>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Vue détaillée pour un enseignant sélectionné (avec tabs) -->
      <div v-else-if="selectedTeacherData">
        <Card class="mb-3 teacher-header-card">
          <template #content>
            <div class="flex align-items-center justify-content-between flex-wrap gap-3">
              <div class="flex align-items-center gap-3">
                <Button icon="pi pi-arrow-left" severity="secondary" text rounded @click="selectedTeacher = null" v-tooltip="'Retour à la liste'" />
                <i class="pi pi-user text-3xl text-primary"></i>
                <div>
                  <h3 class="m-0">{{ selectedTeacherData.teacher.name }}</h3>
                  <span class="text-500">{{ selectedTeacherData.teacher.email }}</span>
                </div>
              </div>
              <div class="flex gap-4 align-items-center">
                <div class="text-center">
                  <div class="text-3xl font-bold text-primary">{{ selectedTeacherData.totalWeightedPeriods }}p</div>
                  <div class="text-xs text-500">Périodes pondérées</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ selectedTeacherData.totalPresencePeriods }}p</div>
                  <div class="text-xs text-500">Périodes présence</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ selectedTeacherData.slots.length }}</div>
                  <div class="text-xs text-500">Créneaux</div>
                </div>
                <div class="text-center">
                  <Tag :value="'× ' + (selectedTeacherData.totalPresencePeriods > 0 ? (selectedTeacherData.totalWeightedPeriods / selectedTeacherData.totalPresencePeriods).toFixed(2) : '—')" severity="info" class="text-lg" />
                  <div class="text-xs text-500 mt-1">Ratio</div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <TabView>
          <!-- Onglet Coefficients -->
          <TabPanel header="Coefficients">
            <DataTable :value="selectedTeacherData.byCoefficient" size="small" stripedRows>
              <Column field="label" header="Type de coefficient">
                <template #body="{ data: c }">
                  <Tag :value="c.label" :severity="c.coeff === 1.6 ? 'warning' : c.coeff === 4.0 ? 'success' : 'info'" />
                </template>
              </Column>
              <Column field="slots" header="Nb créneaux" sortable style="width: 120px" />
              <Column field="periods" header="Périodes présence" sortable style="width: 140px">
                <template #body="{ data: c }">{{ c.periods }}p</template>
              </Column>
              <Column field="coeff" header="Coefficient" style="width: 100px">
                <template #body="{ data: c }"><strong>× {{ c.coeff }}</strong></template>
              </Column>
              <Column field="weighted" header="Périodes pondérées" sortable style="width: 160px">
                <template #body="{ data: c }"><strong class="text-primary">{{ c.weighted }}p</strong></template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Onglet Modules -->
          <TabPanel header="Modules">
            <DataTable :value="selectedTeacherData.byModule" size="small" stripedRows sortField="weighted" :sortOrder="-1">
              <Column field="title" header="Module" sortable>
                <template #body="{ data: mod }">{{ mod.title || mod.code }}</template>
              </Column>
              <Column field="code" header="Code" sortable style="width: 200px">
                <template #body="{ data: mod }"><span class="text-xs text-500">{{ mod.code }}</span></template>
              </Column>
              <Column field="periods" header="Périodes présence" sortable style="width: 140px">
                <template #body="{ data: mod }">{{ mod.periods }}p</template>
              </Column>
              <Column field="weighted" header="Périodes pondérées" sortable style="width: 160px">
                <template #body="{ data: mod }"><strong class="text-primary">{{ mod.weighted }}p</strong></template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Onglet Classes -->
          <TabPanel header="Classes">
            <DataTable :value="selectedTeacherData.byClass" size="small" stripedRows sortField="weighted" :sortOrder="-1">
              <Column field="code" header="Classe" sortable>
                <template #body="{ data: cls }"><Tag :value="cls.code" /></template>
              </Column>
              <Column field="periods" header="Périodes présence" sortable style="width: 140px">
                <template #body="{ data: cls }">{{ cls.periods }}p</template>
              </Column>
              <Column field="weighted" header="Périodes pondérées" sortable style="width: 160px">
                <template #body="{ data: cls }"><strong class="text-primary">{{ cls.weighted }}p</strong></template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Onglet Créneaux -->
          <TabPanel header="Tous les créneaux">
            <DataTable 
              :value="selectedTeacherData.slots" 
              :paginator="selectedTeacherData.slots.length > 25"
              :rows="25"
              stripedRows 
              responsiveLayout="scroll"
              sortField="weekNumber"
              :sortOrder="1"
              size="small"
            >
              <Column field="weekNumber" header="Sem." sortable style="width: 70px">
                <template #body="{ data }">
                  <Tag :value="'S' + data.weekNumber" :severity="data.weekNumber >= 38 || data.weekNumber <= 7 ? 'warning' : 'info'" />
                </template>
              </Column>
              <Column field="day" header="Jour" sortable style="width: 100px" />
              <Column header="Horaire" style="width: 120px">
                <template #body="{ data }">{{ data.startTime }} – {{ data.endTime }}</template>
              </Column>
              <Column field="classCode" header="Classe" sortable style="width: 110px">
                <template #body="{ data }"><Tag :value="data.classCode" /></template>
              </Column>
              <Column field="moduleName" header="Module" sortable style="width: 200px">
                <template #body="{ data }">
                  <span>{{ data.moduleName || data.moduleCode }}</span>
                </template>
              </Column>
              <Column field="courseTitle" header="Cours" sortable />
              <Column field="activity" header="Type" style="width: 100px">
                <template #body="{ data }">
                  <Tag :value="data.activity" :severity="data.isAtelier ? 'warning' : 'info'" />
                </template>
              </Column>
              <Column field="periods" header="Périodes" sortable style="width: 80px">
                <template #body="{ data }">{{ data.periods }}p</template>
              </Column>
              <Column field="coefficient" header="Coefficient" sortable style="width: 180px">
                <template #body="{ data }">
                  <div class="flex align-items-center gap-2">
                    <Tag :value="'× ' + data.coefficient" :severity="data.isAtelier ? 'warning' : data.teacherCount === 1 ? 'success' : 'info'" />
                    <span class="text-xs text-500">{{ data.coeffLabel }}</span>
                  </div>
                </template>
              </Column>
              <Column field="weightedPeriods" header="Pondéré" sortable style="width: 100px">
                <template #body="{ data }"><strong class="text-primary">{{ data.weightedPeriods }}p</strong></template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="empty-state">
        <i class="pi pi-chart-bar"></i>
        <p>Aucune donnée de planning trouvée</p>
        <small>Vérifiez que des créneaux avec enseignants existent dans le planning hebdomadaire.</small>
      </div>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import Panel from 'primevue/panel'
import ProgressSpinner from 'primevue/progressspinner'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import workloadService, { PILIER_1_1_COEFFICIENTS } from '@/service/workloadService'
import { useAcademicYear } from '@/composables/useAcademicYear'

const roundHalf = (val) => Math.round(val * 2) / 2

const toast = useToast()
const { activeAcademicYear, loadActiveAcademicYear } = useAcademicYear()

// State
const loading = ref(false)
const selectedSemester = ref('all')
const selectedTeacher = ref(null)
const selectedClass = ref(null)
const selectedModule = ref(null)
const selectedType = ref(null)
const workloadData = ref(null)
const expandedRows = ref([])

// Options
const semesterOptions = [
  { label: 'Année complète', value: 'all' },
  { label: "Semestre d'Automne (S38–S7)", value: 'autumn' },
  { label: 'Semestre de Printemps (S8–S37)', value: 'spring' }
]

const typeOptions = [
  { label: 'Cours', value: 'cours' },
  { label: 'Atelier', value: 'atelier' }
]

// Coefficients reference table
const coefficientRows = PILIER_1_1_COEFFICIENTS.map(c => ({
  label: c.label,
  coeff: c.coeff
}))

// Computed — dynamic filter options
const classFilterOptions = computed(() => {
  if (!workloadData.value) return []
  const classSet = new Set()
  for (const w of workloadData.value.teachers) {
    for (const cls of w.byClass) classSet.add(cls.code)
  }
  return [...classSet].sort().map(c => ({ label: c, value: c }))
})

const moduleFilterOptions = computed(() => {
  if (!workloadData.value) return []
  const modMap = new Map()
  for (const w of workloadData.value.teachers) {
    for (const mod of w.byModule) {
      if (!modMap.has(mod.code)) {
        modMap.set(mod.code, mod.title || mod.code)
      }
    }
  }
  return [...modMap.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([code, title]) => ({ label: title !== code ? `${title}` : code, value: code }))
})

const teacherFilterOptions = computed(() => {
  if (!workloadData.value) return []
  return workloadData.value.teachers.map(w => ({
    label: `${w.teacher.name} (${w.totalWeightedPeriods}p)`,
    value: w.teacher.name
  }))
})

const filteredTeachers = computed(() => {
  if (!workloadData.value) return []
  let list = workloadData.value.teachers

  if (selectedTeacher.value) {
    list = list.filter(w => w.teacher.name === selectedTeacher.value)
  }

  // Filtres avancés : on filtre les profs qui ont au moins un créneau correspondant
  if (selectedClass.value) {
    list = list.filter(w => w.slots.some(s => s.classCode === selectedClass.value))
  }
  if (selectedModule.value) {
    list = list.filter(w => w.slots.some(s => s.moduleCode === selectedModule.value))
  }
  if (selectedType.value) {
    if (selectedType.value === 'atelier') {
      list = list.filter(w => w.byActivity.atelier.periods > 0)
    } else {
      list = list.filter(w => w.byActivity.cours.periods > 0)
    }
  }

  return list
})

const selectedTeacherData = computed(() => {
  if (!selectedTeacher.value || !workloadData.value) return null
  return workloadData.value.teachers.find(w => w.teacher.name === selectedTeacher.value) || null
})

// Stats visuelles
const maxWeightedPeriods = computed(() => {
  if (!workloadData.value) return 1
  return Math.max(...workloadData.value.teachers.map(w => w.totalWeightedPeriods), 1)
})

function clearFilters() {
  selectedTeacher.value = null
  selectedClass.value = null
  selectedModule.value = null
  selectedType.value = null
}

const hasActiveFilters = computed(() => {
  return selectedTeacher.value || selectedClass.value || selectedModule.value || selectedType.value
})

// Methods
async function loadWorkload() {
  loading.value = true
  try {
    const academicYearId = activeAcademicYear.value?.id || null
    workloadData.value = await workloadService.computeWorkload(selectedSemester.value, academicYearId)
  } catch (error) {
    console.error('[Workload] Erreur:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger la feuille de charges',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

async function exportWorkload() {
  if (!workloadData.value || workloadData.value.teachers.length === 0) {
    toast.add({ severity: 'warn', summary: 'Rien à exporter', detail: 'Aucune donnée disponible', life: 3000 })
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()

    // Feuille résumé
    const wsSummary = workbook.addWorksheet('Résumé')
    wsSummary.columns = [
      { header: 'Enseignant', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Créneaux', key: 'slots', width: 12 },
      { header: 'Périodes présence', key: 'presence', width: 16 },
      { header: 'Périodes pondérées', key: 'weighted', width: 18 },
      { header: 'Cours (p)', key: 'coursPeriods', width: 12 },
      { header: 'Cours pondéré (p)', key: 'coursWeighted', width: 18 },
      { header: 'Atelier (p)', key: 'atelierPeriods', width: 12 },
      { header: 'Atelier pondéré (p)', key: 'atelierWeighted', width: 18 },
      { header: 'Ratio moyen', key: 'ratio', width: 12 }
    ]

    // Style header
    wsSummary.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } }
      cell.alignment = { horizontal: 'center' }
    })

    for (const w of workloadData.value.teachers) {
      wsSummary.addRow({
        name: w.teacher.name,
        email: w.teacher.email || '',
        slots: w.slots.length,
        presence: w.totalPresencePeriods,
        weighted: w.totalWeightedPeriods,
        coursPeriods: w.byActivity.cours.periods,
        coursWeighted: Math.round(w.byActivity.cours.weighted * 10) / 10,
        atelierPeriods: w.byActivity.atelier.periods,
        atelierWeighted: Math.round(w.byActivity.atelier.weighted * 10) / 10,
        ratio: w.totalPresencePeriods > 0 ? Math.round((w.totalWeightedPeriods / w.totalPresencePeriods) * 10) / 10 : 0
      })
    }

    // Ligne TOTAL sur la feuille Résumé
    const allTeachers = workloadData.value.teachers
    const summaryTotal = wsSummary.addRow({
      name: 'TOTAL',
      email: '',
      slots: allTeachers.reduce((s, w) => s + w.slots.length, 0),
      presence: roundHalf(allTeachers.reduce((s, w) => s + w.totalPresencePeriods, 0)),
      weighted: Math.round(allTeachers.reduce((s, w) => s + w.totalWeightedPeriods, 0) * 10) / 10,
      coursPeriods: roundHalf(allTeachers.reduce((s, w) => s + w.byActivity.cours.periods, 0)),
      coursWeighted: Math.round(allTeachers.reduce((s, w) => s + w.byActivity.cours.weighted, 0) * 10) / 10,
      atelierPeriods: roundHalf(allTeachers.reduce((s, w) => s + w.byActivity.atelier.periods, 0)),
      atelierWeighted: Math.round(allTeachers.reduce((s, w) => s + w.byActivity.atelier.weighted, 0) * 10) / 10,
      ratio: ''
    })
    summaryTotal.eachCell(cell => {
      cell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } }
      cell.alignment = { horizontal: 'center' }
    })
    summaryTotal.getCell('name').alignment = { horizontal: 'left' }

    const headerStyle = (row) => {
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } }
        cell.alignment = { horizontal: 'center' }
      })
    }
    const subHeaderStyle = (row) => {
      row.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF607D8B' } }
      })
    }

    // Feuille détail pour chaque prof
    for (const w of workloadData.value.teachers) {
      const sheetName = (w.teacher.name || 'Inconnu').substring(0, 31)
      const ws = workbook.addWorksheet(sheetName)

      // ── Encadré TOTAL en haut ──
      const titleRow = ws.addRow([`${w.teacher.name}`])
      titleRow.getCell(1).font = { bold: true, size: 14 }
      ws.mergeCells(titleRow.number, 1, titleRow.number, 5)

      const totalRow1 = ws.addRow(['TOTAL PÉRIODES PRÉSENCE', w.totalPresencePeriods + 'p', '', 'TOTAL PÉRIODES PONDÉRÉES', w.totalWeightedPeriods + 'p'])
      totalRow1.getCell(1).font = { bold: true, size: 12 }
      totalRow1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
      totalRow1.getCell(2).font = { bold: true, size: 14, color: { argb: 'FF1B5E20' } }
      totalRow1.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
      totalRow1.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }
      totalRow1.getCell(4).font = { bold: true, size: 12 }
      totalRow1.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } }
      totalRow1.getCell(5).font = { bold: true, size: 16, color: { argb: 'FF1B5E20' } }
      totalRow1.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } }

      const ratioVal = w.totalPresencePeriods > 0 ? (w.totalWeightedPeriods / w.totalPresencePeriods).toFixed(2) : '—'
      const totalRow2 = ws.addRow([
        `Cours: ${roundHalf(w.byActivity.cours.periods)}p (pondéré: ${Math.round(w.byActivity.cours.weighted * 10) / 10}p)`,
        '',
        '',
        `Atelier: ${roundHalf(w.byActivity.atelier.periods)}p (pondéré: ${Math.round(w.byActivity.atelier.weighted * 10) / 10}p)`,
        `Ratio moyen: × ${ratioVal}`
      ])
      totalRow2.getCell(1).font = { italic: true, color: { argb: 'FF1565C0' } }
      totalRow2.getCell(4).font = { italic: true, color: { argb: 'FFE65100' } }
      totalRow2.getCell(5).font = { bold: true }
      ws.addRow([])

      // ── Section 1 : Résumé par coefficient ──
      ws.addRow(['RÉPARTITION PAR COEFFICIENT'])
      subHeaderStyle(ws.lastRow)
      ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 5)

      const coeffHeaders = ws.addRow(['Type', 'Nb créneaux', 'Périodes présence', 'Coefficient', 'Périodes pondérées'])
      headerStyle(coeffHeaders)
      for (const c of w.byCoefficient) {
        ws.addRow([c.label, c.slots, c.periods, `× ${c.coeff}`, c.weighted])
      }
      ws.addRow([])

      // ── Section 2 : Résumé par module ──
      ws.addRow(['DÉTAIL PAR MODULE'])
      subHeaderStyle(ws.lastRow)
      ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 5)

      const modHeaders = ws.addRow(['Module', 'Code', 'Périodes présence', 'Périodes pondérées'])
      headerStyle(modHeaders)
      for (const mod of w.byModule) {
        ws.addRow([mod.title, mod.code, mod.periods, mod.weighted])
      }
      ws.addRow([])

      // ── Section 3 : Résumé par classe ──
      ws.addRow(['DÉTAIL PAR CLASSE'])
      subHeaderStyle(ws.lastRow)
      ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 5)

      const clsHeaders = ws.addRow(['Classe', 'Périodes présence', 'Périodes pondérées'])
      headerStyle(clsHeaders)
      for (const cls of w.byClass) {
        ws.addRow([cls.code, cls.periods, cls.weighted])
      }
      ws.addRow([])

      // ── Section 4 : Détail créneau par créneau ──
      ws.addRow(['DÉTAIL CRÉNEAU PAR CRÉNEAU'])
      subHeaderStyle(ws.lastRow)
      ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 10)

      const slotHeaders = ws.addRow([
        'Semaine', 'Jour', 'Horaire', 'Classe', 'Module', 'Cours', 'Type', 'Périodes', 'Coefficient', 'Détail coeff.', 'Périodes pondérées'
      ])
      headerStyle(slotHeaders)

      for (const slot of w.slots) {
        ws.addRow([
          `S${slot.weekNumber}`,
          slot.day,
          `${slot.startTime} – ${slot.endTime}`,
          slot.classCode,
          slot.moduleName || slot.moduleCode,
          slot.courseTitle || '',
          slot.activity,
          slot.periods,
          slot.coefficient,
          slot.coeffLabel,
          slot.weightedPeriods
        ])
      }

      // Ligne total
      const totalRow = ws.addRow([
        '', '', '', '', '', '', 'TOTAL',
        w.totalPresencePeriods, '', '', w.totalWeightedPeriods
      ])
      totalRow.eachCell(cell => { cell.font = { bold: true } })

      // Largeur des colonnes
      ws.columns = [
        { width: 10 }, { width: 12 }, { width: 16 }, { width: 14 },
        { width: 22 }, { width: 35 }, { width: 12 }, { width: 10 },
        { width: 12 }, { width: 22 }, { width: 16 }
      ]
    }

    // Feuille coefficients de référence
    const wsCoeff = workbook.addWorksheet('Coefficients')
    wsCoeff.columns = [
      { header: 'Type', key: 'type', width: 25 },
      { header: 'Nb enseignants', key: 'range', width: 20 },
      { header: 'Coefficient', key: 'coeff', width: 12 }
    ]
    wsCoeff.getRow(1).eachCell(cell => {
      cell.font = { bold: true }
    })
    for (const c of PILIER_1_1_COEFFICIENTS) {
      wsCoeff.addRow({ type: 'Pilier 1.1', range: c.label, coeff: c.coeff })
    }
    wsCoeff.addRow({ type: 'Atelier (pratique)', range: 'Tout nb de profs', coeff: 1.6 })

    // Télécharger
    const semLabel = selectedSemester.value === 'all' ? 'annuel' : selectedSemester.value === 'autumn' ? 'automne' : 'printemps'
    const blob = new Blob([await workbook.xlsx.writeBuffer()], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Feuille_de_charges_SI_${semLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    toast.add({ severity: 'success', summary: 'Export réussi', detail: 'Fichier Excel généré', life: 3000 })
  } catch (error) {
    console.error('[Workload] Erreur export:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'exporter", life: 5000 })
  }
}

onMounted(async () => {
  await loadActiveAcademicYear()
  await loadWorkload()
})
</script>

<style scoped>
.workload-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem 1.5rem;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-inline label {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.stats-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  flex: 1;
  min-width: 150px;
}

.stat-card.highlight {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 15%, var(--surface-card));
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.coeff-panel {
  margin-bottom: 0;
}

.coeff-table {
  max-width: 500px;
}

.atelier-coeff-card {
  background: var(--orange-50, #fff3e0);
  border: 1px solid var(--orange-200, #ffcc80);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.teacher-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.teacher-name-cell:hover strong {
  color: var(--primary-color);
  text-decoration: underline;
}


.teacher-header-card {
  border-left: 4px solid var(--primary-color);
}

:deep(.workload-table .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
}
</style>
