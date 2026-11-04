<template>
  <div class="user-manager p-4">
    <!-- Filtres et contrôles de vue -->
    <div class="mb-4">
      <div class="user-manager-toolbar flex flex-wrap gap-3 align-items-center justify-content-between">
        <div class="user-manager-filters flex flex-wrap gap-3 align-items-center">
          <div class="p-inputgroup user-search">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
            <InputText
              v-model="searchQuery"
              aria-label="Rechercher un utilisateur"
              placeholder="Rechercher un utilisateur..."
              @input="filterUsers"
            />
          </div>
          
          <Dropdown 
            v-model="selectedHouse" 
            aria-label="Filtrer les utilisateurs par maison"
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
            aria-label="Afficher les utilisateurs en cartes"
            :class="viewMode === 'cards' ? 'p-button-success' : 'p-button-outlined'"
            @click="viewMode = 'cards'"
            v-tooltip.top="'Vue en cartes'"
            class="p-button-sm"
          />
          <Button 
            icon="pi pi-list"
            aria-label="Afficher les utilisateurs en tableau"
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
                  v-if="canManageUsers"
                  @click="addPointsToUser(user)"
                  icon="pi pi-plus-circle"
                  class="p-button-success p-button-sm flex-1"
                  label="Ajouter des XP"
                />
                <Button
                  v-if="canManageUsers"
                  @click="editUserHouse(user)"
                  icon="pi pi-home"
                  class="p-button-outlined p-button-sm"
                  :aria-label="`Changer la maison de ${user.displayName}`"
                  v-tooltip="'Changer de maison'"
                />
                <Button 
                  @click="viewUserProfile(user)"
                  icon="pi pi-eye"
                  class="p-button-info p-button-sm"
                  :aria-label="`Voir le profil gamification de ${user.displayName}`"
                  v-tooltip="'Voir profil'"
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
                  v-if="canManageUsers"
                  @click="addPointsToUser(data)"
                  icon="pi pi-plus-circle"
                  :aria-label="`Ajouter des XP à ${data.displayName}`"
                  class="p-button-text p-button-success p-button-sm"
                  v-tooltip="'Ajouter des points'"
                />
                <Button
                  v-if="canManageUsers"
                  @click="editUserHouse(data)"
                  icon="pi pi-home"
                  :aria-label="`Changer la maison de ${data.displayName}`"
                  class="p-button-text p-button-secondary p-button-sm"
                  v-tooltip="'Changer de maison'"
                />
                <Button 
                  @click="viewUserProfile(data)"
                  icon="pi pi-eye"
                  :aria-label="`Voir le profil gamification de ${data.displayName}`"
                  class="p-button-text p-button-info p-button-sm"
                  v-tooltip="'Voir profil'"
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
      header="Changer la maison"
      :modal="true"
      :closable="true"
      :style="{ width: 'min(540px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)' }"
      class="user-action-dialog"
      @hide="resetHouseForm"
    >
      <div class="flex flex-column gap-4">
        <div class="selected-user-summary">
          <Avatar
            v-if="houseForm.userPhoto"
            :image="houseForm.userPhoto"
            size="normal"
            shape="circle"
          />
          <Avatar v-else icon="pi pi-user" size="normal" shape="circle" />
          <div class="min-w-0">
            <div class="font-semibold text-900 overflow-wrap-anywhere">{{ houseForm.userName }}</div>
            <div class="text-600 text-sm overflow-wrap-anywhere">{{ houseForm.userEmail }}</div>
          </div>
        </div>
        <p class="action-explanation m-0">
          La maison sera mise à jour dans le profil et dans la progression gamification. Cette action est journalisée.
        </p>
        
        <div class="field">
          <label for="user-house-select" class="font-semibold text-900">Nouvelle maison *</label>
          <Dropdown 
            inputId="user-house-select"
            aria-label="Nouvelle maison de l’utilisateur"
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
          label="Enregistrer la maison"
          :loading="assigning"
          :disabled="!houseSelectionChanged"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Dialog d'ajout de points -->
    <Dialog 
      v-model:visible="showPointsDialog" 
      header="Ajouter des XP"
      :modal="true"
      :closable="true"
      :style="{ width: 'min(540px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)' }"
      class="user-action-dialog"
      @hide="resetPointsForm"
    >
      <div class="flex flex-column gap-4">
        <div class="field">
          <span class="font-semibold text-900">Utilisateur sélectionné</span>
          <div class="selected-user-summary mt-2">
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
          <small v-if="pointsErrors.userId" class="p-error">{{ pointsErrors.userId }}</small>
        </div>
        <p class="action-explanation m-0">
          L’ajout crée une écriture d’audit dans l’historique XP et recalcule automatiquement le niveau et les points de maison.
        </p>
        
        <div class="field">
          <label for="user-xp-amount" class="font-semibold text-900">XP à ajouter *</label>
          <InputNumber 
            inputId="user-xp-amount"
            aria-label="Nombre de points XP à ajouter"
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
          <label for="user-xp-reason" class="font-semibold text-900">Raison *</label>
          <Textarea 
            id="user-xp-reason"
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
          label="Confirmer l’ajout d’XP"
          :loading="assigning"
          class="p-button-success"
          icon="pi pi-plus-circle"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/supabase'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const resolveStorageUrl = (value) => {
  if (!value || typeof value !== 'string') return value

  try {
    const url = new URL(value)
    if (!url.pathname.startsWith('/storage/v1/')) return value

    const storageOrigin = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
    return storageOrigin ? `${storageOrigin}${url.pathname}${url.search}${url.hash}` : value
  } catch {
    return value
  }
}

