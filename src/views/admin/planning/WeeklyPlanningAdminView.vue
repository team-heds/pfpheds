<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="weekly-planning-admin">
      <!-- Header -->
      <Card>
        <template #content>
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 class="text-3xl font-bold text-primary m-0">📅 Planification Hebdomadaire Détaillée</h1>
              <p class="text-600 mt-2">Gestion des horaires, enseignants et activités par semaine</p>
            </div>
            
            <div class="flex gap-2">
              <Button 
                label="Retour au Planning Annuel"
                icon="pi pi-arrow-left"
                @click="goToAnnualPlanning"
                outlined
              />
              <Button 
                label="Voir Planning Public"
                icon="pi pi-eye"
                @click="goToPublicView"
                severity="info"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Sélection de la semaine -->
      <Card>
        <template #content>
          <div class="flex gap-3 align-items-end flex-wrap">
            <div class="flex-1">
              <label class="block mb-2 font-bold">Année académique :</label>
              <Dropdown 
                v-model="selectedYear"
                :options="yearOptions"
                optionLabel="label"
                optionValue="value"
                @change="loadWeekPlanning"
                class="w-full"
              />
            </div>
            
            <div class="flex-1">
              <label class="block mb-2 font-bold">Semaine :</label>
              <Dropdown 
                v-model="selectedWeek"
                :options="weekOptions"
                optionLabel="label"
                optionValue="value"
                @change="loadWeekPlanning"
                filter
                class="w-full"
              />
            </div>
            
            <Button 
              label="Générer depuis Minibrick"
              icon="pi pi-sync"
              @click="generateFromMinibrick"
              severity="warning"
              v-tooltip="'Créer automatiquement les créneaux depuis le planning annuel'"
            />
            
            <Button 
              label="Dupliquer Semaine"
              icon="pi pi-copy"
              @click="showDuplicateDialog = true"
              v-tooltip="'Dupliquer une semaine existante'"
            />
            
            <Button 
              label="Exporter Excel"
              icon="pi pi-file-excel"
              @click="exportToExcel"
              severity="success"
              v-tooltip="'Exporter le planning de la semaine en Excel'"
            />
          </div>
        </template>
      </Card>

      <!-- Planning de la semaine -->
      <Card v-if="selectedWeek">
        <template #header>
          <div class="flex justify-content-between align-items-center p-3">
            <div>
              <h2 class="text-2xl font-bold m-0">Semaine {{ selectedWeek }}</h2>
              <p class="text-600 mt-1">{{ getSemesterLabel(selectedWeek) }}</p>
            </div>
            <Button 
              label="Ajouter un créneau"
              icon="pi pi-plus"
              @click="openSlotDialog()"
              severity="success"
            />
          </div>
        </template>
        
        <template #content>
          <DataTable 
            :value="sortedTimeSlots"
            :rows="20"
            responsiveLayout="scroll"
            class="p-datatable-sm weekly-planning-table"
            :rowClass="getRowClass"
            rowGroupMode="subheader"
            groupRowsBy="day"
            :expandableRowGroups="true"
            v-model:expandedRowGroups="expandedDays"
          >
            <template #groupheader="slotProps">
              <div class="day-group-header">
                <div class="day-info">
                  <Tag 
                    :value="slotProps.data.day.toUpperCase()" 
                    :severity="getDaySeverity(slotProps.data.day)"
                    class="font-bold text-lg"
                  ></Tag>
                  <span v-if="getDayDate(slotProps.data.day)" class="date-text">
                    {{ getDayDate(slotProps.data.day) }}
                  </span>
                </div>
                <div class="module-info" v-if="getDayMainModule(slotProps.data.day)">
                  <div 
                    class="module-badge-header"
                    :style="{ backgroundColor: getDayMainModule(slotProps.data.day)?.color || '#CCCCCC' }"
                  >
                    <span class="module-number-header">{{ getDayMainModule(slotProps.data.day)?.number }}</span>
                    <span class="module-name-header">{{ getDayMainModule(slotProps.data.day)?.title }}</span>
                  </div>
                </div>
                <div class="slots-count">
                  <i class="pi pi-clock mr-2"></i>
                  <span>{{ getDaySlotCount(slotProps.data.day) }} créneau(x)</span>
                </div>
              </div>
            </template>
            
            <Column field="day" header="Jour" style="display: none;"></Column>
            
            <Column field="startTime" header="Horaire" style="width: 10rem">
              <template #body="slotProps">
                <div class="horaire-cell">
                  <i class="pi pi-clock text-primary mr-2"></i>
                  <span class="font-bold">{{ slotProps.data.startTime }}</span>
                  <span class="mx-1">-</span>
                  <span class="font-bold">{{ slotProps.data.endTime }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="courseTitle" header="Nom du cours" style="min-width: 20rem">
              <template #body="slotProps">
                <div 
                  v-if="slotProps.data.moduleCode"
                  class="module-cell"
                  :style="{ 
                    backgroundColor: getModuleColor(slotProps.data.moduleCode),
                    borderLeft: `4px solid ${darkenColor(getModuleColor(slotProps.data.moduleCode))}`
                  }"
                >
                  <div class="course-title-text">{{ slotProps.data.courseTitle || slotProps.data.activity || slotProps.data.moduleTitle }}</div>
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="activity" header="Détails / Activité" style="min-width: 15rem">
              <template #body="slotProps">
                <div class="activity-cell">
                  <i v-if="slotProps.data.activity" class="pi pi-book text-primary mr-2"></i>
                  <span class="text-sm">{{ slotProps.data.activity || '-' }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="teachers" header="Enseignants / Groupes" style="min-width: 15rem">
              <template #body="slotProps">
                <div v-if="slotProps.data.teachers && slotProps.data.teachers.length > 0" class="teachers-cell">
                  <div v-for="(teacher, index) in slotProps.data.teachers" :key="index" class="teacher-group">
                    <Chip 
                      :label="teacher" 
                      icon="pi pi-user"
                      class="teacher-chip"
                    />
                  </div>
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="room" header="Salle" style="width: 8rem">
              <template #body="slotProps">
                <div v-if="slotProps.data.room" class="room-cell">
                  <i class="pi pi-home text-primary mr-1"></i>
                  <span class="font-semibold">{{ slotProps.data.room }}</span>
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="moduleNumber" header="N° Module" :frozen="true" alignFrozen="right" style="width: 7rem">
              <template #body="slotProps">
                <div 
                  v-if="slotProps.data.moduleNumber"
                  class="module-number-badge"
                  :style="{ backgroundColor: getModuleColor(slotProps.data.moduleCode) }"
                >
                  {{ slotProps.data.moduleNumber }}
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column header="Actions" :frozen="true" alignFrozen="right" style="width: 8rem">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-pencil"
                    @click="openSlotDialog(slotProps.data)"
                    size="small"
                    severity="info"
                    text
                    v-tooltip="'Modifier'"
                  />
                  <Button 
                    icon="pi pi-copy"
                    @click="duplicateSlot(slotProps.data)"
                    size="small"
                    severity="success"
                    text
                    v-tooltip="'Dupliquer'"
                  />
                  <Button 
                    icon="pi pi-trash"
                    @click="deleteSlot(slotProps.data.id)"
                    size="small"
                    severity="danger"
                    text
                    v-tooltip="'Supprimer'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Dialog pour éditer un créneau -->
      <Dialog 
        v-model:visible="showSlotDialog"
        :header="editingSlot ? 'Modifier le créneau' : 'Ajouter un créneau'"
        :style="{ width: '50rem' }"
        :modal="true"
      >
        <div class="grid gap-3">
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Jour :</label>
            <Dropdown 
              v-model="slotForm.day"
              :options="['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']"
              placeholder="Sélectionner un jour"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Date :</label>
            <InputText 
              v-model="slotForm.date"
              placeholder="Ex: 16.02.2026"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Heure de début :</label>
            <InputText 
              v-model="slotForm.startTime"
              placeholder="Ex: 09h00"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Heure de fin :</label>
            <InputText 
              v-model="slotForm.endTime"
              placeholder="Ex: 11h00"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Module :</label>
            <Dropdown 
              v-model="slotForm.moduleCode"
              :options="moduleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner un module"
              filter
              class="w-full"
              @change="onModuleChange"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Titre du module :</label>
            <InputText 
              v-model="slotForm.moduleTitle"
              placeholder="Ex: M1012 - Raisonnement clinique 1b"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Nom du cours (affiché dans le planning) :</label>
            <Textarea 
              v-model="slotForm.courseTitle"
              placeholder="Ex: Introduction Module: questions-réponses en lien avec la vidéo et le guide du module"
              :rows="2"
              class="w-full"
            />
            <small class="text-500">Ce texte apparaîtra dans la colonne principale du planning</small>
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Détails / Activité complémentaire :</label>
            <Textarea 
              v-model="slotForm.activity"
              placeholder="Détails supplémentaires ou notes"
              :rows="2"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Enseignants :</label>
            <Chips 
              v-model="slotForm.teachers"
              placeholder="Ajouter un enseignant (Entrée pour valider)"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Salle :</label>
            <InputText 
              v-model="slotForm.room"
              placeholder="Numéro de salle"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Notes :</label>
            <InputText 
              v-model="slotForm.notes"
              placeholder="Notes additionnelles"
              class="w-full"
            />
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" @click="showSlotDialog = false" text />
          <Button label="Enregistrer" @click="saveSlot" />
        </template>
      </Dialog>

      <!-- Dialog pour dupliquer une semaine -->
      <Dialog 
        v-model:visible="showDuplicateDialog"
        header="Dupliquer une semaine"
        :style="{ width: '30rem' }"
        :modal="true"
      >
        <div class="grid gap-3">
          <div class="col-12">
            <label class="block mb-2 font-bold">Semaine source :</label>
            <Dropdown 
              v-model="duplicateFrom"
              :options="weekOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner la semaine à dupliquer"
              filter
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Semaine destination :</label>
            <Dropdown 
              v-model="duplicateTo"
              :options="weekOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner la semaine destination"
              filter
              class="w-full"
            />
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" @click="showDuplicateDialog = false" text />
          <Button label="Dupliquer" @click="performDuplicate" />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import weeklyPlanningService from '@/service/weeklyPlanningService'
import academicPlanningService from '@/service/academicPlanningService'

const router = useRouter()
const toast = useToast()

// État
const selectedYear = ref('bac25')
const selectedWeek = ref(null)
const timeSlots = ref([])
const courseCodes = ref({})
const minibrickData = ref({})
const expandedDays = ref(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'])

const showSlotDialog = ref(false)
const editingSlot = ref(null)
const slotForm = ref({
  day: '',
  date: '',
  startTime: '',
  endTime: '',
  moduleCode: '',
  moduleNumber: '',
  moduleTitle: '',
  courseTitle: '',
  activity: '',
  teachers: [],
  room: '',
  notes: ''
})

const showDuplicateDialog = ref(false)
const duplicateFrom = ref(null)
const duplicateTo = ref(null)

// Options
const yearOptions = ref([
  { label: '1ère année 2025-2026 / Bac 25', value: 'bac25' },
  { label: '2ème année 2025-2026 / Bac 24', value: 'bac24' },
  { label: '3ème année 2025-2026 / Bac 23', value: 'bac23' }
])

const weekOptions = computed(() => {
  const weeks = []
  const autumnWeeks = [...Array.from({ length: 15 }, (_, i) => i + 38), ...Array.from({ length: 7 }, (_, i) => i + 1)]
  const springWeeks = Array.from({ length: 30 }, (_, i) => i + 8)
  
  autumnWeeks.forEach(w => {
    weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  })
  
  springWeeks.forEach(w => {
    weeks.push({ label: `Semaine ${w} (Printemps)`, value: w })
  })
  
  return weeks
})

const moduleOptions = computed(() => {
  return Object.entries(courseCodes.value).map(([id, data]) => ({
    label: `[${data.moduleNumber}] ${data.label}`,
    value: id
  }))
})

// Computed
const sortedTimeSlots = computed(() => {
  const dayOrder = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5 }
  return [...timeSlots.value].sort((a, b) => {
    const dayDiff = dayOrder[a.day] - dayOrder[b.day]
    if (dayDiff !== 0) return dayDiff
    return a.startTime.localeCompare(b.startTime)
  })
})

// Fonctions
const loadWeekPlanning = async () => {
  if (!selectedWeek.value) return
  
  try {
    const weekData = await weeklyPlanningService.getWeekPlanning(selectedYear.value, selectedWeek.value)
    timeSlots.value = Object.entries(weekData).map(([id, data]) => ({ id, ...data }))
  } catch (error) {
    console.error('Erreur chargement planning:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le planning',
      life: 3000
    })
  }
}

