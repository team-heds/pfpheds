<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Feuille de charges — Enseignants SI" 
        subtitle="Calcul automatique des heures pondérées selon les coefficients Pilier 1.1" 
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
                placeholder="Tous les enseignants"
                showClear
                filter
                style="width: 260px"
              />
            </div>
          </div>
          <div class="flex gap-2 align-items-center">
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
              <Column header="Exemple (2h de cours)">
                <template #body="{ data }">
                  <span class="text-500">2h × {{ data.coeff }} = <strong>{{ (2 * data.coeff).toFixed(1) }}h</strong></span>
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
            <span class="stat-value">{{ workloadData.summary.totalPresenceHours }}h</span>
            <span class="stat-label">Heures présence</span>
          </div>
        </div>
        <div class="stat-card highlight">
          <i class="pi pi-chart-bar"></i>
          <div>
            <span class="stat-value">{{ workloadData.summary.totalWeightedHours }}h</span>
            <span class="stat-label">Heures pondérées</span>
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

      <!-- Tableau principal -->
      <div v-else-if="filteredTeachers.length > 0">
        <!-- Vue résumé par enseignant -->
        <DataTable 
          v-if="!selectedTeacher"
          :value="filteredTeachers" 
          :paginator="filteredTeachers.length > 20"
          :rows="20"
          stripedRows 
          responsiveLayout="scroll"
          sortField="totalWeightedHours"
          :sortOrder="-1"
          class="workload-table"
          v-model:expandedRows="expandedRows"
          dataKey="teacher.name"
        >
          <Column :expander="true" style="width: 3rem" />
          <Column field="teacher.name" header="Enseignant" sortable>
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
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
          <Column field="totalPresenceHours" header="Heures présence" sortable style="width: 140px">
            <template #body="{ data }">
              <span>{{ data.totalPresenceHours }}h</span>
            </template>
          </Column>
          <Column field="totalWeightedHours" header="Heures pondérées" sortable style="width: 160px">
            <template #body="{ data }">
              <strong class="text-primary text-lg">{{ data.totalWeightedHours }}h</strong>
            </template>
          </Column>
          <Column header="Répartition" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Tag v-if="data.byActivity.cours.hours > 0" :value="`Cours: ${data.byActivity.cours.hours}h`" severity="info" />
                <Tag v-if="data.byActivity.atelier.hours > 0" :value="`Atelier: ${data.byActivity.atelier.hours}h`" severity="warning" />
              </div>
            </template>
          </Column>
          <Column header="Ratio" style="width: 100px">
            <template #body="{ data }">
              <span class="text-500">× {{ data.totalPresenceHours > 0 ? (data.totalWeightedHours / data.totalPresenceHours).toFixed(2) : '—' }}</span>
            </template>
          </Column>

          <!-- Expanded row: détail par module -->
          <template #expansion="{ data }">
            <div class="p-3">
              <h5 class="mt-0 mb-3">Détail par module — {{ data.teacher.name }}</h5>
              <DataTable :value="data.byModule" size="small" stripedRows>
                <Column field="code" header="Module" sortable />
                <Column field="title" header="Titre" />
                <Column field="hours" header="Heures présence" sortable>
                  <template #body="{ data: mod }">{{ mod.hours }}h</template>
                </Column>
                <Column field="weighted" header="Heures pondérées" sortable>
                  <template #body="{ data: mod }">
                    <strong class="text-primary">{{ mod.weighted }}h</strong>
                  </template>
                </Column>
              </DataTable>

              <h5 class="mt-4 mb-3">Détail par classe</h5>
              <DataTable :value="data.byClass" size="small" stripedRows>
                <Column field="code" header="Classe" sortable>
                  <template #body="{ data: cls }">
                    <Tag :value="cls.code" />
                  </template>
                </Column>
                <Column field="hours" header="Heures présence" sortable>
                  <template #body="{ data: cls }">{{ cls.hours }}h</template>
                </Column>
                <Column field="weighted" header="Heures pondérées" sortable>
                  <template #body="{ data: cls }">
                    <strong class="text-primary">{{ cls.weighted }}h</strong>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </DataTable>

        <!-- Vue détaillée pour un enseignant sélectionné -->
        <div v-else-if="selectedTeacherData">
          <Card class="mb-3">
            <template #title>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-user text-3xl text-primary"></i>
                <div>
                  <h3 class="m-0">{{ selectedTeacherData.teacher.name }}</h3>
                  <span class="text-500">{{ selectedTeacherData.teacher.email }}</span>
                </div>
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-6 md:col-3 text-center">
                  <div class="text-3xl font-bold text-primary">{{ selectedTeacherData.totalWeightedHours }}h</div>
                  <div class="text-500">Heures pondérées</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-3xl font-bold">{{ selectedTeacherData.totalPresenceHours }}h</div>
                  <div class="text-500">Heures présence</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-3xl font-bold">{{ selectedTeacherData.slots.length }}</div>
                  <div class="text-500">Créneaux</div>
                </div>
                <div class="col-6 md:col-3 text-center">
                  <div class="text-3xl font-bold">
                    × {{ selectedTeacherData.totalPresenceHours > 0 ? (selectedTeacherData.totalWeightedHours / selectedTeacherData.totalPresenceHours).toFixed(2) : '—' }}
                  </div>
                  <div class="text-500">Ratio moyen</div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Créneaux détaillés -->
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
              <template #body="{ data }">
                {{ data.startTime }} – {{ data.endTime }}
              </template>
            </Column>
            <Column field="classCode" header="Classe" sortable style="width: 110px">
              <template #body="{ data }">
                <Tag :value="data.classCode" />
              </template>
            </Column>
            <Column field="moduleCode" header="Module" sortable />
            <Column field="activity" header="Type" style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.activity" :severity="data.isAtelier ? 'warning' : 'info'" />
              </template>
            </Column>
            <Column field="hours" header="Heures" sortable style="width: 80px">
              <template #body="{ data }">{{ data.hours }}h</template>
            </Column>
            <Column field="coefficient" header="Coefficient" sortable style="width: 180px">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <Tag :value="'× ' + data.coefficient" :severity="data.isAtelier ? 'warning' : data.teacherCount === 1 ? 'success' : 'info'" />
                  <span class="text-xs text-500">{{ data.coeffLabel }}</span>
                </div>
              </template>
            </Column>
            <Column field="weightedHours" header="Pondéré" sortable style="width: 100px">
              <template #body="{ data }">
                <strong class="text-primary">{{ data.weightedHours }}h</strong>
              </template>
            </Column>
          </DataTable>
        </div>
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
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import workloadService, { PILIER_1_1_COEFFICIENTS } from '@/service/workloadService'
import { useAcademicYear } from '@/composables/useAcademicYear'

