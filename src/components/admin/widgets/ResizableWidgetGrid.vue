<template>
  <div class="resizable-widget-grid">
    <!-- Mode édition toggle -->
    <div v-if="editMode" class="edit-mode-banner mb-3">
      <Message severity="info" :closable="false">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-info-circle"></i>
          <span>Mode édition: Cliquez sur un widget pour changer sa taille (Petit, Moyen, Grand)</span>
        </div>
      </Message>
    </div>

    <!-- Grid de widgets -->
    <div class="widgets-container" :class="{ 'edit-mode': editMode }">
      <div
        v-for="widget in sortedWidgets"
        :key="widget.id"
        :data-widget-id="widget.id"
        class="widget-item"
        :class="[
          `size-${widget.size || 'medium'}`,
          { 'hidden': widget.hidden, 'editing': editMode }
        ]"
        :draggable="editMode"
        @dragstart="onDragStart($event, widget)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, widget)"
        @click="editMode && showSizeSelector(widget)"
        @keydown.enter="editMode && showSizeSelector(widget)"
        @keydown.space.prevent="editMode && showSizeSelector(widget)"
        :tabindex="editMode ? 0 : undefined"
        :role="editMode ? 'button' : undefined"
        :aria-label="editMode ? `Modifier la taille du widget ${widget.label}` : undefined"
      >
        <!-- Controls en mode édition -->
        <div v-if="editMode" class="widget-controls">
          <div class="control-header">
            <Button
              icon="pi pi-arrows-alt"
              class="p-button-rounded p-button-text p-button-sm drag-handle"
              severity="secondary"
              v-tooltip.top="'Glisser pour déplacer'"
            />
            <Button
              :icon="widget.hidden ? 'pi pi-eye-slash' : 'pi pi-eye'"
              @click.stop="toggleVisibility(widget)"
              class="p-button-rounded p-button-text p-button-sm"
              :severity="widget.hidden ? 'danger' : 'secondary'"
              v-tooltip.top="widget.hidden ? 'Afficher' : 'Masquer'"
            />
          </div>
          
          <!-- Size indicator -->
          <div class="size-indicator">
            <Tag 
              :value="getSizeLabel(widget.size)" 
              :severity="getSizeSeverity(widget.size)"
              @click.stop="showSizeSelector(widget)"
            />
          </div>
        </div>

        <!-- Contenu du widget -->
        <div class="widget-content" :class="{ 'dimmed': widget.hidden }">
          <slot :name="widget.id" :widget="widget" :size="widget.size || 'medium'">
            <!-- Fallback content -->
            <Card>
              <template #title>{{ widget.label }}</template>
              <template #content>
                <div class="text-center p-4">
                  <i :class="widget.icon" class="text-4xl text-primary mb-3"></i>
                  <div class="text-3xl font-bold">{{ widget.value || 0 }}</div>
                </div>
              </template>
            </Card>
          </slot>
        </div>
      </div>
    </div>

    <!-- Dialog pour changer la taille -->
    <Dialog
      v-model:visible="showSizeDialog"
      :header="`Taille: ${selectedWidget?.label}`"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Choisissez la taille du widget:</p>
        
        <div class="size-options">
          <button
            v-for="size in sizeOptions"
            :key="size.value"
            type="button"
            class="size-option"
            :class="{ 'active': selectedWidget?.size === size.value }"
            :aria-pressed="selectedWidget?.size === size.value"
            @click="changeWidgetSize(size.value)"
          >
            <div class="size-preview" :class="`preview-${size.value}`">
              <i :class="selectedWidget?.icon" class="preview-icon"></i>
            </div>
            <div class="size-info">
              <div class="font-semibold">{{ size.label }}</div>
              <div class="text-sm text-600">{{ size.description }}</div>
            </div>
            <i v-if="selectedWidget?.size === size.value" class="pi pi-check text-primary"></i>
          </button>
        </div>
      </div>
      
      <template #footer>
        <Button label="Fermer" @click="showSizeDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const props = defineProps({
  widgets: { type: Array, required: true },
  editMode: { type: Boolean, default: false },
  storageKey: { type: String, required: true }
})

const emit = defineEmits(['update:widgets', 'config-changed'])

const draggedWidget = ref(null)
const showSizeDialog = ref(false)
const selectedWidget = ref(null)

const sizeOptions = [
  {
    value: 'small',
    label: 'Petit',
    description: '1 colonne - Compact',
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
    description: '4 colonnes - Large',
    cols: 4
  }
]

