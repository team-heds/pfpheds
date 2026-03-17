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

        <!-- Toggle vue calendrier / liste -->
        <div class="section-card full-width">
          <div class="section-header-row">
            <h3><i class="pi pi-calendar"></i> Mon Calendrier</h3>
            <div class="view-toggle">
              <Button 
                :icon="calendarView === 'week' ? 'pi pi-check' : 'pi pi-calendar'" 
                label="Semaine" 
                :severity="calendarView === 'week' ? 'primary' : 'secondary'" 
                size="small"
                @click="calendarView = 'week'" 
              />
              <Button 
                :icon="calendarView === 'list' ? 'pi pi-check' : 'pi pi-list'" 
                label="Liste" 
                :severity="calendarView === 'list' ? 'primary' : 'secondary'" 
                size="small"
                @click="calendarView = 'list'" 
              />
            </div>
          </div>

          <!-- Vue Semaine -->
          <div v-if="calendarView === 'week'" class="week-schedule">
            <div v-for="day in weekSchedule" :key="day.name" class="day-column">
              <h4>{{ day.name }}</h4>
              <div class="courses-list">
                <div v-for="course in day.courses" :key="course.id" class="course-block-detailed" :style="{ borderLeftColor: course.color }">
                  <div class="course-time-badge">{{ course.time }}</div>
                  <div class="course-content">
                    <span class="course-name">{{ course.name }}</span>
                    <span class="course-code">{{ course.code }}</span>
                    <div class="course-details-row">
                      <Tag :value="course.type || 'Cours'" :severity="getTypeSeverity(course.type)" class="text-xs" />
                      <span v-if="course.class" class="class-badge">{{ course.class }}</span>
                      <span class="room-info"><i class="pi pi-map-marker"></i> {{ course.room }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="day.courses.length === 0" class="no-course">
                  <i class="pi pi-sun"></i>
                  <span>Libre</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vue Liste détaillée -->
          <div v-else class="calendar-list-view">
            <DataTable 
              :value="allMySlots" 
              :rows="10" 
              :paginator="allMySlots.length > 10"
              responsiveLayout="scroll"
              stripedRows
              class="p-datatable-sm"
              sortField="sortKey"
              :sortOrder="1"
            >
              <Column field="weekNumber" header="Sem." style="width: 60px" sortable>
                <template #body="{ data }">
                  <Tag :value="'S' + data.week_number" severity="info" />
                </template>
              </Column>
              <Column field="day" header="Jour" style="width: 90px" />
              <Column field="time" header="Horaire" style="width: 110px">
                <template #body="{ data }">
                  {{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}
                </template>
              </Column>
              <Column field="course_title" header="Cours">
                <template #body="{ data }">
                  <div>
                    <strong>{{ data.course_title || data.module_code }}</strong>
                    <div class="text-sm text-500">{{ data.module_code }}</div>
                  </div>
                </template>
              </Column>
              <Column field="activity" header="Type" style="width: 80px">
                <template #body="{ data }">
                  <Tag :value="data.activity || 'Cours'" :severity="getTypeSeverity(data.activity)" />
                </template>
              </Column>
              <Column field="class_code" header="Classe" style="width: 80px">
                <template #body="{ data }">
                  <span class="class-badge">{{ data.class_code }}</span>
                </template>
              </Column>
              <Column field="room" header="Salle" style="width: 100px" />
              <template #empty>
                <div class="text-center py-4">
                  <i class="pi pi-calendar text-4xl text-400"></i>
                  <p class="mt-2 text-600">Aucun cours planifié</p>
                </div>
              </template>
            </DataTable>
          </div>
        </div>

        <!-- À ne pas oublier (prochains cours) -->
        <div class="section-card reminder-section">
          <div class="section-header">
            <h3>
              <i class="pi pi-bell"></i> 
              À ne pas oublier
              <Badge :value="nextWeekCourses.length" severity="warning" class="ml-2" />
            </h3>
          </div>
          <div class="reminder-list">
            <div v-for="(course, idx) in nextWeekCourses" :key="idx" class="reminder-item" :class="{ 'today': course.isToday, 'tomorrow': course.isTomorrow }">
              <div class="reminder-when">
                <span v-if="course.isToday" class="today-badge">Aujourd'hui</span>
                <span v-else-if="course.isTomorrow" class="tomorrow-badge">Demain</span>
                <span v-else class="date-badge">{{ course.day }}</span>
                <span class="time">{{ course.time }}</span>
              </div>
              <div class="reminder-content">
                <strong>{{ course.course }}</strong>
                <span class="text-500">{{ course.module }} - {{ course.class }}</span>
              </div>
              <div class="reminder-room">
                <i class="pi pi-map-marker"></i>
                {{ course.room }}
              </div>
            </div>
            <div v-if="nextWeekCourses.length === 0" class="empty-state small">
              <i class="pi pi-check-circle text-success"></i>
              <p>Aucun cours dans les prochains jours</p>
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

        <!-- Prochaines séances -->
        <div class="section-card upcoming-section">
          <div class="section-header">
            <h3>
              <i class="pi pi-calendar-plus"></i> 
              Prochaines Séances
              <Badge :value="upcomingSessions.length" severity="info" class="ml-2" />
            </h3>
            <Button icon="pi pi-file-pdf" label="PDF" severity="secondary" size="small" @click="exportMyPlanning" class="mr-2" />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" size="small" outlined @click="exportMyPlanningExcel" />
          </div>
          <div class="upcoming-list">
            <div v-for="session in upcomingSessions.slice(0, 8)" :key="session.id" class="upcoming-item">
              <div class="upcoming-date">
                <span class="day">{{ session.day }}</span>
                <span class="week">S{{ session.weekNumber }}</span>
              </div>
              <div class="upcoming-info">
                <span class="course-name">{{ session.course }}</span>
                <span class="course-details">
                  <i class="pi pi-clock"></i> {{ session.time }}
                  <i class="pi pi-map-marker ml-2"></i> {{ session.room }}
                  <Tag :value="session.class" severity="secondary" class="ml-2" />
                </span>
              </div>
              <Tag :value="session.type" :severity="getTypeSeverity(session.type)" />
            </div>
            <div v-if="upcomingSessions.length === 0" class="empty-state">
              <i class="pi pi-calendar"></i>
              <p>Aucune séance à venir</p>
            </div>
            <div v-if="upcomingSessions.length > 8" class="text-center mt-2">
              <Button label="Voir tout" icon="pi pi-arrow-right" text @click="$router.push('/admin/planning/weekly')" />
            </div>
          </div>
        </div>

        <!-- Statistiques heures -->
        <div class="section-card hours-stats">
          <h3><i class="pi pi-chart-bar"></i> Récapitulatif Heures</h3>
          <div class="hours-grid">
            <div class="hour-stat">
              <span class="hour-value">{{ stats.weeklyHours }}h</span>
              <span class="hour-label">Cette semaine</span>
            </div>
            <div class="hour-stat">
              <span class="hour-value">{{ stats.upcomingHours || 0 }}h</span>
              <span class="hour-label">À venir</span>
            </div>
            <div class="hour-stat">
              <span class="hour-value">{{ stats.totalHours }}h</span>
              <span class="hour-label">Total assigné</span>
            </div>
            <div class="hour-stat">
              <span class="hour-value">{{ stats.upcomingCount || 0 }}</span>
              <span class="hour-label">Séances planifiées</span>
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { loadEnseignantDashboard } from '@/service/enseignantDashboardService';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

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
const upcomingSessions = ref([]);
const allMySlots = ref([]);
const calendarView = ref('week');

// Computed: prochains cours (aujourd'hui + demain + cette semaine)
const nextWeekCourses = computed(() => {
  const now = new Date();
  const today = now.getDay(); // 0=Dim, 1=Lun...
  const todayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][today];
  const tomorrowName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][(today + 1) % 7];
  
  return upcomingSessions.value.slice(0, 10).map(session => ({
    ...session,
    isToday: session.day === todayName,
    isTomorrow: session.day === tomorrowName
  }));
});

