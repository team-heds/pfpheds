<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Dashboard Secrétariat — Soins Infirmiers" 
        subtitle="Vue d'ensemble et gestion centralisée de la filière SI" 
        icon="pi pi-heart-fill" 
      />
    </template>

    <div class="dashboard-si">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <div v-else>
        <!-- ============================================ -->
        <!-- KPI CARDS                                    -->
        <!-- ============================================ -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Année académique</span>
              <span class="kpi-value">{{ activeYearName || '—' }}</span>
              <span class="kpi-sub" v-if="activeYearClasses > 0">{{ activeYearClasses }} classe(s)</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
              <i class="pi pi-book"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Modules</span>
              <span class="kpi-value">{{ modulesCount }}</span>
              <span class="kpi-sub">{{ modulesWithPlanningCount }} année(s)</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <i class="pi pi-users"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Enseignants SI</span>
              <span class="kpi-value">{{ teachersCount }}</span>
              <span class="kpi-sub">{{ teachersAssignedCount }} assignés</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
              <i class="pi pi-clock"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Créneaux planning</span>
              <span class="kpi-value">{{ totalSlots }}</span>
              <span class="kpi-sub">{{ currentWeekSlots }} cette semaine</span>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ALERTES                                      -->
        <!-- ============================================ -->
        <div class="section-card alerts-section" v-if="alerts.length > 0">
          <div class="section-header">
            <h3><i class="pi pi-bell"></i> Alertes & Notifications</h3>
            <Badge :value="alerts.length" severity="danger" />
          </div>
          <div class="alerts-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="'alert-' + alert.severity">
              <i :class="alert.icon"></i>
              <div class="alert-content">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-message">{{ alert.message }}</span>
              </div>
              <Button v-if="alert.action" :label="alert.actionLabel" size="small" severity="secondary" outlined @click="handleAlertAction(alert)" />
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- RACCOURCIS RAPIDES                           -->
        <!-- ============================================ -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-bolt"></i> Accès rapides</h3>
          </div>
          <div class="shortcuts-grid">
            <!-- Planning -->
            <div class="shortcut-card" @click="$router.push('/admin/planning/weekly')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                <i class="pi pi-calendar"></i>
              </div>
              <div class="shortcut-info">
                <h4>Planning Hebdomadaire</h4>
                <p>Voir et modifier les horaires par semaine</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Structure Mini Brique -->
            <div class="shortcut-card" @click="$router.push('/admin/planning')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                <i class="pi pi-th-large"></i>
              </div>
              <div class="shortcut-info">
                <h4>Structure Mini Brique</h4>
                <p>Gestion de la structure annuelle des modules</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Vue Journalière / Salles -->
            <div class="shortcut-card" @click="$router.push('/admin/soins-infirmiers/planning-journalier')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                <i class="pi pi-building"></i>
              </div>
              <div class="shortcut-info">
                <h4>Vue Journalière / Salles</h4>
                <p>Cours par jour, enseignants et salles</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Enseignants SI -->
            <div class="shortcut-card" @click="$router.push('/admin/teachers-si')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                <i class="pi pi-users"></i>
              </div>
              <div class="shortcut-info">
                <h4>Enseignants SI</h4>
                <p>Liste et gestion des enseignants</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Modules -->
            <div class="shortcut-card" @click="$router.push('/admin/modules')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #ec4899, #db2777);">
                <i class="pi pi-book"></i>
              </div>
              <div class="shortcut-info">
                <h4>Modules</h4>
                <p>Administration des modules de cours</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Années académiques -->
            <div class="shortcut-card" @click="$router.push('/admin/planning/years')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #06b6d4, #0891b2);">
                <i class="pi pi-calendar-plus"></i>
              </div>
              <div class="shortcut-info">
                <h4>Années Académiques</h4>
                <p>Créer et gérer les années et cohortes</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Contenu Multimédia -->
            <div class="shortcut-card" @click="$router.push('/admin/academic/video-library')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                <i class="pi pi-video"></i>
              </div>
              <div class="shortcut-info">
                <h4>Contenu Multimédia</h4>
                <p>Vidéos et ressources pédagogiques</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>

            <!-- Kanban Tâches -->
            <div class="shortcut-card" @click="$router.push('/admin/academic/kanban')">
              <div class="shortcut-icon" style="background: linear-gradient(135deg, #64748b, #475569);">
                <i class="pi pi-th-large"></i>
              </div>
              <div class="shortcut-info">
                <h4>Ticket Tâches</h4>
                <p>Suivi des tâches en mode Kanban</p>
              </div>
              <i class="pi pi-chevron-right shortcut-arrow"></i>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- RÉSUMÉ PLANNING SEMAINE COURANTE             -->
        <!-- ============================================ -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-calendar"></i> Planning — Semaine {{ currentISOWeek }}</h3>
            <div class="flex align-items-center gap-2">
              <Badge :value="currentWeekSlots + ' créneaux'" severity="info" />
              <Button label="Voir le planning complet" icon="pi pi-external-link" size="small" text @click="$router.push('/admin/planning/weekly')" />
            </div>
          </div>

          <div v-if="currentWeekSlots > 0" class="calendar-grid">
            <div v-for="dayGroup in currentWeekSlotsByDay" :key="dayGroup.day" class="calendar-day" :class="{ 'calendar-day--empty': dayGroup.slots.length === 0 }">
              <div class="calendar-day-header">
                <span class="calendar-day-name">{{ dayGroup.dayLabel }}</span>
                <span v-if="dayGroup.slots.length > 0" class="calendar-day-count">{{ dayGroup.slots.length }}</span>
              </div>
              <div class="calendar-day-body">
                <div v-if="dayGroup.slots.length === 0" class="calendar-day-empty">
                  <i class="pi pi-minus"></i>
                </div>
                <div v-for="slot in dayGroup.slots" :key="slot.id" class="calendar-slot" :style="{ borderLeftColor: getSlotModuleColor(slot.moduleCode) }">
                  <div class="calendar-slot-time">
                    {{ slot.startTime && slot.startTime !== 'null' ? `${slot.startTime} - ${slot.endTime}` : 'Async' }}
                  </div>
                  <div class="calendar-slot-course" :title="slot.courseTitle || slot.activity || ''">
                    {{ slot.courseTitle || slot.activity || '—' }}
                  </div>
                  <div class="calendar-slot-footer">
                    <span v-if="slot.classCode" class="calendar-slot-class" :style="{ background: getClassColor(slot.classCode), color: '#fff' }">{{ slot.classCode }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-calendar-times"></i>
            <p>Aucun créneau cette semaine</p>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- MODULES RÉCENTS                              -->
        <!-- ============================================ -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-book"></i> Modules ({{ modulesCount }})</h3>
            <Button label="Voir tous" icon="pi pi-external-link" size="small" text @click="$router.push('/admin/modules')" />
          </div>

          <div v-if="modules.length > 0" class="modules-compact-list">
            <div v-for="mod in modules" :key="mod.id" class="module-compact-item">
              <div class="module-color-bar" :style="{ background: mod.color || '#94a3b8' }"></div>
              <div class="module-compact-info">
                <span class="module-number">{{ mod.number || '—' }}</span>
                <span class="module-title">{{ mod.title || '—' }}</span>
                <span class="module-meta" v-if="mod.responsable">{{ mod.responsable }}</span>
              </div>
              <div class="module-tags">
                <Tag v-if="mod.year || mod.annee" :value="`A${mod.year || mod.annee}`" severity="info" class="tag-small" />
                <Tag v-if="mod.semestre" :value="`S${mod.semestre}`" severity="warning" class="tag-small" />
                <Tag v-if="mod.credits" :value="`${mod.credits} ECTS`" severity="success" class="tag-small" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>Aucun module chargé</p>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- ENSEIGNANTS SI                               -->
        <!-- ============================================ -->
        <div class="section-card">
          <div class="section-header">
            <h3><i class="pi pi-users"></i> Enseignants SI ({{ teachers.length }})</h3>
            <div class="flex align-items-center gap-2">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchTeacher" placeholder="Rechercher..." class="p-inputtext-sm" style="width: 220px" />
              </span>
              <Button label="Gérer" icon="pi pi-external-link" size="small" text @click="$router.push('/admin/teachers-si')" />
            </div>
          </div>

          <div v-if="filteredTeachers.length > 0" class="teachers-list-grid">
            <div v-for="teacher in filteredTeachers" :key="teacher.id" class="teacher-item">
              <div class="teacher-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="teacher-info">
                <span class="teacher-name">{{ teacher.name }}</span>
                <span class="teacher-email">{{ teacher.email || '—' }}</span>
              </div>
              <div class="teacher-actions">
                <Button label="Focus" icon="pi pi-eye" size="small" :severity="selectedTeacherId === teacher.id ? 'primary' : 'secondary'" text @click="setTeacherFocus(teacher)" />
                <Button label="Profil" icon="pi pi-external-link" size="small" text @click="openTeacherProfile(teacher)" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-users"></i>
            <p>{{ searchTeacher ? 'Aucun enseignant trouvé' : 'Aucun enseignant SI' }}</p>
          </div>
        </div>

        <div class="section-card focus-teacher-section">
          <div class="section-header">
            <h3><i class="pi pi-id-card"></i> Focus Enseignant SI</h3>
            <div class="flex align-items-center gap-2" v-if="focusTeacher">
              <Button label="Ouvrir dashboard" icon="pi pi-external-link" size="small" text @click="openTeacherProfile(focusTeacher)" />
              <Button label="Réinitialiser" icon="pi pi-times" size="small" severity="secondary" text @click="clearTeacherFocus" />
            </div>
          </div>

          <div v-if="!focusTeacher" class="empty-state">
            <i class="pi pi-arrow-up"></i>
            <p>Sélectionnez un enseignant avec le bouton Focus</p>
          </div>

          <div v-else>
            <div class="focus-teacher-head">
              <div>
                <h4>{{ focusTeacher.name || 'Enseignant' }}</h4>
                <small>{{ focusTeacher.email || 'Aucun email' }}</small>
              </div>
            </div>

            <div v-if="focusLoading" class="loading-inline">
              <ProgressSpinner style="width: 28px; height: 28px" strokeWidth="6" />
              <span>Chargement du profil enseignant...</span>
            </div>

            <div v-else-if="focusError" class="empty-state">
              <i class="pi pi-exclamation-triangle"></i>
              <p>{{ focusError }}</p>
            </div>

            <div v-else class="focus-content-grid">
              <div class="focus-stat-card">
                <span class="label">Cours assignés</span>
                <strong>{{ focusTeacherData.stats?.coursesCount || 0 }}</strong>
              </div>
              <div class="focus-stat-card">
                <span class="label">Heures/semaine</span>
                <strong>{{ focusTeacherData.stats?.weeklyHours || 0 }}h</strong>
              </div>
              <div class="focus-stat-card">
                <span class="label">Séances planifiées</span>
                <strong>{{ focusTeacherData.stats?.upcomingCount || 0 }}</strong>
              </div>
              <div class="focus-stat-card">
                <span class="label">Étudiants</span>
                <strong>{{ focusTeacherData.stats?.studentsCount || 0 }}</strong>
              </div>
            </div>

            <div class="focus-subsection">
              <h5>Prochaines séances</h5>
              <div v-if="(focusTeacherData.upcomingSessions || []).length === 0" class="empty-state small-empty">
                <p>Aucune séance à venir</p>
              </div>
              <div v-else class="focus-sessions-list">
                <div v-for="session in focusTeacherData.upcomingSessions.slice(0, 5)" :key="session.id" class="focus-session-item">
                  <span class="session-when">S{{ session.weekNumber }} • {{ session.day }} {{ session.time }}</span>
                  <span class="session-course">{{ session.course || 'Cours' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import planningService from '@/service/planningService'
import academicYearService from '@/service/academicYearService'
import modulesService from '@/service/modulesService'
import { supabase } from '@/supabase'
import { getSITeachers } from '@/service/academicKpiService'
import { loadEnseignantDashboard } from '@/service/enseignantDashboardService'

const router = useRouter()

// State
const loading = ref(true)
const activeYearName = ref('')
const activeYearClasses = ref(0)
const activeYearId = ref(null)
const modules = ref([])
const teachers = ref([])
const searchTeacher = ref('')
const teachersCount = ref(0)
const teachersAssignedCount = ref(0)
const selectedTeacherId = ref('')
const focusTeacher = ref(null)
const focusTeacherData = ref({ stats: {}, upcomingSessions: [] })
const focusLoading = ref(false)
const focusError = ref('')
const totalSlots = ref(0)
const currentWeekSlots = ref(0)
const currentWeekSlotsData = ref([])
const alerts = ref([])

// Computed
const modulesCount = computed(() => modules.value.length)
const modulesWithPlanningCount = computed(() => {
  const years = new Set(modules.value.map(m => m.year || m.annee).filter(Boolean))
  return years.size
})

const filteredTeachers = computed(() => {
  if (!searchTeacher.value) return teachers.value
  const term = searchTeacher.value.toLowerCase()
  return teachers.value.filter(t =>
    (t.name || '').toLowerCase().includes(term) ||
    (t.email || '').toLowerCase().includes(term)
  )
})

const currentISOWeek = computed(() => {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const jan4Day = jan4.getDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - jan4Day + 1)
  const diff = now - week1Monday
  return Math.ceil((diff / 86400000 + 1) / 7)
})

const currentWeekSlotsByDay = computed(() => {
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']
  const dayLabels = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', distance: 'Dist' }
  const dayFull = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance' }
  const grouped = {}
  
  currentWeekSlotsData.value.forEach(slot => {
    const d = (slot.day || '').toLowerCase()
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(slot)
  })
  
  return dayOrder.map(d => ({
    day: d,
    dayLabel: dayLabels[d] || d,
    dayFull: dayFull[d] || d,
    slots: (grouped[d] || []).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }))
})

const getSlotModuleColor = (moduleCode) => {
  if (!moduleCode) return '#94a3b8'
  const mod = modules.value.find(m => m.code === moduleCode || m.number === moduleCode)
  return mod?.color || '#94a3b8'
}

const CLASS_COLORS = {
  'BAC24-TP': '#3B82F6',
  'BAC25-TP': '#10B981',
  'BAC26-TP': '#F59E0B',
  'BAC24-EE': '#8B5CF6',
  'BAC25-EE': '#EC4899',
  'BAC26-EE': '#F97316',
  'BAC24': '#06B6D4',
  'BAC25': '#14B8A6',
  'BAC26': '#EF4444'
}

const getClassColor = (classCode) => {
  if (!classCode) return '#94a3b8'
  const upper = classCode.toUpperCase()
  return CLASS_COLORS[upper] || '#94a3b8'
}

// Load data
onMounted(async () => {
  try {
    await Promise.all([
      loadAcademicYear(),
      loadModules(),
      loadTeachers(),
      loadPlanningStats()
    ])
    generateAlerts()
  } catch (err) {
    console.error('Erreur chargement dashboard SI:', err)
  } finally {
    loading.value = false
  }
})

async function loadAcademicYear() {
  try {
    const activeYear = await academicYearService.getActiveAcademicYear()
    if (activeYear) {
      activeYearName.value = activeYear.name || ''
      activeYearId.value = activeYear.id
      
      const classes = await academicYearService.getClassesByAcademicYear(activeYear.id)
      activeYearClasses.value = classes?.length || 0
    }
  } catch (err) {
    console.error('Erreur chargement année:', err)
  }
}

function openTeacherProfile(teacher) {
  if (!teacher) return
  router.push({
    path: '/admin/soins-infirmiers/dashboard-enseignant',
    query: {
      teacherId: teacher.id || '',
      teacher: teacher.name || '',
      email: teacher.email || ''
    }
  })
}

async function setTeacherFocus(teacher) {
  if (!teacher?.id) return
  selectedTeacherId.value = teacher.id
  focusTeacher.value = teacher
  focusError.value = ''
  focusLoading.value = true

  try {
    const data = await loadEnseignantDashboard(
      teacher.id || null,
      teacher.email || null,
      teacher.name || null
    )
    focusTeacherData.value = {
      stats: data?.stats || {},
      upcomingSessions: data?.upcomingSessions || []
    }
  } catch (err) {
    console.error('Erreur chargement focus enseignant:', err)
    focusError.value = 'Impossible de charger les données de cet enseignant.'
  } finally {
    focusLoading.value = false
  }
}

function clearTeacherFocus() {
  selectedTeacherId.value = ''
  focusTeacher.value = null
  focusTeacherData.value = { stats: {}, upcomingSessions: [] }
  focusError.value = ''
}

async function loadModules() {
  try {
    const allModules = await modulesService.getAllModules()
    modules.value = (allModules || []).sort((a, b) => {
      const numA = a.number || ''
      const numB = b.number || ''
      return numA.localeCompare(numB, undefined, { numeric: true })
    })
  } catch (err) {
    console.error('Erreur chargement modules:', err)
  }
}

async function loadTeachers() {
  try {
    const list = await getSITeachers()
    teachers.value = (list || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    teachersCount.value = teachers.value.length
    teachersAssignedCount.value = teachers.value.filter(t => t.email).length
  } catch (err) {
    console.error('Erreur chargement enseignants:', err)
  }
}

async function loadPlanningStats() {
  try {
    if (!activeYearId.value) {
      const activeYear = await academicYearService.getActiveAcademicYear()
      if (activeYear) activeYearId.value = activeYear.id
    }
    
    if (!activeYearId.value) return
    
    // Récupérer les classes de l'année active
    const classes = await academicYearService.getClassesByAcademicYear(activeYearId.value)
    if (!classes || classes.length === 0) return
    
    // Convertir codes classes (B24-TP → BAC24-TP) pour matcher planning_time_slots
    const classCodes = classes.map(c => {
      const code = c.code || ''
      return code.match(/^B\d/) ? 'BAC' + code.substring(1) : code
    })
    
    // Total slots pour toutes les classes de l'année
    let totalCount = 0
    for (const code of classCodes) {
      const { count } = await supabase
        .from('planning_time_slots')
        .select('*', { count: 'exact', head: true })
        .ilike('class_code', code)
      totalCount += (count || 0)
    }
    totalSlots.value = totalCount
    
    // Current week slots — toutes les classes
    const weekNum = currentISOWeek.value
    const allSlots = []
    const seenIds = new Set()
    for (const code of classCodes) {
      const slots = await planningService.getWeekTimeSlots(code, weekNum)
      for (const s of (slots || [])) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id)
          allSlots.push({
            id: s.id,
            day: s.day,
            startTime: s.start_time,
            endTime: s.end_time,
            courseTitle: s.course_title,
            activity: s.activity,
            moduleCode: s.module_code,
            classCode: s.class_code
          })
        }
      }
    }
    currentWeekSlots.value = allSlots.length
    currentWeekSlotsData.value = allSlots
  } catch (err) {
    console.error('Erreur chargement stats planning:', err)
  }
}

