<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Créer un Cours" 
        subtitle="Ajoutez un nouveau cours au planning" 
        icon="pi pi-plus-circle" 
      />
    </template>

    <div class="course-create">
      <div class="form-container">
        <div class="form-card">
          <h3><i class="pi pi-info-circle"></i> Informations Générales</h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="code">Code du cours *</label>
              <InputText id="code" v-model="course.code" placeholder="Ex: ANA101" />
            </div>

            <div class="form-field">
              <label for="name">Nom du cours *</label>
              <InputText id="name" v-model="course.name" placeholder="Ex: Anatomie Générale" />
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
              <InputNumber id="students" v-model="course.students" :min="0" placeholder="30" />
            </div>

            <div class="form-field full-width">
              <label for="description">Description</label>
              <Textarea id="description" v-model="course.description" rows="3" placeholder="Description du cours..." />
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
              <Calendar id="startTime" v-model="course.startTime" timeOnly hourFormat="24" placeholder="08:00" />
            </div>

            <div class="form-field">
              <label for="endTime">Heure de fin *</label>
              <Calendar id="endTime" v-model="course.endTime" timeOnly hourFormat="24" placeholder="10:00" />
            </div>

            <div class="form-field">
              <label for="room">Salle *</label>
              <InputText id="room" v-model="course.room" placeholder="Ex: B201" />
            </div>

            <div class="form-field">
              <label for="startDate">Date de début</label>
              <Calendar id="startDate" v-model="course.startDate" dateFormat="dd/mm/yy" placeholder="Sélectionnez une date" />
            </div>

            <div class="form-field">
              <label for="endDate">Date de fin</label>
              <Calendar id="endDate" v-model="course.endDate" dateFormat="dd/mm/yy" placeholder="Sélectionnez une date" />
            </div>

            <div class="form-field full-width">
              <label>
                <Checkbox v-model="course.recurring" :binary="true" />
                Cours récurrent (tous les {{ course.day || '...' }})
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
                placeholder="Sélectionnez un statut" 
              />
            </div>

            <div class="form-field">
              <label for="maxStudents">Capacité maximale</label>
              <InputNumber id="maxStudents" v-model="course.maxStudents" :min="0" placeholder="50" />
            </div>

            <div class="form-field full-width">
              <label>
                <Checkbox v-model="course.onlineAvailable" :binary="true" />
                Disponible en ligne
              </label>
            </div>

            <div class="form-field full-width" v-if="course.onlineAvailable">
              <label for="onlineLink">Lien de visioconférence</label>
              <InputText id="onlineLink" v-model="course.onlineLink" placeholder="https://teams.microsoft.com/..." />
            </div>

            <div class="form-field full-width">
              <label for="notes">Notes internes</label>
              <Textarea id="notes" v-model="course.notes" rows="2" placeholder="Notes pour les administrateurs..." />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <Button label="Annuler" icon="pi pi-times" class="p-button-secondary" @click="cancel" />
          <Button label="Enregistrer comme brouillon" icon="pi pi-save" class="p-button-outlined" @click="saveDraft" />
          <Button label="Créer le cours" icon="pi pi-check" @click="createCourse" :loading="loading" />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const loading = ref(false);

const course = ref({
  code: '',
  name: '',
  type: null,
  moduleId: null,
  teacherId: null,
  students: null,
  description: '',
  day: null,
  startTime: null,
  endTime: null,
  room: '',
  startDate: null,
  endDate: null,
  recurring: true,
  status: 'active',
  maxStudents: null,
  onlineAvailable: false,
  onlineLink: '',
  notes: ''
});

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
  { label: 'Brouillon', value: 'draft' }
];

onMounted(() => {
  loadData();
});

function loadData() {
  // Charger les modules et enseignants
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

async function createCourse() {
  if (!validateForm()) return;

  loading.value = true;
  try {
    // TODO: Enregistrer dans Supabase
    console.log('Creating course:', course.value);
    
    toast.add({
      severity: 'success',
      summary: 'Cours créé',
      detail: 'Le cours a été créé avec succès',
      life: 3000
    });

    router.push('/admin/courses/list');
  } catch (error) {
    console.error('Error creating course:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la création du cours',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
}

async function saveDraft() {
  course.value.status = 'draft';
  await createCourse();
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
  router.push('/admin/courses/list');
}
</script>

<style scoped>
.course-create {
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
