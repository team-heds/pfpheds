<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Attribution Enseignants SI" 
        subtitle="Gérez les enseignants Soins Infirmiers assignés à vos modules" 
        icon="pi pi-users" 
      />
    </template>

    <div class="teacher-assignment">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <div v-else class="assignment-grid">
        <!-- Filtres et actions -->
        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group">
              <label>Filière</label>
              <Dropdown 
                v-model="selectedFiliere" 
                :options="filiereOptions" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Toutes les filières"
                class="w-full"
              />
            </div>
            <div class="filter-group">
              <label>Année</label>
              <Dropdown 
                v-model="selectedYear" 
                :options="yearOptions" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Toutes les années"
                class="w-full"
              />
            </div>
            <div class="filter-group">
              <label>Module</label>
              <Dropdown 
                v-model="selectedModule" 
                :options="moduleOptions" 
                optionLabel="title" 
                optionValue="id"
                placeholder="Tous les modules"
                class="w-full"
                filter
              />
            </div>
            <div class="filter-group search-group">
              <label>Recherche</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText v-model="searchTerm" placeholder="Rechercher un enseignant..." class="w-full" />
              </span>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <i class="pi pi-book"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ modules.length }}</span>
              <span class="stat-label">Modules</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #10b981;">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ availableTeachers.length }}</span>
              <span class="stat-label">Enseignants disponibles</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #f59e0b;">
              <i class="pi pi-link"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalAssignments }}</span>
              <span class="stat-label">Assignations</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: #8b5cf6;">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalHours }}h</span>
              <span class="stat-label">Heures totales</span>
            </div>
          </div>
        </div>

        <!-- Liste des modules avec enseignants -->
        <div class="modules-section">
          <div class="section-header">
            <h3><i class="pi pi-book"></i> Modules et Enseignants</h3>
            <Button 
              label="Nouvelle assignation" 
              icon="pi pi-plus" 
              @click="showAssignDialog = true"
              severity="success"
            />
          </div>

          <div class="modules-list">
            <div 
              v-for="module in filteredModules" 
              :key="module.id" 
              class="module-card"
            >
              <div class="module-header">
                <div class="module-title-section">
                  <span class="module-number">{{ module.number }}</span>
                  <div class="module-details">
                    <h4>{{ module.title }}</h4>
                    <div class="module-meta">
                      <Tag :value="`Année ${module.year}`" severity="info" />
                      <Tag v-if="module.credits" :value="`${module.credits} ECTS`" />
                      <Tag v-if="module.heures_contact" :value="`${module.heures_contact}h`" severity="warning" />
                    </div>
                  </div>
                </div>
                <div class="module-actions">
                  <Button 
                    icon="pi pi-plus" 
                    v-tooltip="'Ajouter un enseignant'"
                    @click="openAssignToModule(module)"
                    class="p-button-rounded p-button-text"
                  />
                  <Button 
                    icon="pi pi-calendar" 
                    v-tooltip="'Voir le planning'"
                    @click="viewModulePlanning(module)"
                    class="p-button-rounded p-button-text p-button-info"
                  />
                </div>
              </div>

              <div class="teachers-section">
                <div v-if="module.teachers && module.teachers.length > 0" class="teachers-grid">
                  <div 
                    v-for="teacher in module.teachers" 
                    :key="teacher.id"
                    class="teacher-chip"
                  >
                    <Avatar 
                      :label="getInitials(teacher.name)" 
                      :style="{ backgroundColor: getAvatarColor(teacher.id) }"
                      shape="circle"
                      size="small"
                    />
                    <div class="teacher-info">
                      <span class="teacher-name">{{ teacher.name }}</span>
                      <span class="teacher-hours">{{ teacher.hours || 0 }}h</span>
                    </div>
                    <Button 
                      icon="pi pi-times" 
                      @click="removeTeacher(module, teacher)"
                      class="p-button-rounded p-button-text p-button-danger p-button-sm"
                      v-tooltip="'Retirer'"
                    />
                  </div>
                </div>
                <div v-else class="no-teachers">
                  <i class="pi pi-info-circle"></i>
                  <span>Aucun enseignant assigné</span>
                  <Button 
                    label="Assigner" 
                    icon="pi pi-plus" 
                    size="small"
                    @click="openAssignToModule(module)"
                    outlined
                  />
                </div>
              </div>
            </div>

            <div v-if="filteredModules.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module trouvé</p>
              <small>Modifiez vos filtres ou contactez l'administrateur</small>
            </div>
          </div>
        </div>

        <!-- Liste des enseignants disponibles -->
        <div class="teachers-section-card">
          <div class="section-header">
            <h3><i class="pi pi-users"></i> Enseignants Disponibles</h3>
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="teacherSearch" placeholder="Filtrer..." size="small" />
            </span>
          </div>

          <div class="teachers-available-list">
            <div 
              v-for="teacher in filteredTeachers" 
              :key="teacher.id"
              class="teacher-item"
              draggable="true"
              @dragstart="onDragStart($event, teacher)"
            >
              <Avatar 
                :label="getInitials(teacher.name)" 
                :style="{ backgroundColor: getAvatarColor(teacher.id) }"
                shape="circle"
              />
              <div class="teacher-details">
                <span class="name">{{ teacher.name }}</span>
                <span class="email">{{ teacher.email }}</span>
              </div>
              <div class="teacher-stats">
                <Tag :value="`${teacher.totalHours || 0}h`" severity="info" />
              </div>
            </div>

            <div v-if="filteredTeachers.length === 0" class="no-teachers">
              <i class="pi pi-users"></i>
              <span>Aucun enseignant disponible</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog d'assignation -->
      <Dialog 
        v-model:visible="showAssignDialog" 
        header="Assigner un enseignant" 
        :style="{ width: '500px' }"
        modal
      >
        <div class="assign-form">
          <div class="form-field">
            <label>Module</label>
            <Dropdown 
              v-model="assignForm.moduleId" 
              :options="modules" 
              optionLabel="title" 
              optionValue="id"
              placeholder="Sélectionner un module"
              class="w-full"
              filter
            />
          </div>
          <div class="form-field">
            <label>Enseignant</label>
            <Dropdown 
              v-model="assignForm.teacherId" 
              :options="availableTeachers" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Sélectionner un enseignant"
              class="w-full"
              filter
            />
          </div>
          <div class="form-field">
            <label>Heures</label>
            <InputNumber 
              v-model="assignForm.hours" 
              :min="0" 
              :max="500"
              suffix="h"
              class="w-full"
            />
          </div>
          <div class="form-field">
            <label>Rôle</label>
            <Dropdown 
              v-model="assignForm.role" 
              :options="roleOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner un rôle"
              class="w-full"
            />
          </div>
        </div>

        <template #footer>
          <Button label="Annuler" icon="pi pi-times" @click="showAssignDialog = false" text />
          <Button label="Assigner" icon="pi pi-check" @click="submitAssignment" :loading="saving" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useRoleStore } from '@/stores/role'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import { supabase } from '@/supabase'
