<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Semestriel</h1>
    <p class="text-700 mb-3">Affichage par semestre, semaine par semaine.</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-4">
        <Panel header="Filtres">
          <div class="flex flex-column gap-2">
            <Dropdown :options="years" v-model="year" placeholder="Année académique" class="w-full" />
            <Dropdown :options="semesters" v-model="semester" optionLabel="name" placeholder="Semestre" class="w-full" />
            <Button label="Rafraîchir" @click="refresh" />
          </div>
        </Panel>
      </div>
      <div class="col-12 md:col-8">
        <Panel header="Semaines du semestre (exemple)">
          <DataTable :value="weeks" size="small" :rows="10" paginator :rowsPerPageOptions="[10,20,50]">
            <Column field="num" header="Semaine" />
            <Column field="label" header="Contenu" />
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
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { ref, onMounted, watch } from 'vue'
import { useSemestersStore } from '@/views/planning/stores/semestersStore.js'
import { useCalendarCellsStore } from '@/views/planning/stores/calendarCellsStore.js'

const years = ref([])
const semesters = ref([])
const year = ref()
const semester = ref()
const weeks = ref([])

const semestersStore = useSemestersStore()
const cellsStore = useCalendarCellsStore()

const loadSemesters = async () => {
  const list = await semestersStore.fetchAll()
  semesters.value = list.map(s => ({ id: s.id, name: s.name, academic_year: s.academic_year }))
  years.value = Array.from(new Set(semesters.value.map(s => s.academic_year)))
}

const loadWeeks = async () => {
  weeks.value = []
  if (!semester.value) return
  const data = await cellsStore.fetchBySemester(semester.value)
  if (!data) return
  // Grouper par semaine et déduire un label simple
  const map = new Map()
  for (const row of data) {
    const arr = map.get(row.week_number) || []
    arr.push(row.type)
    map.set(row.week_number, arr)
  }
  weeks.value = Array.from(map.entries())
    .sort((a,b)=>a[0]-b[0])
    .map(([num, types]) => ({ num, label: types.join(', ') }))
}

const refresh = async () => {
  await loadWeeks()
}

onMounted(async () => {
  await loadSemesters()
})

watch(year, (y) => {
  // auto-filtrer la liste par année
  const list = semesters.value.filter(s => s.academic_year === y)
  semester.value = list[0]?.id
})

watch(semester, async () => {
  await loadWeeks()
})
</script>