const getRowClass = (data) => {
  const dayOrder = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5 }
  const prevIndex = sortedTimeSlots.value.indexOf(data) - 1
  if (prevIndex >= 0) {
    const prevSlot = sortedTimeSlots.value[prevIndex]
    if (prevSlot.day !== data.day) {
      return 'day-separator'
    }
  }
  return ''
}

const getDaySeverity = (day) => {
  const severities = {
    lundi: 'info',
    mardi: 'success',
    mercredi: 'warning',
    jeudi: 'danger',
    vendredi: 'secondary'
  }
  return severities[day] || 'info'
}

const darkenColor = (color) => {
  if (!color) return '#000000'
  const hex = color.replace('#', '')
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 30)
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 30)
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 30)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const duplicateSlot = async (slot) => {
  editingSlot.value = null
  slotForm.value = {
    ...slot,
    id: undefined // Nouveau ID sera généré
  }
  showSlotDialog.value = true
}

const getDaySlotCount = (day) => {
  return timeSlots.value.filter(slot => slot.day === day).length
}

const getDayDate = (day) => {
  const daySlots = timeSlots.value.filter(slot => slot.day === day)
  if (daySlots.length > 0 && daySlots[0].date) {
    return daySlots[0].date
  }
  return null
}

const getDayMainModule = (day) => {
  const daySlots = timeSlots.value.filter(slot => slot.day === day && slot.moduleCode)
  if (daySlots.length === 0) return null
  
  // Trouver le module le plus fréquent du jour
  const moduleCounts = {}
  daySlots.forEach(slot => {
    if (slot.moduleCode) {
      moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
    }
  })
  
  const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
    moduleCounts[a] > moduleCounts[b] ? a : b
  )
  
  const firstSlot = daySlots.find(s => s.moduleCode === mainModuleCode)
  const courseData = courseCodes.value[mainModuleCode]
  
  return {
    code: mainModuleCode,
    number: firstSlot.moduleNumber || courseData?.moduleNumber || mainModuleCode.toUpperCase(),
    title: firstSlot.moduleTitle || courseData?.label || 'Module',
    color: getModuleColor(mainModuleCode)
  }
}