// Computed pour stats
const coursesCount = computed(() => stats.value.coursesCount);
const weeklyHours = computed(() => stats.value.weeklyHours);
const nextCourse = computed(() => stats.value.nextCourse);
const studentsCount = computed(() => stats.value.studentsCount);


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
    upcomingSessions.value = data.upcomingSessions || [];
    allMySlots.value = data.allSlots || [];
    
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

function getTypeSeverity(type) {
  const severities = {
    'Cours': 'primary',
    'CM': 'primary',
    'TP': 'success',
    'TD': 'warning',
    'Examen': 'danger',
    'Atelier': 'info'
  };
  return severities[type] || 'secondary';
}

async function exportMyPlanning() {
  if (upcomingSessions.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune donnée',
      detail: 'Aucune séance à exporter',
      life: 3000
    });
    return;
  }
  
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  
  const userName = authStore.user?.displayName || authStore.user?.email?.split('@')[0] || 'enseignant';
  
  // Créer le PDF
  const doc = new jsPDF('landscape');
  
  // Titre
  doc.setFontSize(18);
  doc.text(`Mon Planning - ${userName}`, 14, 20);
  
  // Sous-titre
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')} | ${upcomingSessions.value.length} séances à venir`, 14, 28);
  doc.text(`Total: ${stats.value.upcomingHours || 0}h planifiées`, 14, 34);
  doc.setTextColor(0);
  
  // Préparer les données pour la table
  const tableData = upcomingSessions.value.map(session => [
    `S${session.weekNumber}`,
    session.day,
    session.date || '',
    session.time,
    session.course,
    session.type,
    session.class || '',
    session.room
  ]);
  
  // Générer la table
  autoTable(doc, {
    head: [['Sem.', 'Jour', 'Date', 'Horaire', 'Cours', 'Type', 'Classe', 'Salle']],
    body: tableData,
    startY: 42,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });
  
  // Télécharger
  doc.save(`Planning_${userName}_${new Date().toISOString().split('T')[0]}.pdf`);
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${upcomingSessions.value.length} séances exportées en PDF`,
    life: 3000
  });
}

async function exportMyPlanningExcel() {
  if (upcomingSessions.value.length === 0) return;
  
  const XLSX = await import('xlsx');
  
  const userName = authStore.user?.displayName || authStore.user?.email?.split('@')[0] || 'enseignant';
  
  const data = upcomingSessions.value.map(session => ({
    'Semaine': session.weekNumber,
    'Jour': session.day,
    'Date': session.date || '',
    'Horaire': session.time,
    'Cours': session.course,
    'Module': session.module || '',
    'Type': session.type,
    'Classe': session.class || '',
    'Salle': session.room
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mon Planning');
  XLSX.writeFile(wb, `Planning_${userName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  toast.add({
    severity: 'success',
    summary: 'Export Excel réussi',
    detail: `${upcomingSessions.value.length} séances exportées`,
    life: 3000
  });
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

/* Prochaines séances */
.upcoming-section {
  border-left: 4px solid #10b981;
}

.upcoming-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.upcoming-item:hover {
  background: var(--surface-100);
}

.upcoming-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  padding: 0.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 0.5rem;
}

