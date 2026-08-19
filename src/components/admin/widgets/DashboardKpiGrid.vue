<template>
  <div class="dashboard-kpi-grid-container">
    <!-- Header avec actions -->
    <div class="kpi-grid-header mb-4">
      <div class="flex align-items-center gap-3">
        <i class="pi pi-chart-bar text-primary text-3xl"></i>
        <div>
          <h2 class="text-2xl font-bold text-900 m-0">{{ title }}</h2>
          <p class="text-600 m-0">{{ subtitle }}</p>
        </div>
      </div>
      
      <div class="kpi-grid-header__actions">
        <!-- Mode comparaison -->
        <Button
          :icon="compareMode ? 'pi pi-eye' : 'pi pi-chart-line'"
          :label="compareMode ? 'Mode Normal' : 'Comparer'"
          @click="toggleCompare"
          :severity="compareMode ? 'success' : 'secondary'"
          outlined
          size="small"
        />
        
        <!-- Toggle edit mode (drag & drop) -->
        <Button
          :icon="editMode ? 'pi pi-check' : 'pi pi-pencil'"
          :label="editMode ? 'Terminer' : 'Personnaliser'"
          @click="toggleEditMode"
          :severity="editMode ? 'success' : 'secondary'"
          outlined
          size="small"
        />
        
        <!-- Export config -->
        <Button
          icon="pi pi-download"
          label="Exporter"
          @click="exportConfig"
          severity="secondary"
          outlined
          size="small"
        />
        
        <!-- Import config -->
        <Button
          icon="pi pi-upload"
          label="Importer"
          @click="showImportDialog = true"
          severity="secondary"
          outlined
          size="small"
        />
      </div>
    </div>

    <!-- Indicateur mode édition -->
    <Message v-if="editMode" severity="info" :closable="false" class="mb-3">
      <i class="pi pi-info-circle mr-2"></i>
      Glissez-déposez les KPI pour les réorganiser. Cliquez sur l'œil pour masquer un KPI.
    </Message>

    <!-- Message si aucun KPI -->
    <Message v-if="visibleKpis.length === 0 && !editMode" severity="info" :closable="false" class="mb-3">
      <i class="pi pi-info-circle mr-2"></i>
      Chargement des indicateurs en cours...
    </Message>

    <!-- Grid KPI avec drag & drop -->
    <div
      v-if="visibleKpis.length > 0"
      ref="kpiGridRef"
      class="kpi-grid"
      :class="{ 'edit-mode': editMode }"
    >
      <div
        v-for="kpi in visibleKpis"
        :key="kpi.id"
        :data-kpi-id="kpi.id"
        class="kpi-grid-item"
        :class="[
          { 'draggable': editMode },
          `size-${kpi.size || 'medium'}`
        ]"
        :draggable="editMode"
        @dragstart="onDragStart($event, kpi)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, kpi)"
      >
        <!-- Contrôles en mode édition -->
        <div v-if="editMode" class="kpi-controls">
          <div class="control-header">
            <Button
              icon="pi pi-arrows-alt"
              class="p-button-rounded p-button-text drag-handle"
              size="small"
              severity="secondary"
              v-tooltip.top="'Glisser pour déplacer'"
            />
            <Button
              :icon="kpi.hidden ? 'pi pi-eye-slash' : 'pi pi-eye'"
              @click="toggleKpiVisibility(kpi)"
              class="p-button-rounded p-button-text"
              size="small"
              :severity="kpi.hidden ? 'danger' : 'secondary'"
              v-tooltip.top="kpi.hidden ? 'Afficher' : 'Masquer'"
            />
          </div>
          
          <!-- Size indicator -->
          <Tag 
            :value="getKpiSizeLabel(kpi.size)" 
            :severity="getKpiSizeSeverity(kpi.size)"
            @click.stop="showKpiSizeSelector(kpi)"
            class="size-tag"
            style="cursor: pointer"
          />
        </div>

        <!-- KPI Card -->
        <KpiCard
          v-bind="kpi"
          :class="{ 'opacity-50': kpi.hidden }"
          :size="kpi.size || 'medium'"
          @action="$emit('kpi-action', kpi)"
        >
          <!-- Slot pour comparaison -->
          <template #comparison v-if="compareMode && kpi.previousValue !== undefined">
            <div class="comparison-section mt-3 pt-3 border-top-1 border-200">
              <div class="flex align-items-center justify-content-between">
                <span class="text-600 text-sm">Période précédente:</span>
                <span class="font-bold">{{ kpi.previousValue.toLocaleString() }}</span>
              </div>
              <div class="flex align-items-center justify-content-between mt-2">
                <span class="text-600 text-sm">Différence:</span>
                <span :class="getDifferenceClass(kpi.value, kpi.previousValue)">
                  {{ getDifference(kpi.value, kpi.previousValue) }}
                </span>
              </div>
            </div>
          </template>
        </KpiCard>

        <!-- Alertes KPI -->
        <div v-if="kpi.alert" class="kpi-alert mt-2">
          <Message :severity="kpi.alert.severity" :closable="false">
            <i :class="kpi.alert.icon" class="mr-2"></i>
            {{ kpi.alert.message }}
          </Message>
        </div>
      </div>
    </div>

    <!-- Dialog Import -->
    <Dialog
      v-model:visible="showImportDialog"
      header="Importer une configuration"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Collez votre configuration JSON exportée:</p>
        <Textarea
          v-model="importConfigText"
          rows="10"
          placeholder='{"kpis": [...], "order": [...]}'
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Annuler" @click="showImportDialog = false" severity="secondary" outlined />
        <Button label="Importer" @click="importConfig" icon="pi pi-upload" />
      </template>
    </Dialog>

    <!-- Dialog Export Success -->
    <Dialog
      v-model:visible="showExportDialog"
      header="Configuration exportée"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Copiez cette configuration pour la sauvegarder ou la partager:</p>
        <Textarea
          :model-value="exportedConfig"
          rows="10"
          readonly
          class="w-full"
        />
        <Button
          label="Copier dans le presse-papiers"
          icon="pi pi-copy"
          @click="copyToClipboard"
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Fermer" @click="showExportDialog = false" />
      </template>
    </Dialog>

    <!-- Dialog Size Selector pour KPI -->
    <Dialog
      v-model:visible="showKpiSizeDialog"
      :header="`Taille: ${selectedKpi?.label}`"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Choisissez la taille du KPI:</p>
        
        <div class="size-options">
          <button type="button"
            v-for="size in kpiSizeOptions"
            :key="size.value"
            class="size-option"
            :class="{ 'active': selectedKpi?.size === size.value }"
            @click="changeKpiSize(size.value)"
            :aria-pressed="selectedKpi?.size === size.value"
          >
            <div class="size-preview" :class="`preview-${size.value}`">
              <i :class="selectedKpi?.icon" class="preview-icon"></i>
            </div>
            <div class="size-info">
              <div class="font-semibold">{{ size.label }}</div>
              <div class="text-sm text-600">{{ size.description }}</div>
            </div>
            <i v-if="selectedKpi?.size === size.value" class="pi pi-check text-primary"></i>
          </button>
        </div>
      </div>
      
      <template #footer>
        <Button label="Fermer" @click="showKpiSizeDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
