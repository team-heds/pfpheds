<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Liste des Cours" 
        subtitle="Gérez tous vos cours et enseignements" 
        icon="pi pi-list" 
      />
    </template>

    <div class="course-list">
      <div class="list-header">
        <div class="search-bar">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher un cours..." />
          </span>
        </div>
        <div class="list-actions">
          <Button label="Nouveau Cours" icon="pi pi-plus" @click="createCourse" />
        </div>
      </div>

      <div class="filters-bar">
        <Dropdown v-model="selectedModule" :options="modules" optionLabel="name" placeholder="Tous les modules" showClear />
        <Dropdown v-model="selectedTeacher" :options="teachers" optionLabel="name" placeholder="Tous les enseignants" showClear />
        <Dropdown v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Tous les statuts" showClear />
      </div>

      <DataTable 
        :value="filteredCourses" 
        :paginator="true" 
        :rows="10"
        :loading="loading"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="code" header="Code" sortable>
          <template #body="slotProps">
            <span class="course-code">{{ slotProps.data.code }}</span>
          </template>
        </Column>
        
        <Column field="name" header="Nom du cours" sortable>
          <template #body="slotProps">
            <div class="course-info">
              <strong>{{ slotProps.data.name }}</strong>
              <span class="course-type">{{ slotProps.data.type }}</span>
            </div>
          </template>
        </Column>

        <Column field="module" header="Module" sortable>
          <template #body="slotProps">
            <span class="module-tag">{{ slotProps.data.module }}</span>
          </template>
        </Column>

        <Column field="teacher" header="Enseignant" sortable></Column>

        <Column field="schedule" header="Horaire">
          <template #body="slotProps">
            <div class="schedule-info">
              <div>{{ slotProps.data.day }}</div>
              <div class="time">{{ slotProps.data.time }}</div>
            </div>
          </template>
        </Column>

        <Column field="room" header="Salle" sortable></Column>

        <Column field="students" header="Étudiants" sortable>
          <template #body="slotProps">
            <span class="students-count">{{ slotProps.data.students }}</span>
          </template>
        </Column>

        <Column field="status" header="Statut">
          <template #body="slotProps">
            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
          </template>
        </Column>

        <Column header="Actions">
          <template #body="slotProps">
            <div class="action-buttons">
              <Button icon="pi pi-eye" class="p-button-sm p-button-text" v-tooltip.top="'Voir'" @click="viewCourse(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-sm p-button-text" v-tooltip.top="'Éditer'" @click="editCourse(slotProps.data)" />
              <Button icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" v-tooltip.top="'Supprimer'" @click="deleteCourse(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';

const router = useRouter();

const loading = ref(false);
const searchQuery = ref('');
const selectedModule = ref(null);
const selectedTeacher = ref(null);
const selectedStatus = ref(null);

const modules = ref([]);
const teachers = ref([]);
const courses = ref([]);

const statusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'En attente', value: 'pending' },
  { label: 'Annulé', value: 'cancelled' }
];

const filteredCourses = computed(() => {
  let filtered = courses.value;

  if (searchQuery.value) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  if (selectedModule.value) {
    filtered = filtered.filter(c => c.module === selectedModule.value.name);
  }

  if (selectedTeacher.value) {
    filtered = filtered.filter(c => c.teacher === selectedTeacher.value.name);
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(c => c.status === selectedStatus.value);
  }

  return filtered;
});

onMounted(() => {
  loadData();
});

function loadData() {
  loading.value = true;
  
  // Données de démo
  modules.value = [
    { id: 1, name: 'Anatomie' },
    { id: 2, name: 'Physiologie' },
    { id: 3, name: 'Pathologie' }
  ];

  teachers.value = [
    { id: 1, name: 'Dr. Martin Dubois' },
    { id: 2, name: 'Prof. Sophie Renaud' }
  ];

  courses.value = [
    {
      id: 1,
      code: 'ANA101',
      name: 'Anatomie Générale',
      type: 'Cours magistral',
      module: 'Anatomie',
      teacher: 'Dr. Martin Dubois',
      day: 'Lundi',
      time: '08:00-10:00',
      room: 'B201',
      students: 30,
      status: 'active'
    },
    {
      id: 2,
      code: 'PHY101',
      name: 'Physiologie Humaine',
      type: 'TP',
      module: 'Physiologie',
      teacher: 'Prof. Sophie Renaud',
      day: 'Mardi',
      time: '10:00-12:00',
      room: 'A105',
      students: 28,
      status: 'active'
    }
  ];

  loading.value = false;
}

function createCourse() {
  router.push('/admin/courses/create');
}

function viewCourse(course) {
  router.push(`/admin/courses/${course.id}`);
}

function editCourse(course) {
  router.push(`/admin/courses/${course.id}/edit`);
}

function deleteCourse(course) {
  // TODO: Implémenter la suppression
  console.log('Delete course:', course);
}

function getStatusSeverity(status) {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return null;
  }
}
</script>

<style scoped>
.course-list {
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-bar {
  flex: 1;
  max-width: 400px;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.course-code {
  font-weight: 600;
  color: var(--primary-color);
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-type {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.module-tag {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.schedule-info .time {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.students-count {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}
</style>
