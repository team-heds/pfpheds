<template>
  <div class="p-4">
    <!-- Header simplifié -->
    <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-3">
        <div class="bg-green-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center">
          <i class="pi pi-users text-green-500 text-xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-900 m-0">Gestion des Utilisateurs</h2>
          <p class="text-600 m-0">Gérez les utilisateurs et leurs maisons</p>
        </div>
      </div>
      <Button 
        @click="showHouseDialog = true; resetForm()"
        icon="pi pi-home"
        label="Modifier Maison"
        class="p-button-success"
      />
    </div>

    <!-- Filtres et contrôles de vue -->
    <div class="mb-4">
      <div class="flex flex-wrap gap-3 align-items-center justify-content-between">
        <div class="flex flex-wrap gap-3 align-items-center">
          <div class="p-inputgroup" style="min-width: 300px">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
            <InputText 
              v-model="searchQuery" 
              placeholder="Rechercher un utilisateur..."
              @input="filterUsers"
            />
          </div>
          
          <Dropdown 
            v-model="selectedHouse" 
            :options="houseOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Maison"
            @change="filterUsers"
            style="min-width: 150px"
          />
        </div>
        
        <!-- Toggle de vue -->
        <div class="flex align-items-center gap-2">
          <Button 
            :icon="viewMode === 'cards' ? 'pi pi-th-large' : 'pi pi-list'"
            :class="viewMode === 'cards' ? 'p-button-success' : 'p-button-outlined'"
            @click="viewMode = 'cards'"
            v-tooltip="'Vue en cartes'"
            class="p-button-sm"
          />
          <Button 
            :icon="viewMode === 'table' ? 'pi pi-table' : 'pi pi-table'"
            :class="viewMode === 'table' ? 'p-button-success' : 'p-button-outlined'"
            @click="viewMode = 'table'"
            v-tooltip="'Vue en tableau'"
            class="p-button-sm"
          />
        </div>
      </div>
    </div>

    <!-- Affichage des utilisateurs -->
    <div style="min-height: 400px">
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6 text-600">
        <ProgressSpinner />
        <p class="mt-3">Chargement des utilisateurs...</p>
      </div>
      
      <div v-else-if="filteredUsers.length === 0" class="text-center p-6 text-600">
        <i class="pi pi-users text-6xl mb-3 text-300"></i>
        <h3 class="text-900 mb-2">Aucun utilisateur trouvé</h3>
        <p class="m-0">{{ searchQuery ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Aucun utilisateur dans le système.' }}</p>
      </div>
      
      <!-- Vue en cartes (améliorée) -->
      <div v-else-if="viewMode === 'cards'" class="grid">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id"
          class="col-12 md:col-6 xl:col-4"
        >
          <div class="surface-card border-round shadow-3 h-full overflow-hidden hover:shadow-4 transition-all transition-duration-200">
            <!-- Header de la carte avec gradient selon la maison -->
            <div class="p-3 pb-2" :class="getHouseGradientClass(user.house)">
              <div class="flex align-items-center gap-3">
                <Avatar 
                  v-if="user.photoURL" 
                  :image="user.photoURL" 
                  size="large" 
                  shape="circle"
                  class="border-2 border-white-alpha-90"
                />
                <Avatar 
                  v-else 
                  icon="pi pi-user" 
                  size="large" 
                  shape="circle"
                  class="bg-white-alpha-20 text-white border-2 border-white-alpha-90"
                />
                <div class="flex-1">
                  <h4 class="text-white font-bold m-0 mb-1">{{ user.displayName || 'Utilisateur' }}</h4>
                  <p class="text-white-alpha-90 m-0 text-sm">{{ user.email }}</p>
                </div>
              </div>
            </div>
            
            <!-- Corps de la carte -->
            <div class="p-3 pt-2">
              <div class="flex align-items-center justify-content-between mb-3">
                <Tag v-if="user.house" :value="getHouseLabel(user.house)" :severity="getHouseSeverity(user.house)" />
                <div class="text-right">
                  <div class="text-900 font-bold text-lg">{{ user.totalPoints || 0 }}</div>
                  <div class="text-600 text-xs">Points totaux</div>
                </div>
              </div>
              
              <div class="grid text-center mb-3">
                <div class="col-6">
                  <div class="surface-100 border-round p-2">
                    <div class="text-900 font-semibold">{{ user.completedChallenges || 0 }}</div>
                    <div class="text-600 text-xs">Défis</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="surface-100 border-round p-2">
                    <div class="text-900 font-semibold">{{ user.completedQuests || 0 }}</div>
                    <div class="text-600 text-xs">Quêtes</div>
                  </div>
                </div>
              </div>
              
              <div class="text-center mb-3 p-2 surface-50 border-round">
                <div class="text-600 text-xs mb-1">Dernière activité</div>
                <div class="text-900 font-medium text-sm">{{ formatDate(user.lastActive) }}</div>
              </div>
              
              <div class="flex gap-2 justify-content-center">
                <Button 
                  @click="editUserHouse(user)"
                  icon="pi pi-home"
                  class="p-button-success p-button-sm flex-1"
                  label="Maison"
                />
                <Button 
                  @click="viewUserProfile(user)"
                  icon="pi pi-eye"
                  class="p-button-info p-button-sm"
                  v-tooltip="'Voir profil'"
                />
                <Button 
                  @click="resetUserProgress(user)"
                  icon="pi pi-refresh"
                  class="p-button-warning p-button-sm"
                  v-tooltip="'Réinitialiser'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vue en tableau -->
      <div v-else-if="viewMode === 'table'">
        <DataTable 
          :value="filteredUsers" 
          :paginator="true" 
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} utilisateurs"
          class="p-datatable-sm"
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="displayName" header="Utilisateur" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <Avatar 
                  v-if="data.photoURL" 
                  :image="data.photoURL" 
                  size="normal" 
                  shape="circle"
                />
                <Avatar 
                  v-else 
                  icon="pi pi-user" 
                  size="normal" 
                  shape="circle"
                  class="bg-gray-100 text-gray-600"
                />
                <div>
                  <div class="font-semibold text-900">{{ data.displayName || 'Utilisateur' }}</div>
                  <div class="text-600 text-sm">{{ data.email }}</div>
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="house" header="Maison" sortable style="min-width: 120px">
            <template #body="{ data }">
              <Tag v-if="data.house" :value="getHouseLabel(data.house)" :severity="getHouseSeverity(data.house)" />
              <span v-else class="text-500">Aucune</span>
            </template>
          </Column>
          
          <Column field="totalPoints" header="Points" sortable style="min-width: 100px">
            <template #body="{ data }">
              <div class="text-center">
                <div class="font-bold text-900">{{ data.totalPoints || 0 }}</div>
              </div>
            </template>
          </Column>
          
          <Column header="Progression" style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex gap-3 text-center">
                <div>
                  <div class="font-semibold text-green-600">{{ data.completedChallenges || 0 }}</div>
                  <div class="text-xs text-600">Défis</div>
                </div>
                <div>
                  <div class="font-semibold text-blue-600">{{ data.completedQuests || 0 }}</div>
                  <div class="text-xs text-600">Quêtes</div>
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="lastActive" header="Dernière activité" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div class="text-center">
                <div class="text-900">{{ formatDate(data.lastActive) }}</div>
              </div>
            </template>
          </Column>
          
          <Column header="Actions" style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex gap-1 justify-content-center">
                <Button 
                  @click="editUserHouse(data)"
                  icon="pi pi-home"
                  class="p-button-text p-button-success p-button-sm"
                  v-tooltip="'Modifier maison'"
                />
                <Button 
                  @click="viewUserProfile(data)"
                  icon="pi pi-eye"
                  class="p-button-text p-button-info p-button-sm"
                  v-tooltip="'Voir profil'"
                />
                <Button 
                  @click="resetUserProgress(data)"
                  icon="pi pi-refresh"
                  class="p-button-text p-button-warning p-button-sm"
                  v-tooltip="'Réinitialiser progression'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog de modification de maison -->
    <Dialog 
      v-model:visible="showHouseDialog" 
      header="Modifier la Maison"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-4">
        <div class="field">
          <label for="userSelect" class="font-semibold text-900">Utilisateur *</label>
          <Dropdown 
            id="userSelect"
            v-model="houseForm.userId" 
            :options="allUsers" 
            optionLabel="displayName" 
            optionValue="id"
            placeholder="Sélectionner un utilisateur"
            :class="{ 'p-invalid': errors.userId }"
            filter
            class="w-full"
          />
          <small v-if="errors.userId" class="p-error">{{ errors.userId }}</small>
        </div>
        
        <div class="field">
          <label for="houseSelect" class="font-semibold text-900">Maison *</label>
          <Dropdown 
            id="houseSelect"
            v-model="houseForm.house" 
            :options="houseOptions.filter(h => h.value)" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Sélectionner une maison"
            :class="{ 'p-invalid': errors.house }"
            class="w-full"
          />
          <small v-if="errors.house" class="p-error">{{ errors.house }}</small>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="closeHouseDialog" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="assignHouse" 
          label="Modifier"
          :loading="assigning"
          class="p-button-success"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import ToggleButton from 'primevue/togglebutton'
// Système de rôles temporairement désactivé - sera réintégré plus tard

const toast = useToast()

// État réactif
const users = ref([])
const allUsers = ref([])
const filteredUsers = ref([])
const loading = ref(true)
const assigning = ref(false)

// Filtres
const searchQuery = ref('')
const selectedHouse = ref(null)

// Mode d'affichage
const viewMode = ref('cards') // 'cards' ou 'table'

// Dialogs
const showHouseDialog = ref(false)

// Formulaire d'attribution de maison
const houseForm = reactive({
  userId: '',
  house: ''
})

const errors = ref({})

// Options pour les dropdowns - rôles temporairement supprimés

const houseOptions = [
  { label: 'Toutes', value: null },
  { label: 'Harmonis', value: 'harmonis' },
  { label: 'Elaris', value: 'elaris' },
  { label: 'Doloris', value: 'doloris' },
  { label: 'Solencia', value: 'solencia' }
]

// Système de rôles temporairement désactivé - accès libre pour le développement

// Méthodes
const loadUsers = async () => {
  try {
    loading.value = true
    // Simuler le chargement des utilisateurs depuis Firebase
    // En réalité, cela viendrait de votre service utilisateur
    const mockUsers = [
      {
        id: '1',
        displayName: 'John Doe',
        email: 'john.doe@hes-so.ch',
        house: 'harmonis',
        totalPoints: 150,
        completedChallenges: 5,
        completedQuests: 2,
        lastActive: Date.now() - 86400000
      },
      {
        id: '2',
        displayName: 'Jane Smith',
        email: 'jane.smith@hes-so.ch',
        house: 'elaris',
        totalPoints: 300,
        completedChallenges: 8,
        completedQuests: 4,
        lastActive: Date.now() - 3600000
      },
      {
        id: '3',
        displayName: 'Alice Martin',
        email: 'alice.martin@hes-so.ch',
        house: 'doloris',
        totalPoints: 220,
        completedChallenges: 6,
        completedQuests: 3,
        lastActive: Date.now() - 7200000
      },
      {
        id: '4',
        displayName: 'Marc Dubois',
        email: 'marc.dubois@hes-so.ch',
        house: 'solencia',
        totalPoints: 180,
        completedChallenges: 4,
        completedQuests: 3,
        lastActive: Date.now() - 1800000
      }
    ]
    
    users.value = mockUsers
    allUsers.value = mockUsers
    filterUsers()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les utilisateurs',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterUsers = () => {
  let filtered = [...users.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.displayName?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }
  
  // Filtre par rôle supprimé - système de rôles désactivé
  
  if (selectedHouse.value) {
    filtered = filtered.filter(user => user.house === selectedHouse.value)
  }
  
  filteredUsers.value = filtered
}

const validateHouseForm = () => {
  errors.value = {}
  
  if (!houseForm.userId) {
    errors.value.userId = 'Veuillez sélectionner un utilisateur'
  }
  
  if (!houseForm.house) {
    errors.value.house = 'Veuillez sélectionner une maison'
  }
  
  return Object.keys(errors.value).length === 0
}

const assignHouse = async () => {
  if (!validateHouseForm()) return
  
  try {
    assigning.value = true
    
    // Simuler l'attribution de maison
    const userIndex = users.value.findIndex(u => u.id === houseForm.userId)
    if (userIndex !== -1) {
      users.value[userIndex].house = houseForm.house
    }
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Maison modifiée avec succès',
      life: 3000
    })
    
    showHouseDialog.value = false
    Object.assign(houseForm, { userId: '', house: '' })
    await loadUsers()
    
  } catch (error) {
    console.error('Erreur lors de la modification de maison:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la modification de maison',
      life: 3000
    })
  } finally {
    assigning.value = false
  }
}

