<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendar - Module</h1>
    <Panel header="Informations du module">
      <ul class="m-0 pl-3">
        <li><strong>Nom</strong>: {{ module?.name || '—' }}</li>
        <li><strong>Code</strong>: {{ module?.code || '—' }}</li>
        <li><strong>Couleur</strong>: <span :style="{ background: module?.color || '#eee', padding: '0 .5rem' }">{{ module?.color || '—' }}</span></li>
        <li><strong>Description</strong>: {{ module?.description || '—' }}</li>
        <li><strong>Syllabus</strong>: <a v-if="module?.syllabus_url" :href="module.syllabus_url" target="_blank">Ouvrir</a><span v-else>—</span></li>
      </ul>
    </Panel>

    <Panel class="mt-3" header="Cours du module">
      <DataTable :value="courses" size="small">
        <Column field="name" header="Nom" />
        <Column header="Semaine">
          <template #body="{ data }">{{ data.schedule?.week || '—' }}</template>
        </Column>
      </DataTable>
    </Panel>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useModulesStore } from '@/views/planning/stores/modulesStore.js'
import { useCoursesStore } from '@/views/planning/stores/coursesStore.js'

const route = useRoute()
const modulesStore = useModulesStore()
const coursesStore = useCoursesStore()

const module = ref(null)
const courses = ref([])

const load = async () => {
  const id = route.params.moduleId
  if (!id) return
  try { module.value = await modulesStore.getById(id) } catch (e) { console.warn('Module load failed', e) }
  try { courses.value = await coursesStore.fetchByModule(id) } catch (e) { console.warn('Module courses load failed', e) }
}

onMounted(load)
</script>
