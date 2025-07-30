<template>
  <Panel header="Feuilles" class="page-list page-list-panel">
    <InputText v-model="search" placeholder="Rechercher une feuille..." class="p-mb-2 w-12 mb-5" />
    <ul class="page-list-ul mb-3" v-if="filteredPages && filteredPages.length > 0">
      <li v-for="page in filteredPages" :key="page.id" :class="{active: selectedPageId === page.id}" class="mb-4">
        <span @click="$emit('select', page)">
          {{ page.title }}
          <small class="page-date">({{ formatDate(page.updatedAt || page.createdAt) }})</small>
        </span>
        <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click.stop="$emit('edit-page', page)" />
        <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" @click.stop="$emit('delete-page', page)" />
      </li>
    </ul>
    <div v-else class="empty-state">
      <p>Aucune feuille trouvée</p>
    </div>
    <Button label="Nouvelle feuille" icon="pi pi-plus" class="p-mt-3" @click="$emit('create-page')" />
  </Panel>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps({
  pages: {
    type: Array,
    default: () => []
  },
})
const emit = defineEmits(['select', 'create-page', 'edit-page', 'delete-page'])
const selectedPageId = null // sélection gérée dans la vue principale

const search = ref('')

const filteredPages = computed(() => {
  if (!props.pages || !Array.isArray(props.pages)) return []
  if (!search.value) return props.pages
  return props.pages.filter(page => 
    page.title && page.title.toLowerCase().includes(search.value.toLowerCase())
  )
})

function formatDate(date) {
  if (!date) return 'Date inconnue'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR')
}
</script>

<style scoped>
.page-list {
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
:deep(.page-list)::-webkit-scrollbar {
  display: none;
}
.page-list-panel {
  background: var(--surface-card) !important;
  box-shadow: none;
}
.page-list-ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.page-list-ul li {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
  cursor: pointer;
}
.page-list-ul li.active > span {
  font-weight: bold;
  color: var(--primary-color, #2196f3);
}
.page-list-ul li span {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.page-date {
  color: #888;
  font-size: 0.8em;
  margin-left: 0.5em;
}
.page-list-ul li.active {
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 1rem;
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