// CACHE BUSTED: 2024-11-26-10:30
import { ref, computed, onMounted } from 'vue'
import KpiCard from './KpiCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  kpis: { type: Array, required: true, default: () => [] }, // FIX: Default array
  title: { type: String, default: 'Indicateurs Clés' },
  subtitle: { type: String, default: 'Vue d\'ensemble des KPI' },
  storageKey: { type: String, default: 'dashboard-kpi-config' }
})

const emit = defineEmits(['kpi-action', 'config-changed'])
const toast = useToast()

const editMode = ref(false)
const compareMode = ref(false)
const draggedItem = ref(null)
const kpiGridRef = ref(null)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const showKpiSizeDialog = ref(false)
const selectedKpi = ref(null)
const importConfigText = ref('')
const exportedConfig = ref('')

// Configuration utilisateur (ordre, visibilité, alertes, tailles)
const userConfig = ref({
  order: [],
  hidden: [],
  alerts: {},
  sizes: {}
})

// Options de taille pour les KPI
const kpiSizeOptions = [
  {
    value: 'compact',
    label: 'Compact',
    description: '1 colonne - Minimal',
    cols: 1
  },
  {
    value: 'small',
    label: 'Petit',
    description: '1 colonne - Avec graphique',
    cols: 1
  },
  {
    value: 'medium',
    label: 'Moyen',
    description: '2 colonnes - Standard',
    cols: 2
  },
  {
    value: 'large',
    label: 'Grand',
    description: '3 colonnes - Détaillé',
    cols: 3
  },
  {
    value: 'xlarge',
    label: 'Très Grand',
    description: '4 colonnes - Complet',
    cols: 4
  }
]

