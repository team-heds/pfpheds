<template>
  <div class="planning-admin-container">
    <Navbar />
    
    <!-- Header Card -->
    <Card class="header-card mb-4">
      <template #header>
        <Toolbar class="border-noround">
          <template #start>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-calendar-plus text-4xl text-primary"></i>
              <div>
                <h1 class="m-0 text-2xl font-bold">Administration Planning</h1>
                <p class="m-0 text-sm text-500">Gestion du planning académique</p>
              </div>
            </div>
          </template>
          
          <template #end>
            <div class="flex gap-2 flex-wrap">
              <Button 
                label="Initialiser"
                icon="pi pi-database" 
                @click="initializePlanning" 
                severity="warning"
                v-tooltip="'Créer la structure par défaut'"
              />
              
              <Button 
                label="Migrer N° Modules"
                icon="pi pi-sync" 
                @click="migrateModuleNumbers" 
                severity="info"
                v-tooltip="'Ajouter les numéros de module aux codes existants'"
              />
              
              <SplitButton 
                label="Exporter JSON" 
                icon="pi pi-download" 
                @click="exportPlanning" 
                :model="exportOptions"
                severity="success"
              />
              
              <Button 
                label="Voir Planning" 
                icon="pi pi-eye" 
                @click="goToView" 
                severity="secondary"
              />
            </div>
          </template>
        </Toolbar>
      </template>
    </Card>

    <!-- Contrôles -->
    <Card class="mb-4">
      <template #content>
        <div class="grid">
          <div class="col-12 md:col-4">
            <div class="field">
              <label class="block text-900 font-semibold mb-2">
                <i class="pi pi-calendar mr-2"></i>Année académique
              </label>
              <Dropdown 
                v-model="selectedYear" 
                :options="yearOptions" 
                optionLabel="label" 
                optionValue="value"
                @change="loadPlanning"
                class="w-full"
                placeholder="Sélectionner l'année"
              />
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label class="block text-900 font-semibold mb-2">
                <i class="pi pi-pencil mr-2"></i>Mode d'édition
              </label>
              <SelectButton 
                v-model="editMode" 
                :options="editModeOptions" 
                optionLabel="label" 
                optionValue="value"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Grid d'édition -->
    <Panel :toggleable="true" class="mb-4">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-calendar-plus text-primary text-xl"></i>
          <span class="font-bold text-xl">Planning Académique Complet</span>
          <Tag value="Automne: S38-52 & S1-7 | Printemps: S8-37" severity="info" class="ml-2"></Tag>
          <Tag 
            v-if="editMode === 'multiple' && selectedCells.length > 0"
            :value="`${selectedCells.length} cellule(s) sélectionnée(s)`"
            severity="info"
            class="ml-2"
          ></Tag>
        </div>
      </template>
      <template #icons>
        <Button 
          v-if="editMode === 'multiple' && selectedCells.length > 0"
          label="Éditer la sélection"
          icon="pi pi-pencil"
          @click="editSelectedCells"
          severity="primary"
          size="small"
          class="mr-2"
        />
        <Button
          v-if="editMode === 'multiple' && selectedCells.length > 0"
          label="Effacer sélection"
          icon="pi pi-times"
          @click="selectedCells = []"
          severity="secondary"
          size="small"
        />
      </template>
      
      <div class="planning-grid editable">
        <!-- Header -->
        <div class="grid-header">
          <div class="week-label-corner">
            <i class="pi pi-calendar text-500"></i>
          </div>
          <div 
            v-for="week in currentWeeks" 
            :key="`w${week}`" 
            class="week-header"
            :class="{ 'autumn-week': week >= 38 || week <= 7, 'spring-week': week >= 8 && week <= 37 }"
          >
            <span class="week-number">S{{ week }}</span>
          </div>
        </div>

        <!-- Lignes -->
        <div 
          v-for="day in days" 
          :key="day" 
          class="grid-row"
        >
          <div class="day-label">{{ dayLabels[day] }}</div>
          
          <div 
            v-for="week in currentWeeks" 
            :key="`${day}-${week}`" 
            class="grid-cell editable-cell"
            :style="getCellStyle(day, week)"
            :class="{ selected: isCellSelected(day, week), 'autumn-cell': week >= 38 || week <= 7, 'spring-cell': week >= 8 && week <= 37 }"
            @click="handleCellClick(day, week)"
            :title="getCellTooltip(day, week)"
          >
            <span v-if="getCellLabel(day, week)" class="cell-label">
              {{ getCellLabel(day, week) }}
            </span>
          </div>
        </div>
      </div>
    </Panel>

    <!-- Panel d'édition de cellule -->
    <Dialog 
      v-model:visible="showCellEditor" 
      header="Éditer la cellule" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="cell-editor-form">
        <div class="form-field">
          <label>Code de cours :</label>
          <Dropdown 
            v-model="editingCell.courseCode" 
            :options="courseCodeOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Sélectionner un code"
            showClear
          />
        </div>

        <div class="form-field">
          <label>Label d'affichage (optionnel) :</label>
          <InputText 
            v-model="editingCell.displayLabel" 
            placeholder="Ex: PFP1, IA1, etc."
          />
        </div>

        <div class="form-field">
          <label>Notes (optionnelles) :</label>
          <Textarea 
            v-model="editingCell.notes" 
            rows="3"
            placeholder="Notes sur ce cours..."
          />
        </div>

        <div class="preview-cell" :style="getPreviewStyle()">
          <span v-if="editingCell.displayLabel || editingCell.courseCode">
            {{ editingCell.displayLabel || editingCell.courseCode?.toUpperCase() }}
          </span>
        </div>
      </div>

      <template #footer>
        <Button 
          label="Supprimer" 
          icon="pi pi-trash" 
          @click="deleteCell" 
          class="p-button-danger"
        />
        <Button 
          label="Annuler" 
          icon="pi pi-times" 
          @click="showCellEditor = false" 
          class="p-button-text"
        />
        <Button 
          label="Enregistrer" 
          icon="pi pi-check" 
          @click="saveCell" 
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Gestion des codes de cours -->
    <Panel :toggleable="true">
      <template #header>
        <div class="flex align-items-center justify-content-between w-full pr-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-palette text-pink-500 text-xl"></i>
            <span class="font-bold text-xl">Gestion des Codes de Cours</span>
            <Tag 
              :value="courseCodeSearch ? `${filteredCourseCodesArray.length} / ${courseCodesArray.length} codes` : `${courseCodesArray.length} codes`" 
              class="ml-2"
            ></Tag>
          </div>
          <Button 
            label="Nouveau Code" 
            icon="pi pi-plus" 
            @click="showCourseCodeDialog = true"
            size="small"
            severity="success"
          />
        </div>
      </template>

      <!-- Barre de recherche -->
      <div class="mb-4">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText 
            v-model="courseCodeSearch" 
            placeholder="Rechercher un code ou une description..."
            class="w-full"
          />
        </span>
      </div>

      <DataTable 
        :value="filteredCourseCodesArray" 
        :paginator="true" 
        :rows="10"
        stripedRows
        :rowsPerPageOptions="[5, 10, 20, 50]"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column field="id" header="Code" sortable style="width: 8rem">
          <template #body="slotProps">
            <Tag :value="slotProps.data.id.toUpperCase()" severity="info"></Tag>
          </template>
        </Column>
        <Column field="moduleNumber" header="N° Module" sortable style="width: 9rem">
          <template #body="slotProps">
            <span v-if="slotProps.data.moduleNumber" class="font-bold text-primary">
              {{ slotProps.data.moduleNumber }}
            </span>
            <span v-else class="text-500">-</span>
          </template>
        </Column>
        <Column field="label" header="Description" sortable></Column>
        <Column field="color" header="Couleur" style="width: 10rem">
          <template #body="slotProps">
            <div class="flex align-items-center gap-2">
              <div 
                class="color-preview-badge" 
                :style="{ backgroundColor: slotProps.data.color }"
              ></div>
              <span class="text-sm text-600">{{ slotProps.data.color }}</span>
            </div>
          </template>
        </Column>
        <Column field="year" header="Année" sortable style="width: 8rem">
          <template #body="slotProps">
            <Tag v-if="slotProps.data.year" :value="`Année ${slotProps.data.year}`"></Tag>
            <span v-else class="text-500">-</span>
          </template>
        </Column>
        <Column header="Actions" style="width: 10rem">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-pencil" 
                severity="info"
                text
                rounded
                @click="editCourseCode(slotProps.data)"
                v-tooltip="'Éditer'"
              />
              <Button 
                icon="pi pi-trash" 
                severity="danger"
                text
                rounded
                @click="deleteCourseCode(slotProps.data.id)"
                v-tooltip="'Supprimer'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </Panel>

    <!-- Dialog pour ajouter/éditer un code de cours -->
    <Dialog 
      v-model:visible="showCourseCodeDialog" 
      :header="editingCourseCode ? 'Éditer le Code' : 'Nouveau Code de Cours'" 
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="course-code-form">
        <div class="form-field">
          <label>Code (ID unique) :</label>
          <InputText 
            v-model="courseCodeForm.id" 
            placeholder="Ex: pfp1, ia1a, ..."
            :disabled="editingCourseCode !== null"
          />
        </div>

        <div class="form-field">
          <label>Numéro de module :</label>
          <InputText 
            v-model="courseCodeForm.moduleNumber" 
            placeholder="Ex: 3014, PFP1, ..."
          />
        </div>

        <div class="form-field">
          <label>Description :</label>
          <InputText 
            v-model="courseCodeForm.label" 
            placeholder="Description du cours"
          />
        </div>

        <div class="form-field">
          <label>Couleur :</label>
          <ColorPicker v-model="courseCodeForm.color" />
          <InputText 
            v-model="courseCodeForm.color" 
            placeholder="#RRGGBB"
            style="margin-top: 0.5rem;"
          />
        </div>

        <div class="form-field">
          <label>Année :</label>
          <Dropdown 
            v-model="courseCodeForm.year" 
            :options="[1, 2, 3]" 
            placeholder="Sélectionner l'année"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Annuler" 
          icon="pi pi-times" 
          @click="showCourseCodeDialog = false" 
          class="p-button-text"
        />
        <Button 
          label="Enregistrer" 
          icon="pi pi-check" 
          @click="saveCourseCode" 
          class="p-button-success"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import SplitButton from 'primevue/splitbutton'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ColorPicker from 'primevue/colorpicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toast from 'primevue/toast'
