<template>
  <AdminLayout class="planning-container">
    
    <!-- Header Card -->
    <Card class="planning-header-card">
      <template #header>
        <Toolbar class="border-noround">
          <template #start>
            <div class="flex align-items-center gap-3">
              <i class="pi pi-calendar text-3xl text-primary"></i>
              <div class="flex flex-column">
                <div class="flex align-items-center gap-2">
                  <h1 class="m-0 text-xl font-bold">Planning Académique</h1>
                  <Tag v-if="activeAcademicYear" :value="activeAcademicYear.name" severity="secondary" class="text-xs"></Tag>
                </div>
                <p class="m-0 text-xs text-500">Bachelor of Science in Nursing</p>
              </div>
            </div>
          </template>
          
          <template #end>
            <div class="flex gap-2 align-items-center">
              <span class="text-sm font-semibold text-500 mr-2 uppercase hidden md:inline">Année :</span>
              <SelectButton 
                v-model="selectedYear" 
                :options="yearOptions" 
                optionLabel="labelShort" 
                optionValue="value"
                @change="loadPlanning"
                aria-labelledby="basic"
                class="year-select-button"
              >
                <template #option="slotProps">
                  <div class="flex flex-column align-items-center px-2">
                    <span class="font-bold">{{ slotProps.option.labelShort }}</span>
                    <span class="text-xs opacity-70">{{ slotProps.option.classCode }}</span>
                  </div>
                </template>
              </SelectButton>
            </div>
          </template>
        </Toolbar>
      </template>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
      <ProgressSpinner />
      <p class="mt-4 text-lg text-600">Chargement du planning...</p>
    </div>

    <!-- Planning Grid -->
    <div v-else class="planning-content">
      <!-- Année académique Info (DÉPLACÉE DANS LE HEADER) -->
      
      <!-- Planning complet année académique -->
      <Panel :toggleable="true" class="mb-4">
        <template #header>
          <div class="flex align-items-center gap-2 flex-wrap">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-calendar-plus text-primary text-xl"></i>
              <span class="font-bold text-xl">Planning Académique Complet</span>
            </div>
            <div class="flex gap-2">
              <Tag :value="semesterLabels.autumn" severity="warning"></Tag>
              <Tag :value="semesterLabels.spring" severity="info"></Tag>
            </div>
          </div>
        </template>
        
        <div class="planning-grid">
          <!-- Header avec numéros de semaines -->
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
              <div class="week-header-content">
                <span class="week-number">S{{ week }}</span>
                <div v-if="getWeekModules(week).length > 0" class="week-colors">
                  <div 
                    v-for="moduleColor in getWeekModules(week)" 
                    :key="moduleColor"
                    class="week-color-indicator"
                    :style="{ backgroundColor: moduleColor }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lignes pour chaque jour -->
          <div 
            v-for="day in days" 
            :key="day" 
            class="grid-row"
          >
            <div class="day-label">{{ dayLabels[day] }}</div>
            
            <div 
              v-for="week in currentWeeks" 
              :key="`${day}-${week}`" 
              class="grid-cell"
              :class="{ 'autumn-cell': week >= 38 || week <= 7, 'spring-cell': week >= 8 && week <= 37 }"
              :style="getCellStyle(day, week)"
              :title="getCellTooltip(day, week)"
            >
              <span v-if="getCellLabel(day, week)" class="cell-label">
                {{ getCellLabel(day, week) }}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Légende des cours -->
      <Panel :toggleable="true" class="mt-4 compact-legend">
        <template #header>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-palette text-primary text-xl"></i>
            <span class="font-bold text-lg">Légende des cours</span>
            <Tag :value="`${Object.keys(courseCodes).length} modules`" severity="secondary" class="ml-2"></Tag>
          </div>
        </template>
        
        <div class="legend-grid-container">
          <!-- 1ère année -->
          <div v-if="coursesByYear[1] && coursesByYear[1].length > 0" class="legend-section">
            <div class="legend-section-header">1ère année</div>
            <div class="legend-items-grid">
              <div 
                v-for="code in coursesByYear[1]" 
                :key="code.id" 
                class="legend-item" 
                v-tooltip.bottom="code.supabaseData?.titre || code.label"
                @click="showModuleDetails(code)"
              >
                <div class="legend-color-strip" :style="{ backgroundColor: code.color }"></div>
                <div class="legend-item-content">
                  <span class="legend-item-code">{{ code.moduleNumber || code.id.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2ème année -->
          <div v-if="coursesByYear[2] && coursesByYear[2].length > 0" class="legend-section">
            <div class="legend-section-header">2ème année</div>
            <div class="legend-items-grid">
              <div 
                v-for="code in coursesByYear[2]" 
                :key="code.id" 
                class="legend-item" 
                v-tooltip.bottom="code.supabaseData?.titre || code.label"
                @click="showModuleDetails(code)"
              >
                <div class="legend-color-strip" :style="{ backgroundColor: code.color }"></div>
                <div class="legend-item-content">
                  <span class="legend-item-code">{{ code.moduleNumber || code.id.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3ème année -->
          <div v-if="coursesByYear[3] && coursesByYear[3].length > 0" class="legend-section">
            <div class="legend-section-header">3ème année</div>
            <div class="legend-items-grid">
              <div 
                v-for="code in coursesByYear[3]" 
                :key="code.id" 
                class="legend-item" 
                v-tooltip.bottom="code.supabaseData?.titre || code.label"
                @click="showModuleDetails(code)"
              >
                <div class="legend-color-strip" :style="{ backgroundColor: code.color }"></div>
                <div class="legend-item-content">
                  <span class="legend-item-code">{{ code.moduleNumber || code.id.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Autres -->
          <div v-if="coursesByYear[0] && coursesByYear[0].length > 0" class="legend-section">
            <div class="legend-section-header">Événements</div>
            <div class="legend-items-grid">
              <div 
                v-for="code in coursesByYear[0]" 
                :key="code.id" 
                class="legend-item" 
                v-tooltip.bottom="code.label"
                @click="showModuleDetails(code)"
              >
                <div class="legend-color-strip" :style="{ backgroundColor: code.color }"></div>
                <div class="legend-item-content">
                  <span class="legend-item-code">{{ code.id.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <!-- Dialog Détails Module -->
      <Dialog 
        v-model:visible="displayModuleDetails" 
        :header="selectedModule?.moduleNumber ? `Module ${selectedModule.moduleNumber}` : selectedModule?.id.toUpperCase()" 
        :style="{ width: '450px' }" 
        :modal="true"
        dismissableMask
      >
        <div v-if="selectedModule" class="p-2">
          <div class="flex align-items-center gap-3 mb-4">
            <div class="w-2rem h-2rem border-round" :style="{ backgroundColor: selectedModule.color }"></div>
            <h2 class="m-0 text-xl">{{ selectedModule.label }}</h2>
          </div>
          
          <div v-if="selectedModule.supabaseData" class="flex flex-column gap-3">
            <div v-if="selectedModule.supabaseData.responsable" class="flex align-items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              <div>
                <div class="text-xs text-500">Responsable</div>
                <div class="font-semibold">{{ selectedModule.supabaseData.responsable }}</div>
              </div>
            </div>
            
            <div class="flex gap-4">
              <div v-if="selectedModule.supabaseData.credits" class="flex align-items-center gap-2">
                <i class="pi pi-star-fill text-yellow-500"></i>
                <div>
                  <div class="text-xs text-500">Crédits ECTS</div>
                  <div class="font-semibold">{{ selectedModule.supabaseData.credits }}</div>
                </div>
              </div>
              
              <div v-if="selectedModule.supabaseData.heures_contact" class="flex align-items-center gap-2">
                <i class="pi pi-clock text-blue-500"></i>
                <div>
                  <div class="text-xs text-500">Heures contact</div>
                  <div class="font-semibold">{{ selectedModule.supabaseData.heures_contact }}h</div>
                </div>
              </div>
            </div>

            <div v-if="selectedModule.supabaseData.description" class="mt-2">
              <div class="text-xs text-500 mb-1">Description</div>
              <div class="text-sm line-height-3 surface-100 p-3 border-round">
                {{ selectedModule.supabaseData.description }}
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Fermer" icon="pi pi-times" @click="displayModuleDetails = false" class="p-button-text" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
// import Navbar from '@/components/common/utils/Navbar.vue'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import planningService from '@/service/planningService'
import { useModules } from '@/composables/useModules'
import { useAcademicYear } from '@/composables/useAcademicYear'

const router = useRouter()

// State
const loading = ref(true)
const selectedYear = ref('bac25')
const courseCodes = ref({})
const planningCells = ref([])

// Détails module
const displayModuleDetails = ref(false)
const selectedModule = ref(null)

const showModuleDetails = (module) => {
  selectedModule.value = module
  displayModuleDetails.value = true
}

// Modules Supabase
const { modules: supabaseModules, loadModules, loading: modulesLoading } = useModules()

// Années académiques et classes
const { activeAcademicYear, sortedClasses, loadActiveAcademicYear, loadClassesByYear } = useAcademicYear()

// Vérifie si une année ISO a 53 semaines
const isoWeeksInYear = (year) => {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52
}

// Année civile de l'automne (ex: 2025 pour 2025-2026)
const autumnStartYear = computed(() => {
  if (activeAcademicYear.value?.name) {
    const match = activeAcademicYear.value.name.match(/(\d{4})/)
    if (match) return parseInt(match[1])
  }
  if (activeAcademicYear.value?.start_date) {
    return new Date(activeAcademicYear.value.start_date).getFullYear()
  }
  const now = new Date()
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
})

// Options dynamiques basées sur les classes
const yearOptions = computed(() => {
  if (!activeAcademicYear.value || sortedClasses.value.length === 0) {
    // Fallback vers les valeurs statiques
    return [
      { label: '1ère année 2025-2026 / Bac 25', value: 'bac25' },
      { label: '2ème année 2025-2026 / Bac 24', value: 'bac24' },
      { label: '3ème année 2025-2026 / Bac 23', value: 'bac23' }
    ]
  }
  
  return sortedClasses.value
    .filter(classItem => !classItem.code.endsWith('-EE'))
    .map(classItem => {
      const yearLevel = classItem.year_level === 1 ? '1ère' : classItem.year_level === 2 ? '2ème' : '3ème'
      return {
        label: `${yearLevel} année ${activeAcademicYear.value.name} / ${classItem.code}`,
        labelShort: `${yearLevel} année`,
        classCode: classItem.code,
        value: 'bac' + classItem.code.substring(1) // B25 -> bac25
      }
    })
})

// Jours de la semaine
const days = ['lu', 'ma', 'me', 'je', 've']
const dayLabels = {
  lu: 'Lun',
  ma: 'Mar',
  me: 'Mer',
  je: 'Jeu',
  ve: 'Ven'
}

// Semaines (même structure que PlanningAdminView)
const currentWeeks = computed(() => {
  // Ordre académique : Automne (S38-S52/53, S1-S7) puis Printemps (S8-S37)
  const weeks = []
  const maxAutumnWeek = isoWeeksInYear(autumnStartYear.value) // 52 ou 53

  // Semestre d'Automne : S38 → S52 (ou S53 si l'année en a 53)
  for (let w = 38; w <= maxAutumnWeek; w++) {
    weeks.push(w)
  }

  // Semestre d'Automne (suite) : S1 → S7
  for (let w = 1; w <= 7; w++) {
    weeks.push(w)
  }

  // Semestre de Printemps : S8 → S37
  for (let w = 8; w <= 37; w++) {
    weeks.push(w)
  }

  return weeks
})

// Labels des semestres (depuis Supabase)
const semesterLabels = computed(() => {
  // Si pas d'année académique chargée, valeurs par défaut
  if (!activeAcademicYear.value) {
    return {
      autumn: 'Semestre d\'Automne',
      spring: 'Semestre de Printemps'
    }
  }
  
  // Construire le label d'automne (peut avoir une coupure d'année)
  let autumnLabel = 'Semestre d\'Automne'
  if (activeAcademicYear.value.autumn_start_week && activeAcademicYear.value.autumn_end_week) {
    const start = activeAcademicYear.value.autumn_start_week
    const end = activeAcademicYear.value.autumn_end_week
    
    // Si end < start, il y a une coupure d'année (ex: S38-52/53 puis S1-7)
    if (end < start) {
      const maxWeek = isoWeeksInYear(autumnStartYear.value)
      autumnLabel = `Automne: S${start}-${maxWeek} & S1-${end}`
    } else {
      autumnLabel = `Automne: S${start}-${end}`
    }
  }
  
  // Label de printemps (simple)
  let springLabel = 'Semestre de Printemps'
  if (activeAcademicYear.value.spring_start_week && activeAcademicYear.value.spring_end_week) {
    springLabel = `Printemps: S${activeAcademicYear.value.spring_start_week}-${activeAcademicYear.value.spring_end_week}`
  }
  
  return {
    autumn: autumnLabel,
    spring: springLabel
  }
})

// Organiser les codes par année
const coursesByYear = computed(() => {
  const byYear = {
    0: [], // Sans année
    1: [],
    2: [],
    3: []
  }
  
  Object.entries(courseCodes.value).forEach(([id, data]) => {
    const year = data.year || 0
    byYear[year].push({ id, ...data })
  })
  
  // Trier chaque année par numéro de module
  Object.keys(byYear).forEach(year => {
    byYear[year].sort((a, b) => { 
      if (a.moduleNumber && b.moduleNumber) {
        return a.moduleNumber.localeCompare(b.moduleNumber, undefined, { numeric: true })
      }
      return a.label.localeCompare(b.label)
    })
  })
  
  return byYear
})

// Charger le planning
const loadPlanning = async () => {
  loading.value = true
  try {
    // Charger les modules Supabase
    await loadModules()
    console.log('[PlanningView] 📚 Modules Supabase chargés:', supabaseModules.value.length)
    
    // Créer les codes de cours depuis Supabase
    courseCodes.value = {}
    
    supabaseModules.value.forEach((module) => {
      // Nettoyage des codes pour le mapping
      const cleanShortCode = module.short_code ? module.short_code.toString().trim().toLowerCase() : null
      const cleanNumber = module.number ? module.number.toString().trim().toLowerCase() : null
      const courseCodeId = (cleanShortCode || cleanNumber || `module_${module.id}`).toString()
      
      const moduleData = {
        id: courseCodeId,
        moduleNumber: module.number,
        label: module.title,
        color: module.color || getDefaultColorByYear(module.year),
        year: module.year,
        supabaseData: {
          title: module.title,
          responsable: module.responsable,
          credits: module.credits,
          description: module.description,
          year: module.year,
          short_code: module.short_code
        }
      }
      
      // Ajouter avec le short_code comme clé principale
      if (cleanShortCode) {
        courseCodes.value[cleanShortCode] = moduleData
      }
      
      // Ajouter aussi avec le numéro
      if (cleanNumber) {
        courseCodes.value[cleanNumber] = moduleData
      }

      // Ajouter une clé "S.XX.XXXX" si possible pour matcher les codes de planning
      if (cleanShortCode && cleanShortCode.includes('.')) {
        // Déjà au format S.XX.XXXX
      } else if (cleanNumber && /^\d+$/.test(cleanNumber)) {
        // Si c'est juste un numéro, on ne peut pas deviner le préfixe
      }
    })
    
    console.log('[PlanningView] ✅ Codes de cours créés:', Object.keys(courseCodes.value).length)
    console.log('[PlanningView] 🔍 Liste des clés courseCodes:', Object.keys(courseCodes.value))
    
    // Charger les cellules depuis Supabase (automne + printemps)
    const autumnCells = await planningService.getPlanningCells(selectedYear.value, 'autumn')
    const springCells = await planningService.getPlanningCells(selectedYear.value, 'spring')
    
    // Fusionner les cellules des 2 semestres dans un seul array
    planningCells.value = []
    
    // Convertir les objets en array
    if (autumnCells) {
      Object.values(autumnCells).forEach(cell => {
        planningCells.value.push(cell)
      })
    }
    if (springCells) {
      Object.values(springCells).forEach(cell => {
        planningCells.value.push(cell)
      })
    }
    
    console.log('[PlanningView] 🎯 Cellules chargées:', planningCells.value.length)
    if (planningCells.value.length > 0) {
      console.log('[PlanningView] 🔍 Exemple cellules:', planningCells.value.slice(0, 3).map(c => ({ 
        day: c.day, 
        week: c.week_number, 
        module_code: c.module_code 
      })))
    }
  } catch (error) {
    console.error('[PlanningView] ❌ Erreur chargement:', error)
  } finally {
    loading.value = false
  }
}

// Fonction helper pour obtenir une couleur par défaut selon l'année
const getDefaultColorByYear = (annee) => {
  const colorsByYear = {
    1: '#E6B8B7',  // Rose pour 1ère année
    2: '#BA68C8',  // Violet pour 2ème année
    3: '#4DD0E1',  // Cyan pour 3ème année
  }
  return colorsByYear[annee] || '#CCCCCC'
}

// Obtenir le style d'une cellule
const getCellStyle = (day, week) => {
  const cell = planningCells.value.find(c => c.day === day && c.week_number === week)
  
  if (!cell || !cell.module_code) {
    return { backgroundColor: '#ffffff' }
  }
  
  const mCode = cell.module_code.toString().trim().toLowerCase()
  
  // 1. Recherche directe (clé exacte ou normalisée)
  let courseCode = courseCodes.value[mCode]
  
  // 2. Recherche par moduleNumber
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => 
      c.moduleNumber?.toString().toLowerCase() === mCode
    )
  }

  // 3. Recherche floue (si mCode contient le short_code ou vice-versa)
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => {
      const shortCode = c.supabaseData?.short_code?.toString().toLowerCase()
      if (!shortCode) return false
      return mCode.includes(shortCode) || shortCode.includes(mCode)
    })
  }

  // 4. Si c'est un événement spécial (Vacances, Examen, etc.)
  if (!courseCode) {
    const specialColors = {
      'vacances': '#FFFF00', // Jaune comme sur l'image
      'examen': '#FF0000',   // Rouge comme sur l'image
      'interrup': '#FF9800', // Orange comme sur l'image
      'ferie': '#E0E0E0',
      'férié': '#E0E0E0'
    }
    
    for (const [key, color] of Object.entries(specialColors)) {
      if (mCode.includes(key)) {
        return {
          backgroundColor: color,
          color: isLightColor(color) ? '#000000' : '#ffffff'
        }
      }
    }
  }

  return {
    backgroundColor: courseCode?.color || '#CCCCCC',
    color: isLightColor(courseCode?.color) ? '#000000' : '#ffffff'
  }
}

// Obtenir le label d'une cellule
const getCellLabel = (day, week) => {
  const cell = planningCells.value.find(c => c.day === day && c.week_number === week)
  
  if (!cell || !cell.module_code) return ''
  
  // Si un label personnalisé est défini, l'utiliser
  if (cell.display_label) {
    return cell.display_label
  }
  
  const mCode = cell.module_code.toString().trim().toLowerCase()
  
  // Recherche du module
  let courseCode = courseCodes.value[mCode]
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => 
      c.moduleNumber?.toString().toLowerCase() === mCode
    )
  }
  
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => {
      const shortCode = c.supabaseData?.short_code?.toString().toLowerCase()
      if (!shortCode) return false
      return mCode.includes(shortCode) || shortCode.includes(mCode)
    })
  }

  if (courseCode && courseCode.moduleNumber) {
    return courseCode.moduleNumber
  }
  
  return cell.module_code.toUpperCase()
}