// État réactif
const users = ref([])
const filteredUsers = ref([])
const loading = ref(true)
const assigning = ref(false)
const canManageUsers = ref(false)

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
  userName: '',
  userEmail: '',
  userPhoto: '',
  house: '',
  originalHouse: ''
})

// Formulaire d'ajout de points
const pointsForm = reactive({
  userId: '',
  userName: '',
  userEmail: '',
  userPhoto: '',
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
const validHouseFilters = new Set(houseOptions.map(option => option.value).filter(Boolean))

const applyHouseQuery = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  selectedHouse.value = validHouseFilters.has(normalized) ? normalized : null
  filterUsers()
}

watch(() => route.query.house, applyHouseQuery)

const loadManagementPermission = async () => {
  const { data, error } = await supabase.rpc('app_is_privileged')
  canManageUsers.value = !error && data === true
}

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
    
    // Charger les infos utilisateur depuis user_profiles
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, forname, family_name, avatar_url, last_login')
    
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
          // Cloned staging rows may still contain the production Storage origin.
          // Keep the object path but always use the Supabase origin of this build.
          photoURL: resolveStorageUrl(profile?.avatar_url),
          house: house?.name?.toLowerCase() || null,
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

const houseSelectionChanged = computed(() => (
  Boolean(houseForm.house)
  && houseForm.house !== houseForm.originalHouse
))

const assignHouse = async () => {
  if (!validateHouseForm()) return
  
  try {
    assigning.value = true
    
    // Récupérer l'ID de la maison depuis le nom
    const { data: houseData, error: houseError } = await supabase
      .from('houses')
      .select('id, name')
      .ilike('name', houseForm.house)
      .single()
    
    if (houseError) throw houseError
    
    const { data: assignment, error } = await supabase.rpc('admin_assign_user_gamification_house', {
      p_user_id: houseForm.userId,
      p_house_id: houseData.id
    })
    
    if (error) throw error
    
    const user = users.value.find(u => u.id === houseForm.userId)
    const houseName = getHouseLabel(houseForm.house)
    
    toast.add({
      severity: assignment?.changed ? 'success' : 'info',
      summary: assignment?.changed ? 'Maison modifiée' : 'Aucune modification',
      detail: assignment?.changed
        ? `${user?.displayName || 'L\'utilisateur'} a été assigné à ${houseName}.`
        : `${user?.displayName || 'L\'utilisateur'} appartient déjà à ${houseName}.`,
      life: 3000
    })
    
    showHouseDialog.value = false
    resetHouseForm()
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
  Object.assign(houseForm, {
    userId: user.id,
    userName: user.displayName || 'Utilisateur',
    userEmail: user.email || '',
    userPhoto: user.photoURL || '',
    house: user.house || '',
    originalHouse: user.house || ''
  })
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
  // Naviguer vers le profil de gamification de l'utilisateur
  console.log('🔍 Viewing profile for user:', user.id, user.email)
  
  if (!user.id) {
    console.error('❌ User ID is missing!')
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'ID utilisateur manquant',
      life: 3000
    })
    return
  }
  
  // Navigation avec le path directement pour garantir le bon format
  router.push(`/gamification-profile/${user.id}`)
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

const resetHouseForm = () => {
  Object.assign(houseForm, {
    userId: '',
    userName: '',
    userEmail: '',
    userPhoto: '',
    house: '',
    originalHouse: ''
  })
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

  if (!pointsForm.userId) {
    pointsErrors.value.userId = 'Sélectionnez un utilisateur depuis la liste.'
  }
  
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

    const { data, error } = await supabase.rpc('admin_adjust_user_gamification_xp', {
      p_user_id: pointsForm.userId,
      p_amount: pointsForm.points,
      p_reason: pointsForm.reason.trim(),
      p_adjustment_id: crypto.randomUUID()
    })

    if (error) throw error

    const levelChanged = Boolean(data?.level_changed)
    
    toast.add({
      severity: 'success',
      summary: levelChanged ? 'Points ajoutés et niveau recalculé' : 'Points ajoutés',
      detail: levelChanged
        ? `${pointsForm.points} XP attribués à ${pointsForm.userName} — niveau ${data.current_level}`
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

const formatLastActive = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `Il y a ${days}j`
  if (hours > 0) return `Il y a ${hours}h`
  return 'Actif maintenant'
}

const closeHouseDialog = () => {
  showHouseDialog.value = false
  resetHouseForm()
}

// Initialisation
onMounted(async () => {
  applyHouseQuery(route.query.house)
  await Promise.all([loadManagementPermission(), loadUsers()])
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
.selected-user-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.875rem;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-100);
}

.action-explanation {
  max-width: 65ch;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.overflow-wrap-anywhere {
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .user-manager {
    padding: 0.75rem !important;
  }

  .user-manager-toolbar,
  .user-manager-filters {
    align-items: stretch !important;
    flex-direction: column;
    width: 100%;
  }

  .user-search,
  .user-manager-filters :deep(.p-dropdown) {
    width: 100%;
    min-width: 0 !important;
  }

  :deep(.user-action-dialog .p-dialog-header),
  :deep(.user-action-dialog .p-dialog-content),
  :deep(.user-action-dialog .p-dialog-footer) {
    padding-inline: 1rem;
  }

  :deep(.user-action-dialog .p-dialog-footer) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  :deep(.user-action-dialog .p-dialog-footer .p-button) {
    width: 100%;
    justify-content: center;
    margin: 0;
  }
}

.user-search {
  min-width: min(300px, 100%);
}
</style>