import academicPlanningService from '@/service/academicPlanningService'

const router = useRouter()
const toast = useToast()

// State
const selectedYear = ref('bac25')
const editMode = ref('single')
const yearData = ref(null)
const courseCodes = ref({})
const planningCells = ref({})
const showCellEditor = ref(false)
const selectedCells = ref([])
const editingCell = ref({
  day: null,
  week: null,
  courseCode: null,
  displayLabel: '',
  notes: ''
})

// Codes de cours
const courseCodeSearch = ref('')
const showCourseCodeDialog = ref(false)
const editingCourseCode = ref(null)
const courseCodeForm = ref({
  id: '',
  moduleNumber: '',
  label: '',
  color: '#CCCCCC',
  year: 1
})

// Options
const yearOptions = ref([
  { label: '1ère année 2025-2026 / Bac 25', value: 'bac25' },
  { label: '2ème année 2025-2026 / Bac 24', value: 'bac24' },
  { label: '3ème année 2025-2026 / Bac 23', value: 'bac23' }
])

const editModeOptions = ref([
  { label: "Cellule unique", value: 'single' },
  { label: "Sélection multiple", value: 'multiple' }
])

// Options d'export
const exportOptions = ref([
  {
    label: 'Exporter Excel',
    icon: 'pi pi-file-excel',
    command: () => exportPlanningExcel()
  }
])

