<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Dashboard Enseignant" 
        subtitle="Votre emploi du temps et vos cours" 
        icon="pi pi-graduation-cap" 
      />
    </template>

    <div class="dashboard-enseignant">
      <!-- Loading spinner -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <div v-else class="dashboard-grid">
        
        <!-- Statistiques rapides -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <i class="pi pi-book"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Cours assignés</span>
              <span class="stat-value">{{ coursesCount }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #10b981;">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Heures/semaine</span>
              <span class="stat-value">{{ weeklyHours }}h</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #f59e0b;">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Prochain cours</span>
              <span class="stat-value">{{ nextCourse }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #8b5cf6;">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Étudiants</span>
              <span class="stat-value">{{ studentsCount }}</span>
            </div>
          </div>
        </div>

        <!-- Planning de la semaine -->
        <div class="section-card full-width">
          <h3><i class="pi pi-calendar"></i> Planning de la Semaine</h3>
          <div class="week-schedule">
            <div v-for="day in weekSchedule" :key="day.name" class="day-column">
              <h4>{{ day.name }}</h4>
              <div class="courses-list">
                <div v-for="course in day.courses" :key="course.id" class="course-block" :style="{ backgroundColor: course.color }">
                  <span class="course-time">{{ course.time }}</span>
                  <span class="course-name">{{ course.name }}</span>
                  <span class="course-room">{{ course.room }}</span>
                </div>
                <div v-if="day.courses.length === 0" class="no-course">
                  <i class="pi pi-sun"></i>
                  <span>Libre</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mes cours -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-book"></i> 
              Mes Cours
              <Badge :value="myCourses.length" severity="info" class="ml-2" />
            </h3>
          </div>

          <div class="courses-grid">
            <div v-for="course in myCourses" :key="course.id" class="course-card">
              <div class="course-header">
                <h4>{{ course.name }}</h4>
                <span class="course-badge" :style="{ backgroundColor: course.color || '#3b82f6' }">{{ course.code }}</span>
              </div>
              <div class="course-meta">
                <span><i class="pi pi-clock"></i> {{ course.hours }}h</span>
                <span><i class="pi pi-folder"></i> {{ course.moduleName }}</span>
              </div>
              <div class="course-footer">
                <Tag :value="course.type || 'CM'" severity="secondary" />
                <Button label="Détails" icon="pi pi-eye" class="p-button-sm p-button-text" @click="viewCourse(course)" />
              </div>
            </div>
            <div v-if="myCourses.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun cours assigné</p>
              <small>Contactez le responsable de module pour être assigné</small>
            </div>
          </div>
        </div>

        <!-- Mes Modules -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-th-large"></i> 
              Modules où j'interviens
              <Badge :value="myModules.length" severity="success" class="ml-2" />
            </h3>
          </div>
          <div class="modules-list">
            <div v-for="module in myModules" :key="module.id" class="module-item">
              <div class="module-icon">
                <i class="pi pi-folder"></i>
              </div>
              <div class="module-info">
                <h4>{{ module.title }}</h4>
                <p>{{ module.code }} - {{ module.credits }} ECTS</p>
                <small class="text-500">RM: {{ module.responsable || module.responsable_email }}</small>
              </div>
              <div class="module-year">
                <Tag :value="'BA' + module.year" severity="info" />
              </div>
            </div>
            <div v-if="myModules.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module</p>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="section-card">
          <h3><i class="pi pi-bolt"></i> Actions Rapides</h3>
          <div class="quick-actions">
            <Button label="Mon Planning" icon="pi pi-calendar" severity="primary" @click="$router.push('/admin/planning/weekly')" />
            <Button label="Calendrier Semestriel" icon="pi pi-calendar-plus" class="p-button-outlined" @click="$router.push('/admin/planning/semester')" />
            <Button label="Liste des Modules" icon="pi pi-book" class="p-button-outlined" @click="$router.push('/admin/modules')" />
            <Button label="Ressources Pédagogiques" icon="pi pi-folder" class="p-button-outlined" @click="$router.push('/media')" />
          </div>
        </div>

        <!-- Tâches à faire -->
        <div class="section-card tasks-section">
          <div class="section-header-row">
            <h3><i class="pi pi-check-square"></i> Tâches à Faire</h3>
            <Badge :value="pendingTasks.length" severity="warning" />
          </div>
          <div class="tasks-list">
            <div v-for="task in pendingTasks" :key="task.id" class="task-item">
              <Checkbox v-model="task.completed" :binary="true" @change="toggleTask(task)" />
              <div class="task-content">
                <span class="task-title" :class="{ completed: task.completed }">{{ task.title }}</span>
                <span class="task-due">{{ task.dueDate }}</span>
              </div>
              <Tag :value="task.priority" :severity="getPrioritySeverity(task.priority)" />
            </div>
            <div v-if="pendingTasks.length === 0" class="no-tasks">
              <i class="pi pi-check-circle"></i>
              <span>Toutes les tâches sont terminées !</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import { loadEnseignantDashboard } from '@/services/enseignantDashboardService';

const router = useRouter();
const authStore = useAuthStore();

// Loading
const loading = ref(true);

// Stats
const stats = ref({
  coursesCount: 0,
  weeklyHours: 0,
  nextCourse: 'N/A',
  studentsCount: 0,
  modulesCount: 0,
  totalHours: 0
});

// Données
const myCourses = ref([]);
const myModules = ref([]);
const weekSchedule = ref([]);

// Computed pour stats
const coursesCount = computed(() => stats.value.coursesCount);
const weeklyHours = computed(() => stats.value.weeklyHours);
const nextCourse = computed(() => stats.value.nextCourse);
const studentsCount = computed(() => stats.value.studentsCount);

// Tâches
const pendingTasks = ref([
  { id: 1, title: 'Préparer le cours de M1', dueDate: 'Aujourd\'hui', priority: 'Haute', completed: false },
  { id: 2, title: 'Corriger les examens', dueDate: 'Demain', priority: 'Moyenne', completed: false },
  { id: 3, title: 'Réunion pédagogique', dueDate: 'Vendredi', priority: 'Basse', completed: false }
]);

/**
 * Charge les données enseignant depuis Supabase
 */
async function loadTeacherData() {
  loading.value = true;
  
  try {
    const userId = authStore.user?.id || authStore.user?.uid;
    const userEmail = authStore.user?.email;
    
    if (!userId && !userEmail) {
      console.warn('⚠️ Aucun utilisateur connecté');
      loading.value = false;
      return;
    }
    
    console.log('🔄 Chargement données enseignant pour:', userEmail);
    
    const data = await loadEnseignantDashboard(userId, userEmail);
    
    // Mettre à jour les stats
    stats.value = data.stats;
    
    // Mettre à jour les données
    myCourses.value = data.courses;
    myModules.value = data.modules;
    weekSchedule.value = data.weekPlanning;
    
    console.log('✅ Données enseignant chargées:', {
      courses: myCourses.value.length,
      modules: myModules.value.length
    });
  } catch (error) {
    console.error('❌ Erreur chargement données enseignant:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTeacherData();
});

function viewCourse(course) {
  console.log('View course:', course);
  router.push(`/admin/courses/${course.id}`);
}

function toggleTask(task) {
  console.log('Toggle task:', task);
}

function getPrioritySeverity(priority) {
  switch (priority) {
    case 'Haute': return 'danger';
    case 'Moyenne': return 'warning';
    case 'Basse': return 'info';
    default: return 'secondary';
  }
}
</script>

<style scoped>
.dashboard-enseignant {
  padding: 2rem;
}

.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.section-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-card.full-width {
  grid-column: 1 / -1;
}

.section-card h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.week-schedule {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.day-column h4 {
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--surface-border);
  color: var(--text-color);
  text-align: center;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 200px;
}

.course-block {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary-color);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
}

.course-name {
  font-size: 0.9rem;
  color: var(--text-color);
}

.course-room {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.no-course {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
  gap: 0.5rem;
}

.no-course i {
  font-size: 2rem;
  opacity: 0.3;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.course-card {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.course-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
}

.course-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.course-card p {
  margin: 0 0 0.75rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

/* Tâches */
.tasks-section {
  border-left: 4px solid var(--primary-color);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header-row h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--surface-100);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-weight: 500;
  color: var(--text-color);
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--text-color-secondary);
}

.task-due {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.no-tasks {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #dcfce7;
  border-radius: 0.5rem;
  color: #16a34a;
}

.no-tasks i {
  font-size: 1.25rem;
}

/* Course meta et footer */
.course-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

/* Modules list */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.module-item:hover {
  background: var(--surface-100);
}

.module-icon {
  width: 45px;
  height: 45px;
  border-radius: 0.75rem;
  background: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-icon i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.module-info {
  flex: 1;
}

.module-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
  font-size: 1rem;
}

.module-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.module-year {
  flex-shrink: 0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.5rem;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  font-weight: 500;
}

.empty-state small {
  margin-top: 0.25rem;
}

/* Section header */
.section-header {
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Header avec sélecteur de filière */
.header-with-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.track-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.track-selector :deep(.p-selectbutton) {
  border-radius: 0.5rem;
}

.track-selector :deep(.p-selectbutton .p-button) {
  padding: 0.5rem 1rem;
  font-weight: 600;
}

.track-selector :deep(.p-selectbutton .p-button.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}
</style>
