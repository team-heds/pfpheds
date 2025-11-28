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
          <h3><i class="pi pi-book"></i> Mes Cours</h3>
          <div class="courses-grid">
            <div v-for="course in myCourses" :key="course.id" class="course-card">
              <div class="course-header">
                <h4>{{ course.name }}</h4>
                <span class="course-badge" :style="{ backgroundColor: course.color }">{{ course.code }}</span>
              </div>
              <p>{{ course.hours }}h - {{ course.students }} étudiants</p>
              <Button label="Détails" icon="pi pi-eye" class="p-button-sm p-button-text" @click="viewCourse(course)" />
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="section-card">
          <h3><i class="pi pi-bolt"></i> Actions Rapides</h3>
          <div class="quick-actions">
            <Button label="Mon Planning" icon="pi pi-calendar" class="p-button-outlined" @click="$router.push('/admin/planning/weekly')" />
            <Button label="Mes Cours" icon="pi pi-book" class="p-button-outlined" @click="$router.push('/admin/courses/list')" />
            <Button label="Feedback Étudiants" icon="pi pi-comments" class="p-button-outlined" @click="$router.push('/admin/tools/feedbacka')" />
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { getAllTeacherData } from '@/services/academicKpiService';

const router = useRouter();
const authStore = useAuthStore();

// Loading
const loading = ref(true);

// Stats
const coursesCount = ref(0);
const weeklyHours = ref(0);
const nextCourse = ref('');
const studentsCount = ref(0);

// Données
const myCourses = ref([]);
const weekSchedule = ref([]);

/**
 * Charge les données enseignant depuis Supabase/Firebase
 */
async function loadTeacherData() {
  loading.value = true;
  
  try {
    const userId = authStore.user?.id || authStore.user?.uid;
    
    if (!userId) {
      console.warn('⚠️ Aucun utilisateur connecté');
      loading.value = false;
      return;
    }
    
    console.log('🔄 Chargement données enseignant pour:', userId);
    
    const data = await getAllTeacherData(userId);
    
    // Mettre à jour les stats
    coursesCount.value = data.stats.coursesCount;
    weeklyHours.value = data.stats.weeklyHours;
    nextCourse.value = data.stats.nextCourse;
    studentsCount.value = data.stats.studentsCount;
    
    // Mettre à jour les données
    myCourses.value = data.courses;
    weekSchedule.value = data.weekSchedule;
    
    console.log('✅ Données enseignant chargées');
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
</style>
