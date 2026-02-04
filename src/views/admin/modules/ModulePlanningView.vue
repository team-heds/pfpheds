<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="`Planning - ${module?.title || 'Module'}`"
        :subtitle="`${module?.code || ''} • ${stats.totalSessions} séances • ${stats.totalHours}h`"
        icon="pi pi-calendar" 
      />
    </template>

    <div class="module-planning">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement du planning...</p>
      </div>

      <div v-else>
        <!-- Actions bar -->
        <div class="actions-bar">
          <div class="left-actions">
            <Button 
              icon="pi pi-arrow-left" 
              label="Retour au module" 
              class="p-button-text"
              @click="$router.push(`/admin/modules/${moduleId}/manage`)"
            />
          </div>
          <div class="right-actions">
            <Button 
              icon="pi pi-plus" 
              label="Ajouter une séance" 
              @click="openAddDialog"
            />
            <Button 
              icon="pi pi-refresh" 
              class="p-button-text"
              @click="loadData"
              :loading="loading"
            />
          </div>
        </div>

        <!-- Stats cards -->
        <div class="stats-row">
          <div class="stat-mini">
            <i class="pi pi-calendar"></i>
            <div>
              <span class="value">{{ stats.totalSessions }}</span>
              <span class="label">Séances</span>
            </div>
          </div>
          <div class="stat-mini">
            <i class="pi pi-clock"></i>
            <div>
              <span class="value">{{ stats.totalHours }}h</span>
              <span class="label">Total</span>
            </div>
          </div>
          <div class="stat-mini">
            <i class="pi pi-hashtag"></i>
            <div>
              <span class="value">{{ stats.weeksCount }}</span>
              <span class="label">Semaines</span>
            </div>
          </div>
        </div>

        <!-- Planning par semaine -->
        <div class="planning-grid">
          <div v-if="groupedSessions.length === 0" class="empty-state">
            <i class="pi pi-calendar-times"></i>
            <h3>Aucune séance planifiée</h3>
            <p>Ajoutez des séances pour ce module</p>
            <Button label="Ajouter une séance" icon="pi pi-plus" @click="openAddDialog" />
          </div>

          <div v-for="week in groupedSessions" :key="week.weekNumber" :id="`week-${week.weekNumber}`" class="week-card">
            <div class="week-header">
              <h3>Semaine {{ week.weekNumber }}</h3>
              <Tag :value="`${week.sessions.length} séance(s)`" severity="info" />
            </div>
            
            <div class="sessions-list">
              <div 
                v-for="session in week.sessions" 
                :key="session.id" 
                class="session-item"
                @click="openEditDialog(session)"
              >
                <div class="session-day">
                  <span class="day-name">{{ session.displayDay }}</span>
                  <span class="day-date" v-if="session.date">{{ session.date }}</span>
                </div>
                <div class="session-time">
                  <i class="pi pi-clock"></i>
                  {{ session.displayTime }}
                </div>
                <div class="session-course-info">
                  <div class="course-title" v-if="session.courseTitle">
                    {{ session.courseTitle }}
                  </div>
                  <div class="course-details">
                    <Tag v-if="session.classCode" :value="session.classCode.toUpperCase()" severity="info" class="mr-2" />
                    <span class="activity">{{ session.activity || 'Cours' }}</span>
                    <span class="room" v-if="session.room">
                      <i class="pi pi-map-marker"></i> {{ session.room }}
                    </span>
                  </div>
                </div>
                <div class="session-teachers" v-if="session.teachers?.length">
                  <i class="pi pi-users"></i>
                  <div class="teachers-list">
                    <Chip 
                      v-for="(teacher, idx) in session.teachers.slice(0, 3)" 
                      :key="idx"
                      :label="teacher" 
                      icon="pi pi-user"
                      class="teacher-chip"
                    />
                    <Badge v-if="session.teachers.length > 3" :value="`+${session.teachers.length - 3}`" severity="warning" />
                  </div>
                </div>
                <div class="session-actions">
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-text p-button-sm"
                    @click.stop="openEditDialog(session)"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    @click.stop="confirmDelete(session)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog: Ajouter/Modifier séance -->
      <Dialog 
        v-model:visible="showDialog" 
        :header="editingSession?.id ? 'Modifier la séance' : 'Ajouter une séance'"
        :style="{ width: '700px' }"
        modal
      >
        <div class="session-form" v-if="editingSession">
          <div class="field-row">
            <div class="field">
              <label>Classe / Volée</label>
              <Dropdown 
                v-model="editingSession.classCode" 
                :options="classOptions" 
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionner une classe"
                class="w-full"
              />
            </div>
            <div class="field">
              <label>Semaine</label>
              <InputNumber v-model="editingSession.weekNumber" :min="1" :max="52" class="w-full" />
            </div>
            <div class="field">
              <label>Jour</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <Button 
                  v-for="opt in dayOptions" 
                  :key="opt.value"
                  :label="opt.label"
                  :severity="editingSession.day === opt.value ? 'primary' : 'secondary'"
                  :outlined="editingSession.day !== opt.value"
                  size="small"
                  @click="editingSession.day = opt.value"
                  type="button"
                />
              </div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <label>Date</label>
              <InputMask v-model="editingSession.date" mask="99.99.9999" placeholder="16.02.2026" class="w-full" />
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <label>Heure début</label>
              <InputMask v-model="editingSession.startTime" mask="99:99" placeholder="09:00" class="w-full" />
            </div>
            <div class="field">
              <label>Heure fin</label>
              <InputMask v-model="editingSession.endTime" mask="99:99" placeholder="11:00" class="w-full" />
            </div>
          </div>
          
          <div class="field">
            <label>Nom du cours (affiché dans le planning)</label>
            <Textarea 
              v-model="editingSession.courseTitle" 
              placeholder="Ex: Introduction Module: questions-réponses en lien avec la vidéo"
              :rows="2"
              class="w-full"
            />
            <small class="text-500">Ce texte apparaîtra comme titre principal du cours</small>
          </div>
          
          <div class="field">
            <label>Détails / Activité complémentaire</label>
            <Dropdown 
              v-model="editingSession.activity" 
              :options="activityOptions"
              editable
              placeholder="Type d'activité"
              class="w-full"
            />
          </div>
          
          <div class="field">
            <label>Enseignants (max 6)</label>
            <AutoComplete 
              v-model="editingSession.teachers"
              :suggestions="filteredTeachers"
              @complete="searchTeachers"
              optionLabel="name"
              placeholder="Saisissez un nom (Entrée pour valider)"
              multiple
              :forceSelection="false"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <i v-if="slotProps.option.isNew" class="pi pi-plus mr-2 text-green-500"></i>
                  <span :class="{ 'font-bold': slotProps.option.isNew }">
                    {{ slotProps.option.isNew ? 'Ajouter : ' : '' }}{{ slotProps.option.name }}
                  </span>
                </div>
              </template>
            </AutoComplete>
            <small class="text-500">Sélectionnez jusqu'à 6 enseignants</small>
          </div>
          
          <div class="field-row">
            <div class="field">
              <label>Salle</label>
              <InputText v-model="editingSession.room" placeholder="Salle 101" class="w-full" />
            </div>
            <div class="field">
              <label>Notes</label>
              <InputText v-model="editingSession.notes" placeholder="Notes additionnelles" class="w-full" />
            </div>
          </div>
        </div>

        <template #footer>
          <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="saveSession" :loading="saving" />
        </template>
      </Dialog>

      <!-- Confirm Dialog -->
      <ConfirmDialog />
      <Toast />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'
