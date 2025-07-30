<template>
  <Panel header="Mes classeurs" class="notebook-sidebar-panel notebook-sidebar">
    <ul class="notebook-list" v-if="notebooks && notebooks.length > 0">
      <li v-for="notebook in notebooks" :key="notebook.id" :class="{active: selectedNotebookId === notebook.id}">
        <span @click="$emit('select', notebook)">{{ notebook.name }}</span>
        <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click.stop="$emit('edit-notebook', notebook)" />
        <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" @click.stop="$emit('delete-notebook', notebook)" />
      </li>
    </ul>
    <div v-else class="empty-state">
      <p>Aucun classeur trouvé</p>
    </div>
    <Button label="Nouveau classeur" icon="pi pi-plus" class="p-mt-3" @click="$emit('create-notebook')" />
  </Panel>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import Panel from 'primevue/panel';
import Button from 'primevue/button';

const props = defineProps({
  notebooks: {
    type: Array,
    default: () => []
  },
})
const emit = defineEmits(['select', 'create-notebook', 'edit-notebook', 'delete-notebook'])
const selectedNotebookId = null // la sélection est gérée dans la vue principale
</script>

<style scoped>
.notebook-sidebar-panel {
  background: var(--surface-card) !important;
  box-shadow: none;
}
.notebook-sidebar {
  min-width: 200px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 32px;
  background: var(--surface-card) !important;
}
:deep(.notebook-sidebar)::-webkit-scrollbar {
  display: none;
}
.notebook-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.notebook-list li {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
  cursor: pointer;
}
.notebook-list li.active > span {
  font-weight: bold;
  color: var(--primary-color, #2196f3);
}
.notebook-list li.active {
  background: var(--primary-color);
  color: white;
}
.notebook-list li span {
  flex: 1;
}
.empty-state {
  text-align: center;
  padding: 1rem;
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