.upcoming-date .day {
  font-weight: 700;
  font-size: 0.9rem;
}

.upcoming-date .week {
  font-size: 0.75rem;
  opacity: 0.8;
}

.upcoming-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upcoming-info .course-name {
  font-weight: 600;
  color: var(--text-color);
}

.upcoming-info .course-details {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

/* Statistiques heures */
.hours-stats {
  border-left: 4px solid #f59e0b;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.hour-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
  text-align: center;
}

.hour-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.hour-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .hours-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Section header row avec toggle */
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

/* Course block détaillé */
.course-block-detailed {
  background: var(--surface-ground);
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.course-time-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.course-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-content .course-name {
  font-weight: 600;
  color: var(--text-color);
}

.course-content .course-code {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.course-details-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.class-badge {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.room-info {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Section rappels */
.reminder-section {
  border-left: 4px solid #ef4444;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.reminder-item:hover {
  background: var(--surface-100);
}

.reminder-item.today {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.reminder-item.tomorrow {
  background: #dbeafe;
  border-left: 3px solid #3b82f6;
}

.reminder-when {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.today-badge {
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.tomorrow-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.date-badge {
  font-weight: 600;
  color: var(--text-color);
}

.reminder-when .time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.reminder-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.reminder-room {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

/* Calendar list view */
.calendar-list-view {
  margin-top: 1rem;
}

/* Course meta */
.course-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.course-meta i {
  margin-right: 0.25rem;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}
</style>
