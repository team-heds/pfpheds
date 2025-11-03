<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="course?.name || 'Détails du Cours'" 
        :subtitle="course?.code || ''"
        icon="pi pi-eye" 
      />
    </template>

    <div class="course-detail" v-if="course">
      <div class="detail-grid">
        
        <!-- Informations principales -->
        <div class="info-card">
          <div class="card-header">
            <h3><i class="pi pi-info-circle"></i> Informations du Cours</h3>
            <div class="header-actions">
              <Button label="Éditer" icon="pi pi-pencil" class="p-button-outlined" @click="editCourse" />
              <Button label="Supprimer" icon="pi pi-trash" class="p-button-outlined p-button-danger" @click="deleteCourse" />
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Code</span>
              <span class="value">{{ course.code }}</span>
            </div>
            <div class="info-item">
              <span class="label">Nom</span>
              <span class="value">{{ course.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Type</span>
              <Tag :value="getCourseTypeLabel(course.type)" />
            </div>
            <div class="info-item">
              <span class="label">Module</span>
              <span class="value">{{ course.module }}</span>
            </div>
            <div class="info-item">
              <span class="label">Enseignant</span>
              <span class="value">{{ course.teacher }}</span>
            </div>
            <div class="info-item">
              <span class="label">Statut</span>
              <Tag :value="course.status" :severity="getStatusSeverity(course.status)" />
            </div>
            <div class="info-item full-width" v-if="course.description">
              <span class="label">Description</span>
              <p class="description">{{ course.description }}</p>
            </div>
          </div>
        </div>

        <!-- Horaire et lieu -->
        <div class="info-card">
          <div class="card-header">
            <h3><i class="pi pi-calendar"></i> Horaire & Lieu</h3>
          </div>
          <div class="schedule-info">
            <div class="schedule-block">
              <i class="pi pi-calendar"></i>
              <div class="schedule-details">
                <span class="schedule-label">Jour</span>
                <span class="schedule-value">{{ course.day }}</span>
              </div>
            </div>
            <div class="schedule-block">
              <i class="pi pi-clock"></i>
              <div class="schedule-details">
                <span class="schedule-label">Horaire</span>
                <span class="schedule-value">{{ course.time }}</span>
              </div>
            </div>
            <div class="schedule-block">
              <i class="pi pi-map-marker"></i>
              <div class="schedule-details">
                <span class="schedule-label">Salle</span>
                <span class="schedule-value">{{ course.room }}</span>
              </div>
            </div>
            <div class="schedule-block" v-if="course.recurring">
              <i class="pi pi-refresh"></i>
              <div class="schedule-details">
                <span class="schedule-label">Récurrence</span>
                <span class="schedule-value">Hebdomadaire</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Participants -->
        <div class="info-card">
          <div class="card-header">
            <h3><i class="pi pi-users"></i> Participants</h3>
            <Button label="Gérer" icon="pi pi-cog" class="p-button-sm p-button-text" @click="manageStudents" />
          </div>
          <div class="participants-stats">
            <div class="stat-box">
              <span class="stat-number">{{ course.students || 0 }}</span>
              <span class="stat-label">Inscrits</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">{{ course.maxStudents || '-' }}</span>
              <span class="stat-label">Capacité max</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">{{ calculateOccupancy() }}%</span>
              <span class="stat-label">Occupation</span>
            </div>
          </div>
          <div class="students-list" v-if="students.length > 0">
            <div v-for="student in students" :key="student.id" class="student-item">
              <Avatar :label="student.initials" shape="circle" />
              <div class="student-info">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-class">{{ student.class }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-students">
            <i class="pi pi-inbox"></i>
            <p>Aucun étudiant inscrit</p>
          </div>
        </div>

        <!-- Ressources -->
        <div class="info-card">
          <div class="card-header">
            <h3><i class="pi pi-file"></i> Ressources du Cours</h3>
            <Button label="Ajouter" icon="pi pi-plus" class="p-button-sm p-button-text" @click="addResource" />
          </div>
          <div class="resources-list">
            <div v-for="resource in resources" :key="resource.id" class="resource-item">
              <i :class="`pi ${getFileIcon(resource.type)}`"></i>
              <div class="resource-info">
                <span class="resource-name">{{ resource.name }}</span>
                <span class="resource-meta">{{ resource.size }} - {{ formatDate(resource.date) }}</span>
              </div>
              <Button icon="pi pi-download" class="p-button-sm p-button-text" @click="downloadResource(resource)" />
            </div>
            <div v-if="resources.length === 0" class="empty-resources">
              <i class="pi pi-inbox"></i>
              <p>Aucune ressource</p>
            </div>
          </div>
        </div>

        <!-- Présences -->
        <div class="info-card full-width">
          <div class="card-header">
            <h3><i class="pi pi-check-square"></i> Présences</h3>
            <Button label="Prendre les présences" icon="pi pi-user-plus" @click="takeAttendance" />
          </div>
          <div class="attendance-chart">
            <DataTable :value="attendanceData" responsiveLayout="scroll">
              <Column field="date" header="Date" sortable></Column>
              <Column field="present" header="Présents" sortable>
                <template #body="{ data }">
                  <span class="attendance-stat">{{ data.present }}/{{ course.students }}</span>
                </template>
              </Column>
              <Column field="absent" header="Absents" sortable></Column>
              <Column field="late" header="Retards" sortable></Column>
              <Column field="rate" header="Taux de présence" sortable>
                <template #body="{ data }">
                  <ProgressBar :value="data.rate" :showValue="true" />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="actions-card">
          <h3><i class="pi pi-bolt"></i> Actions Rapides</h3>
          <div class="quick-actions">
            <Button label="Envoyer un email" icon="pi pi-envelope" class="p-button-outlined" @click="sendEmail" />
            <Button label="Créer une annonce" icon="pi pi-megaphone" class="p-button-outlined" @click="createAnnouncement" />
            <Button label="Exporter données" icon="pi pi-download" class="p-button-outlined" @click="exportData" />
            <Button label="Dupliquer le cours" icon="pi pi-copy" class="p-button-outlined" @click="duplicateCourse" />
          </div>
        </div>

      </div>
    </div>

    <div v-else class="loading-state">
      <ProgressSpinner />
      <p>Chargement du cours...</p>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const course = ref(null);
const students = ref([]);
const resources = ref([]);
const attendanceData = ref([]);

onMounted(() => {
  loadCourse();
});

function loadCourse() {
  // Données de démo - à remplacer par un appel API
  const courseId = route.params.id;
  
  course.value = {
    id: courseId,
    code: 'ANA101',
    name: 'Anatomie Générale',
    type: 'lecture',
    module: 'Anatomie',
    teacher: 'Dr. Martin Dubois',
    day: 'Lundi',
    time: '08:00-10:00',
    room: 'B201',
    students: 28,
    maxStudents: 30,
    status: 'active',
    recurring: true,
    description: 'Cours d\'introduction à l\'anatomie humaine générale, couvrant les systèmes principaux du corps humain.'
  };

  students.value = [
    { id: 1, name: 'Sophie Martin', initials: 'SM', class: 'SI-BA1' },
    { id: 2, name: 'Pierre Dubois', initials: 'PD', class: 'SI-BA1' },
    { id: 3, name: 'Marie Laurent', initials: 'ML', class: 'SI-BA1' }
  ];

  resources.value = [
    { id: 1, name: 'Cours_01_Introduction.pdf', type: 'pdf', size: '2.4 MB', date: '2024-11-01' },
    { id: 2, name: 'TP_Anatomie_Membres.docx', type: 'doc', size: '850 KB', date: '2024-11-02' }
  ];

  attendanceData.value = [
    { date: '2024-11-01', present: 26, absent: 2, late: 1, rate: 92.8 },
    { date: '2024-11-08', present: 28, absent: 0, late: 0, rate: 100 },
    { date: '2024-11-15', present: 25, absent: 3, late: 2, rate: 89.3 }
  ];
}

function calculateOccupancy() {
  if (!course.value.maxStudents) return 0;
  return Math.round((course.value.students / course.value.maxStudents) * 100);
}

function getCourseTypeLabel(type) {
  const labels = {
    'lecture': 'Cours magistral',
    'practical': 'Travaux pratiques',
    'seminar': 'Séminaire',
    'workshop': 'Atelier',
    'tutoring': 'Tutorat'
  };
  return labels[type] || type;
}

function getStatusSeverity(status) {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return null;
  }
}

function getFileIcon(type) {
  const icons = {
    'pdf': 'pi-file-pdf',
    'doc': 'pi-file-word',
    'xls': 'pi-file-excel',
    'ppt': 'pi-file',
    'video': 'pi-video'
  };
  return icons[type] || 'pi-file';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function editCourse() {
  router.push(`/admin/courses/${course.value.id}/edit`);
}

function deleteCourse() {
  // TODO: Implémenter la suppression
  toast.add({
    severity: 'info',
    summary: 'Fonction à implémenter',
    detail: 'Suppression du cours',
    life: 3000
  });
}

function manageStudents() {
  toast.add({
    severity: 'info',
    summary: 'Gestion des étudiants',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function addResource() {
  toast.add({
    severity: 'info',
    summary: 'Ajout de ressource',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function downloadResource(resource) {
  console.log('Download resource:', resource);
}

function takeAttendance() {
  toast.add({
    severity: 'info',
    summary: 'Prise de présences',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function sendEmail() {
  toast.add({
    severity: 'info',
    summary: 'Envoi d\'email',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function createAnnouncement() {
  toast.add({
    severity: 'info',
    summary: 'Création d\'annonce',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function exportData() {
  toast.add({
    severity: 'info',
    summary: 'Export des données',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function duplicateCourse() {
  toast.add({
    severity: 'info',
    summary: 'Duplication du cours',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}
</script>

<style scoped>
.course-detail {
  padding: 2rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.card-header h3 {
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.info-item .value {
  color: var(--text-color);
  font-size: 1rem;
}

.description {
  margin: 0;
  line-height: 1.6;
  color: var(--text-color-secondary);
}

.schedule-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.schedule-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.schedule-block i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.schedule-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.schedule-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.participants-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-weight: 600;
  color: var(--text-color);
}

.student-class {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.empty-students, .empty-resources {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.empty-students i, .empty-resources i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.3;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.resource-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.resource-name {
  font-weight: 600;
  color: var(--text-color);
}

.resource-meta {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.attendance-stat {
  font-weight: 600;
  color: var(--primary-color);
}

.actions-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  grid-column: 1 / -1;
}

.actions-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid, .schedule-info, .participants-stats {
    grid-template-columns: 1fr;
  }
}
</style>