// Configuration utilisateur
const userConfig = ref({
  order: [],
  sizes: {},
  hidden: []
})

// Charger config
function loadConfig() {
  const saved = localStorage.getItem(props.storageKey)
  if (saved) {
    try {
      userConfig.value = JSON.parse(saved)
    } catch (error) {
      console.error('Error loading widget config:', error)
    }
  }
}

// Sauvegarder config
function saveConfig() {
  localStorage.setItem(props.storageKey, JSON.stringify(userConfig.value))
  emit('config-changed', userConfig.value)
}

// Widgets triés avec config appliquée
const sortedWidgets = computed(() => {
  let widgets = [...props.widgets]
  
  // Appliquer tailles
  widgets = widgets.map(w => ({
    ...w,
    size: userConfig.value.sizes[w.id] || w.size || 'medium',
    hidden: userConfig.value.hidden.includes(w.id)
  }))
  
  // Appliquer ordre
  if (userConfig.value.order.length > 0) {
    widgets.sort((a, b) => {
      const indexA = userConfig.value.order.indexOf(a.id)
      const indexB = userConfig.value.order.indexOf(b.id)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }
  
  return widgets
})

// Drag & Drop
function onDragStart(event, widget) {
  draggedWidget.value = widget
  event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggedWidget.value = null
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onDrop(event, targetWidget) {
  event.preventDefault()
  if (!draggedWidget.value || draggedWidget.value.id === targetWidget.id) return
  
  const newOrder = sortedWidgets.value.map(w => w.id)
  const draggedIndex = newOrder.indexOf(draggedWidget.value.id)
  const targetIndex = newOrder.indexOf(targetWidget.id)
  
  newOrder.splice(draggedIndex, 1)
  newOrder.splice(targetIndex, 0, draggedWidget.value.id)
  
  userConfig.value.order = newOrder
  saveConfig()
}

// Visibilité
function toggleVisibility(widget) {
  const index = userConfig.value.hidden.indexOf(widget.id)
  if (index > -1) {
    userConfig.value.hidden.splice(index, 1)
  } else {
    userConfig.value.hidden.push(widget.id)
  }
  saveConfig()
}

// Taille
function showSizeSelector(widget) {
  selectedWidget.value = widget
  showSizeDialog.value = true
}

function changeWidgetSize(size) {
  if (selectedWidget.value) {
    userConfig.value.sizes[selectedWidget.value.id] = size
    saveConfig()
    showSizeDialog.value = false
  }
}

function getSizeLabel(size) {
  const option = sizeOptions.find(o => o.value === size)
  return option?.label || 'Moyen'
}

function getSizeSeverity(size) {
  switch (size) {
    case 'small': return 'info'
    case 'large': return 'success'
    default: return 'secondary'
  }
}

// Exposer méthodes
defineExpose({
  resetConfig: () => {
    userConfig.value = { order: [], sizes: {}, hidden: [] }
    saveConfig()
  }
})

// Init
loadConfig()
</script>

<style scoped>
.resizable-widget-grid {
  width: 100%;
}

.edit-mode-banner {
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

.widgets-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.widget-item {
  position: relative;
  transition: opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  min-height: 150px;
}

/* Tailles des widgets */
.widget-item.size-small {
  grid-column: span 1;
}

.widget-item.size-medium {
  grid-column: span 2;
}

.widget-item.size-large {
  grid-column: span 4;
}

/* Mode édition */
.widget-item.editing {
  cursor: move;
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
  padding: 0.5rem;
}

.widget-item.editing:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.widget-item.hidden {
  opacity: 0.4;
}

.widget-controls {
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

.size-indicator {
  cursor: pointer;
}

.widget-content {
  transition: opacity 0.3s ease;
  height: 100%;
}

.widget-content.dimmed {
  opacity: 0.5;
  pointer-events: none;
}

.drag-handle {
  cursor: move !important;
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
  color:inherit;
  background:transparent;
  font:inherit;
  text-align:left;
  transition: border-color 0.2s ease, background-color 0.2s ease;
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
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.size-option.active .size-preview {
  border-color: var(--primary-color);
  background: var(--primary-100);
}

.size-preview.preview-small {
  width: 40px;
  height: 40px;
}

.size-preview.preview-large {
  width: 80px;
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
@media (max-width: 1200px) {
  .widgets-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .widget-item.size-large {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .widgets-container {
    grid-template-columns: 1fr;
  }
  
  .widget-item.size-small,
  .widget-item.size-medium,
  .widget-item.size-large {
    grid-column: span 1;
  }
}
</style>
