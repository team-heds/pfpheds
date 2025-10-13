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
            
            <div class="flex gap-2 flex-wrap">

              <Button
                label="Retour Planning"
                icon="pi pi-arrow-left"
                @click="goToAnnualPlanning"
                outlined
              />
              <Button 
                label="Vue Public"
                icon="pi pi-eye"
                @click="goToPublicView"
                severity="secondary"
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
              <label class="block mb-2 font-bold">Mode d'affichage :</label>
              <Dropdown 
                v-model="viewMode"
                :options="viewModeOptions"
                optionLabel="label"
                optionValue="value"
                @change="onViewModeChange"
                class="w-full"
              />
            </div>
            
            <div v-if="viewMode === 'week'" class="flex-1">
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
              v-if="viewMode === 'week'"
              label="Générer depuis Minibrick"
              icon="pi pi-sync"
              @click="generateFromMinibrick"
              severity="warning"
              v-tooltip="'Créer automatiquement les créneaux depuis le planning annuel'"
            />
            
            <Button 
              v-if="viewMode !== 'week'"
              label="Générer Semestre depuis Minibrick"
              icon="pi pi-sync"
              @click="generateSemesterFromMinibrick"
              severity="warning"
              v-tooltip="'Créer automatiquement tous les créneaux du semestre'"
            />
            
            <Button 
              v-if="viewMode === 'week'"
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
              v-tooltip="viewMode === 'week' ? 'Exporter le planning de la semaine en Excel' : 'Exporter le planning du semestre en Excel'"
            />
          </div>
        </template>
      </Card>

      <!-- Planning de la semaine -->
      <Card v-if="viewMode === 'week' && selectedWeek || viewMode !== 'week'">
        <template #header>
          <div class="flex justify-content-between align-items-center p-3">
            <div>
              <h2 class="text-2xl font-bold m-0">
                <span v-if="viewMode === 'week'">Semaine {{ selectedWeek }}</span>
                <span v-else-if="viewMode === 'semester1'">Semestre de Printemps (S8-S37)</span>
                <span v-else-if="viewMode === 'semester2'">Semestre d'Automne (S38-S7)</span>
              </h2>
              <p class="text-600 mt-1">
                <span v-if="viewMode === 'week'">{{ getSemesterLabel(selectedWeek) }}</span>
                <span v-else>{{ timeSlots.length }} créneaux au total</span>
              </p>
            </div>
            <Button 
              v-if="viewMode === 'week'"
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
            :rows="viewMode === 'week' ? 20 : 50"
            :paginator="viewMode !== 'week'"
            :paginatorTemplate="viewMode !== 'week' ? 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown' : ''"
            :rowsPerPageOptions="viewMode !== 'week' ? [20, 50, 100, 200] : []"
            currentPageReportTemplate="{first} à {last} sur {totalRecords} créneaux"
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
            
            <Column v-if="viewMode !== 'week'" field="weekNumber" header="Semaine" style="width: 8rem">
              <template #body="slotProps">
                <Tag :value="`S${slotProps.data.weekNumber}`" severity="info" class="font-bold" />
              </template>
            </Column>
            
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
            
            <Column field="teachers" header="Enseignants / Groupes (max 6)" style="min-width: 20rem">
              <template #body="slotProps">
                <div v-if="slotProps.data.teachers && slotProps.data.teachers.length > 0" class="teachers-cell">
                  <div v-for="(teacher, index) in slotProps.data.teachers.slice(0, 6)" :key="index" class="teacher-group">
                    <Chip 
                      :label="teacher" 
                      icon="pi pi-user"
                      class="teacher-chip"
                    />
                  </div>
                  <Badge v-if="slotProps.data.teachers.length > 6" :value="`+${slotProps.data.teachers.length - 6}`" severity="warning" />
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
            
            <Column v-if="viewMode === 'week'" header="Actions" :frozen="true" alignFrozen="right" style="width: 8rem">
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
            <label class="block mb-2 font-bold">Enseignants (max 6) :</label>
            <Chips 
              v-model="slotForm.teachers"
              :max="6"
              placeholder="Ajouter un enseignant (Entrée pour valider)"
              class="w-full"
            />
            <small class="text-500">Appuyez sur Entrée après chaque nom. Maximum 6 enseignants par créneau.</small>
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
const viewMode = ref('week') // 'week', 'semester1', 'semester2'
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

