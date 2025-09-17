<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Enseignant</h1>
    <p class="text-700 mb-3">Sélectionner un enseignant pour voir sa planification (semaine par semaine).</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-4">
        <Panel header="Enseignant">
          <Dropdown class="w-full" :options="teachers" v-model="teacherId" optionLabel="name" optionValue="id" placeholder="Choisir un enseignant" />
        </Panel>
      </div>
      <div class="col-12 md:col-8">
        <Panel header="Semaine actuelle (exemple)">
          <DataTable :value="rows" size="small">
            <Column field="day" header="Jour" />
            <Column field="content" header="Cours / Module" />
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
import { supabase } from '@/supabase.js'

const teachers = ref([])
const teacherId = ref()
const rows = ref([])

const dayNames = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche'
}

const loadTeachers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,role')
    .eq('role', 'enseignant')
    .order('name', { ascending: true })
  if (!error && data) {
    teachers.value = data.map(t => ({ id: t.id, name: t.name || t.id }))
  }
}

const loadTeacherWeek = async () => {
  rows.value = []
  if (!teacherId.value) return
  // Récupère les cours assignés à l’enseignant et leurs horaires (schedule JSON)
  const { data, error } = await supabase
    .from('course_teachers')
    .select('courses(name,schedule)')
    .eq('teacher_id', teacherId.value)
  if (error || !data) return

  // Construire une semaine simple à partir de courses.schedule.day_of_week
  const map = new Map()
  for (const ct of data) {
    const c = ct.courses
    if (!c || !c.schedule) continue
    const d = c.schedule.day_of_week
    const label = `${c.name} ${c.schedule.start || ''}-${c.schedule.end || ''}`.trim()
    const arr = map.get(d) || []
    arr.push(label)
    map.set(d, arr)
  }
  // Générer lignes Lundi→Vendredi
  rows.value = [1,2,3,4,5].map(d => ({ day: dayNames[d], content: (map.get(d) || ['—']).join(', ') }))
}

onMounted(async () => {
  await loadTeachers()
})

watch(teacherId, async () => {
  await loadTeacherWeek()
})
</script>