const days = ['lu', 'ma', 'me', 'je', 've']
const dayLabels = {
  lu: 'Lun',
  ma: 'Mar',
  me: 'Mer',
  je: 'Jeu',
  ve: 'Ven'
}

// Computed
const currentWeeks = computed(() => {
  return academicPlanningService.generateAllWeeks()
})

// Déterminer le semestre d'une semaine
const getSemesterForWeek = (week) => {
  // Automne : S38-S52 + S1-S7
  // Printemps : S8-S37
  return (week >= 38 || week <= 7) ? 'autumn' : 'spring'
}

const courseCodeOptions = computed(() => {
  return Object.entries(courseCodes.value).map(([id, data]) => ({
    label: `${id.toUpperCase()} - ${data.label}`,
    value: id
  }))
})

const courseCodesArray = computed(() => {
  return Object.entries(courseCodes.value).map(([id, data]) => ({
    id,
    ...data
  }))
})

const filteredCourseCodesArray = computed(() => {
  let filtered = courseCodesArray.value
  
  // Appliquer la recherche si nécessaire
  if (courseCodeSearch.value) {
    const searchTerm = courseCodeSearch.value.toLowerCase()
    filtered = filtered.filter(code => 
      code.id.toLowerCase().includes(searchTerm) ||
      code.label.toLowerCase().includes(searchTerm) ||
      code.color.toLowerCase().includes(searchTerm) ||
      (code.moduleNumber && code.moduleNumber.toLowerCase().includes(searchTerm))
    )
  }
  
  // Trier par année puis par numéro de module
  return filtered.sort((a, b) => {
    // D'abord par année
    const yearA = a.year || 99
    const yearB = b.year || 99
    if (yearA !== yearB) {
      return yearA - yearB
    }
    
    // Puis par numéro de module
    if (a.moduleNumber && b.moduleNumber) {
      return a.moduleNumber.localeCompare(b.moduleNumber, undefined, { numeric: true })
    }
    
    // Sinon par label
    return a.label.localeCompare(b.label)
  })
})