const viewModeOptions = [
  { label: 'Semaine unique', value: 'week' },
  { label: 'Semestre de Printemps (S8-S37)', value: 'semester1' },
  { label: 'Semestre d\'Automne (S38-S7)', value: 'semester2' }
]

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
    // Si mode semestre, trier d'abord par numéro de semaine
    if (viewMode.value !== 'week') {
      const weekA = a.weekNumber || 0
      const weekB = b.weekNumber || 0
      
      // Pour le semestre d'automne, 38-52 vient avant 1-7
      if (viewMode.value === 'semester2') {
        if (weekA >= 38 && weekB >= 38) {
          if (weekA !== weekB) return weekA - weekB
        } else if (weekA >= 38 && weekB < 38) {
          return -1
        } else if (weekA < 38 && weekB >= 38) {
          return 1
        } else if (weekA < 38 && weekB < 38) {
          if (weekA !== weekB) return weekA - weekB
        }
      } else {
        // Pour printemps, tri normal
        if (weekA !== weekB) return weekA - weekB
      }
    }
    
    // Puis par jour
    const dayDiff = dayOrder[a.day] - dayOrder[b.day]
    if (dayDiff !== 0) return dayDiff
    
    // Puis par heure
    return a.startTime.localeCompare(b.startTime)
  })
})

// Fonctions
const onViewModeChange = async () => {
  if (viewMode.value === 'week') {
    // Charger une seule semaine
    if (selectedWeek.value) {
      await loadWeekPlanning()
    }
  } else if (viewMode.value === 'semester1') {
    // Charger semestre de printemps (semaines 8-37)
    await loadSemesterPlanning(8, 37)
  } else if (viewMode.value === 'semester2') {
    // Charger semestre d'automne (semaines 38-52 puis 1-7)
    await loadSemesterPlanning(38, 52, 1, 7)
  }
}

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