// Obtenir le tooltip d'une cellule
const getCellTooltip = (day, week) => {
  const cell = planningCells.value.find(c => c.day === day && c.week_number === week)
  
  // Calcul de la date
  let dateStr = ''
  try {
    const dayMap = { 'lu': 1, 'ma': 2, 'me': 3, 'je': 4, 've': 5 }
    const dayNum = dayMap[day] || 1
    
    // Année académique 2026-2027
    // Semaines >= 38 : 2026
    // Semaines < 38 : 2027
    const year = (week >= 38) ? 2026 : 2027
    
    // Créer une date basée sur le numéro de semaine ISO
    const simple = new Date(year, 0, 1 + (week - 1) * 7)
    const dow = simple.getDay()
    const isoWeekStart = simple
    if (dow <= 4)
      isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1)
    else
      isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay())
    
    // Ajouter les jours pour arriver au jour de la semaine (dayNum - 1 car lu=1)
    const targetDate = new Date(isoWeekStart)
    targetDate.setDate(isoWeekStart.getDate() + (dayNum - 1))
    
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    dateStr = targetDate.toLocaleDateString('fr-FR', options)
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1) // Capitalize
  } catch (e) {
    console.error('Error calculating date:', e)
  }

  if (!cell || !cell.module_code) return dateStr || ''
  
  const mCode = cell.module_code.toString().trim().toLowerCase()
  
  let courseCode = courseCodes.value[mCode]
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => 
      c.moduleNumber?.toString().toLowerCase() === mCode
    )
  }
  
  if (!courseCode) {
    courseCode = Object.values(courseCodes.value).find(c => {
      const shortCode = c.supabaseData?.short_code?.toString().toLowerCase()
      if (!shortCode) return false
      return mCode.includes(shortCode) || shortCode.includes(mCode)
    })
  }

  let tooltip = dateStr ? `${dateStr}\n-------------------\n` : ''

  if (!courseCode) return tooltip + cell.module_code
  
  // Tooltip enrichi avec données Supabase
  tooltip += courseCode.label
  
  if (courseCode.supabaseData) {
    const data = courseCode.supabaseData
    if (data.title) tooltip += `\n\n📚 ${data.title}`
    if (data.responsable) tooltip += `\n👤 Responsable: ${data.responsable}`
    if (data.credits) tooltip += `\n⭐ ${data.credits} crédits ECTS`
  }
  
  return tooltip
}

