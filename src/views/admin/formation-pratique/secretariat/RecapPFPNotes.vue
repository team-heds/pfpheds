<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-file text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Récapitulatif PFP Notes</h1>
              <p class="text-600 m-0 mt-2">Toutes les colonnes du fichier Excel PFP - Notes (A-B-C-D-E-F), absences et remarques</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown 
                v-model="filterPFP" 
                :options="typesPFP" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Type PFP" 
                class="w-full md:w-10rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown 
                v-model="filterYear" 
                :options="years" 
                placeholder="Année" 
                class="w-full md:w-8rem"
                showClear
              />
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredNotes" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="20">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Notes PFP</span>
            </div>
          </template>
          <Column field="etudiant" header="Étudiant" sortable></Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="pfp_type" header="PFP" sortable></Column>
          <Column field="year" header="Année" sortable></Column>
          <Column field="note_a" header="Note A" sortable></Column>
          <Column field="note_b" header="Note B" sortable></Column>
          <Column field="note_c" header="Note C" sortable></Column>
          <Column field="note_d" header="Note D" sortable></Column>
          <Column field="note_e" header="Note E" sortable></Column>
          <Column field="note_f" header="Note F" sortable></Column>
          <Column field="absences" header="Absences (1/2j)" sortable></Column>
          <Column field="remarques" header="Remarques" sortable>
            <template #body="slotProps">
              <span :title="slotProps.data.remarques">{{ slotProps.data.remarques || '-' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const loading = ref(false)
const notes = ref([])
const filterPFP = ref(null)
const filterYear = ref(null)

const typesPFP = ref([
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const years = ref(['2025', '2026'])

const filteredNotes = computed(() => {
  let list = notes.value
  
  if (filterPFP.value) {
    list = list.filter(n => n.pfp_type === filterPFP.value)
  }
  
  if (filterYear.value) {
    list = list.filter(n => n.year === filterYear.value)
  }
  
  return list
})

const fetchNotes = async () => {
  loading.value = true
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, family_name, forname, classe')
      .order('family_name')

    if (error) throw error

    notes.value = (profiles || []).map(p => ({
      etudiant: `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim(),
      classe: p.classe || '-',
      pfp_type: '-',
      year: '2025',
      note_a: '-',
      note_b: '-',
      note_c: '-',
      note_d: '-',
      note_e: '-',
      note_f: '-',
      absences: 0,
      remarques: ''
    }))
  } catch (e) {
    console.error('Erreur fetchNotes:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNotes()
})
</script>

<style scoped>
</style>
