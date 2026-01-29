<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-building text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Suivi Institutions</h1>
              <p class="text-600 m-0 mt-2">Gestion des conventions, dates et signatures des accords cadres</p>
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredInstitutions" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="20" :globalFilterFields="['Name', 'Locality']" filterDisplay="row">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Institutions</span>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Rechercher une institution..." class="w-20rem" />
              </span>
            </div>
          </template>
          <Column field="Name" header="Institution" sortable></Column>
          <Column field="Locality" header="Localité" sortable></Column>
          <Column field="ConventionDate" header="Date Convention" sortable>
            <template #body="slotProps">
              <span v-if="!editingRow || editingRow.InstitutionId !== slotProps.data.InstitutionId">
                {{ formatDate(slotProps.data.ConventionDate) }}
              </span>
              <Calendar
                v-else
                v-model="editingRow.ConventionDate"
                dateFormat="yy-mm-dd"
                :showIcon="true"
                class="w-full"
              />
            </template>
          </Column>
          <Column field="AccordCadreDate" header="Date Accord Cadre" sortable>
            <template #body="slotProps">
              <span v-if="!editingRow || editingRow.InstitutionId !== slotProps.data.InstitutionId">
                {{ formatDate(slotProps.data.AccordCadreDate) }}
              </span>
              <Calendar
                v-else
                v-model="editingRow.AccordCadreDate"
                dateFormat="yy-mm-dd"
                :showIcon="true"
                class="w-full"
              />
            </template>
          </Column>
          <Column header="Actions" :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
              <Button
                v-if="!editingRow || editingRow.InstitutionId !== slotProps.data.InstitutionId"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
                @click="startEditing(slotProps.data)"
                v-tooltip="'Éditer'"
              />
              <Button
                v-else
                icon="pi pi-check"
                class="p-button-rounded p-button-success mr-2"
                @click="saveEdit()"
                v-tooltip="'Sauvegarder'"
              />
              <Button
                v-if="editingRow && editingRow.InstitutionId === slotProps.data.InstitutionId"
                icon="pi pi-times"
                class="p-button-rounded p-button-danger"
                @click="cancelEdit()"
                v-tooltip="'Annuler'"
              />
            </template>
          </Column>
  
          
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<Toast />

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Toast from 'primevue/toast'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'

const loading = ref(false)
const institutions = ref([])
const editingRow = ref(null)
const originalRow = ref(null)
const searchQuery = ref('')
const toast = useToast()

const filteredInstitutions = computed(() => {
  if (!searchQuery.value) {
    return institutions.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return institutions.value.filter(institution => 
    institution.Name?.toLowerCase().includes(query) ||
    institution.Locality?.toLowerCase().includes(query)
  )
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-CH')
}

const startEditing = (institution) => {
  editingRow.value = { ...institution }
  originalRow.value = { ...institution }
}

const cancelEdit = () => {
  editingRow.value = null
  originalRow.value = null
}

const saveEdit = async () => {
  if (!editingRow.value) return
  
  try {
    const { error } = await supabase
      .from('institutions')
      .update({
        ConventionDate: editingRow.value.ConventionDate,
        AccordCadreDate: editingRow.value.AccordCadreDate,
        UpdatedAt: new Date().toISOString()
      })
      .eq('InstitutionId', editingRow.value.InstitutionId)

    if (error) throw error

    // Update local data
    const index = institutions.value.findIndex(i => i.InstitutionId === editingRow.value.InstitutionId)
    if (index !== -1) {
      institutions.value[index] = { ...editingRow.value }
    }

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Les dates ont été mises à jour',
      life: 3000
    })

    editingRow.value = null
    originalRow.value = null
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder les modifications',
      life: 3000
    })
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('Email copié:', text)
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
  }
}

const fetchInstitutions = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('InstitutionId, Name, Locality, ConventionDate, AccordCadreDate, IdResponsablePhysio')
      .order('Name')

    if (error) throw error

    institutions.value = data || []
  } catch (e) {
    console.error('Erreur fetchInstitutions:', e)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les institutions',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInstitutions()
})
</script>

<style scoped>
</style>