import { useModules } from '@/composables/useModules'
import { getSITeachers } from '@/service/academicKpiService'

const router = useRouter()
const authStore = useAuthStore()
const roleStore = useRoleStore()
const toast = useToast()

// State
const loading = ref(true)
const saving = ref(false)
const showAssignDialog = ref(false)

// Filters
const selectedFiliere = ref(null)
const selectedYear = ref(null)
const selectedModule = ref(null)
const searchTerm = ref('')
const teacherSearch = ref('')

// Data
const { modules, loadModules } = useModules()
const availableTeachers = ref([])
const assignments = ref([])

// Form
const assignForm = ref({
  moduleId: null,
  teacherId: null,
  hours: 0,
  role: 'enseignant'
})

// Options
const filiereOptions = [
  { label: 'Toutes', value: null },
  { label: 'Soins Infirmiers', value: 'SI' },
  { label: 'Physiothérapie', value: 'PHYSIO' }
]

const yearOptions = [
  { label: 'Toutes', value: null },
  { label: '1ère année', value: 1 },
  { label: '2ème année', value: 2 },
  { label: '3ème année', value: 3 }
]

const roleOptions = [
  { label: 'Enseignant', value: 'enseignant' },
  { label: 'Responsable', value: 'responsable' },
  { label: 'Assistant', value: 'assistant' },
  { label: 'Intervenant', value: 'intervenant' }
]

// Computed
const moduleOptions = computed(() => {
  return [{ id: null, title: 'Tous les modules' }, ...modules.value]
})

const filteredModules = computed(() => {
  let result = [...modules.value]
  
  if (selectedFiliere.value) {
    result = result.filter(m => m.filiere === selectedFiliere.value)
  }
  
  if (selectedYear.value) {
    result = result.filter(m => m.year === selectedYear.value)
  }
  
  if (selectedModule.value) {
    result = result.filter(m => m.id === selectedModule.value)
  }
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(m => 
      m.title?.toLowerCase().includes(term) ||
      m.number?.toLowerCase().includes(term)
    )
  }
  
  return result
})

const filteredTeachers = computed(() => {
  if (!teacherSearch.value) return availableTeachers.value
  
  const term = teacherSearch.value.toLowerCase()
  return availableTeachers.value.filter(t => 
    t.name?.toLowerCase().includes(term) ||
    t.email?.toLowerCase().includes(term)
  )
})

const totalAssignments = computed(() => {
  return modules.value.reduce((acc, m) => acc + (m.teachers?.length || 0), 0)
})

const totalHours = computed(() => {
  return modules.value.reduce((acc, m) => {
    const moduleHours = m.teachers?.reduce((sum, t) => sum + (t.hours || 0), 0) || 0
    return acc + moduleHours
  }, 0)
})

