<template>
  <div>
    <Navbar />
    
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-cog text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Administration Gamification</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord pour la gestion du système de gamification</p>
              </div>
            </div>
            
            <Button 
              icon="pi pi-refresh" 
              label="Actualiser" 
              @click="loadDashboardData"
              :loading="refreshing"
              class="p-button-primary"
            />
          </div>
        </div>

        <!-- Informations de rôle supprimées - système désactivé -->

        <!-- Statistics Overview -->
        <div class="grid mb-4">
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-orange-100 border-circle">
                  <i class="pi pi-trophy text-orange-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.challenges?.total || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Défis Totaux</p>
                  <span class="text-sm text-500">{{ stats.challenges?.active || 0 }} actifs</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-purple-100 border-circle">
                  <i class="pi pi-flag text-purple-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.quests?.total || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Quêtes Totales</p>
                  <span class="text-sm text-500">{{ stats.quests?.active || 0 }} actives</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-red-100 border-circle">
                  <i class="pi pi-star text-red-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.badges?.total || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Badges Totaux</p>
                  <span class="text-sm text-500">{{ stats.badges?.unlocked || 0 }} débloqués</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-green-100 border-circle">
                  <i class="pi pi-users text-green-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.users?.total || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Utilisateurs</p>
                  <span class="text-sm text-500">{{ stats.users?.active || 0 }} actifs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Actions Rapides</h2>
          <div class="grid">
            <!-- Challenge Management -->
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/challenges')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-trophy text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Défis</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Créer, modifier et supprimer des défis</p>
                <span class="text-primary font-medium text-sm">{{ stats.challenges?.active || 0 }} actifs</span>
              </div>
            </div>

            <!-- User Management -->
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/users')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-users text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Utilisateurs</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Attribuer des rôles et gérer les permissions</p>
                <span class="text-primary font-medium text-sm">{{ stats.users?.total || 0 }} utilisateurs</span>
              </div>
            </div>

            <!-- House Management -->
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/houses')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-home text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Maisons</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Points des maisons et statistiques</p>
                <span class="text-primary font-medium text-sm">4 maisons</span>
              </div>
            </div>

            <!-- Analytics -->
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/analytics')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-indigo-100 border-circle mb-3">
                  <i class="pi pi-chart-line text-indigo-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Analytics</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Statistiques détaillées et rapports</p>
                <span class="text-primary font-medium text-sm">Données en temps réel</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="surface-card p-4 border-round shadow-2">
          <h2 class="text-lg font-semibold text-900 mb-3">Activité Récente</h2>
          <div class="flex flex-column gap-3">
            <div 
              v-for="log in recentLogs" 
              :key="log.id"
              class="flex align-items-center gap-3 p-3 border-round bg-gray-50 border-left-3 border-primary"
            >
              <div class="flex align-items-center justify-content-center w-2rem h-2rem bg-primary border-circle">
                <i :class="getActionIcon(log.action)" class="text-white text-sm"></i>
              </div>
              <div class="flex-1">
                <p class="text-900 font-medium m-0 mb-1">
                  {{ getActionDescription(log.action, log.targetId) }}
                </p>
                <span class="text-600 text-sm">
                  {{ formatTime(log.timestamp) }}
                </span>
              </div>
            </div>
            
            <div v-if="recentLogs.length === 0" class="text-center p-6">
              <i class="pi pi-info-circle text-4xl text-300 mb-3"></i>
              <p class="text-600 m-0">Aucune activité récente</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast for notifications -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import Navbar from '../common/Navbar.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import adminService from '../../service/adminService'
import rolesService, { ROLES, PERMISSIONS } from '../../service/rolesService'

// Router
const router = useRouter()

// Reactive data
const loading = ref(true)
const refreshing = ref(false)
const stats = ref({})
const recentLogs = ref([])
const currentUserRole = ref('')
const userPermissions = ref([])

// Auth
const auth = getAuth()

// Computed
const hasPermission = computed(() => {
  return (permission) => {
    return userPermissions.value.includes(PERMISSIONS[permission])
  }
})

// Methods
const loadDashboardData = async () => {
  try {
    refreshing.value = true
    
    // Charger les données simplifiées
    const statsData = await adminService.getGeneralStats()
    
    stats.value = statsData || {}
    recentLogs.value = [] // Logs désactivés temporairement
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    showToast('error', 'Erreur', 'Impossible de charger les données du tableau de bord')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const navigateTo = (path) => {
  router.push(path)
}

// Utilitaires de rôles supprimés - système désactivé

const getActionIcon = (action) => {
  const actionIcons = {
    create_challenge: 'pi pi-plus-circle',
    update_challenge: 'pi pi-pencil',
    delete_challenge: 'pi pi-trash',
    create_quest: 'pi pi-plus-circle',
    update_quest: 'pi pi-pencil',
    delete_quest: 'pi pi-trash',
    create_badge: 'pi pi-plus-circle',
    update_badge: 'pi pi-pencil',
    delete_badge: 'pi pi-trash',
    role_change: 'pi pi-user-edit'
  }
  return actionIcons[action] || 'pi pi-info-circle'
}

const getActionDescription = (action, targetId) => {
  const descriptions = {
    create_challenge: `Nouveau défi créé (${targetId})`,
    update_challenge: `Défi modifié (${targetId})`,
    delete_challenge: `Défi supprimé (${targetId})`,
    create_quest: `Nouvelle quête créée (${targetId})`,
    update_quest: `Quête modifiée (${targetId})`,
    delete_quest: `Quête supprimée (${targetId})`,
    create_badge: `Nouveau badge créé (${targetId})`,
    update_badge: `Badge modifié (${targetId})`,
    delete_badge: `Badge supprimé (${targetId})`,
    role_change: `Rôle utilisateur modifié (${targetId})`
  }
  return descriptions[action] || `Action ${action} sur ${targetId}`
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffMinutes < 1) return 'À l\'instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays}j`
}

const showToast = (severity, summary, detail) => {
  const toast = ref()
  if (toast.value) {
    toast.value.add({ severity, summary, detail, life: 3000 })
  }
}

// Lifecycle
onMounted(async () => {
  // Vérifier les permissions d'accès
  const isAdmin = await rolesService.isCurrentUserAdmin()
  if (!isAdmin) {
    router.push('/unauthorized')
    return
  }
  
  await loadDashboardData()
})
</script>

<style scoped>
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
