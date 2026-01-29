<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Vérification Critères Étudiants</h1>
              <p class="text-600 m-0 mt-2">Gestion et vérification des critères d'admission des étudiants</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText 
                  v-model="searchQuery" 
                  placeholder="Rechercher par nom ou prénom" 
                  class="w-full md:w-20rem"
                  @input="handleSearch($event.target.value)"
                />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown 
                v-model="filterClasse" 
                :options="classes" 
                placeholder="Sélectionner une classe" 
                class="w-full md:w-12rem"
                showClear
              />
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredStudents" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="100" scrollable scrollHeight="600px" :globalFilterFields="['nom', 'prenom']">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Étudiants ({{ students.length }})</span>
            </div>
          </template>
          <Column field="nom" header="Nom" sortable frozen style="min-width: 150px"></Column>
          <Column field="prenom" header="Prénom" sortable frozen style="min-width: 150px"></Column>
          <Column field="classe" header="Classe" sortable style="min-width: 100px"></Column>
          <Column field="MSQ" header="MSQ" sortable style="min-width: 80px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.MSQ > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.MSQ > 0, 'text-500': slotProps.data.scores.MSQ === 0}">
                  {{ slotProps.data.scores.MSQ }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="SYSINT" header="SYSINT" sortable style="min-width: 100px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.SYSINT > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.SYSINT > 0, 'text-500': slotProps.data.scores.SYSINT === 0}">
                  {{ slotProps.data.scores.SYSINT }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="NEUROGER" header="NEUROGER" sortable style="min-width: 120px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.NEUROGER > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.NEUROGER > 0, 'text-500': slotProps.data.scores.NEUROGER === 0}">
                  {{ slotProps.data.scores.NEUROGER }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="AIGU" header="AIGU" sortable style="min-width: 80px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.AIGU > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.AIGU > 0, 'text-500': slotProps.data.scores.AIGU === 0}">
                  {{ slotProps.data.scores.AIGU }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="REHAB" header="REHAB" sortable style="min-width: 100px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.REHAB > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.REHAB > 0, 'text-500': slotProps.data.scores.REHAB === 0}">
                  {{ slotProps.data.scores.REHAB }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="AMBU" header="AMBU" sortable style="min-width: 90px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.AMBU > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.AMBU > 0, 'text-500': slotProps.data.scores.AMBU === 0}">
                  {{ slotProps.data.scores.AMBU }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="FR" header="FR" sortable style="min-width: 70px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.FR > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.FR > 0, 'text-500': slotProps.data.scores.FR === 0}">
                  {{ slotProps.data.scores.FR }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="DE" header="DE" sortable style="min-width: 70px">
            <template #body="slotProps">
              <div class="flex align-items-center justify-content-center">
                <i v-if="slotProps.data.scores.DE > 0" class="pi pi-check-circle text-green-500 mr-1" />
                <i v-else class="pi pi-times-circle text-red-400 mr-1" />
                <span :class="{'text-green-600 font-bold': slotProps.data.scores.DE > 0, 'text-500': slotProps.data.scores.DE === 0}">
                  {{ slotProps.data.scores.DE }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="totalStages" header="Total Stages" sortable style="min-width: 120px">
            <template #body="slotProps">
              <Tag :value="slotProps.data.totalStages" severity="info" />
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
import studentsService from '@/service/studentsService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'

const loading = ref(false)
const students = ref([])
const filterClasse = ref(null)
const classes = ref(['BA23', 'BA24', 'BA25'])
const searchQuery = ref('')
const searchDebounceTimer = ref(null)

// Étudiants filtrés par classe ET recherche
const filteredStudents = computed(() => {
  let filtered = students.value
  
  // Filtrer par classe
  if (filterClasse.value) {
    filtered = filtered.filter(student => student.classe === filterClasse.value)
  }
  
  // Filtrer par recherche (nom/prénom)
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.nom.toLowerCase().includes(searchLower) ||
      student.prenom.toLowerCase().includes(searchLower)
    )
  }
  
  return filtered
})

// Debounce pour la recherche
const handleSearch = (value) => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  searchDebounceTimer.value = setTimeout(() => {
    searchQuery.value = value
  }, 300)
}

const parsePfpValided = (pfpVal) => {
  if (!pfpVal) return []
  if (Array.isArray(pfpVal)) return pfpVal
  if (typeof pfpVal === 'string') {
    try {
      const parsed = JSON.parse(pfpVal)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  if (typeof pfpVal === 'object') return Object.values(pfpVal)
  return []
}

const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

const fetchStudents = async () => {
  loading.value = true
  const startTime = performance.now()
  
  try {
    // ⚡ OPTIMISATION: Requêtes parallèles avec Promise.all
    const [studentsData, physioResult] = await Promise.all([
      studentsService.getAllStudents(),
      supabase
        .from('StudentsPhysio')
        .select('user_id, pfp_valided')
    ])

    const physioData = physioResult.data
    if (physioResult.error) {
      console.warn('Erreur StudentsPhysio:', physioResult.error)
    }

    // ⚡ OPTIMISATION: Map pour lookup O(1) au lieu de O(n)
    const criteriaMap = new Map()
    
    if (physioData) {
      // Pré-calculer tous les scores en une passe
      physioData.forEach(physio => {
        if (!physio.pfp_valided) return
        
        const scores = {}
        criteriaLabels.forEach(k => { scores[k] = 0 })
        
        const pfpArray = parsePfpValided(physio.pfp_valided)
        
        pfpArray.forEach(place => {
          criteriaLabels.forEach(crit => {
            if (place[crit] === true) scores[crit]++
          })
        })
        
        criteriaMap.set(physio.user_id, {
          scores,
          totalStages: pfpArray.length
        })
      })
    }

    // ⚡ OPTIMISATION: Mapping direct sans recréation d'objets
    const defaultScores = Object.fromEntries(criteriaLabels.map(k => [k, 0]))
    
    students.value = studentsData.map(student => {
      const criteria = criteriaMap.get(student.id) || {
        scores: defaultScores,
        totalStages: 0
      }
      
      return {
        nom: student.Nom || '',
        prenom: student.Prenom || '',
        classe: student.Classe || '-',
        scores: criteria.scores,
        totalStages: criteria.totalStages,
        user_id: student.id
      }
    })

    // Tri optimisé avec Intl.Collator
    const collator = new Intl.Collator('fr', { sensitivity: 'base' })
    students.value.sort((a, b) => collator.compare(a.nom, b.nom))
    
    // Extraire les classes uniques
    const uniqueClasses = [...new Set(students.value.map(s => s.classe).filter(c => c !== '-'))].sort()
    if (uniqueClasses.length > 0) {
      classes.value = uniqueClasses
    }
    
    const loadTime = Math.round(performance.now() - startTime)
    console.log(`✅ ${students.value.length} étudiants chargés en ${loadTime}ms`)
  } catch (e) {
    console.error('Erreur fetchStudents:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
</style>
