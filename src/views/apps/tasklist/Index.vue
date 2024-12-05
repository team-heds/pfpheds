<script setup>
import { ref, onBeforeMount } from 'vue';
import { getDatabase, ref as dbRef, onValue, push, remove, update } from 'firebase/database';
import List from './List.vue';
import CreateTaskDialog from './CreateTaskDialog.vue';
import { useToast } from 'primevue/usetoast';
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js'; // Importez votre configuration Firebase

const toast = useToast();

const taskList = ref([]);
const todo = ref([]);
const completed = ref([]);
const dialogConfig = ref({
  visible: false,
  task: null,
});
const selectedTask = ref(null);

onBeforeMount(async () => {
  await loadTasks();
});

const loadTasks = async () => {
  const tasksRef = dbRef(db, 'tasks');
  onValue(tasksRef, (snapshot) => {
    const data = snapshot.val();
    taskList.value = data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [];
    categorize(taskList.value);
  });
};

const categorize = (tasks) => {
  todo.value = tasks.filter((task) => !task.completed);
  completed.value = tasks.filter((task) => task.completed);
};

const saveTaskToFirebase = async (task) => {
  if (task.id) {
    // Mise à jour d'une tâche existante
    const taskRef = dbRef(db, `tasks/${task.id}`);
    await update(taskRef, task);
  } else {
    // Ajout d'une nouvelle tâche
    const tasksRef = dbRef(db, 'tasks');
    await push(tasksRef, task);
  }
};

const deleteTaskFromFirebase = async (taskId) => {
  const taskRef = dbRef(db, `tasks/${taskId}`);
  await remove(taskRef);
};

const onCheckboxChange = async (updatedTask) => {
  const taskIndex = taskList.value.findIndex((task) => task.id === updatedTask.id);
  if (taskIndex !== -1) {
    taskList.value[taskIndex].completed = updatedTask.completed;
    await saveTaskToFirebase(taskList.value[taskIndex]);
  }
  categorize(taskList.value);
};

const onDeleteTask = async (deletedTask) => {
  await deleteTaskFromFirebase(deletedTask.id);
  taskList.value = taskList.value.filter((task) => task.id !== deletedTask.id);
  categorize(taskList.value);
};

const openEditDialog = (task) => {
  dialogConfig.value.visible = true;
  dialogConfig.value.header = 'Edit Task';
  selectedTask.value = task;
};

const openCreateDialog = () => {
  dialogConfig.value.visible = true;
  dialogConfig.value.header = 'Create Task';
  selectedTask.value = null;
};

const onCloseDialog = () => {
  dialogConfig.value.visible = false;
};

const onSaveDialog = async (task) => {
  await saveTaskToFirebase(task);
  toast.add({
    severity: task.id ? 'success' : 'info',
    summary: task.id ? 'Task Updated' : 'Task Created',
    detail: `Task "${task.name}" ${task.id ? 'updated' : 'created'} successfully.`,
    life: 3000,
  });
  dialogConfig.value.visible = false;
};
</script>

<template>
  <Navbar />
  <div class="card">
    <div class="flex justify-content-between align-items-center mb-5">
      <span class="text-900 text-xl font-semibold">Task List</span>
      <Button class="font-semibold" outlined icon="pi pi-plus" label="Create Task" @click="openCreateDialog()" />
    </div>
    <List :task-list="todo" title="ToDo" @checkbox:change="onCheckboxChange" @delete:task="onDeleteTask" @open:edit:dialog="openEditDialog" />
    <List :task-list="completed" title="Completed" @checkbox:change="onCheckboxChange" @delete:task="onDeleteTask" @open:edit:dialog="openEditDialog" />
  </div>

  <Dialog
    :header="dialogConfig.header || ''"
    v-model:visible="dialogConfig.visible"
    modal
    class="mx-3 sm:mx-0 sm:w-full md:w-8 lg:w-6"
    contentClass="border-round-bottom border-top-1 surface-border p-0"
  >
    <CreateTaskDialog :selected-task="selectedTask" @close="onCloseDialog()" @save="onSaveDialog" />
  </Dialog>
</template>

<style scoped>
.card {
  padding: 20px;
  background-color: var(--surface-card);
  border-radius: 10px;
}
</style>
