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
                 :style="{ backgroundColor: houseData[entry.house]?.color + '20', color: houseData[entry.house]?.color }">
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
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
// Système de rôles temporairement désactivé - sera réintégré plus tard

// Accès libre pour le développement
const canManageHouses = computed(() => true)

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

// Données des vraies maisons HES
const houseData = {
  harmonis: { displayName: 'Harmonis', color: '#2E8B57' },
  elaris: { displayName: 'Elaris', color: '#DC143C' },
  doloris: { displayName: 'Doloris', color: '#FFD700' },
  solencia: { displayName: 'Solencia', color: '#4169E1' }
}

// Options pour les dropdowns
const houseOptions = [
  { label: 'Harmonis', value: 'harmonis' },
  { label: 'Elaris', value: 'elaris' },
  { label: 'Doloris', value: 'doloris' },
  { label: 'Solencia', value: 'solencia' }
]

const houseFilterOptions = [
  { label: 'Toutes les maisons', value: null },
  ...houseOptions
]

// Permissions temporairement désactivées

// Computed properties
const rankedHouses = computed(() => {
  return [...houses.value].sort((a, b) => b.totalPoints - a.totalPoints)
})

// Méthodes
const loadHouses = async () => {
  try {
    loading.value = true
    
    // Simuler le chargement des données des vraies maisons HES
    const mockHouses = [
      {
        name: 'harmonis',
        displayName: 'Harmonis',
        totalPoints: 1320,
        memberCount: 48,
        completedChallenges: 25,
        completedQuests: 18
      },
      {
        name: 'elaris',
        displayName: 'Elaris',
        totalPoints: 1250,
        memberCount: 45,
        completedChallenges: 23,
        completedQuests: 12
      },
      {
        name: 'doloris',
        displayName: 'Doloris',
        totalPoints: 1180,
        memberCount: 52,
        completedChallenges: 19,
        completedQuests: 15
      },
      {
        name: 'solencia',
        displayName: 'Solencia',
        totalPoints: 1095,
        memberCount: 41,
        completedChallenges: 17,
        completedQuests: 10
      }
    ]
    
    houses.value = mockHouses
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

const loadPointsHistory = async () => {
  try {
    // Simuler le chargement de l'historique avec les vraies maisons HES
    const mockHistory = [
      {
        id: '1',
        house: 'harmonis',
        points: 50,
        reason: 'Victoire au défi "Innovation en Soins Infirmiers"',
        timestamp: Date.now() - 3600000,
        authorName: 'Dr. Martin'
      },
      {
        id: '2',
        house: 'elaris',
        points: -20,
        reason: 'Pénalité pour retard dans le projet de recherche',
        timestamp: Date.now() - 7200000,
        authorName: 'Prof. Dubois'
      },
      {
        id: '3',
        house: 'doloris',
        points: 30,
        reason: 'Excellent travail d\'équipe en simulation clinique',
        timestamp: Date.now() - 86400000,
        authorName: 'Dr. Leroy'
      },
      {
        id: '4',
        house: 'solencia',
        points: 25,
        reason: 'Participation active aux ateliers de communication',
        timestamp: Date.now() - 172800000,
        authorName: 'Prof. Bernard'
      }
    ]
    
    let filtered = mockHistory
    
    if (selectedHouseFilter.value) {
      filtered = filtered.filter(entry => entry.house === selectedHouseFilter.value)
    }
    
    pointsHistory.value = filtered
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
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
    
    // Ici vous appelleriez votre service pour attribuer les points
    // await houseService.assignPoints(pointsForm.house, pointsForm.points, pointsForm.reason)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${pointsForm.points > 0 ? 'Points attribués' : 'Points retirés'} avec succès`,
      life: 3000
    })
    
    showPointsDialog.value = false
    Object.assign(pointsForm, { house: '', points: 0, reason: '' })
    editingHouse.value = null
    
    await loadHouses()
    await loadPointsHistory()
    
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
  return houseData[houseName]?.displayName || houseName
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
onMounted(() => {
  loadHouses()
  loadPointsHistory()
})
</script>

<!-- Styles supprimés - utilisation exclusive des classes PrimeVue -->
