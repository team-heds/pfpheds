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

          <div v-for="week in groupedSessions" :key="week.weekNumber" class="week-card">
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
                <div class="session-info">
                  <span class="activity">{{ session.activity || 'Cours' }}</span>
                  <span class="room" v-if="session.room">
                    <i class="pi pi-map-marker"></i> {{ session.room }}
                  </span>
                </div>
                <div class="session-teachers" v-if="session.teachers?.length">
                  <i class="pi pi-users"></i>
                  {{ session.teachers.join(', ') }}
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
        :style="{ width: '500px' }"
        modal
      >
        <div class="session-form" v-if="editingSession">
          <div class="field">
            <label>Classe</label>
            <Dropdown 
              v-model="editingSession.classCode" 
              :options="classOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner une classe"
              class="w-full"
            />
          </div>
          
          <div class="field-row">
            <div class="field">
              <label>Semaine</label>
              <InputNumber v-model="editingSession.weekNumber" :min="1" :max="52" class="w-full" />
            </div>
            <div class="field">
              <label>Jour</label>
              <Dropdown 
                v-model="editingSession.day" 
                :options="dayOptions" 
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <label>Heure début</label>
              <InputText v-model="editingSession.startTime" placeholder="08:00" class="w-full" />
            </div>
            <div class="field">
              <label>Heure fin</label>
              <InputText v-model="editingSession.endTime" placeholder="10:00" class="w-full" />
            </div>
          </div>
          
          <div class="field">
            <label>Activité</label>
            <Dropdown 
              v-model="editingSession.activity" 
              :options="activityOptions"
              editable
              class="w-full"
            />
          </div>
          
          <div class="field">
            <label>Salle</label>
            <InputText v-model="editingSession.room" placeholder="Salle 101" class="w-full" />
          </div>
          
          <div class="field">
            <label>Notes</label>
            <Textarea v-model="editingSession.notes" rows="2" class="w-full" />
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
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import { 
  getModulePlanning, 
  getModulePlanningStats,
  saveModuleTimeSlot,
  deleteModuleTimeSlot,
  getAvailableClasses
} from '@/services/modulePlanningService'

const route = useRoute()
const router = useRouter()
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
  
  return Object.values(byWeek).sort((a, b) => a.weekNumber - b.weekNumber)
})

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
    startTime: '09:00',
    endTime: '11:00',
    moduleCode: module.value?.code,
    activity: 'Cours',
    room: '',
    notes: ''
  }
  showDialog.value = true
}

function openEditDialog(session) {
  editingSession.value = {
    id: session.id,
    classCode: session.classCode,
    weekNumber: session.weekNumber,
    day: session.day?.toLowerCase(),
    startTime: session.startTime,
    endTime: session.endTime,
    moduleCode: session.moduleCode,
    activity: session.activity,
    room: session.room,
    notes: session.notes
  }
  showDialog.value = true
}

async function saveSession() {
  if (!editingSession.value) return
  
  saving.value = true
  try {
    await saveModuleTimeSlot({
      id: editingSession.value.id,
      class_code: editingSession.value.classCode,
      week_number: editingSession.value.weekNumber,
      day: editingSession.value.day,
      start_time: editingSession.value.startTime,
      end_time: editingSession.value.endTime,
      module_code: module.value?.code,
      activity: editingSession.value.activity,
      room: editingSession.value.room,
      notes: editingSession.value.notes
    })
    
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Séance enregistrée', life: 2000 })
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
      const result = await deleteModuleTimeSlot(session.id)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Supprimé', life: 2000 })
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
  grid-template-columns: 100px 120px 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  background: var(--surface-100);
  transform: translateX(4px);
}

.session-day {
  display: flex;
  flex-direction: column;
}

.day-name {
  font-weight: 600;
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

.session-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.activity {
  font-weight: 500;
}

.room {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.session-teachers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
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
    gap: 0.5rem;
  }
  
  .stats-row {
    flex-wrap: wrap;
  }
  
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