// Obtenir les modules présents dans une semaine donnée
const getWeekModules = (week) => {
  const modulesInWeek = new Set()
  
  // Parcourir toutes les cellules de cette semaine
  days.forEach(day => {
    const cell = planningCells.value.find(c => c.day === day && c.week_number === week)
    if (cell && cell.module_code) {
      const mCode = cell.module_code.toString().trim().toLowerCase()
      
      let courseCode = courseCodes.value[mCode]
      if (!courseCode) {
        courseCode = Object.values(courseCodes.value).find(c => 
          c.moduleNumber?.toString().toLowerCase() === mCode
        )
      }
      
      if (!courseCode) {
        courseCode = Object.values(courseCodes.value).find(c => {
          const shortCode = c.supabaseData?.short_code?.toString().toLowerCase()
          if (!shortCode) return false
          return mCode.includes(shortCode) || shortCode.includes(mCode)
        })
      }

      if (courseCode && courseCode.color) {
        modulesInWeek.add(courseCode.color)
      }
    }
  })
  
  const colors = Array.from(modulesInWeek)
  return colors
}

// Vérifier si une couleur est claire (pour le contraste du texte)
const isLightColor = (hexColor) => {
  if (!hexColor) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

// Navigation vers l'admin
const goToAdmin = () => {
  router.push('/admin/planning/manage')
}

// Montage du composant
onMounted(async () => {
  // Charger l'année académique active et ses classes
  await loadActiveAcademicYear()
  if (activeAcademicYear.value) {
    await loadClassesByYear(activeAcademicYear.value.id)
    console.log('[PlanningView] 📅 Année active:', activeAcademicYear.value.name)
    console.log('[PlanningView] 👥 Classes:', sortedClasses.value.length)
  }
  
  await loadPlanning()
})
</script>

<style scoped>
.planning-container {
  padding: 1.5rem;
  min-height: 100vh;
}

.planning-header-card {
  margin-bottom: 1.5rem;
}

.year-select-button :deep(.p-button) {
  padding: 0.75rem 1.25rem;
  transition: all 0.2s;
}

.year-select-button :deep(.p-button.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--primary-color-text);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
}