// KPI avec configuration utilisateur appliquée
const visibleKpis = computed(() => {
  // Vérifier que props.kpis existe et est un tableau
  if (!props.kpis || !Array.isArray(props.kpis)) {
    return []
  }
  
  let kpis = [...props.kpis]
  
  // Filtrer les KPI invalides (sans id)
  kpis = kpis.filter(kpi => kpi && kpi.id)
  
  // Appliquer l'ordre personnalisé
  if (userConfig.value.order.length > 0) {
    kpis.sort((a, b) => {
      const indexA = userConfig.value.order.indexOf(a.id)
      const indexB = userConfig.value.order.indexOf(b.id)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }
  
  // Appliquer config (cachés, alertes, tailles) avec protection
  kpis = kpis.map(kpi => {
    if (!kpi || !kpi.id) return null
    
    // Protection complète contre les données corrompues
    const hidden = Array.isArray(userConfig.value?.hidden) ? userConfig.value.hidden.includes(kpi.id) : false
    const alert = userConfig.value?.alerts ? userConfig.value.alerts[kpi.id] : undefined
    const size = (userConfig.value?.sizes && userConfig.value.sizes[kpi.id]) || kpi.size || 'medium'
    
    return {
      ...kpi,
      hidden,
      alert,
      size
    }
  }).filter(kpi => kpi !== null) // Filtrer les null
  
  // Filtrer les cachés si pas en mode édition
  if (!editMode.value) {
    kpis = kpis.filter(kpi => !kpi.hidden)
  }
  
  return kpis
})

// Drag & Drop
function onDragStart(event, kpi) {
  draggedItem.value = kpi
  event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggedItem.value = null
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onDrop(event, targetKpi) {
  event.preventDefault()
  if (!draggedItem.value || draggedItem.value.id === targetKpi.id) return
  
  const newOrder = visibleKpis.value.map(k => k.id)
  const draggedIndex = newOrder.indexOf(draggedItem.value.id)
  const targetIndex = newOrder.indexOf(targetKpi.id)
  
  // Réorganiser
  newOrder.splice(draggedIndex, 1)
  newOrder.splice(targetIndex, 0, draggedItem.value.id)
  
  userConfig.value.order = newOrder
  saveConfig()
}

function toggleEditMode() {
  editMode.value = !editMode.value
  if (!editMode.value) {
    saveConfig()
  }
}

function toggleCompare() {
  compareMode.value = !compareMode.value
  emit('config-changed', { compareMode: compareMode.value })
}

function toggleKpiVisibility(kpi) {
  const index = userConfig.value.hidden.indexOf(kpi.id)
  if (index > -1) {
    userConfig.value.hidden.splice(index, 1)
  } else {
    userConfig.value.hidden.push(kpi.id)
  }
  saveConfig()
}

// Gestion des alertes (peut être appelé depuis parent)
function setKpiAlert(kpiId, alert) {
  if (alert) {
    userConfig.value.alerts[kpiId] = alert
  } else {
    delete userConfig.value.alerts[kpiId]
  }
  saveConfig()
}

// Gestion de la taille des KPI
function showKpiSizeSelector(kpi) {
  selectedKpi.value = kpi
  showKpiSizeDialog.value = true
}

function changeKpiSize(size) {
  if (selectedKpi.value) {
    userConfig.value.sizes[selectedKpi.value.id] = size
    saveConfig()
    showKpiSizeDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Taille modifiée',
      detail: `KPI redimensionné en ${getKpiSizeLabel(size)}`,
      life: 2000
    })
  }
}

function getKpiSizeLabel(size) {
  const option = kpiSizeOptions.find(o => o.value === size)
  return option?.label || 'Moyen'
}

function getKpiSizeSeverity(size) {
  switch (size) {
    case 'compact': return 'secondary'
    case 'small': return 'info'
    case 'medium': return 'primary'
    case 'large': return 'success'
    case 'xlarge': return 'warning'
    default: return 'primary'
  }
}

// Export/Import
function exportConfig() {
  const config = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    kpis: visibleKpis.value.map(k => ({
      id: k.id,
      label: k.label
    })),
    order: userConfig.value.order,
    hidden: userConfig.value.hidden,
    alerts: userConfig.value.alerts
  }
  
  exportedConfig.value = JSON.stringify(config, null, 2)
  showExportDialog.value = true
}

