<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Module</h1>
    <p class="text-700 mb-3">Affichage par module, semaine par semaine.</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-4">
        <Panel header="Sélection du module">
          <Dropdown class="w-full" :options="modules" v-model="moduleId" optionLabel="name" optionValue="id" placeholder="Choisir un module" />
        </Panel>
      </div>
      <div class="col-12 md:col-8">
        <Panel header="Planification du module (exemple)">
          <DataTable :value="rows" size="small">
            <Column field="week" header="Semaine" />
            <Column field="content" header="Contenu" />
          </DataTable>
        </Panel>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { ref, onMounted, watch } from 'vue'
import { useModulesStore } from '@/views/planning/stores/modulesStore.js'
import { useCalendarCellsStore } from '@/views/planning/stores/calendarCellsStore.js'

const modules = ref([])
const moduleId = ref()
const rows = ref([])

const modulesStore = useModulesStore()
const cellsStore = useCalendarCellsStore()

const loadModules = async () => {
  modules.value = await modulesStore.fetchAll()
}

const loadModuleWeeks = async () => {
  rows.value = []
  if (!moduleId.value) return
  const data = await cellsStore.fetchByModule(moduleId.value)
  if (!data) return
  const map = new Map()
  for (const r of data) {
    const arr = map.get(r.week_number) || []
    arr.push(r.type + (r.notes ? ` (${r.notes})` : ''))
    map.set(r.week_number, arr)
  }
  rows.value = Array.from(map.entries())
    .sort((a,b)=>a[0]-b[0])
    .map(([week, types]) => ({ week, content: types.join(', ') }))
}

onMounted(loadModules)

watch(moduleId, loadModuleWeeks)
</script>
