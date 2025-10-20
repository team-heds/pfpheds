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
        <label for="description" class="block mb-2 font-semibold">
          Description
          <span class="text-sm text-500 ml-2">(Markdown supporté)</span>
        </label>
        
        <!-- Boutons de formatage Markdown -->
        <div class="markdown-toolbar">
          <Button 
            icon="pi pi-bold" 
            @click="insertMarkdown('**', '**', 'texte en gras')"
            text
            size="small"
            v-tooltip="'Gras'"
          />
          <Button 
            icon="pi pi-italic" 
            @click="insertMarkdown('_', '_', 'texte en italique')"
            text
            size="small"
            v-tooltip="'Italique'"
          />
          <Button 
            icon="pi pi-list" 
            @click="insertMarkdown('- ', '', 'élément de liste')"
            text
            size="small"
            v-tooltip="'Liste'"
          />
          <Button 
            icon="pi pi-hashtag" 
            @click="insertMarkdown('## ', '', 'Titre')"
            text
            size="small"
            v-tooltip="'Titre'"
          />
          <Button 
            icon="pi pi-link" 
            @click="insertMarkdown('[', '](url)', 'texte du lien')"
            text
            size="small"
            v-tooltip="'Lien'"
          />
          <Button 
            icon="pi pi-code" 
            @click="insertMarkdown('`', '`', 'code')"
            text
            size="small"
            v-tooltip="'Code inline'"
          />
        </div>
        
        <Textarea 
          ref="descriptionTextarea"
          v-model="formData.description" 
          id="description"
          rows="6"
          placeholder="Décrivez le contenu à produire...

Vous pouvez utiliser le Markdown :
- **Gras** ou _italique_
- ## Titres
- Listes à puces
- [Liens](url)
- `Code`"
          class="w-full markdown-editor"
        />
        
        <!-- Aperçu Markdown -->
        <div v-if="formData.description" class="markdown-preview mt-2">
          <div class="preview-header">
            <i class="pi pi-eye"></i>
            <span>Aperçu</span>
          </div>
          <div class="preview-content" v-html="renderedMarkdown"></div>
        </div>
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
import { ref, reactive, watch, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
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
const descriptionTextarea = ref(null)

// Configuration Markdown
marked.setOptions({
  breaks: true,
  gfm: true
})

// Rendu Markdown sécurisé
const renderedMarkdown = computed(() => {
  if (!formData.description) return ''
  try {
    // marked.parse peut retourner une Promise, donc on utilise parseInline pour du sync
    const rawHtml = marked(formData.description)
    return DOMPurify.sanitize(rawHtml)
  } catch (error) {
    console.error('[TicketForm] Erreur Markdown:', error)
    return formData.description
  }
})

// Insérer du Markdown dans le textarea
function insertMarkdown(before, after, placeholder) {
  const textarea = descriptionTextarea.value?.$el || descriptionTextarea.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = formData.description.substring(start, end)
  const textToInsert = selectedText || placeholder
  
  const newText = 
    formData.description.substring(0, start) +
    before + textToInsert + after +
    formData.description.substring(end)
  
  formData.description = newText
  
  // Replacer le curseur
  setTimeout(() => {
    const newCursorPos = start + before.length + textToInsert.length
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
}

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

/* Markdown Toolbar */
.markdown-toolbar {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
}

.markdown-editor {
  border-radius: 0 0 8px 8px !important;
}

/* Aperçu Markdown */
.markdown-preview {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-100);
  border-bottom: 1px solid var(--surface-border);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.preview-content {
  padding: 1rem;
  background: var(--surface-card);
  color: var(--text-color) !important;
  line-height: 1.6;
  min-height: 100px;
}

.preview-content * {
  color: var(--text-color) !important;
}

/* Style du Markdown rendu */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  margin: 1rem 0 0.5rem 0;
  color: var(--text-color) !important;
  font-weight: 600;
}

.preview-content :deep(h1) {
  font-size: 1.5rem;
  border-bottom: 2px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.preview-content :deep(h2) {
  font-size: 1.25rem;
}

.preview-content :deep(h3) {
  font-size: 1.1rem;
}

.preview-content :deep(p) {
  margin: 0.75rem 0;
  color: var(--text-color) !important;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 2rem;
  color: var(--text-color) !important;
}

.preview-content :deep(li) {
  margin: 0.25rem 0;
  color: var(--text-color) !important;
}

.preview-content :deep(code) {
  background: rgba(255, 193, 7, 0.2);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  color: #ffc107 !important;
}

.preview-content :deep(pre) {
  background: rgba(0,0,0,0.3);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  border-left: 4px solid var(--primary-color);
}

.preview-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #ffc107 !important;
}

.preview-content :deep(a) {
  color: var(--primary-color) !important;
  text-decoration: underline;
}

.preview-content :deep(blockquote) {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 4px solid var(--primary-color);
  color: var(--text-color-secondary) !important;
  font-style: italic;
}

.preview-content :deep(strong) {
  font-weight: 700;
  color: var(--text-color) !important;
}

.preview-content :deep(em) {
  font-style: italic;
  color: var(--text-color) !important;
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
