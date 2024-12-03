<script setup>
import { ref } from 'vue';
import { getDatabase, ref as dbRef, update, remove } from 'firebase/database';
import { db } from '../../../..//firebase.js'; // Importez votre configuration Firebase

// Événements émis par le composant
const emit = defineEmits(['checkbox:change', 'delete:task', 'open:edit:dialog']);

// Props reçues par le composant
defineProps({
  title: {
    type: String,
    required: true
  },
  taskList: {
    type: Array,
    required: true
  }
});

// Références pour le menu contextuel
const menu = ref(null);
const clickedTask = ref(null);
const menuItems = ref([
  { label: 'Edit', icon: 'pi pi-pencil', command: () => onEdit() },
  { label: 'Delete', icon: 'pi pi-trash', command: () => handleDelete() }
]);

// Méthodes
const onEdit = () => {
  emit('open:edit:dialog', clickedTask.value);
};

const handleDelete = async () => {
  if (!clickedTask.value || !clickedTask.value.id) return;

  try {
    const taskRef = dbRef(db, `tasks/${clickedTask.value.id}`);
    await remove(taskRef);

    emit('delete:task', clickedTask.value);
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche :', error);
  }
};

const parseDate = (timestamp) => {
  return new Date(timestamp).toTimeString().split(':').slice(0, 2).join(':');
};

const onCheckboxChange = async (task) => {
  if (!task || !task.id) return;

  try {
    const taskRef = dbRef(db, `tasks/${task.id}`);
    await update(taskRef, { completed: task.completed });

    emit('checkbox:change', task);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche :', error);
  }
};

const toggleMenu = (event, i, task) => {
  clickedTask.value = task;
  menu.value[i].toggle(event);
};
</script>

<template>
  <div class="text-900 font-semibold text-lg mt-5 mb-3 border-bottom-1 surface-border py-3">{{ title }}</div>
  <ul class="list-none p-0 m-0">
    <li
      v-for="(task, i) in taskList"
      :key="task.id"
      class="flex flex-column gap-3 md:flex-row md:align-items-center p-2 border-bottom-1 surface-border"
    >
      <div class="flex align-items-center flex-1">
        <Checkbox
          binary
          @change="onCheckboxChange(task)"
          v-model="task.completed"
          :inputId="task.id?.toString()"
        ></Checkbox>
        <label
          class="font-medium white-space-nowrap text-overflow-ellipsis overflow-hidden ml-2"
          :class="{ 'line-through': task.completed }"
          style="max-width: 500px"
        >
          {{ task.name }}
        </label>
      </div>
      <div class="flex flex-1 gap-3 flex-column sm:flex-row sm:justify-content-between">
        <div class="flex align-items-center">
                    <span v-if="task.comments" class="flex align-items-center font-semibold mr-3"
                    ><i class="pi pi-comment mr-2"></i>{{ task.comments }}</span
                    >
          <span v-if="task.attachments" class="flex align-items-center font-semibold mr-3"
          ><i class="pi pi-paperclip mr-2"></i>{{ task.attachments }}</span
          >
          <span class="flex align-items-center font-semibold white-space-nowrap" v-if="task.startDate"
          ><i class="pi pi-clock mr-2"></i>{{ parseDate(task.startDate) }}</span
          >
        </div>
        <div class="flex align-items-center sm:justify-content-end">
          <div class="mr-3">
            <AvatarGroup v-if="task.members?.length > 0">
              <Avatar
                v-for="member in task.members.slice(0, 4)"
                :key="member.id"
                :image="member.image"
                size="large"
                shape="circle"
              ></Avatar>
              <Avatar
                v-if="task.members.length > 4"
                :label="`+${task.members.length - 4}`"
                shape="circle"
                size="large"
                class="bg-blue-500"
                :style="{ color: '#212121', border: '2px solid var(--surface-border)' }"
              ></Avatar>
            </AvatarGroup>
          </div>
          <Button
            type="button"
            icon="pi pi-ellipsis-v"
            class="z-3 ml-auto sm:ml-0"
            text
            rounded
            @click="toggleMenu($event, i, task)"
          ></Button>
          <Menu ref="menu" popup :model="menuItems" class="w-8rem"></Menu>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
/* Ajout de styles personnalisés si nécessaire */
</style>
