<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Tous les cours</h1>
    <p class="text-700 mb-3">Les cours, leur module et leur horaire.</p>
    <Panel header="Cours">
      <DataTable :value="rows" size="small">
        <Column field="name" header="Cours" />
        <Column field="module" header="Module" />
        <Column field="when" header="Quand" />
      </DataTable>
    </Panel>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'

const rows = ref([])

const loadCourses = async () => {
  // Démo publique: liste tous les cours avec module et horaire
  const { data, error } = await supabase
    .from('courses')
    .select('id,name,duration_hours,schedule,modules(name,code)')
    .order('name', { ascending: true })
  if (error || !data) return
  rows.value = data.map(c => ({
    name: c.name,
    module: c.modules?.name || '-',
    when: c?.schedule ? `${dayLabel(c.schedule.day_of_week)} ${c.schedule.start || ''}-${c.schedule.end || ''}`.trim() : '—'
  }))
}

const dayLabel = (d) => ({1:'Lundi',2:'Mardi',3:'Mercredi',4:'Jeudi',5:'Vendredi',6:'Samedi',7:'Dimanche'})[d] || '—'

onMounted(loadCourses)
</script>