const openSlotDialog = (slot = null) => {
  if (slot) {
    editingSlot.value = slot.id
    slotForm.value = { ...slot }
  } else {
    editingSlot.value = null
    slotForm.value = {
      day: '',
      date: '',
      startTime: '',
      endTime: '',
      moduleCode: '',
      moduleNumber: '',
      moduleTitle: '',
      courseTitle: '',
      activity: '',
      teachers: [],
      room: '',
      notes: ''
    }
  }
  showSlotDialog.value = true
}

const onModuleChange = () => {
  const module = courseCodes.value[slotForm.value.moduleCode]
  if (module) {
    slotForm.value.moduleNumber = module.moduleNumber
    slotForm.value.moduleTitle = `${module.moduleNumber} - ${module.label}`
  }
}

const saveSlot = async () => {
  try {
    const slotId = editingSlot.value || `${slotForm.value.day}_${selectedWeek.value}_${Date.now()}`
    await weeklyPlanningService.saveTimeSlot(selectedYear.value, selectedWeek.value, slotId, slotForm.value)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Créneau enregistré',
      life: 3000
    })
    
    showSlotDialog.value = false
    await loadWeekPlanning()
  } catch (error) {
    console.error('Erreur sauvegarde créneau:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le créneau',
      life: 3000
    })
  }
}

