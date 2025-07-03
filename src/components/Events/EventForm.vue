<template>
  <form class="event-form" @submit.prevent="submitForm">
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
      <Dropdown v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Sélectionner le type" class="w-full surface-card" />
    </div>
    <div class="form-group" v-if="form.type === 'private'">
      <label>Rôle dédié</label>
      <Dropdown v-model="form.role" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Sélectionner le rôle" class="w-full surface-card" />
    </div>
    <div class="form-group">
      <label>Image de l'événement (optionnel)</label>
      <div class="image-upload-container">
        <input 
          type="file" 
          ref="fileInput"
          @change="handleImageUpload" 
          accept="image/*" 
          class="file-input"
          id="event-image"
        />
        <label for="event-image" class="file-input-label">
          <i class="pi pi-upload"></i>
          {{ form.imageFile ? form.imageFile.name : 'Choisir une image' }}
        </label>
        <div v-if="form.imagePreview || (editMode && event?.image)" class="image-preview">
          <img :src="form.imagePreview || event?.image" alt="Aperçu" class="preview-img" />
          <Button 
            icon="pi pi-times" 
            class="p-button-rounded p-button-danger p-button-sm remove-image-btn"
            @click="removeImage"
            type="button"
          />
        </div>
      </div>
    </div>
    <div class="form-actions">
      <Button v-if="!editMode || canManageEvent" type="submit" :label="editMode ? 'Modifier' : 'Créer'" class="p-button-primary w-full mt-2" :icon="editMode ? 'pi pi-check' : 'pi pi-plus-circle'" />
      <Button type="button" label="Annuler" class="p-button-text w-full mt-2" icon="pi pi-times" @click="$emit('close')" />
      <Button v-if="canManageEvent" type="button" label="Supprimer" class="p-button-danger w-full mt-2" icon="pi pi-trash" @click="confirmDeleteEvent" />
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
  event: { type: Object, default: null },
  editMode: { type: Boolean, default: false },
  userId: { type: String, default: null }
});

const emit = defineEmits(['submit', 'close', 'delete']);

const confirm = useConfirm();

const typeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Privé', value: 'private' }
];
const roleOptions = [
  { label: 'Site Loeche', value: 'siteLoeche' },
  { label: 'BA24', value: 'BA24' },
  { label: 'BA23', value: 'BA23' },
  { label: 'BA22', value: 'BA22' },
  { label: 'Student', value: 'student' },
  { label: 'Manuel', value: 'manuel' }
];

const form = ref({
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
});

const canManageEvent = computed(() => {
  return props.editMode && props.event && props.userId && props.event.admin === props.userId;
});

// Pré-remplir le formulaire en mode édition
onMounted(() => {
  if (props.editMode && props.event) {
    form.value.title = props.event.title || '';
    form.value.description = props.event.description || '';
    form.value.startDate = props.event.startDate ? new Date(props.event.startDate) : '';
    form.value.endDate = props.event.endDate ? new Date(props.event.endDate) : '';
    form.value.lieu = props.event.lieu || '';
    form.value.type = props.event.type || '';
    form.value.role = props.event.role || '';
    form.value.existingImage = props.event.image || null;
  }
});

// Surveiller les changements de props
watch(() => props.event, (newEvent) => {
  if (props.editMode && newEvent) {
    form.value.title = newEvent.title || '';
    form.value.description = newEvent.description || '';
    form.value.startDate = newEvent.startDate ? new Date(newEvent.startDate) : '';
    form.value.endDate = newEvent.endDate ? new Date(newEvent.endDate) : '';
    form.value.lieu = newEvent.lieu || '';
    form.value.type = newEvent.type || '';
    form.value.role = newEvent.role || '';
    form.value.existingImage = newEvent.image || null;
  }
});

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    form.value.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      form.value.imagePreview = e.target.result;
      console.log('Image preview set:', form.value.imagePreview ? 'OK' : 'FAILED');
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  form.value.imageFile = null;
  form.value.imagePreview = null;
  // Reset the file input
  const fileInput = document.getElementById('event-image');
  if (fileInput) {
    fileInput.value = '';
  }
}

function confirmDeleteEvent() {
  confirm.require({
    message: "Supprimer définitivement cet événement ?",
    header: "Confirmation de suppression",
    icon: "pi pi-exclamation-triangle",
    accept: () => emit('delete', event?.id),
  });
}

function submitForm() {
  if (!form.value.title || !form.value.description || !form.value.startDate || !form.value.endDate || !form.value.type || (form.value.type === 'private' && !form.value.role)) return;
  const formData = { ...form.value };
  if (formData.imageFile) {
    formData.image = formData.imageFile;
    delete formData.imageFile;
  }
  emit('submit', formData);
  // Ne réinitialiser le formulaire que si ce n'est pas en mode édition
  if (!props.editMode) {
    form.value = { title: '', description: '', startDate: '', endDate: '', lieu: '', type: '', role: '', imageFile: null, imagePreview: null, existingImage: null };
  }
  emit('close');
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
