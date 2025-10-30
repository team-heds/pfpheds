<template>
  <AdminLayout class="planning-container">
    
    <!-- Header Card -->
    <Card class="planning-header-card">
      <template #header>
        <Toolbar class="border-noround">
          <template #start>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-calendar text-4xl text-primary"></i>
              <div>
                <h1 class="m-0 text-2xl font-bold">Planning Académique</h1>
                <p class="m-0 text-sm text-500">Bachelor of Science in Nursing</p>
              </div>
            </div>
          </template>
          
          <template #end>
            <div class="flex gap-2">
              <Dropdown 
                v-model="selectedYear" 
                :options="yearOptions" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Sélectionner une année"
                @change="loadPlanning"
                class="w-full md:w-20rem"
              />
              
              <Button 
                label="Mode Admin" 
                icon="pi pi-pencil" 
                @click="goToAdmin" 
                severity="info"
              />
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
    <div v-else class="planning-content mt-4">
      
      <!-- Année académique Info -->
      <Card v-if="activeAcademicYear" class="mb-4">
        <template #content>
          <div class="text-center">
            <Tag :value="selectedYear" severity="info" class="text-xl px-4 py-2"></Tag>
            <p class="mt-2 mb-0 text-600 text-lg">{{ activeAcademicYear.name }}</p>
            
            <!-- Indicateur modules Supabase -->
            <div v-if="supabaseModules.length > 0" class="mt-3 flex justify-content-center gap-3">
              <Tag severity="success" class="px-3">
                <i class="pi pi-database mr-2"></i>
                {{ supabaseModules.length }} modules Supabase chargés
              </Tag>
              <Tag severity="info" class="px-3">
                <i class="pi pi-link mr-2"></i>
                {{ Object.keys(courseCodes).filter(id => courseCodes[id].supabaseData).length }} enrichis
              </Tag>
            </div>
          </div>
        </template>
      </Card>

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
              <span class="week-number">S{{ week }}</span>
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

      <!-- Légende des codes de cours -->
      <Panel :toggleable="true">
        <template #header>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-palette text-pink-500 text-xl"></i>
            <span class="font-bold text-xl">Légende des cours</span>
            <Tag :value="`${Object.keys(courseCodes).length} codes`" class="ml-2"></Tag>
          </div>
        </template>
        
        <!-- 1ère année -->
        <div v-if="coursesByYear[1] && coursesByYear[1].length > 0" class="mb-4">
          <div class="text-xl font-bold text-primary mb-3">
            <i class="pi pi-graduation-cap mr-2"></i>1ère année
          </div>
          <div class="grid">
            <div 
              v-for="code in coursesByYear[1]" 
              :key="code.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="flex align-items-center gap-3 p-3 border-round surface-100 hover:surface-200 transition-colors transition-duration-150 module-card">
                <div 
                  class="legend-color-badge"
                  :style="{ backgroundColor: code.color }"
                ></div>
                <div class="flex-1">
                  <div class="font-bold text-900 text-lg">{{ code.moduleNumber || code.id.toUpperCase() }}</div>
                  <div class="text-sm text-600 mb-2">{{ code.supabaseData?.titre || code.label }}</div>
                  
                  <!-- Données Supabase enrichies -->
                  <div v-if="code.supabaseData" class="module-details">
                    <div v-if="code.supabaseData.responsable" class="text-xs text-500 mb-1">
                      <i class="pi pi-user mr-1"></i>
                      <strong>Responsable:</strong> {{ code.supabaseData.responsable }}
                    </div>
                    <div class="flex gap-3 text-xs text-500">
                      <span v-if="code.supabaseData.credits">
                        <i class="pi pi-star-fill mr-1"></i>
                        <strong>{{ code.supabaseData.credits }}</strong> crédits
                      </span>
                      <span v-if="code.supabaseData.heures_contact">
                        <i class="pi pi-clock mr-1"></i>
                        <strong>{{ code.supabaseData.heures_contact }}h</strong> contact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2ème année -->
        <div v-if="coursesByYear[2] && coursesByYear[2].length > 0" class="mb-4">
          <div class="text-xl font-bold text-primary mb-3">
            <i class="pi pi-graduation-cap mr-2"></i>2ème année
          </div>
          <div class="grid">
            <div 
              v-for="code in coursesByYear[2]" 
              :key="code.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="flex align-items-center gap-3 p-3 border-round surface-100 hover:surface-200 transition-colors transition-duration-150 module-card">
                <div 
                  class="legend-color-badge"
                  :style="{ backgroundColor: code.color }"
                ></div>
                <div class="flex-1">
                  <div class="font-bold text-900 text-lg">{{ code.moduleNumber || code.id.toUpperCase() }}</div>
                  <div class="text-sm text-600 mb-2">{{ code.supabaseData?.titre || code.label }}</div>
                  
                  <!-- Données Supabase enrichies -->
                  <div v-if="code.supabaseData" class="module-details">
                    <div v-if="code.supabaseData.responsable" class="text-xs text-500 mb-1">
                      <i class="pi pi-user mr-1"></i>
                      <strong>Responsable:</strong> {{ code.supabaseData.responsable }}
                    </div>
                    <div class="flex gap-3 text-xs text-500">
                      <span v-if="code.supabaseData.credits">
                        <i class="pi pi-star-fill mr-1"></i>
                        <strong>{{ code.supabaseData.credits }}</strong> crédits
                      </span>
                      <span v-if="code.supabaseData.heures_contact">
                        <i class="pi pi-clock mr-1"></i>
                        <strong>{{ code.supabaseData.heures_contact }}h</strong> contact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3ème année -->
        <div v-if="coursesByYear[3] && coursesByYear[3].length > 0" class="mb-4">
          <div class="text-xl font-bold text-primary mb-3">
            <i class="pi pi-graduation-cap mr-2"></i>3ème année
          </div>
          <div class="grid">
            <div 
              v-for="code in coursesByYear[3]" 
              :key="code.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="flex align-items-center gap-3 p-3 border-round surface-100 hover:surface-200 transition-colors transition-duration-150 module-card">
                <div 
                  class="legend-color-badge"
                  :style="{ backgroundColor: code.color }"
                ></div>
                <div class="flex-1">
                  <div class="font-bold text-900 text-lg">{{ code.moduleNumber || code.id.toUpperCase() }}</div>
                  <div class="text-sm text-600 mb-2">{{ code.supabaseData?.titre || code.label }}</div>
                  
                  <!-- Données Supabase enrichies -->
                  <div v-if="code.supabaseData" class="module-details">
                    <div v-if="code.supabaseData.responsable" class="text-xs text-500 mb-1">
                      <i class="pi pi-user mr-1"></i>
                      <strong>Responsable:</strong> {{ code.supabaseData.responsable }}
                    </div>
                    <div class="flex gap-3 text-xs text-500">
                      <span v-if="code.supabaseData.credits">
                        <i class="pi pi-star-fill mr-1"></i>
                        <strong>{{ code.supabaseData.credits }}</strong> crédits
                      </span>
                      <span v-if="code.supabaseData.heures_contact">
                        <i class="pi pi-clock mr-1"></i>
                        <strong>{{ code.supabaseData.heures_contact }}h</strong> contact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Autres (sans année) -->
        <div v-if="coursesByYear[0] && coursesByYear[0].length > 0">
          <div class="text-xl font-bold text-600 mb-3">
            <i class="pi pi-calendar mr-2"></i>Autres événements
          </div>
          <div class="grid">
            <div 
              v-for="code in coursesByYear[0]" 
              :key="code.id" 
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="flex align-items-center gap-3 p-3 border-round surface-100 hover:surface-200 transition-colors transition-duration-150">
                <div 
                  class="legend-color-badge"
                  :style="{ backgroundColor: code.color }"
                ></div>
                <div class="flex-1">
                  <div class="font-semibold text-900">{{ code.id.toUpperCase() }}</div>
                  <div class="text-sm text-600">{{ code.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
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
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
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

// Modules Supabase
const { modules: supabaseModules, loadModules, loading: modulesLoading } = useModules()

// Années académiques et classes
const { activeAcademicYear, sortedClasses, loadActiveAcademicYear, loadClassesByYear } = useAcademicYear()

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
  
  return sortedClasses.value.map(classItem => {
    const yearLevel = classItem.year_level === 1 ? '1ère' : classItem.year_level === 2 ? '2ème' : '3ème'
    return {
      label: `${yearLevel} année ${activeAcademicYear.value.name} / ${classItem.code}`,
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
  // Ordre académique : Automne (S38-S52, S1-S7) puis Printemps (S8-S37)
  const weeks = []

  // Semestre d'Automne : S38 → S52
  for (let w = 38; w <= 52; w++) {
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
    
    // Si end < start, il y a une coupure d'année (ex: S38-52 puis S1-7)
    if (end < start) {
      autumnLabel = `Automne: S${start}-52 & S1-${end}`
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
      const courseCodeId = module.number?.toString() || module.short_code?.toString() || `module_${module.id}`
      
      courseCodes.value[courseCodeId] = {
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
          year: module.year
        }
      }
    })
    
    console.log('[PlanningView] ✅ Codes de cours créés:', Object.keys(courseCodes.value).length)
    
    // Charger les cellules depuis Supabase (automne + printemps)
    const autumnCells = await planningService.getPlanningCells(selectedYear.value, 'autumn')
    const springCells = await planningService.getPlanningCells(selectedYear.value, 'spring')
    
    // Fusionner les cellules des 2 semestres dans un seul array
    planningCells.value = []
    
    // Convertir les objets en array
    if (autumnCells) {
      Object.values(autumnCells).forEach(cell => planningCells.value.push(cell))
    }
    if (springCells) {
      Object.values(springCells).forEach(cell => planningCells.value.push(cell))
    }
    
    console.log('[PlanningView] 🎯 Cellules chargées:', planningCells.value.length)
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
  
  const courseCode = courseCodes.value[cell.module_code]
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
  
  // Afficher le numéro de module
  const courseCode = courseCodes.value[cell.module_code]
  if (courseCode && courseCode.moduleNumber) {
    return courseCode.moduleNumber
  }
  
  return cell.module_code.toUpperCase()
}

// Obtenir le tooltip d'une cellule
const getCellTooltip = (day, week) => {
  const cell = planningCells.value.find(c => c.day === day && c.week_number === week)
  
  if (!cell || !cell.module_code) return ''
  
  const courseCode = courseCodes.value[cell.module_code]
  if (!courseCode) return cell.module_code
  
  // Tooltip enrichi avec données Supabase
  let tooltip = courseCode.label
  
  if (courseCode.supabaseData) {
    const data = courseCode.supabaseData
    if (data.title) tooltip += `\n\n📚 ${data.title}`
    if (data.responsable) tooltip += `\n👤 Responsable: ${data.responsable}`
    if (data.credits) tooltip += `\n⭐ ${data.credits} crédits ECTS`
  }
  
  return tooltip
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
  padding: 0.75rem 0;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
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
