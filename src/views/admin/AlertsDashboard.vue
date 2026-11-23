<template>
  <div class="alerts-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <i class="pi pi-bell"></i>
          <div>
            <h1>Tableau de Bord des Alertes</h1>
            <p>Contrôles calculés sur les données réelles de la plateforme</p>
          </div>
        </div>
        <div class="header-actions">
          <PeriodSelector
            v-model="selectedPeriod"
            :show-custom="false"
            @change="loadAlerts"
          />
          <Button
            label="Exporter"
            icon="pi pi-download"
            severity="secondary"
            @click="showExportDialog = true"
          />
          <Button
            label="Rafraîchir"
            icon="pi pi-refresh"
            @click="loadAlerts"
            :loading="loading"
          />
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <Card class="stat-card critical">
        <template #content>
          <div class="stat-content">
            <i class="pi pi-exclamation-circle"></i>
            <div>
              <span class="stat-value">{{ stats.critical }}</span>
              <span class="stat-label">Alertes Critiques</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card warning">
        <template #content>
          <div class="stat-content">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <span class="stat-value">{{ stats.warning }}</span>
              <span class="stat-label">Avertissements</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card info">
        <template #content>
          <div class="stat-content">
            <i class="pi pi-info-circle"></i>
            <div>
              <span class="stat-value">{{ stats.info }}</span>
              <span class="stat-label">Informations</span>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card resolved">
        <template #content>
          <div class="stat-content">
            <i class="pi pi-check-circle"></i>
            <div>
              <span class="stat-value">{{ stats.resolved }}</span>
              <span class="stat-label">Résolues</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filtres -->
    <Card class="filters-card">
      <template #content>
        <div class="filters">
          <div class="filter-group">
            <label>Sévérité</label>
            <MultiSelect
              v-model="filters.severity"
              :options="severityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Toutes"
              display="chip"
            />
          </div>
          <div class="filter-group">
            <label>Type</label>
            <MultiSelect
              v-model="filters.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tous"
              display="chip"
            />
          </div>
          <div class="filter-group">
            <label>KPI</label>
            <MultiSelect
              v-model="filters.kpiIds"
              :options="kpiOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tous"
              filter
            />
          </div>
          <div class="filter-group">
            <label>Statut</label>
            <SelectButton
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Timeline des alertes -->
    <Card class="timeline-card">
      <template #header>
        <div class="card-header">
          <h2>Historique des Alertes</h2>
          <div class="view-toggle">
            <Button
              icon="pi pi-list"
              :severity="viewMode === 'list' ? 'primary' : 'secondary'"
              text
              @click="viewMode = 'list'"
            />
            <Button
              icon="pi pi-table"
              :severity="viewMode === 'table' ? 'primary' : 'secondary'"
              text
              @click="viewMode = 'table'"
            />
            <Button
              icon="pi pi-chart-line"
              :severity="viewMode === 'chart' ? 'primary' : 'secondary'"
              text
              @click="viewMode = 'chart'"
            />
          </div>
        </div>
      </template>

      <template #content>
        <!-- Vue Liste -->
        <Message v-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>
        <Message v-else-if="!canPersistResolution" severity="info" :closable="false">
          La résolution des alertes sera disponible après l’activation de l’historique.
        </Message>
        <div v-if="!loading && !loadError && !filteredAlerts.length" class="text-center p-5 text-600">
          Aucune alerte pour ces filtres.
        </div>
        <div v-else-if="viewMode === 'list'" class="alerts-timeline">
          <Timeline :value="filteredAlerts" align="left" class="custom-timeline">
            <template #marker="{ item }">
              <div class="timeline-marker" :class="`marker-${item.severity}`">
                <i :class="getAlertIcon(item.type)"></i>
              </div>
            </template>
            <template #content="{ item }">
              <div class="timeline-content">
                <div class="alert-header">
                  <h3>{{ item.title }}</h3>
                  <Tag :value="alertSeverityLabel(item.severity)" :severity="alertTagSeverity(item.severity)" />
                </div>
                <p class="alert-message">{{ item.message }}</p>
                <div class="alert-meta">
                  <span class="alert-kpi">
                    <i class="pi pi-chart-bar"></i>
                    {{ item.kpiLabel }}
                  </span>
                  <span class="alert-time">
                    <i class="pi pi-clock"></i>
                    {{ formatDateTime(item.timestamp) }}
                  </span>
                </div>
                <div class="alert-actions">
                  <Button
                    v-if="!item.resolved && canPersistResolution"
                    label="Résoudre"
                    icon="pi pi-check"
                    size="small"
                    @click="resolveAlert(item)"
                  />
                  <Button
                    :label="item.actionLabel || 'Voir'"
                    icon="pi pi-arrow-right"
                    size="small"
                    outlined
                    @click="viewAlertDetails(item)"
                  />
                </div>
              </div>
            </template>
          </Timeline>
        </div>

        <!-- Vue Table -->
        <DataTable
          v-else-if="viewMode === 'table'"
          :value="filteredAlerts"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          stripedRows
          sortField="timestamp"
          :sortOrder="-1"
        >
          <Column field="timestamp" header="Date" sortable>
            <template #body="{ data }">
              {{ formatDateTime(data.timestamp) }}
            </template>
          </Column>
          <Column field="severity" header="Sévérité" sortable>
            <template #body="{ data }">
              <Tag :value="alertSeverityLabel(data.severity)" :severity="alertTagSeverity(data.severity)" />
            </template>
          </Column>
          <Column field="title" header="Alerte" sortable />
          <Column field="kpiId" header="KPI">
            <template #body="{ data }">
              {{ data.kpiLabel }}
            </template>
          </Column>
          <Column field="value" header="Valeur" sortable />
          <Column header="Actions">
            <template #body="{ data }">
              <div class="table-actions">
                <Button
                  v-if="!data.resolved && canPersistResolution"
                  icon="pi pi-check"
                  rounded
                  text
                  severity="success"
                  @click="resolveAlert(data)"
                  v-tooltip="'Résoudre'"
                />
                <Button
                  icon="pi pi-eye"
                  rounded
                  text
                  @click="viewAlertDetails(data)"
                  v-tooltip="'Détails'"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <!-- Vue Graphique -->
        <div v-else-if="viewMode === 'chart'" class="alerts-chart">
          <Chart type="bar" :data="chartData" :options="chartOptions" />
        </div>
      </template>
    </Card>

    <!-- Dialog Export -->
    <Dialog
      v-model:visible="showExportDialog"
      header="Exporter les Alertes"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="export-options">
        <div class="export-format">
          <h4>Format d'export</h4>
          <div class="format-buttons">
            <Button
              label="Excel"
              icon="pi pi-file-excel"
              severity="success"
              @click="exportToExcel"
            />
            <Button
              label="PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="exportToPDF"
            />
            <Button
              label="CSV"
              icon="pi pi-file"
              severity="secondary"
              @click="exportToCSV"
            />
          </div>
        </div>
        <Divider />
        <div class="export-settings">
          <h4>Options</h4>
          <div class="setting-item">
            <Checkbox v-model="exportSettings.includeResolved" binary inputId="resolved" />
            <label for="resolved">Inclure les alertes résolues</label>
          </div>
          <div class="setting-item">
            <Checkbox v-model="exportSettings.includeStats" binary inputId="stats" />
            <label for="stats">Inclure les statistiques (PDF)</label>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Timeline from 'primevue/timeline'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Chart from 'primevue/chart'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import PeriodSelector from '@/components/admin/widgets/PeriodSelector.vue'