const editUserHouse = (user) => {
  houseForm.userId = user.id
  houseForm.house = user.house || ''
  showHouseDialog.value = true
}

const viewUserProfile = (user) => {
  // Naviguer vers le profil utilisateur
  console.log('Voir profil de:', user)
}

// Méthodes utilitaires pour l'affichage
const getHouseClass = (house) => {
  return `house-${house}`
}

const getHouseLabel = (house) => {
  const houseLabels = {
    harmonis: 'Harmonis',
    elaris: 'Elaris',
    doloris: 'Doloris',
    solencia: 'Solencia'
  }
  return houseLabels[house] || house
}

const getHouseSeverity = (house) => {
  const severities = {
    harmonis: 'success',    // Vert pour Harmonis
    elaris: 'danger',       // Rouge pour Elaris
    doloris: 'warning',     // Jaune pour Doloris
    solencia: 'info'        // Bleu pour Solencia
  }
  return severities[house] || 'secondary'
}

const getHouseGradientClass = (house) => {
  const gradients = {
    harmonis: 'bg-green-500',
    elaris: 'bg-red-500', 
    doloris: 'bg-yellow-500',
    solencia: 'bg-blue-500'
  }
  return gradients[house] || 'bg-gray-500'
}

const resetForm = () => {
  Object.assign(houseForm, { userId: '', house: '' })
  errors.value = {}
}

