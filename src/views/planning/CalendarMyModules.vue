<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendar - My Modules</h1>
    <p class="text-700 mb-3">Liste de mes modules (rmodule) et liens d'édition (placeholder public, branchement Supabase selon roles à venir).</p>
    <Panel header="Mes modules (exemple)">
      <DataTable :value="rows" size="small">
        <Column field="name" header="Module" />
        <Column field="code" header="Code" />
        <Column header="Actions">
          <template #body="{ data }">
            <Button size="small" label="Éditer" icon="pi pi-pencil" @click="goEdit(data.id)" />
          </template>
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
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'

const router = useRouter()
const goEdit = (id) => router.push(`/calendar/module/${id}/edit`)

const rows = ref([])

const loadModules = async () => {
  const { data, error } = await supabase
    .from('modules')
    .select('id,code,name,color')
    .order('name', { ascending: true })
  if (!error && data) rows.value = data
}

onMounted(loadModules)
</script>