const toast = useToast()
const { activeAcademicYear, loadActiveAcademicYear } = useAcademicYear()

// State
const loading = ref(false)
const selectedSemester = ref('all')
const selectedTeacher = ref(null)
const workloadData = ref(null)
const expandedRows = ref([])

// Options
const semesterOptions = [
  { label: 'Année complète', value: 'all' },
  { label: "Semestre d'Automne (S38–S7)", value: 'autumn' },
  { label: 'Semestre de Printemps (S8–S37)', value: 'spring' }
]

// Coefficients reference table
const coefficientRows = PILIER_1_1_COEFFICIENTS.map(c => ({
  label: c.label,
  coeff: c.coeff
}))

// Computed
const teacherFilterOptions = computed(() => {
  if (!workloadData.value) return []
  return workloadData.value.teachers.map(w => ({
    label: `${w.teacher.name} (${w.totalWeightedHours}h)`,
    value: w.teacher.name
  }))
})

const filteredTeachers = computed(() => {
  if (!workloadData.value) return []
  if (!selectedTeacher.value) return workloadData.value.teachers
  return workloadData.value.teachers.filter(w => w.teacher.name === selectedTeacher.value)
})

const selectedTeacherData = computed(() => {
  if (!selectedTeacher.value || !workloadData.value) return null
  return workloadData.value.teachers.find(w => w.teacher.name === selectedTeacher.value) || null
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
      { header: 'Heures présence', key: 'presence', width: 16 },
      { header: 'Heures pondérées', key: 'weighted', width: 18 },
      { header: 'Cours (h)', key: 'coursHours', width: 12 },
      { header: 'Cours pondéré (h)', key: 'coursWeighted', width: 18 },
      { header: 'Atelier (h)', key: 'atelierHours', width: 12 },
      { header: 'Atelier pondéré (h)', key: 'atelierWeighted', width: 18 },
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
        presence: w.totalPresenceHours,
        weighted: w.totalWeightedHours,
        coursHours: w.byActivity.cours.hours,
        coursWeighted: Math.round(w.byActivity.cours.weighted * 100) / 100,
        atelierHours: w.byActivity.atelier.hours,
        atelierWeighted: Math.round(w.byActivity.atelier.weighted * 100) / 100,
        ratio: w.totalPresenceHours > 0 ? Math.round((w.totalWeightedHours / w.totalPresenceHours) * 100) / 100 : 0
      })
    }

    // Feuille détail pour chaque prof
    for (const w of workloadData.value.teachers) {
      const sheetName = (w.teacher.name || 'Inconnu').substring(0, 31)
      const ws = workbook.addWorksheet(sheetName)
      ws.columns = [
        { header: 'Semaine', key: 'week', width: 10 },
        { header: 'Jour', key: 'day', width: 12 },
        { header: 'Horaire', key: 'time', width: 14 },
        { header: 'Classe', key: 'class', width: 12 },
        { header: 'Module', key: 'module', width: 25 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Heures', key: 'hours', width: 10 },
        { header: 'Coefficient', key: 'coeff', width: 12 },
        { header: 'Détail coeff.', key: 'coeffLabel', width: 22 },
        { header: 'Heures pondérées', key: 'weighted', width: 16 }
      ]

      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } }
        cell.alignment = { horizontal: 'center' }
      })

      for (const slot of w.slots) {
        ws.addRow({
          week: `S${slot.weekNumber}`,
          day: slot.day,
          time: `${slot.startTime} – ${slot.endTime}`,
          class: slot.classCode,
          module: slot.moduleCode,
          type: slot.activity,
          hours: slot.hours,
          coeff: slot.coefficient,
          coeffLabel: slot.coeffLabel,
          weighted: slot.weightedHours
        })
      }

      // Ligne total
      const totalRow = ws.addRow({
        week: '',
        day: '',
        time: '',
        class: '',
        module: '',
        type: 'TOTAL',
        hours: w.totalPresenceHours,
        coeff: '',
        coeffLabel: '',
        weighted: w.totalWeightedHours
      })
      totalRow.eachCell(cell => { cell.font = { bold: true } })
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
  background: var(--primary-50, #e3f2fd);
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

:deep(.workload-table .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
}
</style>
