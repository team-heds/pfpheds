<template>
  <div class="ticket-form">
    <div class="grid">
      <!-- Type de ticket -->
      <div class="col-12">
        <label for="type" class="block mb-2 font-semibold">Type de contenu *</label>
        <div class="grid">
          <div 
            v-for="type in ticketTypes" 
            :key="type.value"
            class="col-12 md:col-6"
          >
            <div 
              class="type-card"
              :class="{ 'selected': formData.type === type.value }"
              @click="selectType(type.value)"
            >
              <i :class="type.icon" class="text-2xl"></i>
              <span class="font-semibold">{{ type.label }}</span>
              <p class="text-sm text-600">{{ type.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Titre -->
      <div class="col-12">
        <label for="title" class="block mb-2 font-semibold">Titre *</label>
        <InputText 
          v-model="formData.title" 
          id="title"
          placeholder="Ex: Vidéo Introduction aux soins"
          class="w-full"
          :class="{ 'p-invalid': errors.title }"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>

      <!-- Description -->
      <div class="col-12">
        <label for="description" class="block mb-2 font-semibold">Description</label>
        <Textarea 
          v-model="formData.description" 
          id="description"
          rows="4"
          placeholder="Décrivez le contenu à produire..."
          class="w-full"
        />
      </div>

      <!-- Module -->
      <div class="col-12 md:col-6">
        <label for="module" class="block mb-2 font-semibold">Module associé</label>
        <Dropdown
          v-model="formData.module_id"
          :options="modules"
          optionLabel="title"
          optionValue="id"
          placeholder="Sélectionner un module"
          class="w-full"
          filter
          showClear
        />
        <small class="text-600">Optionnel - Laissez vide si non applicable</small>
      </div>

      <!-- Date de rendu -->
      <div class="col-12 md:col-6">
        <label for="due_date" class="block mb-2 font-semibold">Date de rendu</label>
        <Calendar
          v-model="formData.due_date"
          id="due_date"
          dateFormat="dd/mm/yy"
          placeholder="Sélectionner une date"
          class="w-full"
          showIcon
        />
      </div>

      <!-- Priorité -->
      <div class="col-12 md:col-6">
        <label for="priority" class="block mb-2 font-semibold">Priorité</label>
        <Dropdown
          v-model="formData.priority"
          :options="priorityOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner une priorité"
          class="w-full"
        />
      </div>

      <!-- Statut initial -->
      <div class="col-12 md:col-6">
        <label for="status" class="block mb-2 font-semibold">Statut initial</label>
        <Dropdown
          v-model="formData.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner un statut"
          class="w-full"
        />
      </div>

      <Divider class="col-12" />

      <!-- Champs spécifiques VIDÉO -->
      <template v-if="formData.type === 'video'">
        <div class="col-12">
          <h3><i class="pi pi-video mr-2"></i>Informations Vidéo</h3>
        </div>

        <!-- Nom de la personne filmée -->
        <div class="col-12 md:col-6">
          <label for="person_filmed" class="block mb-2 font-semibold">Personne filmée</label>
          <InputText 
            v-model="formData.metadata.person_filmed" 
            id="person_filmed"
            placeholder="Ex: Prof. Dupont"
            class="w-full"
          />
        </div>

        <!-- Date de tournage -->
        <div class="col-12 md:col-6">
          <label for="filming_date" class="block mb-2 font-semibold">Date de tournage</label>
          <Calendar
            v-model="formData.metadata.filming_date"
            id="filming_date"
            dateFormat="dd/mm/yy"
            placeholder="Sélectionner une date"
            class="w-full"
            showIcon
          />
        </div>

        <!-- Modalité -->
        <div class="col-12 md:col-6">
          <label for="modality" class="block mb-2 font-semibold">Modalité de production</label>
          <Dropdown
            v-model="formData.metadata.modality"
            :options="modalityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Type de vidéo"
            class="w-full"
          />
        </div>

        <!-- Durée estimée -->
        <div class="col-12 md:col-6">
          <label for="duration" class="block mb-2 font-semibold">Durée estimée (min)</label>
          <InputNumber 
            v-model="formData.metadata.duration_minutes" 
            id="duration"
            placeholder="Ex: 15"
            class="w-full"
            :min="1"
            :max="180"
          />
        </div>

        <!-- Assets -->
        <div class="col-12">
          <label class="block mb-2 font-semibold">Assets disponibles</label>
          <div class="flex align-items-center gap-2">
            <Checkbox 
              v-model="formData.has_assets" 
              inputId="has_assets"
              :binary="true"
            />
            <label for="has_assets">Ce contenu nécessite des assets (slides, documents, etc.)</label>
          </div>
        </div>

        <!-- Lien vers assets -->
        <div v-if="formData.has_assets" class="col-12">
          <label for="assets_url" class="block mb-2 font-semibold">Lien vers les assets</label>
          <InputText 
            v-model="formData.metadata.assets_url" 
            id="assets_url"
            placeholder="Ex: https://drive.google.com/..."
            class="w-full"
          />
        </div>
      </template>

      <!-- Champs spécifiques DÉVELOPPEMENT -->
      <template v-if="formData.type === 'development'">
        <div class="col-12">
          <h3><i class="pi pi-code mr-2"></i>Informations Développement</h3>
        </div>

        <!-- Type de développement -->
        <div class="col-12 md:col-6">
          <label for="dev_type" class="block mb-2 font-semibold">Type de développement</label>
          <Dropdown
            v-model="formData.metadata.dev_type"
            :options="devTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Type de développement"
            class="w-full"
          />
        </div>

        <!-- Technologies -->
        <div class="col-12 md:col-6">
          <label for="technologies" class="block mb-2 font-semibold">Technologies</label>
          <InputText 
            v-model="formData.metadata.technologies" 
            id="technologies"
            placeholder="Ex: Vue.js, Node.js"
            class="w-full"
          />
        </div>

        <!-- Repository -->
        <div class="col-12">
          <label for="repository_url" class="block mb-2 font-semibold">Repository (GitHub, GitLab)</label>
          <InputText 
            v-model="formData.metadata.repository_url" 
            id="repository_url"
            placeholder="Ex: https://github.com/..."
            class="w-full"
          />
        </div>
      </template>

      <!-- Champs spécifiques SIMULATION -->
      <template v-if="formData.type === 'simulation'">
        <div class="col-12">
          <h3><i class="pi pi-desktop mr-2"></i>Informations Simulation</h3>
        </div>

        <!-- Type de simulation -->
        <div class="col-12 md:col-6">
          <label for="sim_type" class="block mb-2 font-semibold">Type de simulation</label>
          <Dropdown
            v-model="formData.metadata.sim_type"
            :options="simTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Type de simulation"
            class="w-full"
          />
        </div>

        <!-- Nombre de participants -->
        <div class="col-12 md:col-6">
          <label for="participants" class="block mb-2 font-semibold">Nombre de participants</label>
          <InputNumber 
            v-model="formData.metadata.participants_count" 
            id="participants"
            placeholder="Ex: 5"
            class="w-full"
            :min="1"
            :max="100"
          />
        </div>

        <!-- Matériel nécessaire -->
        <div class="col-12">
          <label for="equipment" class="block mb-2 font-semibold">Matériel nécessaire</label>
          <Textarea 
            v-model="formData.metadata.equipment" 
            id="equipment"
            rows="3"
            placeholder="Liste du matériel requis..."
            class="w-full"
          />
        </div>
      </template>

      <!-- Notes additionnelles -->
      <div class="col-12">
        <label for="notes" class="block mb-2 font-semibold">Notes additionnelles</label>
        <Textarea 
          v-model="formData.notes" 
          id="notes"
          rows="3"
          placeholder="Informations complémentaires..."
          class="w-full"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="form-actions mt-4">
      <Button 
        label="Annuler" 
        icon="pi pi-times"
        @click="$emit('cancel')"
        outlined
      />
      <Button 
        label="Enregistrer" 
        icon="pi pi-check"
        @click="submit"
        :loading="saving"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { TICKET_STATUS, TICKET_TYPES, VIDEO_MODALITIES } from '@/service/ticketService'

const props = defineProps({
  ticket: {
    type: Object,
    default: null
  },
  modules: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])

const saving = ref(false)
const errors = ref({})

// Types de tickets
const ticketTypes = [
  { 
    value: TICKET_TYPES.VIDEO, 
    label: 'Vidéo', 
    icon: 'pi pi-video',
    description: 'Production vidéo (cours, interview, podcast)' 
  },
  { 
    value: TICKET_TYPES.DEVELOPMENT, 
    label: 'Développement', 
    icon: 'pi pi-code',
    description: 'Développement logiciel ou application' 
  },
  { 
    value: TICKET_TYPES.SIMULATION, 
    label: 'Simulation', 
    icon: 'pi pi-desktop',
    description: 'Simulation pratique ou cas clinique' 
  },
  { 
    value: TICKET_TYPES.OTHER, 
    label: 'Autre', 
    icon: 'pi pi-folder',
    description: 'Autre type de contenu' 
  }
]

// Options de priorité
const priorityOptions = [
  { label: 'Basse', value: 'low' },
  { label: 'Normale', value: 'normal' },
  { label: 'Haute', value: 'high' },
  { label: 'Urgente', value: 'urgent' }
]

// Options de statut
const statusOptions = [
  { label: 'Backlog', value: TICKET_STATUS.BACKLOG },
  { label: 'À faire', value: TICKET_STATUS.TODO },
  { label: 'En cours', value: TICKET_STATUS.IN_PROGRESS }
]

// Modalités vidéo
const modalityOptions = [
  { label: 'PowerPoint sonorisé', value: VIDEO_MODALITIES.POWERPOINT },
  { label: 'Table ronde', value: VIDEO_MODALITIES.TABLE_RONDE },
  { label: 'Podcast', value: VIDEO_MODALITIES.PODCAST },
  { label: 'Interview', value: VIDEO_MODALITIES.INTERVIEW },
  { label: 'Tutoriel', value: VIDEO_MODALITIES.TUTORIAL },
  { label: 'Autre', value: VIDEO_MODALITIES.OTHER }
]

// Types de développement
const devTypeOptions = [
  { label: 'Application web', value: 'web_app' },
  { label: 'Application mobile', value: 'mobile_app' },
  { label: 'API / Backend', value: 'api' },
  { label: 'Plugin / Extension', value: 'plugin' },
  { label: 'Autre', value: 'other' }
]

// Types de simulation
const simTypeOptions = [
  { label: 'Cas clinique', value: 'clinical_case' },
  { label: 'Pratique technique', value: 'technical_practice' },
  { label: 'Jeu de rôle', value: 'role_play' },
  { label: 'Simulation haute fidélité', value: 'high_fidelity' },
  { label: 'Autre', value: 'other' }
]

// Données du formulaire
const formData = reactive({
  type: TICKET_TYPES.VIDEO,
  title: '',
  description: '',
  module_id: null,
  due_date: null,
  priority: 'normal',
  status: TICKET_STATUS.BACKLOG,
  has_assets: false,
  notes: '',
  metadata: {
    // Vidéo
    person_filmed: '',
    filming_date: null,
    modality: null,
    duration_minutes: null,
    assets_url: '',
    
    // Développement
    dev_type: null,
    technologies: '',
    repository_url: '',
    
    // Simulation
    sim_type: null,
    participants_count: null,
    equipment: ''
  }
})

// Pré-remplir si édition
if (props.ticket) {
  Object.assign(formData, {
    ...props.ticket,
    due_date: props.ticket.due_date ? new Date(props.ticket.due_date) : null,
    metadata: {
      ...formData.metadata,
      ...props.ticket.metadata,
      filming_date: props.ticket.metadata?.filming_date ? new Date(props.ticket.metadata.filming_date) : null
    }
  })
}

// Changer de type
function selectType(type) {
  formData.type = type
}

// Validation
function validate() {
  errors.value = {}
  
  if (!formData.title || formData.title.trim() === '') {
    errors.value.title = 'Le titre est obligatoire'
  }
  
  // Module est optionnel
  
  return Object.keys(errors.value).length === 0
}

// Soumettre
async function submit() {
  if (!validate()) {
    return
  }
  
  saving.value = true
  
  try {
    const data = {
      ...formData,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      metadata: {
        ...formData.metadata,
        filming_date: formData.metadata.filming_date ? formData.metadata.filming_date.toISOString() : null
      }
    }
    
    emit('save', data)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ticket-form {
  padding: 1rem;
}

.type-card {
  padding: 1.5rem;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.type-card:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.type-card.selected {
  border-color: var(--primary-color);
  border: 1px solid var(--primary-color);
  background: var(--surface-card);
  box-shadow: 0 0 0 1px var(--primary-50);
}

.type-card i {
  color: var(--primary-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

h3 {
  color: var(--primary-color);
  margin: 0;
}
</style>
