<template>
  <Panel header="Mes classeurs" class="notebook-sidebar-panel notebook-sidebar">
    <ul class="notebook-list" v-if="notebooks && notebooks.length > 0">
      <li v-for="notebook in notebooks" :key="notebook.id" :class="{active: selectedNotebookId === notebook.id}">
        <button type="button" class="notebook-name" :aria-current="selectedNotebookId === notebook.id ? 'page' : undefined" @click="$emit('select', notebook)">{{ notebook.name }}</button>
        <Button icon="pi pi-pencil" class="p-button-text p-button-sm" :aria-label="`Modifier le classeur ${notebook.name}`" @click.stop="$emit('edit-notebook', notebook)" />
        <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" :aria-label="`Supprimer le classeur ${notebook.name}`" @click.stop="$emit('delete-notebook', notebook)" />
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
  selectedNotebookId: {
    type: [String, Number],
    default: null
  },
})
const emit = defineEmits(['select', 'create-notebook', 'edit-notebook', 'delete-notebook'])
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
.notebook-list li.active {
  background: var(--primary-color);
  color: #071426;
  border-radius: 4px;
}
.notebook-list li.active .notebook-name {
  font-weight: 700;
}
.notebook-list li.active :deep(.p-button) {
  color: #071426;
}
.notebook-name {
  flex: 1;
  min-height: 2.5rem;
  padding: .5rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.notebook-name:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
.empty-state {
  text-align: center;
  padding: 1rem;
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
