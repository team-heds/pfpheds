<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Profil Répondant Enseignant</h1>
              <p class="text-600 m-0 mt-2">Gestion des profils des répondants enseignants et de leurs étudiants assignés</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3">
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
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown 
                v-model="filterType" 
                :options="typesPFP" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Type PFP" 
                class="w-full md:w-10rem"
                showClear
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Rôle :</label>
              <SelectButton 
                v-model="filterRole" 
                :options="roleOptions" 
                optionLabel="label" 
                optionValue="value" 
              />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Choisir un répondant :</label>
              <Dropdown 
                v-model="selectedRepondant" 
                :options="repondantsHESList" 
                optionLabel="label" 
                placeholder="Sélectionner un répondant" 
                class="w-full md:w-15rem"
                filter
                showClear
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedRepondant" class="grid mb-4">
        <!-- Statistiques du répondant -->
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ assignedStudents.length }}</h3>
                <p class="text-600 m-0">Étudiants assignés</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ validatedCount }}</h3>
                <p class="text-600 m-0">Validés</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-clock text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ pendingCount }}</h3>
                <p class="text-600 m-0">En attente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des étudiants assignés -->
      <div v-if="selectedRepondant" class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredAssignedStudents" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="20">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Étudiants sous la responsabilité de {{ selectedRepondant.label }}</span>
            </div>
          </template>
          <Column field="student_name" header="Étudiant" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="(slotProps.data.student_name || '').charAt(0)" shape="circle" />
                <span>{{ slotProps.data.student_name }}</span>
              </div>
            </template>
          </Column>
          <Column field="student_class" header="Classe" sortable></Column>
          <Column field="pfp_type" header="PFP" sortable></Column>
          <Column field="year" header="Année" sortable></Column>
          <Column field="assigned_place_name" header="Lieu de stage" sortable></Column>
          <Column field="role" header="Rôle HES" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.role" :severity="slotProps.data.role === 'Répondant' ? 'primary' : 'info'" />
            </template>
          </Column>
          <Column field="lieu_signature" header="Lieu signature" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.lieu_signature" :value="slotProps.data.lieu_signature" :severity="getLieuSignatureSeverity(slotProps.data.lieu_signature)" />
              <span v-else>-</span>
            </template>
          </Column>
          <Column field="is_validated" header="Validé" sortable>
            <template #body="slotProps">
              <Checkbox v-model="slotProps.data.is_validated" :binary="true" @change="toggleValidation(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="surface-card p-8 border-round shadow-2 text-center">
        <i class="pi pi-users text-400 text-6xl mb-4"></i>
        <h2 class="text-2xl font-medium text-600">Veuillez sélectionner un répondant pour voir ses assignations</h2>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Checkbox from 'primevue/checkbox'

const loading = ref(false)
const repondantsHESList = ref([])
const selectedRepondant = ref(null)
const assignedStudents = ref([])
const filterRole = ref('all')
const filterYear = ref(null)
const filterType = ref(null)

const years = ref(['2025', '2026'])
const typesPFP = ref([
  { label: 'PFP1A', value: 'PFP1A' },
  { label: 'PFP1B', value: 'PFP1B' },
  { label: 'PFP2', value: 'PFP2' },
  { label: 'PFP3', value: 'PFP3' },
  { label: 'PFP4', value: 'PFP4' }
])

const roleOptions = ref([
  { label: 'Tous', value: 'all' },
  { label: 'Répondant', value: 'Répondant' },
  { label: 'Signataire', value: 'Signataire' }
])

const filteredAssignedStudents = computed(() => {
  let list = assignedStudents.value
  
  if (filterRole.value !== 'all') {
    list = list.filter(s => s.role === filterRole.value)
  }
  
  if (filterYear.value) {
    list = list.filter(s => s.year === filterYear.value)
  }
  
  if (filterType.value) {
    list = list.filter(s => s.pfp_type === filterType.value)
  }
  
  return list
})

const validatedCount = computed(() => filteredAssignedStudents.value.filter(s => s.is_validated).length)
const pendingCount = computed(() => filteredAssignedStudents.value.length - validatedCount.value)

const loadRepondantsHES = async () => {
  try {
    const { data, error } = await supabase
      .from('RepondantPhysioHES')
      .select('id, first_name, last_name')
      .eq('is_active', true)
      .order('last_name')

    if (error) throw error
    repondantsHESList.value = (data || []).map(r => ({
      id: r.id,
      label: `${r.first_name} ${r.last_name}`,
      value: `${r.first_name} ${r.last_name}`
    }))
  } catch (e) {
    console.error('Erreur loadRepondantsHES:', e)
  }
}

const fetchAssignedStudents = async (repondantName) => {
  if (!repondantName) {
    assignedStudents.value = []
    return
  }

  loading.value = true
  try {
    // 1. Chercher dans student_result_vote les correspondances
    const { data: assignments, error } = await supabase
      .from('student_result_vote')
      .select(`
        id, 
        user_id, 
        pfp_type, 
        year, 
        assigned_place_name, 
        repondant_hes, 
        signataire_hes, 
        lieu_signature, 
        is_validated
      `)
      .or(`repondant_hes.eq."${repondantName}",signataire_hes.eq."${repondantName}"`)
      .eq('status', 'published')

    if (error) throw error

    if (!assignments?.length) {
      assignedStudents.value = []
      return
    }

    // 2. Enrichir avec les infos étudiants
    const userIds = [...new Set(assignments.map(a => a.user_id))]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, family_name, forname, classe')
      .in('user_id', userIds)

    const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]))

    assignedStudents.value = assignments.map(a => {
      const p = profilesMap.get(a.user_id)
      return {
        ...a,
        student_name: p ? `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim() : 'Inconnu',
        student_class: p?.classe || '-',
        role: a.repondant_hes === repondantName ? 'Répondant' : 'Signataire'
      }
    })
  } catch (e) {
    console.error('Erreur fetchAssignedStudents:', e)
  } finally {
    loading.value = false
  }
}

const getLieuSignatureSeverity = (lieu) => {
  const severities = {
    'Présence': 'success',
    'Visio-conférence': 'info',
    'Étudiant': 'warning'
  }
  return severities[lieu] || 'secondary'
}

const toggleValidation = async (row) => {
  try {
    const { error } = await supabase
      .from('student_result_vote')
      .update({ is_validated: row.is_validated })
      .eq('id', row.id)

    if (error) throw error
  } catch (e) {
    console.error('Erreur toggleValidation:', e)
    row.is_validated = !row.is_validated
  }
}

watch(selectedRepondant, (newVal) => {
  if (newVal) {
    fetchAssignedStudents(newVal.value)
  } else {
    assignedStudents.value = []
  }
})

onMounted(() => {
  loadRepondantsHES()
})
</script>

<style scoped>
</style>