// Fonctions
const loadPlanning = async () => {
  try {
    yearData.value = await academicPlanningService.getAcademicYear(selectedYear.value)
    courseCodes.value = await academicPlanningService.getAllCourseCodes()
    
    // Charger les cellules des deux semestres
    const autumnCells = await academicPlanningService.getPlanningCells(selectedYear.value, 'autumn')
    const springCells = await academicPlanningService.getPlanningCells(selectedYear.value, 'spring')
    
    // Fusionner les cellules
    planningCells.value = {
      ...(autumnCells || {}),
      ...(springCells || {})
    }
    
    console.log('[PlanningAdmin] Planning chargé')
  } catch (error) {
    console.error('[PlanningAdmin] Erreur chargement:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le planning',
      life: 3000
    })
  }
}

const handleCellClick = (day, week) => {
  if (editMode.value === 'single') {
    openCellEditor(day, week)
  } else {
    toggleCellSelection(day, week)
  }
}

const openCellEditor = (day, week) => {
  const cellKey = `${day}_${week}`
  const existingCell = planningCells.value[cellKey] || {}
  
  editingCell.value = {
    day,
    week,
    courseCode: existingCell.courseCode || null,
    displayLabel: existingCell.displayLabel || '',
    notes: existingCell.notes || ''
  }
  
  showCellEditor.value = true
}

const saveCell = async () => {
  try {
    if (!editingCell.value.courseCode) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez sélectionner un code de cours',
        life: 3000
      })
      return
    }

    // Si mode multiple et des cellules sont sélectionnées
    if (editMode.value === 'multiple' && selectedCells.value.length > 0) {
      const cellCount = selectedCells.value.length
      for (const cellKey of selectedCells.value) {
        const [day, week] = cellKey.split('_')
        const semester = getSemesterForWeek(parseInt(week))
        await academicPlanningService.savePlanningCell(
          selectedYear.value,
          semester,
          day,
          parseInt(week),
          {
            courseCode: editingCell.value.courseCode,
            displayLabel: editingCell.value.displayLabel,
            notes: editingCell.value.notes
          }
        )
      }
      
      selectedCells.value = []
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: `${cellCount} cellule(s) sauvegardée(s)`,
        life: 3000
      })
    } else {
      // Mode single
      const semester = getSemesterForWeek(editingCell.value.week)
      await academicPlanningService.savePlanningCell(
        selectedYear.value,
        semester,
        editingCell.value.day,
        editingCell.value.week,
        {
          courseCode: editingCell.value.courseCode,
          displayLabel: editingCell.value.displayLabel,
          notes: editingCell.value.notes
        }
      )
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Cellule sauvegardée',
        life: 3000
      })
    }

    showCellEditor.value = false
    await loadPlanning()
  } catch (error) {
    console.error('[PlanningAdmin] Erreur saveCell:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder la cellule',
      life: 3000
    })
  }
}

const deleteCell = async () => {
  try {
    const semester = getSemesterForWeek(editingCell.value.week)
    await academicPlanningService.deletePlanningCell(
      selectedYear.value,
      semester,
      editingCell.value.day,
      editingCell.value.week
    )

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Cellule supprimée',
      life: 3000
    })

    showCellEditor.value = false
    await loadPlanning()
  } catch (error) {
    console.error('[PlanningAdmin] Erreur deleteCell:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer la cellule',
      life: 3000
    })
  }
}

