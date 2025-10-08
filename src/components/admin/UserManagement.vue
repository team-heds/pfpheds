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
        @click="showPointsDialog = true; resetPointsForm()"
        icon="pi pi-plus-circle"
        label="Ajouter Points"
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
            icon="pi pi-th-large"
            :class="viewMode === 'cards' ? 'p-button-success' : 'p-button-outlined'"
            @click="viewMode = 'cards'"
            v-tooltip.top="'Vue en cartes'"
            class="p-button-sm"
          />
          <Button 
            icon="pi pi-list"
            :class="viewMode === 'table' ? 'p-button-success' : 'p-button-outlined'"
            @click="viewMode = 'table'"
            v-tooltip.top="'Vue en tableau'"
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
            <!-- Header de la carte avec couleur de la maison -->
            <div 
              class="p-3 pb-2" 
              :style="{ 
                backgroundColor: user.houseColor || '#6b7280',
                background: user.houseColor ? `linear-gradient(135deg, ${user.houseColor} 0%, ${user.houseColor}dd 100%)` : '#6b7280'
              }"
            >
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
                <span 
                  v-if="user.house" 
                  class="px-2 py-1 border-round text-white font-semibold text-sm"
                  :style="{ backgroundColor: user.houseColor || '#6b7280' }"
                >
                  {{ getHouseLabel(user.house) }}
                </span>
                <span v-else class="text-500 text-sm">Aucune maison</span>
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
                  @click="addPointsToUser(user)"
                  icon="pi pi-plus-circle"
                  class="p-button-success p-button-sm flex-1"
                  label="Points"
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
              <span 
                v-if="data.house" 
                class="px-2 py-1 border-round text-white font-semibold text-sm inline-block"
                :style="{ backgroundColor: data.houseColor || '#6b7280' }"
              >
                {{ getHouseLabel(data.house) }}
              </span>
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
                  @click="addPointsToUser(data)"
                  icon="pi pi-plus-circle"
                  class="p-button-text p-button-success p-button-sm"
                  v-tooltip="'Ajouter des points'"
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

    <!-- Dialog d'ajout de points -->
    <Dialog 
      v-model:visible="showPointsDialog" 
      header="Ajouter des Points XP"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-4">
        <div class="field">
          <label class="font-semibold text-900">Utilisateur sélectionné</label>
          <div class="p-3 surface-100 border-round flex align-items-center gap-2">
            <Avatar 
              v-if="pointsForm.userPhoto" 
              :image="pointsForm.userPhoto" 
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
              <div class="font-semibold text-900">{{ pointsForm.userName }}</div>
              <div class="text-600 text-sm">{{ pointsForm.userEmail }}</div>
            </div>
          </div>
        </div>
        
        <div class="field">
          <label for="pointsInput" class="font-semibold text-900">Points à ajouter *</label>
          <InputNumber 
            id="pointsInput"
            v-model="pointsForm.points" 
            :min="1"
            :max="1000"
            placeholder="Nombre de points (ex: 50)"
            :class="{ 'p-invalid': pointsErrors.points }"
            class="w-full"
            suffix=" XP"
          />
          <small v-if="pointsErrors.points" class="p-error">{{ pointsErrors.points }}</small>
          <small class="text-600">Entre 1 et 1000 points XP</small>
        </div>
        
        <div class="field">
          <label for="reasonInput" class="font-semibold text-900">Raison *</label>
          <Textarea 
            id="reasonInput"
            v-model="pointsForm.reason" 
            placeholder="Pourquoi attribuer ces points ? (ex: Participation exceptionnelle, projet réussi...)"
            :class="{ 'p-invalid': pointsErrors.reason }"
            class="w-full"
            rows="3"
            :maxlength="200"
          />
          <small v-if="pointsErrors.reason" class="p-error">{{ pointsErrors.reason }}</small>
          <small class="text-600">{{ pointsForm.reason?.length || 0 }}/200 caractères</small>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="closePointsDialog" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="addPoints" 
          label="Ajouter Points"
          :loading="assigning"
          class="p-button-success"
          icon="pi pi-plus-circle"
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
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

