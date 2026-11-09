<template>
  <div class="grid">
    <!-- Section Classement des Maisons -->
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4 house-ranking-header">
          <div class="flex align-items-center gap-2">
            <div class="bg-blue-100 text-blue-600 p-2 border-circle">
              <i class="pi pi-trophy text-lg"></i>
            </div>
            <h2 class="text-xl font-bold text-900 m-0">Classement des maisons HES</h2>
          </div>
          <Tag value="Totaux calculés automatiquement" severity="info" class="house-ranking-tag" />
        </div>
        
        <div v-if="loading" class="flex flex-column align-items-center justify-content-center py-6">
          <ProgressSpinner />
          <p class="text-600 mt-3">Chargement du classement...</p>
        </div>
        
        <div v-else class="grid">
          <div 
            v-for="(house, index) in rankedHouses" 
            :key="house.name"
            class="col-12 md:col-6 xl:col-3"
          >
            <div class="card border-1 surface-border h-full">
              <!-- Rang et couronne -->
              <div class="flex justify-content-between align-items-center mb-3">
                <div class="flex align-items-center gap-2">
                  <span class="text-2xl font-bold text-600">#{{ index + 1 }}</span>
                  <i v-if="index === 0" class="pi pi-crown text-yellow-500 text-xl"></i>
                </div>
                <Tag 
                  :value="house.displayName" 
                  :severity="getHouseSeverity(house.name)"
                  class="font-semibold"
                />
              </div>
              
              <!-- Points -->
              <div class="text-center mb-4">
                <div class="text-3xl font-bold text-900">{{ house.totalPoints }}</div>
                <div class="text-sm text-600">points</div>
              </div>
              
              <!-- Statistiques -->
              <div class="grid text-center mb-4">
                <div class="col-4">
                  <div class="text-lg font-semibold text-900">{{ house.memberCount || 0 }}</div>
                  <div class="text-xs text-600">Membres</div>
                </div>
                <div class="col-4">
                  <div class="text-lg font-semibold text-900">{{ house.completedChallenges || 0 }}</div>
                  <div class="text-xs text-600">Défis</div>
                </div>
                <div class="col-4">
                  <div class="text-lg font-semibold text-900">{{ house.completedQuests || 0 }}</div>
                  <div class="text-xs text-600">Quêtes</div>
                </div>
              </div>
              
              <!-- Barre de progression -->
              <div class="mb-3">
                <div class="bg-gray-200 border-round-lg overflow-hidden" style="height: 6px;">
                  <div 
                    class="bg-primary border-round-lg h-full transition-all transition-duration-300"
                    :style="{ width: `${getProgressPercentage(house, rankedHouses[0])}%` }"
                  ></div>
                </div>
                <div class="text-xs text-600 mt-1">
                  {{ getProgressPercentage(house, rankedHouses[0]) }}% du leader
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex gap-1 justify-content-center">
                <Button 
                  @click="viewHouseDetails(house)"
                  icon="pi pi-eye"
                  :aria-label="`Voir les détails de la maison ${house.displayName}`"
                  text
                  size="small"
                  v-tooltip="'Voir détails'"
                />
                <Button 
                  v-if="house.name !== 'gamemaster'"
                  @click="viewHouseMembers(house)"
                  icon="pi pi-users"
                  :aria-label="`Voir les membres de la maison ${house.displayName}`"
                  severity="secondary"
                  text
                  size="small"
                  v-tooltip="'Voir membres'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Les points de maison sont dérivés des soldes XP des membres. -->
    <div class="col-12">
      <div class="card">
        <div class="flex align-items-center gap-2 mb-4">
          <div class="bg-blue-100 text-blue-600 p-2 border-circle">
            <i class="pi pi-info-circle text-lg"></i>
          </div>
          <h2 class="text-xl font-bold text-900 m-0">Calcul des points</h2>
        </div>
        <p class="text-700 m-0">
          Le total d'une maison correspond à la somme des XP de ses membres.
          Il est recalculé par Supabase et ne peut plus être modifié séparément
          depuis le navigateur.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/supabase'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()