import {
  alertSeverityLabel,
  alertTagSeverity,
  fetchAdminAlerts,
  resolveAdminAlert,
  toCsv
} from '@/service/adminAlertsService'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const loadError = ref('')
const canPersistResolution = ref(true)
const alerts = ref([])
const stats = ref({
  total: 0,
  critical: 0,
  warning: 0,
  info: 0,
  resolved: 0
})
const selectedPeriod = ref('month')
const viewMode = ref('list')
const showExportDialog = ref(false)

const filters = ref({
  severity: [],
  type: [],
  kpiIds: [],
  status: 'active'
})

const exportSettings = ref({
  includeResolved: false,
  includeStats: true
})

const severityOptions = [
  { label: 'Critique', value: 'error' },
  { label: 'Avertissement', value: 'warn' },
  { label: 'Info', value: 'info' }
]

const typeOptions = [
  { label: 'Chute importante', value: 'critical' },
  { label: 'Hausse inhabituelle', value: 'warning' },
  { label: 'Qualité des données', value: 'quality' },
  { label: 'Source en erreur', value: 'source' }
]

const kpiOptions = computed(() => {
  const labels = new Map(alerts.value.map(a => [a.kpiId, a.kpiLabel]))
  return [...labels].map(([value, label]) => ({ label, value }))
})

const statusOptions = [
  { label: 'Actives', value: 'active' },
  { label: 'Résolues', value: 'resolved' },
  { label: 'Toutes', value: 'all' }
]

const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    if (filters.value.severity.length && !filters.value.severity.includes(alert.severity)) {
      return false
    }
    if (filters.value.type.length && !filters.value.type.includes(alert.type)) {
      return false
    }
    if (filters.value.kpiIds.length && !filters.value.kpiIds.includes(alert.kpiId)) {
      return false
    }
    if (filters.value.status === 'active' && alert.resolved) {
      return false
    }
    if (filters.value.status === 'resolved' && !alert.resolved) {
      return false
    }
    return true
  })
})