const toast = useToast()
const authStore = useAuthStore()

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
const showPointsDialog = ref(false)

// Formulaire d'attribution de maison
const houseForm = reactive({
  userId: '',
  house: ''
})

// Formulaire d'ajout de points
const pointsForm = reactive({
  userId: '',
  userName: '',
  points: 0,
  reason: ''
})

const errors = ref({})
const pointsErrors = ref({})

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
    console.log('🔄 Chargement des utilisateurs depuis gamification_data...')
    
    // Charger tous les utilisateurs depuis gamification_data
    const { data: gamificationData, error: gamificationError } = await supabase
      .from('gamification_data')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (gamificationError) throw gamificationError
    
    console.log('📊 Données gamification chargées:', gamificationData?.length)
    
    // Charger toutes les maisons séparément
    const { data: housesData } = await supabase
      .from('houses')
      .select('id, name, color')
    
    // Créer un map des maisons pour accès rapide
    const housesMap = {}
    housesData?.forEach(house => {
      housesMap[house.id] = house
    })
    
    // Charger les infos utilisateur depuis users_profiles
    const { data: profilesData } = await supabase
      .from('users_profiles')
      .select('user_id, display_name, forname, family_name, avatar_url, profile_picture_url, last_login')
    
    // Créer un map des profils pour accès rapide
    const profilesMap = {}
    profilesData?.forEach(profile => {
      profilesMap[profile.user_id] = profile
    })
    
    // Charger les statistiques de gamification pour chaque utilisateur
    const usersWithStats = await Promise.all(
      gamificationData.map(async (gamif) => {
        const profile = profilesMap[gamif.user_id]
        const house = housesMap[gamif.house_id]
        
        // Compter les défis complétés
        const { count: challengesCount } = await supabase
          .from('user_challenge_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', gamif.user_id)
          .eq('completed', true)
        
        // Compter les quêtes complétées
        const { count: questsCount } = await supabase
          .from('user_quest_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', gamif.user_id)
          .eq('status', 'completed')
        
        return {
          id: gamif.user_id,
          displayName: profile?.display_name || (profile?.forname && profile?.family_name ? `${profile.forname} ${profile.family_name}` : null) || gamif.email?.split('@')[0] || 'Utilisateur',
          email: gamif.email,
          photoURL: profile?.avatar_url || profile?.profile_picture_url,
          house: house?.name || null,
          houseId: gamif.house_id,
          houseColor: house?.color,
          totalPoints: gamif.total_xp || 0,
          housePoints: gamif.house_points || 0,
          currentLevel: gamif.current_level || 1,
          completedChallenges: challengesCount || 0,
          completedQuests: questsCount || 0,
          lastActive: profile?.last_login ? new Date(profile.last_login).getTime() : new Date(gamif.updated_at).getTime(),
          metadata: gamif.gamification_metadata || {},
          createdAt: gamif.created_at,
          updatedAt: gamif.updated_at
        }
      })
    )
    
    users.value = usersWithStats
    allUsers.value = usersWithStats
    filterUsers()
    
    console.log(`✅ ${usersWithStats.length} utilisateurs chargés depuis gamification_data`)
    
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
    
    // Récupérer l'ID de la maison depuis le nom
    const { data: houseData, error: houseError } = await supabase
      .from('houses')
      .select('id, name')
      .eq('name', houseForm.house)
      .single()
    
    if (houseError) throw houseError
    
    // Mettre à jour la maison dans gamification_data
    const { error } = await supabase
      .from('gamification_data')
      .update({ 
        house_id: houseData.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', houseForm.userId)
    
    if (error) throw error
    
    const user = users.value.find(u => u.id === houseForm.userId)
    const houseName = getHouseLabel(houseForm.house)
    
    toast.add({
      severity: 'success',
      summary: 'Maison modifiée !',
      detail: `${user?.displayName || 'L\'utilisateur'} a été assigné à ${houseName}`,
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

const addPointsToUser = (user) => {
  pointsForm.userId = user.id
  pointsForm.userName = user.displayName || 'Utilisateur'
  pointsForm.userEmail = user.email
  pointsForm.userPhoto = user.photoURL
  pointsForm.points = 0
  pointsForm.reason = ''
  showPointsDialog.value = true
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

const resetPointsForm = () => {
  Object.assign(pointsForm, { 
    userId: '', 
    userName: '', 
    userEmail: '', 
    userPhoto: '', 
    points: 0, 
    reason: '' 
  })
  pointsErrors.value = {}
}

const validatePointsForm = () => {
  pointsErrors.value = {}
  
  if (!pointsForm.points || pointsForm.points < 1) {
    pointsErrors.value.points = 'Veuillez saisir un nombre de points valide (minimum 1)'
  }
  
  if (pointsForm.points > 1000) {
    pointsErrors.value.points = 'Le nombre de points ne peut pas dépasser 1000'
  }
  
  if (!pointsForm.reason || pointsForm.reason.trim().length < 5) {
    pointsErrors.value.reason = 'Veuillez saisir une raison (minimum 5 caractères)'
  }
  
  return Object.keys(pointsErrors.value).length === 0
}

const addPoints = async () => {
  if (!validatePointsForm()) return
  
  try {
    assigning.value = true
    
    console.log('💫 Ajout de points pour user_id:', pointsForm.userId)
    console.log('📊 Points à ajouter:', pointsForm.points)
    
    // Récupérer les points actuels de l'utilisateur depuis gamification_data
    const { data: currentGamif, error: fetchError } = await supabase
      .from('gamification_data')
      .select('total_xp, current_level')
      .eq('user_id', pointsForm.userId)
      .single()
    
    console.log('🔍 Données actuelles:', currentGamif)
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération:', fetchError)
      throw fetchError
    }
    
    const currentXP = currentGamif.total_xp || 0
    const newTotalXP = currentXP + pointsForm.points
    
    console.log(`📈 XP: ${currentXP} → ${newTotalXP}`)
    
    // Calculer le nouveau niveau basé sur les XP (ex: 100 XP par niveau)
    const newLevel = Math.floor(newTotalXP / 100) + 1
    
    console.log('🎯 Niveau:', newLevel)
    
    // Mettre à jour les points XP dans gamification_data
    const { data: updateData, error: updateError } = await supabase
      .from('gamification_data')
      .update({ 
        total_xp: newTotalXP,
        current_level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', pointsForm.userId)
      .select()
    
    console.log('✅ Mise à jour effectuée:', updateData)
    
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError)
      throw updateError
    }
    
    // Vérifier que la mise à jour a bien été effectuée
    if (!updateData || updateData.length === 0) {
      console.warn('⚠️ Aucune ligne mise à jour - Vérifier que user_id existe dans gamification_data')
      throw new Error('Utilisateur non trouvé dans gamification_data')
    }
    
    // Log l'action dans l'historique (optionnel - créer une table xp_history si nécessaire)
    try {
      await supabase
        .from('xp_history')
        .insert({
          user_id: pointsForm.userId,
          xp_gained: pointsForm.points,
          reason: pointsForm.reason,
          admin_id: authStore.user?.id,
          created_at: new Date().toISOString()
        })
      console.log('📝 Action loggée dans xp_history')
    } catch (historyError) {
      console.warn('⚠️ Impossible de logger dans l\'historique XP:', historyError.message)
      // Ne pas bloquer si la table n'existe pas encore
    }
    
    const levelUp = newLevel > (currentGamif.current_level || 1)
    
    toast.add({
      severity: 'success',
      summary: levelUp ? '🎉 Points ajoutés et Niveau augmenté !' : 'Points ajoutés !',
      detail: levelUp 
        ? `${pointsForm.points} XP attribués à ${pointsForm.userName} - Nouveau niveau: ${newLevel}` 
        : `${pointsForm.points} XP attribués à ${pointsForm.userName}`,
      life: 4000
    })
    
    showPointsDialog.value = false
    resetPointsForm()
    await loadUsers()
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de points:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de l\'ajout de points',
      life: 3000
    })
  } finally {
    assigning.value = false
  }
}

const closePointsDialog = () => {
  showPointsDialog.value = false
  resetPointsForm()
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