function generateAlerts() {
  const newAlerts = []
  
  if (!activeYearName.value) {
    newAlerts.push({
      id: 'no-year',
      severity: 'danger',
      icon: 'pi pi-exclamation-triangle',
      title: 'Aucune année académique active',
      message: 'Veuillez créer ou activer une année académique pour commencer.',
      action: '/admin/planning/years',
      actionLabel: 'Gérer'
    })
  }
  
  if (modulesCount.value === 0) {
    newAlerts.push({
      id: 'no-modules',
      severity: 'warning',
      icon: 'pi pi-info-circle',
      title: 'Aucun module configuré',
      message: 'Les modules de cours n\'ont pas encore été créés.',
      action: '/admin/modules',
      actionLabel: 'Configurer'
    })
  }
  
  if (totalSlots.value === 0 && activeYearName.value) {
    newAlerts.push({
      id: 'no-planning',
      severity: 'warning',
      icon: 'pi pi-calendar-times',
      title: 'Planning vide',
      message: 'Aucun créneau n\'a été créé pour cette année académique.',
      action: '/admin/planning/weekly',
      actionLabel: 'Créer'
    })
  }
  
  if (currentWeekSlots.value === 0 && totalSlots.value > 0) {
    newAlerts.push({
      id: 'empty-week',
      severity: 'info',
      icon: 'pi pi-info-circle',
      title: `Semaine ${currentISOWeek.value} vide`,
      message: 'Aucun créneau prévu pour la semaine courante.',
      action: '/admin/planning/weekly',
      actionLabel: 'Voir'
    })
  }
  
  if (teachersCount.value === 0) {
    newAlerts.push({
      id: 'no-teachers',
      severity: 'warning',
      icon: 'pi pi-users',
      title: 'Aucun enseignant SI',
      message: 'La liste des enseignants SI est vide.',
      action: '/admin/teachers-si',
      actionLabel: 'Ajouter'
    })
  }
  
  alerts.value = newAlerts
}