const getCellStyle = (day, week) => {
  const cellKey = `${day}_${week}`
  const cell = planningCells.value[cellKey]
  
  if (!cell || !cell.courseCode) {
    return { backgroundColor: '#ffffff' }
  }
  
  const courseCode = courseCodes.value[cell.courseCode]
  return {
    backgroundColor: courseCode?.color || '#CCCCCC',
    color: isLightColor(courseCode?.color) ? '#000000' : '#ffffff'
  }
}

const getCellLabel = (day, week) => {
  const cellKey = `${day}_${week}`
  const cell = planningCells.value[cellKey]
  
  if (!cell || !cell.courseCode) return ''
  
  // Si un label personnalisé est défini, l'utiliser
  if (cell.displayLabel) {
    return cell.displayLabel
  }
  
  // Sinon, afficher le numéro de module avec le nom court
  const courseCode = courseCodes.value[cell.courseCode]
  if (courseCode && courseCode.moduleNumber) {
    return `${courseCode.moduleNumber}\n${courseCode.label}`
  }
  
  return cell.courseCode?.toUpperCase() || ''
}

const getCellTooltip = (day, week) => {
  const cellKey = `${day}_${week}`
  const cell = planningCells.value[cellKey]
  
  if (!cell || !cell.courseCode) return 'Cliquer pour éditer'
  
  const courseCode = courseCodes.value[cell.courseCode]
  return courseCode?.label || cell.courseCode
}

const getPreviewStyle = () => {
  if (!editingCell.value.courseCode) {
    return { backgroundColor: '#ffffff' }
  }
  
  const courseCode = courseCodes.value[editingCell.value.courseCode]
  return {
    backgroundColor: courseCode?.color || '#CCCCCC',
    color: isLightColor(courseCode?.color) ? '#000000' : '#ffffff'
  }
}

const isLightColor = (hexColor) => {
  if (!hexColor) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

const toggleCellSelection = (day, week) => {
  const cellKey = `${day}_${week}`
  const index = selectedCells.value.indexOf(cellKey)
  
  if (index > -1) {
    selectedCells.value.splice(index, 1)
  } else {
    selectedCells.value.push(cellKey)
  }
}

const isCellSelected = (day, week) => {
  const cellKey = `${day}_${week}`
  return selectedCells.value.includes(cellKey)
}

// Gestion des codes de cours
const editCourseCode = (code) => {
  editingCourseCode.value = code.id
  courseCodeForm.value = { ...code }
  showCourseCodeDialog.value = true
}

const saveCourseCode = async () => {
  try {
    if (!courseCodeForm.value.id || !courseCodeForm.value.label) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      })
      return
    }

    await academicPlanningService.saveCourseCode(
      courseCodeForm.value.id,
      {
        moduleNumber: courseCodeForm.value.moduleNumber,
        label: courseCodeForm.value.label,
        color: courseCodeForm.value.color,
        year: courseCodeForm.value.year
      }
    )

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Code de cours sauvegardé',
      life: 3000
    })

    showCourseCodeDialog.value = false
    editingCourseCode.value = null
    courseCodeForm.value = { id: '', moduleNumber: '', label: '', color: '#CCCCCC', year: 1 }
    await loadPlanning()
  } catch (error) {
    console.error('[PlanningAdmin] Erreur saveCourseCode:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le code',
      life: 3000
    })
  }
}

const deleteCourseCode = async (codeId) => {
  try {
    if (confirm(`Supprimer le code "${codeId}" ?`)) {
      await academicPlanningService.deleteCourseCode(codeId)
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Code supprimé',
        life: 3000
      })
      
      await loadPlanning()
    }
  } catch (error) {
    console.error('[PlanningAdmin] Erreur deleteCourseCode:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le code',
      life: 3000
    })
  }
}

const initializePlanning = async () => {
  try {
    if (confirm('Initialiser le planning avec les données par défaut ?')) {
      await academicPlanningService.initializeDefaultPlanning()
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Planning initialisé',
        life: 3000
      })
      
      await loadPlanning()
    }
  } catch (error) {
    console.error('[PlanningAdmin] Erreur initializePlanning:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'initialiser le planning',
      life: 3000
    })
  }
}