const chartData = computed(() => {
  const counts = { error: 0, warn: 0, info: 0 }
  filteredAlerts.value.forEach(alert => {
    counts[alert.severity] = (counts[alert.severity] || 0) + 1
  })
  return {
    labels: ['Critiques', 'Avertissements', 'Informations'],
    datasets: [
      {
        label: 'Alertes',
        data: [counts.error, counts.warn, counts.info],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

function getAlertIcon(type) {
  const icons = {
    critical: 'pi pi-arrow-down-right',
    warning: 'pi pi-arrow-up-right',
    quality: 'pi pi-exclamation-triangle',
    source: 'pi pi-times-circle'
  }
  return icons[type] || 'pi pi-bell'
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function applyAlerts(payload) {
  alerts.value = payload.alerts
  stats.value = payload.stats
  canPersistResolution.value = payload.canPersistResolution !== false
}

function requestPeriod() {
  return typeof selectedPeriod.value === 'string' ? selectedPeriod.value : 'month'
}

async function loadAlerts() {
  loading.value = true
  loadError.value = ''
  try {
    applyAlerts(await fetchAdminAlerts({ period: requestPeriod() }))
  } catch (error) {
    console.error('Erreur chargement alertes:', error)
    loadError.value = 'Impossible de charger les alertes. Les compteurs ne sont pas à jour.'
  } finally {
    loading.value = false
  }
}

async function resolveAlert(alert) {
  try {
    applyAlerts(await resolveAdminAlert(alert.key, { period: requestPeriod() }))
    toast.add({ severity: 'success', summary: 'Alerte résolue', detail: alert.title, life: 2500 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Résolution impossible',
      detail: error?.message || 'Réessayez plus tard.',
      life: 4000
    })
  }
}

function viewAlertDetails(alert) {
  if (alert.link) router.push(alert.link)
}

function exportRows() {
  return filteredAlerts.value.filter(alert => exportSettings.value.includeResolved || !alert.resolved)
}

function exportFileName(extension) {
  return `alertes_kpi_${new Date().toISOString().slice(0, 10)}.${extension}`
}

async function exportToExcel() {
  const XLSX = await import('xlsx')
  const data = exportRows().map(alert => ({
    'Date': formatDateTime(alert.timestamp),
    'Sévérité': alertSeverityLabel(alert.severity),
    'Type': alert.type,
    'Titre': alert.title,
    'Message': alert.message,
    'KPI': alert.kpiLabel,
    'Valeur': alert.value ?? '',
    'Statut': alert.resolved ? 'Résolue' : 'Active'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alertes')
  XLSX.writeFile(wb, exportFileName('xlsx'))
  showExportDialog.value = false
}

async function exportToPDF() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Rapport des alertes KPI', 14, 20)

  let startY = 30
  if (exportSettings.value.includeStats) {
    doc.setFontSize(10)
    doc.text(`Critiques : ${stats.value.critical}`, 14, 32)
    doc.text(`Avertissements : ${stats.value.warning}`, 14, 39)
    doc.text(`Informations : ${stats.value.info}`, 14, 46)
    doc.text(`Résolues : ${stats.value.resolved}`, 14, 53)
    startY = 60
  }

  autoTable(doc, {
    head: [['Date', 'Sévérité', 'Alerte', 'KPI', 'Valeur', 'Statut']],
    body: exportRows().map(alert => [
      formatDateTime(alert.timestamp),
      alertSeverityLabel(alert.severity),
      alert.message,
      alert.kpiLabel,
      alert.value ?? '-',
      alert.resolved ? 'Résolue' : 'Active'
    ]),
    startY
  })
  doc.save(exportFileName('pdf'))
  showExportDialog.value = false
}

function exportToCSV() {
  const csv = toCsv(
    ['Date', 'Sévérité', 'Type', 'Titre', 'Message', 'KPI', 'Valeur', 'Statut'],
    exportRows().map(alert => [
      formatDateTime(alert.timestamp),
      alertSeverityLabel(alert.severity),
      alert.type,
      alert.title,
      alert.message,
      alert.kpiLabel,
      alert.value ?? '',
      alert.resolved ? 'Résolue' : 'Active'
    ])
  )
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName('csv')
  a.click()
  window.URL.revokeObjectURL(url)
  showExportDialog.value = false
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.alerts-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title i {
  font-size: 3rem;
  color: var(--primary-text-color, var(--primary-color));
}

.header-title h1 {
  margin: 0;
  font-size: 2rem;
}

.header-title p {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-content i {
  font-size: 2.5rem;
}

.stat-card.critical i { color: var(--red-500); }
.stat-card.warning i { color: var(--yellow-600); }
.stat-card.info i { color: var(--blue-500); }
.stat-card.resolved i { color: var(--green-500); }

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.filters-card {
  margin-bottom: 2rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.timeline-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
}

.card-header h2 {
  margin: 0;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.alerts-timeline {
  max-height: 700px;
  overflow-y: auto;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.25rem;
  color: white;
}

.marker-error { background: var(--red-500); }
.marker-warn { background: var(--yellow-500); }
.marker-info { background: var(--blue-500); }

.timeline-content {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.alert-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.alert-message {
  margin: 0.5rem 0;
  color: var(--text-color-secondary);
}

.alert-meta {
  display: flex;
  gap: 1.5rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.alert-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
}

.alerts-chart {
  height: 400px;
}

.export-options {
  padding: 1rem 0;
}

.export-format h4,
.export-settings h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.format-buttons {
  display: flex;
  gap: 1rem;
}

.format-buttons :deep(.p-button) {
  flex: 1;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: var(--surface-50);
  margin-bottom: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .alerts-dashboard {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .format-buttons {
    flex-direction: column;
  }
}
</style>