function handleAlertAction(alert) {
  if (alert.action) router.push(alert.action)
}
</script>

<style scoped>
.dashboard-si {
  padding: 2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-container p {
  color: var(--text-color-secondary);
  font-size: 1.1rem;
}

/* ====== KPI CARDS ====== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon i {
  font-size: 1.5rem;
  color: white;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.kpi-sub {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* ====== SECTIONS ====== */
.section-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

/* ====== ALERTS ====== */
.alerts-section {
  border-left: 4px solid #ef4444;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
}

.alert-item.alert-danger { background: #fef2f2; }
.alert-item.alert-danger > i { color: #ef4444; }
.alert-item.alert-warning { background: #fffbeb; }
.alert-item.alert-warning > i { color: #f59e0b; }
.alert-item.alert-info { background: #eff6ff; }
.alert-item.alert-info > i { color: #3b82f6; }

.alert-item > i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.15rem;
}

.alert-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
}

.alert-message {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

/* ====== SHORTCUTS ====== */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.shortcut-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: var(--surface-ground);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.shortcut-card:hover {
  border-color: var(--primary-color);
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shortcut-icon i {
  font-size: 1.25rem;
  color: white;
}

.shortcut-info {
  flex: 1;
  min-width: 0;
}

.shortcut-info h4 {
  margin: 0 0 0.2rem 0;
  font-size: 1rem;
  color: var(--text-color);
}

.shortcut-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.shortcut-arrow {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.shortcut-card:hover .shortcut-arrow {
  opacity: 1;
  color: var(--primary-color);
}

/* ====== CALENDAR GRID ====== */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  background: var(--surface-ground);
  border-radius: 0.75rem;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.calendar-day--empty {
  opacity: 0.5;
}

.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background: var(--surface-border);
  border-bottom: 1px solid var(--surface-border);
}

.calendar-day-name {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-day-count {
  background: var(--primary-color);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day-body {
  flex: 1;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
  max-height: 400px;
}

.calendar-day-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-color-secondary);
  opacity: 0.4;
  font-size: 1.2rem;
}

.calendar-slot {
  background: var(--surface-card);
  border-left: 3px solid #94a3b8;
  border-radius: 0.35rem;
  padding: 0.45rem 0.6rem;
  transition: box-shadow 0.15s;
  cursor: default;
}

.calendar-slot:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.calendar-slot-time {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.15rem;
}

.calendar-slot-course {
  font-size: 0.78rem;
  color: var(--text-color);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.calendar-slot-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.2rem;
}

.calendar-slot-class {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  background: var(--surface-ground);
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
}

/* ====== MODULES COMPACT ====== */
.modules-compact-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 0.75rem;
}

.module-compact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: var(--surface-ground);
  transition: background 0.15s;
}

.module-compact-item:hover {
  background: var(--surface-hover);
}

.module-color-bar {
  width: 4px;
  height: 44px;
  border-radius: 2px;
  flex-shrink: 0;
}

.module-compact-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.module-number {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary-color);
}

.module-title {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-meta {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-tags {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.tag-small {
  font-size: 0.75rem;
}

/* ====== TEACHERS ====== */
.teachers-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.teacher-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.teacher-item:hover {
  background: var(--surface-hover);
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.teacher-avatar i {
  color: white;
  font-size: 1rem;
}

.teacher-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.teacher-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.teacher-email {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacher-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.focus-teacher-section {
  border-left: 4px solid #8b5cf6;
}

.focus-teacher-head {
  margin-bottom: 0.75rem;
}

.focus-teacher-head h4 {
  margin: 0;
  font-size: 1rem;
}

.focus-teacher-head small {
  color: var(--text-color-secondary);
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
}

.focus-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.75rem;
  margin: 0.75rem 0 1rem;
}

.focus-stat-card {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.focus-stat-card .label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.focus-stat-card strong {
  font-size: 1.1rem;
}

.focus-subsection h5 {
  margin: 0 0 0.5rem;
}

.focus-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.focus-session-item {
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 0.6rem 0.75rem;
}

.session-when {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.session-course {
  font-size: 0.88rem;
}

.small-empty {
  padding: 1rem;
}

/* ====== EMPTY STATE ====== */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
}

/* ====== RESPONSIVE ====== */
@media (max-width: 768px) {
  .dashboard-si {
    padding: 1rem;
  }
  
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .kpi-card {
    padding: 1rem;
  }
  
  .kpi-icon {
    width: 48px;
    height: 48px;
  }
  
  .kpi-value {
    font-size: 1.5rem;
  }
  
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
  
  .modules-compact-list,
  .teachers-list-grid {
    grid-template-columns: 1fr;
  }
  
  .calendar-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
