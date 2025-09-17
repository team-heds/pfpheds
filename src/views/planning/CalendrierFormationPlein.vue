<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Formation Temps Plein</h1>
    <p class="text-700 mb-3">Vue de lecture. Semaine 37 → 37, 5 jours / semaine. 3 années pour 6 semestres (2026-29).</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-4">
        <Panel header="Filtre rapide">
          <div class="flex flex-column gap-2">
            <Dropdown :options="years" v-model="year" placeholder="Année académique" class="w-full" />
            <Dropdown :options="semesters" v-model="semester" optionLabel="name" optionValue="id" placeholder="Semestre" class="w-full" />
            <Dropdown :options="weeks" v-model="week" optionLabel="label" optionValue="value" placeholder="Semaine" class="w-full" />
            <Button label="Appliquer" @click="refresh" />
          </div>
        </Panel>
      </div>
      <div class="col-12 md:col-8">
        <Panel :header="`Semaine ${week || '—'}`">
          <div class="grid">
            <div class="col-2 text-600" v-for="d in [1,2,3,4,5]" :key="d">{{ dayNames[d] }}</div>
          </div>
          <div class="grid">
            <div class="col-2" v-for="d in [1,2,3,4,5]" :key="'c'+d">
              <div class="border-1 surface-border border-round p-2" style="min-height:3.5rem">
                <div v-if="cellsByDay[d] && cellsByDay[d].length">
                  <div v-for="(label,idx) in cellsByDay[d]" :key="idx">{{ label }}</div>
                </div>
                <div v-else class="text-600">—</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div class="col-12">
        <Message severity="info">Lecture depuis Supabase: semestres, semaines (calendar_cells), et cellules par jour pour la semaine sélectionnée.</Message>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/supabase.js'

const years = ref([])
const semesters = ref([])
const year = ref()
const semester = ref()
const weeks = ref([]) // [{label, value}]
const week = ref()
const cellsByDay = ref({})

const dayNames = { 1:'Lundi',2:'Mardi',3:'Mercredi',4:'Jeudi',5:'Vendredi',6:'Samedi',7:'Dimanche' }

const loadSemesters = async () => {
  const { data, error } = await supabase
    .from('semesters')
    .select('id,name,academic_year')
    .order('academic_year', { ascending: true })
  if (!error && data) {
    semesters.value = data
    years.value = Array.from(new Set(data.map(s => s.academic_year)))
  }
}

const loadWeeks = async () => {
  weeks.value = []
  week.value = undefined
  if (!semester.value) return
  const { data, error } = await supabase
    .from('calendar_cells')
    .select('week_number')
    .eq('semester_id', semester.value)
  if (error || !data) return
  const set = Array.from(new Set(data.map(r => r.week_number))).sort((a,b)=>a-b)
  weeks.value = set.map(n => ({ label: `Semaine ${n}`, value: n }))
  week.value = weeks.value[0]?.value
}

const loadCells = async () => {
  cellsByDay.value = {}
  if (!semester.value || !week.value) return
  const { data, error } = await supabase
    .from('calendar_cells')
    .select('day_of_week,type,notes')
    .eq('semester_id', semester.value)
    .eq('week_number', week.value)
  if (error || !data) return
  const map = {}
  for (const r of data) {
    const d = r.day_of_week
    if (!map[d]) map[d] = []
    map[d].push(r.type + (r.notes ? ` (${r.notes})` : ''))
  }
  cellsByDay.value = map
}

const refresh = async () => {
  await loadCells()
}

onMounted(async () => {
  await loadSemesters()
})

watch(year, (y) => {
  const list = semesters.value.filter(s => s.academic_year === y)
  semester.value = list[0]?.id
})

watch(semester, async () => {
  await loadWeeks()
  await loadCells()
})

watch(week, async () => {
  await loadCells()
})
</script>