const toast = useToast()

// État réactif
const houses = ref([])
const loading = ref(true)

// Données des maisons chargées depuis Supabase
const houseData = ref({})

// Permissions temporairement désactivées

// Computed properties
const rankedHouses = computed(() => {
  return [...houses.value].sort((a, b) => b.totalPoints - a.totalPoints)
})

// Méthodes
const loadHouseDefinitions = async () => {
  try {
    // Charger les définitions des maisons depuis la table houses
    const { data, error } = await supabase
      .from('houses')
      .select('*')
    
    if (error) throw error
    
    // Convertir en objet pour accès facile
    houseData.value = data.reduce((acc, house) => {
      acc[house.name] = {
        displayName: house.name.charAt(0).toUpperCase() + house.name.slice(1),
        color: house.color,
        description: house.description
      }
      return acc
    }, {})
    
    console.log('🏠 Maisons chargées depuis Supabase:', houseData.value)
    
  } catch (error) {
    console.error('Erreur lors du chargement des définitions de maisons:', error)
    // Fallback sur les données en dur si erreur
    houseData.value = {
      harmonis: { displayName: 'Harmonis', color: '#2E8B57', description: 'Empathie et Collaboration' },
      elaris: { displayName: 'Elaris', color: '#DC143C', description: 'Courage et Leadership' },
      doloris: { displayName: 'Doloris', color: '#FFD700', description: 'Persévérance et Excellence' },
      solencia: { displayName: 'Solencia', color: '#4169E1', description: 'Sagesse et Innovation' }
    }
  }
}

const loadHouses = async () => {
  try {
    loading.value = true

    const { data, error } = await supabase.rpc('get_house_gamification_totals')

    if (error) throw error
    
    // Mapper les données de la vue
    houses.value = data.map(house => ({
      name: house.name,
      displayName: houseData.value[house.name]?.displayName || house.name,
      color: house.color,
      description: house.description,
      totalPoints: parseInt(house.total_points) || 0,
      memberCount: parseInt(house.member_count) || 0,
      level: parseInt(house.house_level) || 1,
      completedChallenges: parseInt(house.completed_challenges) || 0,
      completedQuests: parseInt(house.completed_quests) || 0
    }))
    
    console.log('📊 Statistiques des maisons chargées:', houses.value)
    
  } catch (error) {
    console.error('Erreur lors du chargement des maisons:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données des maisons',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const viewHouseDetails = (house) => {
  router.push({ name: 'HouseStatsPage', params: { houseName: house.name } })
}

const viewHouseMembers = (house) => {
  router.push({
    name: 'UserManagementView',
    query: { house: house.name }
  })
}

// Utilitaires
const getProgressPercentage = (house, leader) => {
  if (!leader || leader.totalPoints === 0) return 0
  return Math.round((house.totalPoints / leader.totalPoints) * 100)
}

const getHouseSeverity = (houseName) => {
  const severities = {
    harmonis: 'success',    // Vert pour Harmonis
    elaris: 'danger',       // Rouge pour Elaris
    doloris: 'warning',     // Jaune pour Doloris
    solencia: 'info'        // Bleu pour Solencia
  }
  return severities[houseName] || 'secondary'
}

// Méthode getRoleIcon supprimée - système de rôles désactivé

// Méthode getRoleLabel supprimée - système de rôles désactivé

// Initialisation
onMounted(async () => {
  // Charger d'abord les définitions des maisons
  await loadHouseDefinitions()
  
  // Puis charger les statistiques calculées par Supabase.
  await loadHouses()
})
</script>

<style scoped>
@media (max-width: 640px) {
  .house-ranking-header { align-items: flex-start !important; flex-direction: column; gap: 0.75rem; }
  .house-ranking-tag { max-width: 100%; }
  .house-ranking-tag :deep(.p-tag-value) { white-space: normal; }
}
</style>