const deleteSlot = async (slotId) => {
  if (!confirm('Supprimer ce créneau ?')) return
  
  try {
    await weeklyPlanningService.deleteTimeSlot(selectedYear.value, selectedWeek.value, slotId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Créneau supprimé',
      life: 3000
    })
    await loadWeekPlanning()
  } catch (error) {
    console.error('Erreur suppression créneau:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le créneau',
      life: 3000
    })
  }
}

const generateFromMinibrick = async () => {
  if (!confirm('Générer les créneaux depuis le planning annuel ? Les créneaux existants seront conservés.')) return
  
  try {
    await weeklyPlanningService.generateWeekFromMinibrick(selectedYear.value, selectedWeek.value, minibrickData.value)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Créneaux générés depuis le minibrick',
      life: 3000
    })
    await loadWeekPlanning()
  } catch (error) {
    console.error('Erreur génération:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de générer les créneaux',
      life: 3000
    })
  }
}

const performDuplicate = async () => {
  if (!duplicateFrom.value || !duplicateTo.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner les semaines source et destination',
      life: 3000
    })
    return
  }
  
  try {
    await weeklyPlanningService.duplicateWeek(selectedYear.value, duplicateFrom.value, duplicateTo.value)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Semaine dupliquée',
      life: 3000
    })
    showDuplicateDialog.value = false
    if (selectedWeek.value === duplicateTo.value) {
      await loadWeekPlanning()
    }
  } catch (error) {
    console.error('Erreur duplication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dupliquer la semaine',
      life: 3000
    })
  }
}