// Permissions simplifiées - accès libre pour le développement
const canManageUsers = computed(() => true)

const formatLastActive = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `Il y a ${days}j`
  if (hours > 0) return `Il y a ${hours}h`
  return 'Actif maintenant'
}

const getSelectedUserName = () => {
  const user = users.value.find(u => u.id === houseForm.userId)
  return user ? user.displayName : ''
}

const openHouseDialog = () => {
  showHouseDialog.value = true
}

const closeHouseDialog = () => {
  showHouseDialog.value = false
  Object.assign(houseForm, { userId: '', house: '' })
  errors.value = {}
}

const resetUserProgress = async (user) => {
  try {
    // Réinitialiser la progression de l'utilisateur (fonctionnalité désactivée)
    console.log('Réinitialiser progression de:', user)
    
    toast.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Fonctionnalité temporairement désactivée',
      life: 3000
    })
    
    await loadUsers()
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la réinitialisation',
      life: 3000
    })
  }
}

// Initialisation
onMounted(() => {
  loadUsers()
})

// Utilitaires de rôles supprimés - système désactivé

// Toutes les méthodes utilitaires de rôles ont été supprimées

const formatDate = (timestamp) => {
  if (!timestamp) return 'Jamais'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 3600000) { // Moins d'1 heure
    return 'À l\'instant'
  } else if (diff < 86400000) { // Moins d'1 jour
    return 'Aujourd\'hui'
  } else {
    return date.toLocaleDateString('fr-FR')
  }
}

</script>

<style scoped>
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