const loadSemesterPlanning = async (startWeek1, endWeek1, startWeek2 = null, endWeek2 = null) => {
  try {
    const allSlots = []
    
    // Première plage de semaines
    for (let weekNum = startWeek1; weekNum <= endWeek1; weekNum++) {
      const weekData = await weeklyPlanningService.getWeekPlanning(selectedYear.value, weekNum)
      const weekSlots = Object.entries(weekData).map(([id, data]) => ({ 
        id: `${id}_w${weekNum}`,
        weekNumber: weekNum,
        ...data 
      }))
      allSlots.push(...weekSlots)
    }
    
    // Deuxième plage de semaines (pour automne: 38-52 puis 1-7)
    if (startWeek2 !== null && endWeek2 !== null) {
      for (let weekNum = startWeek2; weekNum <= endWeek2; weekNum++) {
        const weekData = await weeklyPlanningService.getWeekPlanning(selectedYear.value, weekNum)
        const weekSlots = Object.entries(weekData).map(([id, data]) => ({ 
          id: `${id}_w${weekNum}`,
          weekNumber: weekNum,
          ...data 
        }))
        allSlots.push(...weekSlots)
      }
    }
    
    timeSlots.value = allSlots
    
    const weekRange = startWeek2 !== null 
      ? `${startWeek1}-${endWeek1} et ${startWeek2}-${endWeek2}`
      : `${startWeek1}-${endWeek1}`
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${allSlots.length} créneaux chargés pour les semaines ${weekRange}`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur chargement semestre:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le semestre',
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
  router.push('/admin/planning')
}

const exportToExcel = async () => {
  if (sortedTimeSlots.value.length === 0) {
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
    
    // Si mode semestre, exporter toutes les semaines séparément
    if (viewMode.value === 'semester1' || viewMode.value === 'semester2') {
      await exportSemesterToExcel(workbook, ExcelJS)
      return
    }
    
    // Sinon, export de la semaine unique
    const worksheet = workbook.addWorksheet(`Semaine ${selectedWeek.value}`)

    // Titre principal
    worksheet.mergeCells('A1:I1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `BACHELOR 25 (1ère) / ${getSemesterLabel(selectedWeek.value).toUpperCase()}`
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFF6600' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).height = 30

    // Sous-titre semaine
    worksheet.mergeCells('A3:I3')
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
        worksheet.mergeCells(currentRow, 2, currentRow, 9)
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

        // Nom du cours (Colonnes 3-8 fusionnées)
        worksheet.mergeCells(currentRow, 3, currentRow, 8)
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

        // Numéro de module (Colonne 9) - fusionné sur 2 lignes
        worksheet.mergeCells(currentRow, 9, currentRow + 1, 9)
        const moduleNumCell = row1.getCell(9)
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
        
        // Enseignants (Colonnes 3-8 pour 6 enseignants)
        for (let i = 0; i < 6; i++) {
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
    worksheet.getColumn(3).width = 20  // Enseignant 1 / Nom du cours
    worksheet.getColumn(4).width = 20  // Enseignant 2
    worksheet.getColumn(5).width = 20  // Enseignant 3
    worksheet.getColumn(6).width = 20  // Enseignant 4
    worksheet.getColumn(7).width = 20  // Enseignant 5
    worksheet.getColumn(8).width = 20  // Enseignant 6
    worksheet.getColumn(9).width = 8   // Numéro de module

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

const exportSemesterToExcel = async (workbook, ExcelJS) => {
  // Récupérer les semaines uniques
  let weekNumbers = [...new Set(timeSlots.value.map(slot => slot.weekNumber))]
  
  const semesterNum = viewMode.value === 'semester1' ? 1 : 2
  const semesterLabel = semesterNum === 1 ? 'SEMESTRE DE PRINTEMPS' : 'SEMESTRE D\'AUTOMNE'
  
  // Trier selon le semestre
  if (semesterNum === 1) {
    // Printemps: 8-37 (ordre normal)
    weekNumbers.sort((a, b) => a - b)
  } else {
    // Automne: 38-52 puis 1-7 (ordre spécial)
    weekNumbers.sort((a, b) => {
      // Les semaines >= 38 viennent en premier
      if (a >= 38 && b >= 38) return a - b
      if (a >= 38 && b < 38) return -1
      if (a < 38 && b >= 38) return 1
      // Les semaines < 38 viennent après
      return a - b
    })
  }
  
  // Créer une seule feuille pour tout le semestre
  const worksheet = workbook.addWorksheet(`Semestre ${semesterNum}`)
  
  // Titre principal
  worksheet.mergeCells('A1:J1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `BACHELOR 25 (1ère) / ${semesterLabel} ${semesterNum}`
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFF6600' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).height = 30

  let currentRow = 3
  
  // Pour chaque semaine
  for (const weekNum of weekNumbers) {
    const weekSlots = timeSlots.value.filter(slot => slot.weekNumber === weekNum)
    if (weekSlots.length === 0) continue
    
    // En-tête de semaine
    worksheet.mergeCells(currentRow, 1, currentRow, 10)
    const weekHeaderCell = worksheet.getCell(currentRow, 1)
    weekHeaderCell.value = `SEMAINE ${weekNum}`
    weekHeaderCell.font = { size: 14, bold: true, color: { argb: 'FF000000' } }
    weekHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
    weekHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
    worksheet.getRow(currentRow).height = 25
    currentRow++
    
    // Ajouter les données de la semaine
    currentRow = await fillWeekDataToSheetContinuous(worksheet, weekSlots, currentRow)
    
    // Espace entre les semaines
    currentRow++
  }
  
  // Largeurs des colonnes
  worksheet.getColumn(1).width = 15  // Jour + Date (plus large)
  worksheet.getColumn(2).width = 15  // Horaire
  for (let i = 3; i <= 8; i++) {
    worksheet.getColumn(i).width = 20
  }
  worksheet.getColumn(9).width = 8   // N° Module
  worksheet.getColumn(10).width = 8  // Extra
  
  // Générer le fichier
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `planning-semestre-${semesterNum}-${selectedYear.value}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${weekNumbers.length} semaines exportées dans un seul fichier`,
    life: 3000
  })
}

const fillWeekDataToSheet = async (worksheet, weekSlots) => {
  let currentRow = 5
  
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const groupedByDay = {}
  
  weekSlots.forEach(slot => {
    if (!groupedByDay[slot.day]) {
      groupedByDay[slot.day] = []
    }
    groupedByDay[slot.day].push(slot)
  })
  
  const dayColors = {
    lundi: 'FFFFCCCC',
    mardi: 'FFCCCCFF',
    mercredi: 'FFFFCCCC',
    jeudi: 'FFCCCCFF',
    vendredi: 'FFFFCCCC'
  }
  
  dayOrder.forEach(day => {
    const daySlots = groupedByDay[day]
    if (!daySlots || daySlots.length === 0) return
    
    const dayBgColor = dayColors[day] || 'FFFFCCCC'
    const moduleStartRow = currentRow
    
    // Module principal (trouver le module le plus fréquent)
    const moduleCounts = {}
    daySlots.forEach(slot => {
      if (slot.moduleCode) {
        moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
      }
    })
    
    let mainModule = null
    if (Object.keys(moduleCounts).length > 0) {
      const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
        moduleCounts[a] > moduleCounts[b] ? a : b
      )
      const firstSlot = daySlots.find(s => s.moduleCode === mainModuleCode)
      
      // Récupérer le titre depuis courseCodes si disponible
      let moduleTitle = firstSlot.moduleTitle || ''
      if (!moduleTitle && courseCodes.value[mainModuleCode]) {
        moduleTitle = courseCodes.value[mainModuleCode].label
      }
      
      mainModule = {
        number: firstSlot.moduleNumber || mainModuleCode.toUpperCase(),
        title: moduleTitle,
        color: getModuleColor(mainModuleCode)
      }
    }
    
    if (mainModule) {
      worksheet.mergeCells(currentRow, 2, currentRow, 9)
      const moduleCell = worksheet.getCell(currentRow, 2)
      moduleCell.value = `${mainModule.number} - ${mainModule.title}`
      moduleCell.font = { size: 10, bold: true }
      moduleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      moduleCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      worksheet.getRow(currentRow).height = 18
      currentRow++
    }
    
    // Créneaux
    daySlots.forEach(slot => {
      const moduleBgColor = mainModule?.color?.replace('#', 'FF') || 'FFFFFFFF'
      
      // Ligne 1
      const row1 = worksheet.getRow(currentRow)
      
      worksheet.mergeCells(currentRow, 2, currentRow + 1, 2)
      const timeCell = row1.getCell(2)
      timeCell.value = `${slot.startTime} - ${slot.endTime}`
      timeCell.font = { size: 9, bold: true }
      timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
      timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      timeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 3, currentRow, 8)
      const courseCell = row1.getCell(3)
      courseCell.value = slot.courseTitle || slot.activity || ''
      courseCell.font = { size: 9 }
      courseCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      courseCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 9, currentRow + 1, 9)
      const moduleNumCell = row1.getCell(9)
      moduleNumCell.value = slot.moduleNumber || ''
      moduleNumCell.font = { size: 10, bold: true }
      moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      moduleNumCell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
      
      row1.height = 20
      currentRow++
      
      // Ligne 2
      const row2 = worksheet.getRow(currentRow)
      for (let i = 0; i < 6; i++) {
        const teacherCell = row2.getCell(3 + i)
        teacherCell.value = slot.teachers?.[i] || ''
        teacherCell.font = { size: 9 }
        teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        teacherCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        teacherCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      }
      row2.height = 20
      currentRow++
    })
    
    // Fusionner colonne jour avec date
    if (daySlots.length > 0) {
      const endRow = currentRow - 1
      worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
      const dayCell = worksheet.getCell(moduleStartRow, 1)
      
      // Formater jour et date
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      const dateStr = daySlots[0].date || ''
      dayCell.value = dateStr ? `${dayName}\n\n${dateStr}` : dayName
      
      dayCell.font = { size: 11, bold: true }
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
  
  // Largeurs
  worksheet.getColumn(1).width = 15  // Jour + Date (plus large)
  worksheet.getColumn(2).width = 15  // Horaire
  for (let i = 3; i <= 8; i++) {
    worksheet.getColumn(i).width = 20
  }
  worksheet.getColumn(9).width = 8   // N° Module
  worksheet.getColumn(10).width = 8  // Extra
}

const fillWeekDataToSheetContinuous = async (worksheet, weekSlots, startRow) => {
  let currentRow = startRow
  
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const groupedByDay = {}
  
  weekSlots.forEach(slot => {
    if (!groupedByDay[slot.day]) {
      groupedByDay[slot.day] = []
    }
    groupedByDay[slot.day].push(slot)
  })
  
  const dayColors = {
    lundi: 'FFFFCCCC',
    mardi: 'FFCCCCFF',
    mercredi: 'FFFFCCCC',
    jeudi: 'FFCCCCFF',
    vendredi: 'FFFFCCCC'
  }
  
  dayOrder.forEach(day => {
    const daySlots = groupedByDay[day]
    if (!daySlots || daySlots.length === 0) return
    
    const dayBgColor = dayColors[day] || 'FFFFCCCC'
    const moduleStartRow = currentRow
    
    // Trouver le module principal
    const moduleCounts = {}
    daySlots.forEach(slot => {
      if (slot.moduleCode) {
        moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
      }
    })
    
    let mainModule = null
    if (Object.keys(moduleCounts).length > 0) {
      const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
        moduleCounts[a] > moduleCounts[b] ? a : b
      )
      const firstSlot = daySlots.find(s => s.moduleCode === mainModuleCode)
      
      // Récupérer le titre depuis courseCodes si disponible
      let moduleTitle = firstSlot.moduleTitle || ''
      if (!moduleTitle && courseCodes.value[mainModuleCode]) {
        moduleTitle = courseCodes.value[mainModuleCode].label
      }
      
      mainModule = {
        number: firstSlot.moduleNumber || mainModuleCode.toUpperCase(),
        title: moduleTitle,
        color: getModuleColor(mainModuleCode)
      }
    }
    
    // Ligne du module (avec titre complet) - ne pas fusionner colonne 1 (jour)
    if (mainModule) {
      worksheet.mergeCells(currentRow, 2, currentRow, 9)
      const moduleCell = worksheet.getCell(currentRow, 2)
      moduleCell.value = `${mainModule.number} - ${mainModule.title}`
      moduleCell.font = { size: 11, bold: true }
      moduleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      moduleCell.border = { 
        top: { style: 'medium' }, 
        left: { style: 'thin' }, 
        bottom: { style: 'medium' }, 
        right: { style: 'medium' } 
      }
      worksheet.getRow(currentRow).height = 20
      currentRow++
    }
    
    const slotsStartRow = currentRow
    
    // Créneaux
    daySlots.forEach(slot => {
      const moduleBgColor = mainModule?.color?.replace('#', 'FF') || 'FFFFFFFF'
      
      // Ligne 1: Horaire + Cours + Numéro module
      const row1 = worksheet.getRow(currentRow)
      
      worksheet.mergeCells(currentRow, 2, currentRow + 1, 2)
      const timeCell = row1.getCell(2)
      timeCell.value = `${slot.startTime} - ${slot.endTime}`
      timeCell.font = { size: 9, bold: true }
      timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
      timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      timeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 3, currentRow, 8)
      const courseCell = row1.getCell(3)
      courseCell.value = slot.courseTitle || slot.activity || ''
      courseCell.font = { size: 9 }
      courseCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      courseCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 9, currentRow + 1, 9)
      const moduleNumCell = row1.getCell(9)
      moduleNumCell.value = slot.moduleNumber || ''
      moduleNumCell.font = { size: 10, bold: true }
      moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      moduleNumCell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
      
      row1.height = 20
      currentRow++
      
      // Ligne 2: Enseignants
      const row2 = worksheet.getRow(currentRow)
      for (let i = 0; i < 6; i++) {
        const teacherCell = row2.getCell(3 + i)
        teacherCell.value = slot.teachers?.[i] || ''
        teacherCell.font = { size: 9 }
        teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        teacherCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        teacherCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      }
      row2.height = 20
      currentRow++
    })
    
    // Fusionner colonne jour avec date
    if (daySlots.length > 0) {
      const endRow = currentRow - 1
      worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
      const dayCell = worksheet.getCell(moduleStartRow, 1)
      
      // Formater jour et date
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      const dateStr = daySlots[0].date || ''
      dayCell.value = dateStr ? `${dayName}\n\n${dateStr}` : dayName
      
      dayCell.font = { size: 11, bold: true }
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
  
  return currentRow
}

const generateSemesterFromMinibrick = async () => {
  const semesterNum = viewMode.value === 'semester1' ? 1 : 2
  
  let weeksToGenerate = []
  let weekRange = ''
  
  if (semesterNum === 1) {
    // Printemps: semaines 8-37
    weeksToGenerate = Array.from({ length: 30 }, (_, i) => i + 8)
    weekRange = '8-37'
  } else {
    // Automne: semaines 38-52 puis 1-7
    weeksToGenerate = [
      ...Array.from({ length: 15 }, (_, i) => i + 38), // 38-52
      ...Array.from({ length: 7 }, (_, i) => i + 1)    // 1-7
    ]
    weekRange = '38-52 et 1-7'
  }
  
  if (!confirm(`Générer tous les créneaux du semestre ${semesterNum === 1 ? 'de Printemps' : 'd\'Automne'} (semaines ${weekRange}) depuis le planning annuel ?`)) return
  
  try {
    let generatedCount = 0
    
    for (const weekNum of weeksToGenerate) {
      try {
        await weeklyPlanningService.generateWeekFromMinibrick(selectedYear.value, weekNum, minibrickData.value)
        generatedCount++
      } catch (error) {
        console.error(`Erreur génération semaine ${weekNum}:`, error)
      }
    }
    
    toast.add({
      severity: 'success',
      summary: 'Génération terminée',
      detail: `${generatedCount}/${weeksToGenerate.length} semaines générées depuis le minibrick`,
      life: 4000
    })
    
    // Recharger le semestre
    await onViewModeChange()
  } catch (error) {
    console.error('Erreur génération semestre:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de générer le semestre',
      life: 3000
    })
  }
}
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  align-items: center;
  max-width: 100%;
}

.teacher-group {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.teacher-chip {
  font-size: 0.85rem;
  background-color: var(--primary-100);
  color: var(--primary-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.teacher-chip:hover {
  background-color: var(--primary-200);
}

/* Badge pour enseignants supplémentaires */
.teachers-cell :deep(.p-badge) {
  margin-left: 0.5rem;
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