function importConfig() {
  try {
    const config = JSON.parse(importConfigText.value)
    
    if (!config.order || !Array.isArray(config.order)) {
      throw new Error('Format invalide')
    }
    
    userConfig.value = {
      order: config.order || [],
      hidden: config.hidden || [],
      alerts: config.alerts || {}
    }
    
    saveConfig()
    showImportDialog.value = false
    importConfigText.value = ''
    
    toast.add({
      severity: 'success',
      summary: 'Configuration importée',
      detail: 'Votre configuration a été restaurée avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur d\'importation',
      detail: 'Le format de la configuration est invalide',
      life: 3000
    })
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(exportedConfig.value).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Copié!',
      detail: 'Configuration copiée dans le presse-papiers',
      life: 2000
    })
  })
}

// Sauvegarde/Chargement
function saveConfig() {
  localStorage.setItem(props.storageKey, JSON.stringify(userConfig.value))
  emit('config-changed', userConfig.value)
}

function loadConfig() {
  const saved = localStorage.getItem(props.storageKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      
      // Validation et fusion avec les valeurs par défaut
      userConfig.value = {
        order: Array.isArray(parsed?.order) ? parsed.order : [],
        hidden: Array.isArray(parsed?.hidden) ? parsed.hidden : [],
        alerts: (parsed?.alerts && typeof parsed.alerts === 'object') ? parsed.alerts : {},
        sizes: (parsed?.sizes && typeof parsed.sizes === 'object') ? parsed.sizes : {}
      }
    } catch (error) {
      console.error('Erreur chargement config KPI:', error)
      // Réinitialiser avec valeurs par défaut
      userConfig.value = {
        order: [],
        hidden: [],
        alerts: {},
        sizes: {}
      }
    }
  }
}

// Utilitaires comparaison
function getDifference(current, previous) {
  const diff = current - previous
  const percent = previous > 0 ? ((diff / previous) * 100).toFixed(1) : 0
  return `${diff > 0 ? '+' : ''}${diff.toLocaleString()} (${percent}%)`
}

function getDifferenceClass(current, previous) {
  const diff = current - previous
  if (diff > 0) return 'text-green-500 font-bold'
  if (diff < 0) return 'text-red-500 font-bold'
  return 'text-600'
}

// Exposer méthodes pour parent
defineExpose({
  setKpiAlert,
  resetConfig: () => {
    userConfig.value = { order: [], hidden: [], alerts: {} }
    saveConfig()
  }
})

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.dashboard-kpi-grid-container {
  width: 100%;
}

.kpi-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}
.kpi-grid-header>div:last-child{display:flex;gap:.5rem;flex-wrap:wrap}
.kpi-grid-header__actions{justify-content:flex-end}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(1rem, 1.5vw, 1.5rem);
  align-items: stretch;
}

