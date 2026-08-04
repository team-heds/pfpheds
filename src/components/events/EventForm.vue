<template>
  <form class="app-form event-form" @submit.prevent="submitForm">
    <div class="form-group">
      <label>Titre</label>
      <InputText v-model="form.title" required placeholder="Titre de l'événement" class="w-full surface-card" />
    </div>

    <div class="form-group">
      <label>Description</label>
      <Textarea v-model="form.description" required placeholder="Description" class="w-full surface-card" autoResize rows="3" />
    </div>

    <div class="form-group">
      <label>Date et heure de début</label>
      <Calendar v-model="form.startDate" showTime hourFormat="24" dateFormat="dd/mm/yy" class="w-full surface-card" showIcon />
    </div>

    <div class="form-group">
      <label>Date et heure de fin</label>
      <Calendar v-model="form.endDate" showTime hourFormat="24" dateFormat="dd/mm/yy" class="w-full surface-card" showIcon />
    </div>

    <div class="form-group">
      <label>Lieu</label>
      <InputText v-model="form.lieu" placeholder="Lieu de l'événement" class="w-full surface-card" />
    </div>

    <div class="form-group">
      <label>Type d'événement</label>
      <Dropdown
        v-model="form.type"
        :options="typeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner le type"
        class="w-full surface-card"
      />
    </div>

    <div v-if="form.type === 'private'" class="form-group">
      <label>Rôle dédié</label>
      <Dropdown
        v-model="form.role"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner le rôle"
        class="w-full surface-card"
      />
    </div>

    <div class="form-group">
      <label>Image de l'événement (optionnel)</label>

      <div class="image-upload-container">
        <input
          id="event-image"
          ref="fileInput"
          type="file"
          accept="image/*"
          class="file-input"
          @change="handleImageUpload"
        />

        <label for="event-image" class="file-input-label">
          <i class="pi pi-upload"></i>
          {{ form.imageFile ? form.imageFile.name : 'Choisir une image' }}
        </label>

        <div v-if="form.imagePreview || (editMode && props.event?.image)" class="image-preview">
          <img :src="form.imagePreview || props.event?.image" alt="Aperçu" class="preview-img" />
          <Button
            icon="pi pi-times"
            class="p-button-rounded p-button-danger p-button-sm remove-image-btn"
            type="button"
            @click="removeImage"
          />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <Button
        v-if="!editMode || canManageEvent"
        type="submit"
        :label="editMode ? 'Modifier' : 'Créer'"
        class="p-button-primary w-full mt-2"
        :icon="editMode ? 'pi pi-check' : 'pi pi-plus-circle'"
      />
      <Button type="button" label="Annuler" class="p-button-text w-full mt-2" icon="pi pi-times" @click="$emit('close')" />
      <Button
        v-if="canManageEvent"
        type="button"
        label="Supprimer"
        class="p-button-danger w-full mt-2"
        icon="pi pi-trash"
        @click="confirmDeleteEvent"
      />
    </div>
  </form>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  event: { type: Object, default: null },
  editMode: { type: Boolean, default: false },
  userId: { type: String, default: null }
})

const emit = defineEmits(['submit', 'close', 'delete'])
const confirm = useConfirm()

const typeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Privé', value: 'private' },
  { label: "Alp'in Physio", value: 'alpinphysio' }
]

const roleOptions = [
  { label: 'Site Loeche', value: 'siteLoeche' },
  { label: 'BA24', value: 'BA24' },
  { label: 'BA23', value: 'BA23' },
  { label: 'BA22', value: 'BA22' },
  { label: 'Student', value: 'student' },
  { label: 'Manuel', value: 'manuel' }
]

const createEmptyForm = () => ({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  lieu: '',
  type: '',
  role: '',
  imageFile: null,
  imagePreview: null,
  existingImage: null
})

const form = ref(createEmptyForm())

const canManageEvent = computed(() => {
  return props.editMode && props.event && props.userId && props.event.admin === props.userId
})

const hydrateFormFromEvent = (event) => {
  if (!event) return

  form.value.title = event.title || ''
  form.value.description = event.description || ''
  form.value.startDate = event.startDate ? new Date(event.startDate) : ''
  form.value.endDate = event.endDate ? new Date(event.endDate) : ''
  form.value.lieu = event.lieu || ''
  form.value.type = event.type || ''
  form.value.role = event.role || ''
  form.value.existingImage = event.image || null
}

onMounted(() => {
  if (props.editMode && props.event) {
    hydrateFormFromEvent(props.event)
  }
})

watch(
  () => props.event,
  (newEvent) => {
    if (props.editMode && newEvent) {
      hydrateFormFromEvent(newEvent)
    }
  }
)

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  form.value.imageFile = file

  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.imagePreview = e.target?.result || null
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  form.value.imageFile = null
  form.value.imagePreview = null

  const fileInput = document.getElementById('event-image')
  if (fileInput) {
    fileInput.value = ''
  }
}

function confirmDeleteEvent() {
  confirm.require({
    message: "Supprimer définitivement cet événement ?",
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    accept: () => emit('delete', props.event?.id),
  })
}

function submitForm() {
  if (
    !form.value.title ||
    !form.value.description ||
    !form.value.startDate ||
    !form.value.endDate ||
    !form.value.type ||
    (form.value.type === 'private' && !form.value.role)
  ) {
    return
  }

  const formData = { ...form.value }

  if (formData.imageFile) {
    formData.image = formData.imageFile
    delete formData.imageFile
  }

  emit('submit', formData)

  if (!props.editMode) {
    form.value = createEmptyForm()
  }

  emit('close')
}
</script>

<style scoped>
.event-form {
  display: flex;
  flex-direction: column;
  gap: 1.1em;
}

.form-group label {
  display: block;
  margin-bottom: 0.45em;
  font-weight: 600;
  color: #ffc700;
  letter-spacing: 0.01em;
}

.form-group {
  margin-bottom: 0.5em;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-top: 1.2em;
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1em;
  border: 1px solid #ddd;
  border-radius: 0.5em;
  cursor: pointer;
}

.file-input {
  display: none;
}

.file-input-label {
  display: flex;
  align-items: center;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 0.5em;
  cursor: pointer;
}

.file-input-label i {
  margin-right: 0.5em;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1em;
  border: 1px solid #ddd;
  border-radius: 0.5em;
  margin-top: 1em;
}

.preview-img {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 0.5em;
}

.remove-image-btn {
  margin-top: 0.5em;
}
</style>