.year-select-button :deep(.p-button:not(.p-highlight):hover) {
  background: var(--surface-200);
}

/* Légende compacte */
.compact-legend :deep(.p-panel-content) {
  padding: 0.75rem;
}

.legend-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-section-header {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.25rem;
  margin-bottom: 0.25rem;
}

.legend-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.4rem;
}

.legend-item {
  display: flex;
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  height: 32px;
}

.legend-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-color: var(--primary-color);
}

.legend-color-strip {
  width: 6px;
  height: 100%;
  flex-shrink: 0;
}

.legend-item-content {
  padding: 0 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.legend-item-code {
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Module card enrichi */
.module-card {
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.module-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.module-details {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.planning-grid {
  overflow-x: auto;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.grid-header {
  display: flex;
  background: var(--primary-color);
  color: var(--primary-color-text);
  font-weight: 600;
}

.week-label-corner {
  min-width: 60px;
  width: 60px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  background: var(--primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.week-header {
  min-width: 40px;
  width: 40px;
  text-align: center;
  padding: 0.4rem 0.2rem;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 65px;
}

.week-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
}

.week-colors {
  display: flex;
  gap: 1px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  max-width: 34px;
  min-height: 10px;
}

.week-color-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.week-number {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Différenciation visuelle automne/printemps */
.autumn-week {
  background: var(--orange-600) !important;
}

.spring-week {
  background: var(--cyan-600) !important;
}

.grid-row {
  display: flex;
  border-bottom: 1px solid var(--surface-border);
}

.grid-row:last-child {
  border-bottom: none;
}

.day-label {
  min-width: 60px;
  width: 60px;
  background: var(--surface-100);
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--surface-border);
  font-size: 0.875rem;
}

.grid-cell {
  min-width: 40px;
  width: 40px;
  min-height: 45px;
  border-right: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.2s;
  position: relative;
}

.grid-cell:hover {
  opacity: 0.9;
}

.cell-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  padding: 0.25rem;
  white-space: pre-line;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.legend-color-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius);
  border: 2px solid var(--surface-border);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .planning-container {
    padding: 1rem;
  }
  
  .grid-cell,
  .week-header {
    min-width: 35px;
    width: 35px;
    min-height: 40px;
    font-size: 0.7rem;
  }
  
  .day-label {
    min-width: 50px;
    width: 50px;
    font-size: 0.8rem;
  }
  
  .cell-label {
    font-size: 0.6rem;
  }
}

@media (max-width: 576px) {
  .grid-cell,
  .week-header {
    min-width: 30px;
    width: 30px;
    min-height: 35px;
  }
  
  .day-label {
    min-width: 45px;
    width: 45px;
  }
}
</style>