const migrateModuleNumbers = async () => {
  try {
    if (confirm('Ajouter les numéros de module aux codes existants ?\n\nCela ne supprimera pas vos codes, mais ajoutera juste les numéros de module.')) {
      await academicPlanningService.migrateModuleNumbers()
      
      toast.add({
        severity: 'success',
        summary: 'Migration réussie',
        detail: 'Les numéros de module ont été ajoutés',
        life: 3000
      })
      
      await loadPlanning()
    }
  } catch (error) {
    console.error('[PlanningAdmin] Erreur migrateModuleNumbers:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de migrer les numéros de module',
      life: 3000
    })
  }
}

const exportPlanning = async () => {
  try {
    const jsonData = await academicPlanningService.exportPlanningToJSON(selectedYear.value)
    
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `planning_${selectedYear.value}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Planning exporté',
      life: 3000
    })
  } catch (error) {
    console.error('[PlanningAdmin] Erreur exportPlanning:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter le planning',
      life: 3000
    })
  }
}

const exportPlanningExcel = async () => {
  try {
    const blob = await academicPlanningService.exportPlanningToExcel(selectedYear.value)
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `planning_${selectedYear.value}_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: 'Planning exporté en Excel avec couleurs',
      life: 3000
    })
  } catch (error) {
    console.error('[PlanningAdmin] Erreur exportPlanningExcel:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter en Excel',
      life: 3000
    })
  }
}

const editSelectedCells = () => {
  if (selectedCells.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune sélection',
      detail: 'Veuillez sélectionner au moins une cellule',
      life: 3000
    })
    return
  }
  
  editingCell.value = {
    day: null,
    week: null,
    courseCode: null,
    displayLabel: '',
    notes: ''
  }
  showCellEditor.value = true
}

const goToView = () => {
  router.push('/admin/planning-view')
}

onMounted(async () => {
  await loadPlanning()
})
</script>

<style scoped>
.planning-admin-container {
  padding: 1.5rem;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 1.5rem;
}

.planning-grid {
  overflow-x: auto;
  border: 1px solid #ddd;
}

.grid-header {
  display: flex;
  background: #34495e;
  color: white;
  font-weight: bold;
}

.week-label-corner {
  min-width: 60px;
  width: 60px;
  border-right: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.week-header {
  min-width: 50px;
  width: 50px;
  text-align: center;
  padding: 0.75rem 0;
  border-right: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-number {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Différenciation visuelle automne/printemps */
.autumn-week {
  background: #f97316 !important;
}

.spring-week {
  background: #06b6d4 !important;
}

.grid-row {
  display: flex;
  border-bottom: 1px solid #ddd;
}

.day-label {
  min-width: 60px;
  width: 60px;
  background: #ecf0f1;
  font-weight: bold;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #ddd;
  font-size: 0.9rem;
}

.grid-cell {
  min-width: 50px;
  width: 50px;
  min-height: 50px;
  border-right: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.grid-cell:hover {
  transform: scale(1.08);
  z-index: 10;
  box-shadow: var(--card-shadow);
}

.grid-cell.selected {
  box-shadow: inset 0 0 0 3px var(--primary-color);
  z-index: 5;
}

.cell-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  padding: 0.25rem;
  word-break: break-word;
  width: 100%;
  white-space: pre-line;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.color-preview-badge {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius);
  border: 2px solid var(--surface-border);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 992px) {
  .planning-admin-container {
    padding: 1rem;
  }
  
  .grid-cell, .week-header {
    min-width: 40px;
    width: 40px;
  }
  
  .day-label {
    min-width: 50px;
    width: 50px;
  }
}

@media (max-width: 768px) {
  .planning-admin-container {
    padding: 0.75rem;
  }
  
  .grid-cell, .week-header {
    min-width: 35px;
    width: 35px;
    min-height: 40px;
  }
  
  .cell-label {
    font-size: 0.6rem;
  }
}

@media (max-width: 576px) {
  .planning-admin-container {
    padding: 0.5rem;
  }
  
  .grid-cell, .week-header {
    min-width: 30px;
    width: 30px;
    min-height: 35px;
  }
  
  .day-label {
    min-width: 40px;
    width: 40px;
    font-size: 0.8rem;
  }
  
  .cell-label {
    font-size: 0.5rem;
  }
}
</style>