import InputMask from 'primevue/inputmask'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import { 
  getModulePlanningStats,
  saveModuleTimeSlot,
  deleteModuleTimeSlot,
  getAvailableClasses
} from '@/services/modulePlanningService'

const route = useRoute()
const confirm = useConfirm()
const toast = useToast()

const moduleId = computed(() => route.params.id)

// State
const loading = ref(true)
const saving = ref(false)
const module = ref(null)
const sessions = ref([])
const stats = ref({ totalSessions: 0, totalHours: 0, weeksCount: 0 })
const classes = ref([])
const teachers = ref([])
const filteredTeachers = ref([])

// Dialog
const showDialog = ref(false)
const editingSession = ref(null)

// Options
const classOptions = computed(() => 
  classes.value.map(c => ({ label: c, value: c }))
)

const dayOptions = [
  { label: 'Lundi', value: 'lundi' },
  { label: 'Mardi', value: 'mardi' },
  { label: 'Mercredi', value: 'mercredi' },
  { label: 'Jeudi', value: 'jeudi' },
  { label: 'Vendredi', value: 'vendredi' }
]

const activityOptions = ['Cours', 'TP', 'TD', 'Examen', 'Atelier', 'Conférence', 'Stage']

// Grouped sessions by week
const groupedSessions = computed(() => {
  const byWeek = {}
  
  sessions.value.forEach(s => {
    const week = s.weekNumber
    if (!byWeek[week]) {
      byWeek[week] = { weekNumber: week, sessions: [] }
    }
    byWeek[week].sessions.push(s)
  })
  
  return Object.values(byWeek).sort((a, b) => {
    const getAcademicOrder = (w) => (w >= 38 ? w - 38 : w + 16);
    const orderA = getAcademicOrder(a.weekNumber);
    const orderB = getAcademicOrder(b.weekNumber);
    return orderA - orderB;
  })
})

const lastEditedWeek = ref(null)