.kpi-grid-item {
  position: relative;
  transition: transform 0.2s ease, opacity 0.2s ease;
  min-height: 11rem;
  display: flex;
  flex-direction: column;
  animation: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation décalée pour chaque KPI */
.kpi-grid-item:nth-child(1) { animation-delay: 0.05s; }
.kpi-grid-item:nth-child(2) { animation-delay: 0.1s; }
.kpi-grid-item:nth-child(3) { animation-delay: 0.15s; }
.kpi-grid-item:nth-child(4) { animation-delay: 0.2s; }
.kpi-grid-item:nth-child(5) { animation-delay: 0.25s; }
.kpi-grid-item:nth-child(6) { animation-delay: 0.3s; }
.kpi-grid-item:nth-child(7) { animation-delay: 0.35s; }
.kpi-grid-item:nth-child(8) { animation-delay: 0.4s; }

/* S'assurer que KpiCard prend toute la hauteur */
.kpi-grid-item :deep(.kpi-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Tailles des KPI */
.kpi-grid-item.size-compact {
  grid-column: span 3;
}

.kpi-grid-item.size-small {
  grid-column: span 3;
}

.kpi-grid-item.size-medium {
  grid-column: span 6;
}

.kpi-grid-item.size-large {
  grid-column: span 8;
}

.kpi-grid-item.size-xlarge {
  grid-column: span 12;
}

.kpi-grid-item.draggable {
  cursor: move;
}

.kpi-grid-item.draggable:hover {
  transform: translateY(-2px);
  z-index: 10;
}

.edit-mode .kpi-grid-item {
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
  padding: 0.5rem;
}

.kpi-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.control-header {
  display: flex;
  gap: 0.25rem;
  background: var(--surface-card);
  border-radius: 8px;
  padding: 0.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.size-tag {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.size-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.drag-handle {
  cursor: move;
}

.kpi-alert {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comparison-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Dialog tailles */
.size-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.size-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  cursor: pointer;
  width:100%;
  background:transparent;
  color:inherit;
  font:inherit;
  text-align:start;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.size-option:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.size-option.active {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.size-preview {
  width: 60px;
  height: 60px;
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-100);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.size-option.active .size-preview {
  border-color: var(--primary-color);
  background: var(--primary-100);
}

.size-preview.preview-compact {
  width: 35px;
  height: 35px;
}

.size-preview.preview-small {
  width: 45px;
  height: 45px;
}

.size-preview.preview-medium {
  width: 60px;
  height: 50px;
}

.size-preview.preview-large {
  width: 75px;
  height: 55px;
}

.size-preview.preview-xlarge {
  width: 90px;
  height: 60px;
}

.preview-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.size-info {
  flex: 1;
}

/* Responsive */
@media (max-width: 1400px) {
  .kpi-grid-item.size-compact,
  .kpi-grid-item.size-small {
    grid-column: span 4;
  }

  .kpi-grid-item.size-medium {
    grid-column: span 6;
  }

  .kpi-grid-item.size-large,
  .kpi-grid-item.size-xlarge {
    grid-column: span 12;
  }
}

@media (max-width: 1100px) {
  .kpi-grid-item.size-compact,
  .kpi-grid-item.size-small {
    grid-column: span 6;
  }

  .kpi-grid-item.size-medium {
    grid-column: span 12;
  }
}

@media (max-width: 768px) {
  .kpi-grid-header {
    flex-direction: column;
  }
  .kpi-grid-header>div,.kpi-grid-header>div:last-child{width:100%}.kpi-grid-header>div:last-child :deep(.p-button){flex:1 1 calc(50% - .5rem)}
  
  .kpi-grid-item.size-compact,
  .kpi-grid-item.size-small,
  .kpi-grid-item.size-medium,
  .kpi-grid-item.size-large,
  .kpi-grid-item.size-xlarge {
    grid-column: span 12;
  }

  .kpi-grid-header__actions { justify-content: flex-start; }
}
</style>
