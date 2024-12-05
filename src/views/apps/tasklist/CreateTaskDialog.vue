<script setup>
import { onMounted, ref } from 'vue';
import { getDatabase, ref as dbRef, onValue, push, update } from 'firebase/database';
import { db } from '../../../../firebase.js'; // Importez votre configuration Firebase

const emit = defineEmits(['close', 'save']);
const props = defineProps({
  selectedTask: {
    type: Object,
    default: null
  }
});

// Références pour les données
const task = ref({});
const filteredMembers = ref([]);

// Charger la tâche sélectionnée ou initialiser une nouvelle tâche
onMounted(() => {
  if (props.selectedTask) {
    task.value = { ...props.selectedTask }; // Cloner pour éviter la mutation directe
  } else {
    task.value = {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      members: []
    };
  }
});

// Charger les membres depuis Firebase (collection "Users")
const getMembers = async () => {
  const usersRef = dbRef(db, 'Users');
  return new Promise((resolve) => {
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      resolve(
        data
          ? Object.keys(data).map((key) => ({
            id: key,
            name: `${data[key].Forname || ''} ${data[key].Name || ''}`.trim(),
            image: data[key].PhotoURL || '/path/to/default-avatar.jpg' // URL de l'avatar ou une image par défaut
          }))
          : []
      );
    });
  });
};

// Sauvegarder ou mettre à jour une tâche dans Firebase
const saveTaskToFirebase = async (taskData) => {
  const tasksRef = dbRef(db, 'tasks');
  if (taskData.id) {
    // Mise à jour d'une tâche existante
    const taskRef = dbRef(db, `tasks/${taskData.id}`);
    await update(taskRef, taskData);
  } else {
    // Ajout d'une nouvelle tâche
    await push(tasksRef, taskData);
  }
};

// Annuler et fermer le formulaire
const onHide = () => {
  emit('close', task.value);
};

// Sauvegarder la tâche et notifier le parent
const onSave = async () => {
  await saveTaskToFirebase(task.value);
  emit('save', task.value);
};

// Filtrer les membres en fonction de la saisie
const filterMembers = async (event) => {
  const members = await getMembers();

  if (!event.query) {
    filteredMembers.value = [];
    return;
  }

  filteredMembers.value = members.filter((member) =>
    member.name.toLowerCase().includes(event.query.toLowerCase())
  );
};
</script>

<template>
  <div class="p-4">
    <div class="grid p-fluid formgrid">
      <div class="col-12 field">
        <label for="name" class="text-900 font-semibold">Task Name</label>
        <InputText id="name" type="text" placeholder="Title" v-model="task.name" />
      </div>
      <div class="col-12 field">
        <label for="description" class="text-900 font-semibold">Description</label>
        <Editor
          v-model="task.description"
          :pt="{
                        root: { style: { height: '150px' }, class: 'mb-6' }
                    }"
        ></Editor>
      </div>
      <div class="col-6 field">
        <label for="start" class="text-900 font-semibold">Start Date</label>
        <Calendar
          dateFormat="yy-mm-dd"
          :show-time="false"
          inputId="start"
          placeholder="Start Date"
          v-model="task.startDate"
        ></Calendar>
      </div>
      <div class="col-6 field">
        <label for="end" class="text-900 font-semibold">Due Date</label>
        <Calendar
          dateFormat="yy-mm-dd"
          :show-time="false"
          inputId="end"
          placeholder="End Date"
          v-model="task.endDate"
        ></Calendar>
      </div>
      <div class="col-12 field">
        <label for="members" class="text-900 font-semibold">Add Team Member</label>
        <AutoComplete
          inputId="members"
          v-model="task.members"
          :suggestions="filteredMembers"
          field="name"
          multiple
          @complete="filterMembers($event)"
          :inputStyle="{ height: '2.5rem' }"
        >
          <template #chip="{ value }">
            <div class="flex align-items-center">
              <img
                :src="value.image"
                :alt="value.name"
                class="h-2rem w-2rem mr-2"
              />
              <span class="text-900 font-medium">{{ value.name }}</span>
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex align-items-center">
              <img
                :src="item.image"
                :alt="item.name"
                class="h-2rem w-2rem mr-2"
              />
              <span class="text-900 font-medium">{{ item.name }}</span>
            </div>
          </template>
        </AutoComplete>
      </div>

      <div class="col-12 flex justify-content-end mt-4">
        <Button
          class="w-8rem mr-3"
          outlined
          icon="pi pi-times"
          label="Cancel"
          @click="onHide"
        ></Button>
        <Button class="w-8rem" icon="pi pi-check" label="Save" @click="onSave"></Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles personnalisés */
</style>
