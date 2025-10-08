<template>
  <div class="grid">
    <!-- Section Classement des Maisons -->
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <div class="flex align-items-center gap-2">
            <div class="bg-blue-100 text-blue-600 p-2 border-circle">
              <i class="pi pi-trophy text-lg"></i>
            </div>
            <h3 class="text-xl font-bold text-900 m-0">Classement des Maisons HES</h3>
          </div>
          <Button 
            v-if="canManageHouses"
            @click="showPointsDialog = true"
            icon="pi pi-plus"
            label="Attribuer Points"
            severity="success"
            size="small"
          />
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
                  v-if="canManageHouses"
                  @click="editHousePoints(house)"
                  icon="pi pi-pencil"
                  severity="info"
                  text
                  size="small"
                  v-tooltip="'Modifier points'"
                />
                <Button 
                  @click="viewHouseDetails(house)"
                  icon="pi pi-eye"
                  text
                  size="small"
                  v-tooltip="'Voir détails'"
                />
                <Button 
                  v-if="canManageHouses"
                  @click="viewHouseMembers(house)"
                  icon="pi pi-users"
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

    <!-- Section Historique des Points -->
    <div class="col-12">
      <div class="card">
        <div class="flex align-items-center gap-2 mb-4">
          <div class="bg-orange-100 text-orange-600 p-2 border-circle">
            <i class="pi pi-history text-lg"></i>
          </div>
          <h3 class="text-xl font-bold text-900 m-0">Historique des Points</h3>
        </div>
        
        <!-- Filtres -->
        <div class="flex gap-3 mb-4 flex-wrap">
          <Dropdown 
            v-model="selectedHouseFilter" 
            :options="houseFilterOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Toutes les maisons"
            @change="loadPointsHistory"
            class="w-12rem"
          />
          
          <Calendar 
            v-model="dateRange" 
            selectionMode="range" 
            :manualInput="false"
            placeholder="Période"
            @date-select="loadPointsHistory"
            class="w-12rem"
          />
        </div>
        
        <!-- Liste historique -->
        <div class="flex flex-column gap-3">
          <div 
            v-for="entry in pointsHistory" 
            :key="entry.id"
            class="flex align-items-center gap-3 p-3 border-1 surface-border border-round"
          >
            <div class="flex align-items-center justify-content-center w-3rem h-3rem border-circle"
                 :style="{ backgroundColor: houseData.value[entry.house]?.color + '20', color: houseData.value[entry.house]?.color }">
              <i class="pi pi-home text-lg"></i>
            </div>
            
            <div class="flex-1">
              <div class="flex justify-content-between align-items-center mb-2">
                <Tag 
                  :value="getHouseDisplayName(entry.house)" 
                  :severity="getHouseSeverity(entry.house)"
                  class="font-semibold"
                />
                <span class="font-bold text-lg" 
                      :class="entry.points > 0 ? 'text-green-600' : 'text-red-600'">
                  {{ entry.points > 0 ? '+' : '' }}{{ entry.points }} points
                </span>
              </div>
              
              <p class="text-900 m-0 mb-2">{{ entry.reason }}</p>
              
              <div class="flex gap-3 text-sm text-600">
                <span>{{ formatDate(entry.timestamp) }}</span>
                <span>par {{ entry.authorName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog d'attribution de points -->
    <Dialog 
      v-model:visible="showPointsDialog" 
      :header="editingHouse ? 'Modifier Points' : 'Attribuer Points'"
      :modal="true"
      :closable="true"
      class="w-11 md:w-30rem"
    >
      <div class="flex flex-column gap-4">
        <div class="field">
          <label for="houseSelect" class="font-semibold">Maison *</label>
          <Dropdown 
            id="houseSelect"
            v-model="pointsForm.house" 
            :options="houseOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Sélectionner une maison"
            :class="{ 'p-invalid': errors.house }"
            :disabled="!!editingHouse"
            class="w-full"
          />
          <small v-if="errors.house" class="p-error">{{ errors.house }}</small>
        </div>
        
        <div class="field">
          <label for="points" class="font-semibold">Points *</label>
          <InputNumber 
            id="points"
            v-model="pointsForm.points" 
            placeholder="Nombre de points (+ ou -)"
            :class="{ 'p-invalid': errors.points }"
            :min="-1000"
            :max="1000"
            class="w-full"
          />
          <small v-if="errors.points" class="p-error">{{ errors.points }}</small>
          <small class="text-600">Utilisez des nombres négatifs pour retirer des points</small>
        </div>
        
        <div class="field">
          <label for="reason" class="font-semibold">Raison *</label>
          <Textarea 
            id="reason"
            v-model="pointsForm.reason" 
            placeholder="Raison de l'attribution/retrait de points"
            rows="3"
            :class="{ 'p-invalid': errors.reason }"
            class="w-full"
          />
          <small v-if="errors.reason" class="p-error">{{ errors.reason }}</small>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="showPointsDialog = false" 
          label="Annuler" 
          text
        />
        <Button 
          @click="assignPoints" 
          label="Attribuer"
          :loading="assigning"
          severity="success"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const authStore = useAuthStore()

// Vérifier les permissions
const canManageHouses = computed(() => {
  return authStore.user && (
    authStore.user.role === 'admin' || 
    authStore.user.role === 'house_coach' ||
    authStore.user.role === 'game_master'
  )
})

const toast = useToast()

// État réactif
const houses = ref([])
const pointsHistory = ref([])
const loading = ref(true)
const assigning = ref(false)

// Filtres
const selectedHouseFilter = ref(null)
const dateRange = ref(null)

// Dialogs
const showPointsDialog = ref(false)
const editingHouse = ref(null)

// Formulaire d'attribution de points
const pointsForm = reactive({
  house: '',
  points: 0,
  reason: ''
})

const errors = ref({})

// Données des maisons chargées depuis Supabase
const houseData = ref({})

// Options pour les dropdowns (computed pour être dynamiques)
const houseOptions = computed(() => {
  return Object.keys(houseData.value).map(key => ({
    label: houseData.value[key].displayName || key,
    value: key
  }))
})

const houseFilterOptions = computed(() => [
  { label: 'Toutes les maisons', value: null },
  ...houseOptions.value
])

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
    
    // Utiliser la vue SQL pour obtenir toutes les statistiques en une seule requête
    const { data, error } = await supabase
      .from('house_points_totals')
      .select('*')
    
    if (error) {
      // Si la vue n'existe pas encore, fallback sur l'ancienne méthode
      console.warn('Vue house_points_totals non trouvée, utilisation de la méthode manuelle')
      await loadHousesManually()
      return
    }
    
    // Mapper les données de la vue
    houses.value = data.map(house => ({
      name: house.name,
      displayName: houseData.value[house.name]?.displayName || house.name,
      color: house.color,
      description: house.description,
      totalPoints: parseInt(house.total_points) || 0,
      memberCount: parseInt(house.member_count) || 0,
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

// Méthode manuelle de fallback si la vue n'existe pas
const loadHousesManually = async () => {
  const housesData = []
  
  for (const houseName of Object.keys(houseData.value)) {
    let memberCount = 0
    
    // Essayer de compter les membres (peut échouer si la colonne house n'existe pas)
    try {
      const { count } = await supabase
        .from('users_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('house', houseName)
      memberCount = count || 0
    } catch (error) {
      console.warn(`Impossible de compter les membres de ${houseName}:`, error.message)
    }
    
    // Calculer les points totaux depuis l'historique
    let totalPoints = 0
    try {
      const { data: pointsData } = await supabase
        .from('house_points_history')
        .select('points')
        .eq('house', houseName)
      
      totalPoints = pointsData?.reduce((sum, entry) => sum + entry.points, 0) || 0
    } catch (error) {
      console.warn(`Impossible de charger les points de ${houseName}:`, error.message)
    }
    
    housesData.push({
      name: houseName,
      displayName: houseData.value[houseName].displayName,
      color: houseData.value[houseName].color,
      description: houseData.value[houseName].description,
      totalPoints,
      memberCount,
      completedChallenges: 0,
      completedQuests: 0
    })
  }
  
  houses.value = housesData
}

const loadPointsHistory = async () => {
  try {
    let query = supabase
      .from('house_points_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    // Filtre par maison
    if (selectedHouseFilter.value) {
      query = query.eq('house', selectedHouseFilter.value)
    }
    
    // Filtre par date
    if (dateRange.value && dateRange.value[0]) {
      query = query.gte('created_at', dateRange.value[0].toISOString())
      
      if (dateRange.value[1]) {
        query = query.lte('created_at', dateRange.value[1].toISOString())
      }
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Charger les informations des auteurs séparément
    const userIds = [...new Set(data.map(entry => entry.created_by).filter(Boolean))]
    
    let authorsMap = {}
    if (userIds.length > 0) {
      const { data: authorsData } = await supabase
        .from('users_profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds)
      
      if (authorsData) {
        authorsMap = authorsData.reduce((acc, author) => {
          acc[author.id] = author
          return acc
        }, {})
      }
    }
    
    // Formater les données pour l'affichage
    pointsHistory.value = data.map(entry => {
      const author = authorsMap[entry.created_by]
      
      return {
        id: entry.id,
        house: entry.house,
        points: entry.points,
        reason: entry.reason,
        timestamp: new Date(entry.created_at).getTime(),
        authorName: author 
          ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email
          : 'Système'
      }
    })
    
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger l\'historique des points',
      life: 3000
    })
  }
}

const validatePointsForm = () => {
  errors.value = {}
  
  if (!pointsForm.house) {
    errors.value.house = 'Veuillez sélectionner une maison'
  }
  
  if (!pointsForm.points || pointsForm.points === 0) {
    errors.value.points = 'Veuillez entrer un nombre de points différent de 0'
  }
  
  if (!pointsForm.reason.trim()) {
    errors.value.reason = 'Veuillez indiquer une raison'
  }
  
  return Object.keys(errors.value).length === 0
}

const assignPoints = async () => {
  if (!validatePointsForm()) return
  
  try {
    assigning.value = true
    
    // Insérer dans l'historique des points
    const { error } = await supabase
      .from('house_points_history')
      .insert({
        house: pointsForm.house,
        points: pointsForm.points,
        reason: pointsForm.reason,
        created_by: authStore.user.id
      })
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${pointsForm.points > 0 ? 'Points attribués' : 'Points retirés'} avec succès à ${getHouseDisplayName(pointsForm.house)}`,
      life: 3000
    })
    
    showPointsDialog.value = false
    Object.assign(pointsForm, { house: '', points: 0, reason: '' })
    editingHouse.value = null
    
    // Recharger les données
    await Promise.all([
      loadHouses(),
      loadPointsHistory()
    ])
    
  } catch (error) {
    console.error('Erreur lors de l\'attribution des points:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de l\'attribution des points',
      life: 3000
    })
  } finally {
    assigning.value = false
  }
}

const editHousePoints = (house) => {
  editingHouse.value = house
  pointsForm.house = house.name
  showPointsDialog.value = true
}

const viewHouseDetails = (house) => {
  // Naviguer vers les détails de la maison
  console.log('Voir détails de la maison:', house)
}

const viewHouseMembers = (house) => {
  // Naviguer vers la liste des membres de la maison
  console.log('Voir membres de la maison:', house)
}

// Utilitaires
const getProgressPercentage = (house, leader) => {
  if (!leader || leader.totalPoints === 0) return 0
  return Math.round((house.totalPoints / leader.totalPoints) * 100)
}

const getHouseDisplayName = (houseName) => {
  return houseData.value[houseName]?.displayName || houseName
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

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 3600000) { // Moins d'1 heure
    return 'Il y a ' + Math.floor(diff / 60000) + ' min'
  } else if (diff < 86400000) { // Moins d'1 jour
    return 'Il y a ' + Math.floor(diff / 3600000) + 'h'
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

// Initialisation
onMounted(async () => {
  // Charger d'abord les définitions des maisons
  await loadHouseDefinitions()
  
  // Puis charger les statistiques et l'historique
  await Promise.all([
    loadHouses(),
    loadPointsHistory()
  ])
})
</script>

<!-- Styles supprimés - utilisation exclusive des classes PrimeVue -->
