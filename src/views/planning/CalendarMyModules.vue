<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Tous les modules</h1>
    <p class="text-700 mb-3">La liste des modules et leur accès d’édition.</p>
    <Panel header="Modules">
      <DataTable :value="rows" size="small">
        <Column field="name" header="Module" />
        <Column field="code" header="Code" />
        <Column header="Actions">
          <template #body="{ data }">
            <Button v-if="canEditCalendar" size="small" label="Éditer" icon="pi pi-pencil" @click="goEdit(data.id)" />
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
import { computed, ref, onMounted } from 'vue'
import { supabase } from '@/supabase.js'
import { useRoleStore } from '@/stores/role'
import { CALENDAR_EDIT_NEED } from '@/config/calendarAccess'

const roleStore = useRoleStore()
const canEditCalendar = computed(() => roleStore.can([...CALENDAR_EDIT_NEED]))
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
