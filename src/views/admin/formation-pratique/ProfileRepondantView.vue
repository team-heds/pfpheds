<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Profil Répondant</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Profil Répondant</h1>
              <p class="text-600 m-0 mt-2">
                {{ isActualRepondant ? 'Mes étudiants assignés' : 'Consultation des étudiants par répondant' }}
              </p>
            </div>
          </div>
          
          <div class="flex align-items-center gap-3">
            <!-- Mode consultation pour les admins ou si autorisé -->
            <div v-if="!isActualRepondant || isAdmin" class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Voir en tant que :</label>
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

      <!-- Message si non répondant et rien sélectionné -->
      <div v-if="!effectiveRepondantName" class="surface-card p-8 border-round shadow-2 text-center">
        <i class="pi pi-search text-400 text-6xl mb-4"></i>
        <h2 class="text-2xl font-medium text-600">Veuillez sélectionner un répondant pour voir ses étudiants</h2>
      </div>

      <!-- Contenu (Liste simplifiée) -->
      <div v-else>
        <!-- Statistiques par classe (pour le répondant sélectionné) -->
        <div class="surface-card p-4 border-round shadow-2 mb-4">
          <h3 class="text-xl font-bold text-900 m-0 mb-4">Répartition par classe ({{ effectiveRepondantName }})</h3>
          <div class="grid">
            <div v-for="(count, classe) in respondentClassStats" :key="classe" class="col-12 md:col-3">
              <div class="surface-card p-3 border-round text-center">
                <div class="text-2xl font-bold text-primary">{{ count }}</div>
                <div class="text-sm text-600">{{ classe }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="surface-card p-4 border-round shadow-2">
          <DataTable :value="filteredAssignedStudents" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="20">
            <template #header>
              <div class="flex justify-content-between align-items-center">
                <div class="flex flex-column">
                  <span class="text-xl text-900 font-bold">
                    Étudiants dont {{ effectiveRepondantName }} est le répondant
                  </span>
                  <div class="flex gap-4 mt-2">
                    <span class="text-sm text-600">
                      <strong>{{ filteredAssignedStudents.length }}</strong> étudiants assignés
                    </span>
                    <span class="text-sm text-600">
                      sur <strong>{{ allStudents.length }}</strong> étudiants au total
                    </span>
                  </div>
                  <div class="flex gap-2 mt-2">
                    <span class="p-input-icon-left">
                      <i class="pi pi-filter" />
                      <Dropdown 
                        v-model="selectedClassFilter" 
                        :options="classFilterOptions" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Filtrer par classe" 
                        showClear
                        class="w-full md:w-10rem"
                      />
                    </span>
                    <Button 
                      :label="sortOrder === 'asc' ? 'Tri A-Z' : 'Tri Z-A'" 
                      :icon="sortOrder === 'asc' ? 'pi pi-sort-alpha-down' : 'pi pi-sort-alpha-up'" 
                      outlined 
                      severity="secondary"
                      @click="toggleSortOrder" 
                    />
                  </div>
                </div>
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText v-model="globalSearch" placeholder="Rechercher un étudiant..." />
                </span>
              </div>
            </template>
            <template #empty> Aucun étudiant trouvé pour ce répondant. </template>

            <Column header="Étudiant" sortable sortField="student_name">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <Avatar :label="(data.student_name || '').charAt(0)" shape="circle" />
                  <div class="flex flex-column">
                    <span class="font-bold">{{ data.student_name }}</span>
                    <span class="text-sm text-600">{{ data.Mail }}</span>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="student_class" header="Classe" class="text-center" sortable style="width: 10rem" />

            <Column header="Action" class="text-center" style="width: 8rem">
              <template #body="{ data }">
                <Button label="Profil" icon="pi pi-user" size="small" outlined @click="goToEtudiantDetails(data.user_id)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useUserStore } from '@/stores/userStore'
import studentsService from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const repondantsHESList = ref([])
const selectedRepondant = ref(null)
const allStudents = ref([])
const globalSearch = ref('')
const selectedClassFilter = ref(null)
const sortOrder = ref('asc')

// Options pour le filtre par classe
const classFilterOptions = computed(() => {
  const classes = [...new Set(allStudents.value.map(s => s.student_class).filter(Boolean))]
  return classes.map(classe => ({ label: classe, value: classe })).sort((a, b) => a.label.localeCompare(b.label))
})

// Profil du répondant connecté
const currentRepondantProfile = ref(null)
const isActualRepondant = computed(() => !!currentRepondantProfile.value)
const isAdmin = computed(() => userStore.profile?.roles?.includes('admin'))

const effectiveRepondantName = computed(() => {
  if (selectedRepondant.value) return selectedRepondant.value.value
  if (currentRepondantProfile.value) {
    return `${currentRepondantProfile.value.first_name} ${currentRepondantProfile.value.last_name}`
  }
  return null
})

const respondentClassStats = computed(() => {
  const stats = {}
  filteredAssignedStudents.value.forEach(student => {
    const classe = student.student_class || 'Non défini'
    stats[classe] = (stats[classe] || 0) + 1
  })
  return stats
})

const filteredAssignedStudents = computed(() => {
  if (!effectiveRepondantName.value) return []
  
  let list = allStudents.value.filter(s => s.repondant_hes === effectiveRepondantName.value)
  
  // Filtre par classe
  if (selectedClassFilter.value) {
    list = list.filter(s => s.student_class === selectedClassFilter.value)
  }
  
  // Recherche globale
  if (globalSearch.value) {
    const search = globalSearch.value.toLowerCase()
    list = list.filter(s => 
      s.student_name.toLowerCase().includes(search) || 
      s.Mail?.toLowerCase().includes(search) ||
      s.student_class?.toLowerCase().includes(search)
    )
  }
  
  // Tri alphabétique
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  return [...list].sort((a, b) => {
    const nameA = a.student_name || ''
    const nameB = b.student_name || ''
    const res = collator.compare(nameA, nameB)
    return sortOrder.value === 'asc' ? res : -res
  })
})

const loadCurrentRepondantProfile = async () => {
  if (!userStore.user?.id) return
  try {
    const { data, error } = await supabase
      .from('RepondantPhysioHES')
      .select('*')
      .eq('user_id', userStore.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    currentRepondantProfile.value = data
  } catch (e) {
    console.error('Erreur loadCurrentRepondantProfile:', e)
  }
}

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

const fetchAllStudentsData = async () => {
  loading.value = true
  try {
    const [students, { data: physioData }] = await Promise.all([
      studentsService.getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, repondant_hes')
    ])

    const physioByUserId = new Map((physioData || []).map(sp => [sp.user_id, sp.repondant_hes]))

    allStudents.value = students.map(s => ({
      ...s,
      user_id: s.id,
      student_name: `${(s.Nom || '').toUpperCase()} ${s.Prenom || ''}`.trim(),
      student_class: s.Classe || '-',
      repondant_hes: physioByUserId.get(s.id) || null
    }))
  } catch (e) {
    console.error('Erreur fetchAllStudentsData:', e)
  } finally {
    loading.value = false
  }
}

const goToEtudiantDetails = (userId) => {
  router.push({ name: 'Profile', params: { id: userId } })
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

onMounted(async () => {
  await Promise.all([
    loadCurrentRepondantProfile(),
    loadRepondantsHES(),
    fetchAllStudentsData()
  ])
})
</script>