const getModuleColor = (moduleCode) => {
  return courseCodes.value[moduleCode]?.color || '#CCCCCC'
}

const getSemesterLabel = (week) => {
  return (week >= 38 || week <= 7) ? 'Semestre d\'Automne' : 'Semestre de Printemps'
}

const goToAnnualPlanning = () => {
  router.push('/admin/planning/manage')
}

const goToPublicView = () => {
  router.push('/admin/planning/weekly')
}

const exportToExcel = async () => {
  if (!selectedWeek.value || sortedTimeSlots.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Aucun créneau à exporter',
      life: 3000
    })
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(`Semaine ${selectedWeek.value}`)

    // Titre principal
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `BACHELOR 25 (1ère) / ${getSemesterLabel(selectedWeek.value).toUpperCase()}`
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFF6600' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).height = 30

    // Sous-titre semaine
    worksheet.mergeCells('A3:H3')
    const weekCell = worksheet.getCell('A3')
    weekCell.value = `SEMAINE ${selectedWeek.value}`
    weekCell.font = { size: 14, bold: true, color: { argb: 'FF000000' } }
    weekCell.alignment = { horizontal: 'center', vertical: 'middle' }
    weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
    worksheet.getRow(3).height = 25

    let currentRow = 5

    // Grouper par jour
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
    const groupedByDay = {}
    
    sortedTimeSlots.value.forEach(slot => {
      if (!groupedByDay[slot.day]) {
        groupedByDay[slot.day] = []
      }
      groupedByDay[slot.day].push(slot)
    })

    // Pour chaque jour
    dayOrder.forEach(day => {
      const daySlots = groupedByDay[day]
      if (!daySlots || daySlots.length === 0) return

      const dayDate = getDayDate(day)
      const dayModule = getDayMainModule(day)
      
      const startRowForDay = currentRow
      const numSlots = daySlots.length
      
      // Couleur selon le jour
      const dayColors = {
        lundi: 'FFFFCCCC',
        mardi: 'FFCCCCFF',
        mercredi: 'FFFFCCCC',
        jeudi: 'FFCCCCFF',
        vendredi: 'FFFFCCCC'
      }
      const dayBgColor = dayColors[day] || 'FFFFCCCC'

      // Compteur de lignes avant le module
      const moduleStartRow = currentRow
      
      // Ligne du module principal (fusionné sur toute la largeur)
      if (dayModule) {
        worksheet.mergeCells(currentRow, 2, currentRow, 8)
        const moduleHeaderCell = worksheet.getCell(currentRow, 2)
        moduleHeaderCell.value = `${dayModule.number} - ${dayModule.title}`
        moduleHeaderCell.font = { size: 10, bold: true }
        moduleHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
        moduleHeaderCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        worksheet.getRow(currentRow).height = 18
        currentRow++
      }
      
      const slotsStartRow = currentRow

      // Créneaux du jour
      daySlots.forEach((slot, slotIndex) => {
        // Couleur du module pour cette ligne
        let moduleBgColor = 'FFFFFFFF'
        if (dayModule && dayModule.color) {
          moduleBgColor = dayModule.color.replace('#', 'FF')
        }
        
        // LIGNE 1: Horaire + Nom du cours + Numéro de module
        const row1 = worksheet.getRow(currentRow)
        
        // Horaire (Colonne 2) - fusionné sur 2 lignes
        worksheet.mergeCells(currentRow, 2, currentRow + 1, 2)
        const timeCell = row1.getCell(2)
        timeCell.value = `${slot.startTime} - ${slot.endTime}`
        timeCell.font = { size: 9, bold: true }
        timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
        timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        timeCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }

        // Nom du cours (Colonnes 3-7 fusionnées)
        worksheet.mergeCells(currentRow, 3, currentRow, 7)
        const courseTitleCell = row1.getCell(3)
        courseTitleCell.value = slot.courseTitle || slot.activity || ''
        courseTitleCell.font = { size: 9, bold: false }
        courseTitleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        courseTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        courseTitleCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }

        // Numéro de module (Colonne 8) - fusionné sur 2 lignes
        worksheet.mergeCells(currentRow, 8, currentRow + 1, 8)
        const moduleNumCell = row1.getCell(8)
        moduleNumCell.value = slot.moduleNumber || ''
        moduleNumCell.font = { size: 10, bold: true }
        moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        moduleNumCell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        }

        row1.height = 20
        currentRow++
        
        // LIGNE 2: Enseignants
        const row2 = worksheet.getRow(currentRow)
        
        // Enseignants (Colonnes 3-7)
        for (let i = 0; i < 5; i++) {
          const teacherCell = row2.getCell(3 + i)
          teacherCell.value = slot.teachers?.[i] || ''
          teacherCell.font = { size: 9 }
          teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          teacherCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
          teacherCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }

        row2.height = 20
        currentRow++
      })
      
      // Fusionner la colonne Jour/Date verticalement
      if (numSlots > 0) {
        const endRow = currentRow - 1
        
        // Colonne Jour (1) - depuis le début du module jusqu'à la fin des créneaux
        worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
        const dayCell = worksheet.getCell(moduleStartRow, 1)
        dayCell.value = `${day.charAt(0).toUpperCase() + day.slice(1)}\n\n${dayDate || ''}`
        dayCell.font = { size: 10, bold: true }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBgColor } }
        dayCell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        }
      }
    })

    // Largeur des colonnes
    worksheet.getColumn(1).width = 12  // Jour/Date
    worksheet.getColumn(2).width = 15  // Horaire
    worksheet.getColumn(3).width = 25  // Enseignant 1 / Nom du cours
    worksheet.getColumn(4).width = 25  // Enseignant 2
    worksheet.getColumn(5).width = 25  // Enseignant 3
    worksheet.getColumn(6).width = 25  // Enseignant 4
    worksheet.getColumn(7).width = 25  // Enseignant 5
    worksheet.getColumn(8).width = 8   // Numéro de module

    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `planning-semaine-${selectedWeek.value}-${selectedYear.value}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Planning exporté avec succès',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur export Excel:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter le planning',
      life: 3000
    })
  }
}

onMounted(async () => {
  try {
    courseCodes.value = await academicPlanningService.getAllCourseCodes()
    
    // Charger les données minibrick
    const autumnCells = await academicPlanningService.getPlanningCells(selectedYear.value, 'autumn') || {}
    const springCells = await academicPlanningService.getPlanningCells(selectedYear.value, 'spring') || {}
    minibrickData.value = { ...autumnCells, ...springCells }
  } catch (error) {
    console.error('Erreur chargement données:', error)
  }
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.weekly-planning-admin {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.weekly-planning-table {
  font-size: 0.9rem;
}

/* Header de groupe par jour */
.day-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--surface-100) 0%, var(--surface-50) 100%);
  border-radius: 8px;
  margin: 0.5rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.day-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.module-info {
  flex: 1;
  display: flex;
  justify-content: center;
}

.module-badge-header {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.module-number-header {
  font-weight: bold;
  font-size: 1.2rem;
  padding-right: 1rem;
  border-right: 2px solid rgba(255, 255, 255, 0.5);
}

.module-name-header {
  font-size: 1rem;
  font-weight: 600;
}

.slots-count {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
  font-weight: 500;
}

/* Séparation entre les jours */
.weekly-planning-table :deep(.day-separator) {
  border-top: 3px solid var(--primary-color) !important;
}

/* En-tête de jour */
.day-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Cellule d'horaire */
.horaire-cell {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

/* Cellule de module avec couleurs */
.module-cell {
  padding: 0.75rem;
  border-radius: 6px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.module-cell:hover {
  transform: scale(1.02);
}

.course-title-text {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.4;
}

.module-number {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.module-title {
  font-size: 0.85rem;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badge numéro de module (colonne fixe) */
.module-number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  min-width: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Cellule d'activité */
.activity-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

/* Cellule enseignants/groupes */
.teachers-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.teacher-group {
  display: flex;
  align-items: center;
}

.teacher-chip {
  font-size: 0.85rem;
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.teacher-chip:hover {
  background-color: var(--primary-200);
}

/* Cellule salle */
.room-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .weekly-planning-table {
    font-size: 0.85rem;
  }
  
  .module-cell {
    padding: 0.5rem;
  }
}

@media (max-width: 768px) {
  .weekly-planning-admin {
    padding: 1rem;
  }
  
  .weekly-planning-table {
    font-size: 0.8rem;
  }
}
</style>
