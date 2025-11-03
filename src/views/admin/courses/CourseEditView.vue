<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Éditer le Cours" 
        :subtitle="course?.code || ''"
        icon="pi pi-pencil" 
      />
    </template>

    <div class="course-edit">
      <div class="form-container" v-if="course">
        <div class="form-card">
          <h3><i class="pi pi-info-circle"></i> Informations Générales</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="code">Code du cours *</label>
              <InputText id="code" v-model="course.code" />
            </div>

            <div class="form-field">
              <label for="name">Nom du cours *</label>
              <InputText id="name" v-model="course.name" />
            </div>

            <div class="form-field">
              <label for="type">Type de cours *</label>
              <Dropdown 
                id="type" 
                v-model="course.type" 
                :options="courseTypes" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Sélectionnez un type" 
              />
            </div>

            <div class="form-field">
              <label for="module">Module *</label>
              <Dropdown 
                id="module" 
                v-model="course.moduleId" 
                :options="modules" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionnez un module" 
              />
            </div>

            <div class="form-field">
              <label for="teacher">Enseignant *</label>
              <Dropdown 
                id="teacher" 
                v-model="course.teacherId" 
                :options="teachers" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionnez un enseignant" 
              />
            </div>

            <div class="form-field">
              <label for="students">Nombre d'étudiants</label>
              <InputNumber id="students" v-model="course.students" :min="0" />
            </div>

            <div class="form-field full-width">
              <label for="description">Description</label>
              <Textarea id="description" v-model="course.description" rows="3" />
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3><i class="pi pi-calendar"></i> Horaire & Lieu</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="day">Jour *</label>
              <Dropdown 
                id="day" 
                v-model="course.day" 
                :options="days" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Sélectionnez un jour" 
              />
            </div>

            <div class="form-field">
              <label for="startTime">Heure de début *</label>
              <Calendar id="startTime" v-model="course.startTime" timeOnly hourFormat="24" />
            </div>

            <div class="form-field">
              <label for="endTime">Heure de fin *</label>
              <Calendar id="endTime" v-model="course.endTime" timeOnly hourFormat="24" />
            </div>

            <div class="form-field">
              <label for="room">Salle *</label>
              <InputText id="room" v-model="course.room" />
            </div>

            <div class="form-field">
              <label for="startDate">Date de début</label>
              <Calendar id="startDate" v-model="course.startDate" dateFormat="dd/mm/yy" />
            </div>

            <div class="form-field">
              <label for="endDate">Date de fin</label>
              <Calendar id="endDate" v-model="course.endDate" dateFormat="dd/mm/yy" />
            </div>

            <div class="form-field full-width">
              <label>
                <Checkbox v-model="course.recurring" :binary="true" />
                Cours récurrent
              </label>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h3><i class="pi pi-cog"></i> Options</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="status">Statut</label>
              <Dropdown 
                id="status" 
                v-model="course.status" 
                :options="statusOptions" 
                optionLabel="label" 
                optionValue="value"
              />
            </div>

            <div class="form-field">
              <label for="maxStudents">Capacité maximale</label>
              <InputNumber id="maxStudents" v-model="course.maxStudents" :min="0" />
            </div>

            <div class="form-field full-width">
              <label>
                <Checkbox v-model="course.onlineAvailable" :binary="true" />
                Disponible en ligne
              </label>
            </div>

            <div class="form-field full-width" v-if="course.onlineAvailable">
              <label for="onlineLink">Lien de visioconférence</label>
              <InputText id="onlineLink" v-model="course.onlineLink" />
            </div>

            <div class="form-field full-width">
              <label for="notes">Notes internes</label>
              <Textarea id="notes" v-model="course.notes" rows="2" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <Button label="Annuler" icon="pi pi-times" class="p-button-secondary" @click="cancel" />
          <Button label="Voir le cours" icon="pi pi-eye" class="p-button-outlined" @click="viewCourse" />
          <Button label="Enregistrer" icon="pi pi-check" @click="saveCourse" :loading="loading" />
        </div>
      </div>

      <div v-else class="loading-state">
        <ProgressSpinner />
        <p>Chargement du cours...</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import ProgressSpinner from 'primevue/progressspinner';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const loading = ref(false);

const course = ref(null);
const modules = ref([]);
const teachers = ref([]);

const courseTypes = [
  { label: 'Cours magistral', value: 'lecture' },
  { label: 'Travaux pratiques', value: 'practical' },
  { label: 'Séminaire', value: 'seminar' },
  { label: 'Atelier', value: 'workshop' },
  { label: 'Tutorat', value: 'tutoring' }
];

const days = [
  { label: 'Lundi', value: 'monday' },
  { label: 'Mardi', value: 'tuesday' },
  { label: 'Mercredi', value: 'wednesday' },
  { label: 'Jeudi', value: 'thursday' },
  { label: 'Vendredi', value: 'friday' }
];

const statusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'En attente', value: 'pending' },
  { label: 'Annulé', value: 'cancelled' },
  { label: 'Brouillon', value: 'draft' }
];

onMounted(() => {
  loadData();
  loadCourse();
});

function loadData() {
  modules.value = [
    { id: 1, name: 'Anatomie' },
    { id: 2, name: 'Physiologie' },
    { id: 3, name: 'Pathologie' }
  ];

  teachers.value = [
    { id: 1, name: 'Dr. Martin Dubois' },
    { id: 2, name: 'Prof. Sophie Renaud' }
  ];
}

function loadCourse() {
  const courseId = route.params.id;
  
  // Données de démo - à remplacer par un appel API
  course.value = {
    id: courseId,
    code: 'ANA101',
    name: 'Anatomie Générale',
    type: 'lecture',
    moduleId: 1,
    teacherId: 1,
    students: 28,
    description: 'Cours d\'introduction à l\'anatomie humaine générale.',
    day: 'monday',
    startTime: new Date(2024, 0, 1, 8, 0),
    endTime: new Date(2024, 0, 1, 10, 0),
    room: 'B201',
    startDate: new Date(2024, 8, 1),
    endDate: new Date(2024, 11, 20),
    recurring: true,
    status: 'active',
    maxStudents: 30,
    onlineAvailable: false,
    onlineLink: '',
    notes: ''
  };
}

async function saveCourse() {
  if (!validateForm()) return;

  loading.value = true;
  try {
    // TODO: Enregistrer dans la base de données
    console.log('Saving course:', course.value);
    
    toast.add({
      severity: 'success',
      summary: 'Cours mis à jour',
      detail: 'Les modifications ont été enregistrées',
      life: 3000
    });

    router.push(`/admin/courses/${course.value.id}`);
  } catch (error) {
    console.error('Error saving course:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la sauvegarde',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

function validateForm() {
  if (!course.value.code || !course.value.name || !course.value.teacherId) {
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Veuillez remplir tous les champs obligatoires',
      life: 3000
    });
    return false;
  }
  return true;
}

function cancel() {
  router.push(`/admin/courses/${course.value.id}`);
}

function viewCourse() {
  router.push(`/admin/courses/${course.value.id}`);
}
</script>

<style scoped>
.course-edit {
  padding: 2rem;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
}

.form-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.form-card h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