// Load data
async function loadData() {
  loading.value = true
  try {
    // Load module info
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId.value)
      .single()
    
    if (moduleError) throw moduleError
    module.value = moduleData
    
    // Load planning stats
    const planningStats = await getModulePlanningStats(moduleId.value)
    stats.value = planningStats
    sessions.value = planningStats.sessions
    
    // Load available classes
    classes.value = await getAvailableClasses()
    if (classes.value.length === 0) {
      classes.value = ['bac26', 'bac25', 'bac24']
    }
    
    // Load teachers
    try {
      const { data: teacherData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, forname, family_name, email')
        .in('role', ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio'])
      
      if (teacherData && teacherData.length > 0) {
        teachers.value = teacherData.map(t => ({
          id: t.user_id,
          name: t.display_name || `${t.forname} ${t.family_name}`,
          email: t.email
        }))
      }
    } catch (error) {
      console.error('Erreur chargement enseignants:', error)
    }

    // Scroll to last edited week if exists
    if (lastEditedWeek.value) {
      setTimeout(() => {
        const element = document.getElementById(`week-${lastEditedWeek.value}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  } catch (error) {
    console.error('Erreur chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le planning', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  editingSession.value = {
    id: null,
    classCode: classes.value[0] || 'bac26',
    weekNumber: getCurrentWeek(),
    day: 'lundi',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    moduleCode: module.value?.code,
    courseTitle: '',
    activity: 'Cours',
    teachers: [],
    room: '',
    notes: ''
  }
  showDialog.value = true
}

function openEditDialog(session) {
  // Normaliser les enseignants en objets pour AutoComplete
  const normalizedTeachers = (session.teachers || []).map(t => {
    if (typeof t === 'string') {
      return { name: t }
    }
    return t
  })
  
  editingSession.value = {
    id: session.id,
    classCode: session.classCode,
    weekNumber: session.weekNumber,
    day: session.day?.toLowerCase(),
    date: session.date || '',
    startTime: session.startTime,
    endTime: session.endTime,
    moduleCode: session.moduleCode,
    courseTitle: session.courseTitle || '',
    activity: session.activity,
    teachers: normalizedTeachers,
    room: session.room,
    notes: session.notes
  }
  showDialog.value = true
}

async function saveSession() {
  if (!editingSession.value) return
  
  saving.value = true
  try {
    // Normaliser les enseignants (extraire uniquement les noms)
    const normalizedTeachers = (editingSession.value.teachers || []).map(t => {
      return typeof t === 'object' && t !== null ? t.name : t
    })
    
    await saveModuleTimeSlot({
      id: editingSession.value.id,
      class_code: editingSession.value.classCode,
      week_number: editingSession.value.weekNumber,
      day: editingSession.value.day,
      date: editingSession.value.date,
      start_time: editingSession.value.startTime,
      end_time: editingSession.value.endTime,
      module_code: module.value?.code,
      course_title: editingSession.value.courseTitle,
      activity: editingSession.value.activity,
      teachers: normalizedTeachers,
      room: editingSession.value.room,
      notes: editingSession.value.notes
    })
    
    lastEditedWeek.value = editingSession.value.weekNumber
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: `Séance semaine ${editingSession.value.weekNumber} enregistrée`, 
      life: 2000 
    })
    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Erreur save:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(session) {
  confirm.require({
    message: `Supprimer la séance du ${session.displayDay} semaine ${session.weekNumber} ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      lastEditedWeek.value = session.weekNumber
      const result = await deleteModuleTimeSlot(session.id)
      if (result.success) {
        toast.add({ 
          severity: 'success', 
          summary: 'Supprimé', 
          detail: `Séance semaine ${session.weekNumber} supprimée`,
          life: 2000 
        })
        await loadData()
      } else {
        toast.add({ severity: 'error', summary: 'Erreur', detail: result.message, life: 3000 })
      }
    }
  })
}

function getCurrentWeek() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now - start
  const oneWeek = 604800000
  return Math.ceil(diff / oneWeek)
}

function searchTeachers(event) {
  const query = event.query.toLowerCase()
  
  // Filtrer les enseignants existants
  let filtered = []
  if (!query.trim()) {
    filtered = [...teachers.value]
  } else {
    filtered = teachers.value.filter(teacher => 
      teacher.name.toLowerCase().includes(query)
    )
  }
  
  // Ajouter l'option de création si le texte n'existe pas exactement
  if (query.trim() && !filtered.some(t => t.name.toLowerCase() === query)) {
    filtered.unshift({ name: event.query, isNew: true })
  }
  
  filteredTeachers.value = filtered
}

onMounted(loadData)
</script>

<style scoped>
.module-planning {
  padding: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.right-actions {
  display: flex;
  gap: 0.5rem;
}

.stats-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-mini {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-mini i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-mini .value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-mini .label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.planning-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: var(--surface-card);
  border-radius: 1rem;
}

.empty-state i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.week-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.week-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  display: grid;
  grid-template-columns: 120px 140px 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--surface-border);
}

.session-item:hover {
  background: var(--surface-100);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.session-day {
  display: flex;
  flex-direction: column;
}

.day-name {
  font-weight: 600;
  text-transform: capitalize;
}

.day-date {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.session-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-weight: 500;
}

.session-course-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.course-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.course-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.activity {
  font-weight: 500;
  font-size: 0.9rem;
}

.room {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.session-teachers {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  min-width: 200px;
}

.session-teachers i {
  margin-top: 0.3rem;
}

.teachers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.teacher-chip {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.session-actions {
  display: flex;
  gap: 0.25rem;
}

/* Form */
.session-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .session-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .session-teachers {
    min-width: auto;
    width: 100%;
  }
  
  .stats-row {
    flex-wrap: wrap;
  }
  
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