// Methods
async function loadData() {
  loading.value = true
  
  try {
    // Load modules
    await loadModules()
    
    // Load available teachers
    const teachers = await getSITeachers()
    availableTeachers.value = teachers
    
    // Load assignments for each module
    await loadAssignments()
    
    console.log('✅ Données chargées:', {
      modules: modules.value.length,
      teachers: availableTeachers.value.length
    })
  } catch (error) {
    console.error('❌ Erreur chargement données:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

async function loadAssignments() {
  try {
    // Load all course_teachers assignments
    const { data, error } = await supabase
      .from('course_teachers')
      .select(`
        id,
        course_id,
        teacher_id,
        hours,
        role,
        courses(module_id),
        user_profiles(user_id, display_name, forname, family_name, email)
      `)
    
    if (error) {
      console.warn('⚠️ Erreur chargement assignations:', error)
      return
    }
    
    // Group by module
    const assignmentsByModule = {}
    data?.forEach(assign => {
      const moduleId = assign.courses?.module_id
      if (!moduleId) return
      
      if (!assignmentsByModule[moduleId]) {
        assignmentsByModule[moduleId] = []
      }
      
      assignmentsByModule[moduleId].push({
        id: assign.teacher_id,
        name: assign.user_profiles?.display_name || 
              `${assign.user_profiles?.forname || ''} ${assign.user_profiles?.family_name || ''}`.trim(),
        email: assign.user_profiles?.email,
        hours: assign.hours || 0,
        role: assign.role
      })
    })
    
    // Attach teachers to modules
    modules.value.forEach(module => {
      module.teachers = assignmentsByModule[module.id] || []
    })
    
  } catch (error) {
    console.error('❌ Erreur loadAssignments:', error)
  }
}

function openAssignToModule(module) {
  assignForm.value.moduleId = module.id
  assignForm.value.teacherId = null
  assignForm.value.hours = 0
  assignForm.value.role = 'enseignant'
  showAssignDialog.value = true
}

async function submitAssignment() {
  if (!assignForm.value.moduleId || !assignForm.value.teacherId) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner un module et un enseignant',
      life: 3000
    })
    return
  }
  
  saving.value = true
  
  try {
    // First, get or create a course for this module
    let courseId = null
    
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('module_id', assignForm.value.moduleId)
      .limit(1)
    
    if (existingCourses && existingCourses.length > 0) {
      courseId = existingCourses[0].id
    } else {
      // Create a default course for the module
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          module_id: assignForm.value.moduleId,
          name: 'Cours principal',
          code: `COURS-${assignForm.value.moduleId.substring(0, 8)}`
        })
        .select()
        .single()
      
      if (courseError) throw courseError
      courseId = newCourse.id
    }
    
    // Create the assignment
    const { error } = await supabase
      .from('course_teachers')
      .insert({
        course_id: courseId,
        teacher_id: assignForm.value.teacherId,
        hours: assignForm.value.hours,
        role: assignForm.value.role
      })
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant assigné avec succès',
      life: 3000
    })
    
    showAssignDialog.value = false
    await loadAssignments()
    
  } catch (error) {
    console.error('❌ Erreur assignation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Impossible d\'assigner l\'enseignant',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

async function removeTeacher(module, teacher) {
  try {
    // Find and delete the assignment
    const { error } = await supabase
      .from('course_teachers')
      .delete()
      .eq('teacher_id', teacher.id)
      .in('course_id', (
        await supabase
          .from('courses')
          .select('id')
          .eq('module_id', module.id)
      ).data?.map(c => c.id) || [])
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant retiré du module',
      life: 3000
    })
    
    await loadAssignments()
    
  } catch (error) {
    console.error('❌ Erreur suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de retirer l\'enseignant',
      life: 3000
    })
  }
}

function viewModulePlanning(module) {
  router.push(`/admin/planning?module=${module.id}`)
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function getAvatarColor(id) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
  const index = id?.charCodeAt(0) % colors.length || 0
  return colors[index]
}

function onDragStart(event, teacher) {
  event.dataTransfer.setData('teacher', JSON.stringify(teacher))
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.teacher-assignment {
  padding: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.assignment-grid {
  display: grid;
  gap: 1.5rem;
}

.filters-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.search-group {
  grid-column: span 2;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.modules-section, .teachers-section-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.module-card {
  background: var(--surface-ground);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--surface-border);
  transition: all 0.2s;
}

.module-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.module-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.module-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  background: var(--primary-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  min-width: 60px;
  text-align: center;
}

.module-details h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.module-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.module-actions {
  display: flex;
  gap: 0.25rem;
}

.teachers-section {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.teachers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.teacher-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-card);
  padding: 0.5rem 0.75rem;
  border-radius: 2rem;
  border: 1px solid var(--surface-border);
}

.teacher-info {
  display: flex;
  flex-direction: column;
}

.teacher-name {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
}

.teacher-hours {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.no-teachers {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 0.5rem;
}

.teachers-available-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.teacher-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  cursor: grab;
  transition: all 0.2s;
}

.teacher-item:hover {
  background: var(--primary-50);
  transform: translateX(4px);
}

.teacher-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.teacher-details .name {
  font-weight: 500;
  color: var(--text-color);
}

.teacher-details .email {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.assign-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .search-group {
    grid-column: span 1;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .module-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .module-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
