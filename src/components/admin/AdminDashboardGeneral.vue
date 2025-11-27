<template>
  <AdminLayout>
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-cog text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Admin Général</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord administration générale</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <ButtonGroup>
                <Button
                  label="7j"
                  :outlined="period !== '7d'"
                  :severity="period === '7d' ? 'primary' : 'secondary'"
                  @click="period = '7d'"
                  size="small"
                />
                <Button
                  label="30j"
                  :outlined="period !== '30d'"
                  :severity="period === '30d' ? 'primary' : 'secondary'"
                  @click="period = '30d'"
                  size="small"
                />
                <Button
                  label="90j"
                  :outlined="period !== '90d'"
                  :severity="period === '90d' ? 'primary' : 'secondary'"
                  @click="period = '90d'"
                  size="small"
                />
              </ButtonGroup>
              <Button 
                icon="pi pi-refresh" 
                @click="refresh"
                :loading="refreshing"
                outlined
              />
            </div>
          </div>
        </div>

        <!-- KPI Cards modulables -->
        <div class="kpi-grid mb-4">
          <KpiCard
            v-for="kpi in kpisWithData"
            :key="kpi.id"
            v-bind="kpi"
            @action="handleKpiAction(kpi)"
          />
        </div>

        <!-- Quick Actions -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Actions Rapides</h2>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/role-management')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-user-edit text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gestion des Rôles</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Configurer les rôles et permissions</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/router-inspector')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-sitemap text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Routes & Accès</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Voir toutes les routes du système</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/users')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-users text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Utilisateurs</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les utilisateurs</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Activités récentes -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Activités récentes</h2>
          <div class="surface-card p-4 border-round shadow-2">
            <div v-if="!activities.length" class="text-600">Aucune activité récente</div>
            <div v-else class="flex flex-column gap-2">
              <div
                v-for="(a, i) in activities"
                :key="i"
                class="flex align-items-center justify-content-between border-1 surface-border border-round p-3"
              >
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center w-2rem h-2rem bg-blue-50 border-circle">
                    <i :class="activityIcon(a.type)" class="text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <div class="text-900 font-medium">{{ a.title }}</div>
                    <small class="text-500">{{ a.time }}</small>
                  </div>
                </div>
                <Button v-if="a.to" label="Voir" class="p-button-text p-button-sm" @click="navigateTo(a.to)" />
              </div>
            </div>
          </div>
        </div>
      </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import KpiCard from './widgets/KpiCard.vue'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import ProgressSpinner from 'primevue/progressspinner'
import { getAllAdminKpis } from '@/services/adminKpiService'

const router = useRouter()

// État local
const loading = ref(true)
const refreshing = ref(false)
const period = ref('30d')

// KPIs avec vraies données
const kpisWithData = ref([
  {
    id: 'total_users',
    label: 'Utilisateurs Totaux',
    value: 0,
    icon: 'pi pi-users',
    color: '#3B82F6',
    trend: 0,
    subtitle: 'Tous les profils utilisateurs'
  },
  {
    id: 'total_roles',
    label: 'Rôles Configurés',
    value: 0,
    icon: 'pi pi-shield',
    color: '#10B981',
    trend: 0,
    subtitle: 'Rôles RBAC actifs'
  },
  {
    id: 'active_permissions',
    label: 'Permissions Actives',
    value: 0,
    icon: 'pi pi-lock',
    color: '#F59E0B',
    trend: 0,
    subtitle: 'Permissions système'
  },
  {
    id: 'route_count',
    label: 'Routes',
    value: 0,
    icon: 'pi pi-sitemap',
    color: '#8B5CF6',
    trend: 0,
    subtitle: 'Routes Vue Router'
  },
  {
    id: 'total_institutions',
    label: 'Institutions',
    value: 0,
    icon: 'pi pi-building',
    color: '#EC4899',
    trend: 0,
    subtitle: 'Institutions partenaires'
  },
  {
    id: 'total_places',
    label: 'Places de Stage',
    value: 0,
    icon: 'pi pi-map-marker',
    color: '#14B8A6',
    trend: 0,
    subtitle: 'Places disponibles/totales'
  },
  {
    id: 'active_votations',
    label: 'Votations Actives',
    value: 0,
    icon: 'pi pi-check-square',
    color: '#F97316',
    trend: 0,
    subtitle: 'Votations en cours'
  },
  {
    id: 'total_modules',
    label: 'Modules Académiques',
    value: 0,
    icon: 'pi pi-book',
    color: '#6366F1',
    trend: 0,
    subtitle: 'Modules de cours'
  }
])

const activities = ref([])

const navigateTo = (path) => {
  router.push(path)
}

const handleKpiAction = (kpi) => {
  const routes = {
    total_users: '/user_list',
    total_roles: '/admin/user-roles',
    active_permissions: '/permissions',
    route_count: '/router-inspector'
  }
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

const activityIcon = (type) => {
  switch (type) {
    case 'user': return 'pi pi-user';
    case 'vote': return 'pi pi-check-square';
    case 'place': return 'pi pi-map-marker';
    case 'role': return 'pi pi-lock';
    case 'route': return 'pi pi-sitemap';
    default: return 'pi pi-info-circle';
  }
}

/**
 * Charge les vraies données KPI depuis Supabase
 */
const loadKpiData = async () => {
  loading.value = true
  try {
    console.log('🔄 Chargement des KPIs depuis Supabase...')
    
    const data = await getAllAdminKpis(router)
    
    console.log('✅ Données KPI reçues:', data)
    
    // Mettre à jour les valeurs des KPIs
    kpisWithData.value.forEach(kpi => {
      switch (kpi.id) {
        case 'total_users':
          kpi.value = data.totalUsers
          break
        case 'total_roles':
          kpi.value = data.totalRoles
          break
        case 'active_permissions':
          kpi.value = data.activePermissions
          break
        case 'route_count':
          kpi.value = data.totalRoutes
          break
        case 'total_institutions':
          kpi.value = data.totalInstitutions
          break
        case 'total_places':
          kpi.value = data.totalPlaces
          if (data.availablePlaces > 0) {
            kpi.subtitle = `${data.availablePlaces} disponibles / ${data.totalPlaces} totales`
          }
          break
        case 'active_votations':
          kpi.value = data.activeVotations
          break
        case 'total_modules':
          kpi.value = data.totalModules
          break
      }
    })
    
    console.log('✅ KPIs mis à jour:', kpisWithData.value)
    
  } catch (error) {
    console.error('❌ Erreur chargement KPIs:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Rafraîchit les données
 */
const refresh = async () => {
  refreshing.value = true
  await loadKpiData()
  refreshing.value = false
}

// Initialiser les activités
activities.value = [
  { type: 'user', title: 'Nouvel utilisateur créé', time: 'il y a 10 min', to: '/user_list' },
  { type: 'vote', title: 'Votation prioritaire publiée', time: 'il y a 30 min', to: '/votation_management' },
  { type: 'place', title: 'Nouvelle place ajoutée', time: 'il y a 1 h', to: '/management_places' },
]

// Charger les données au montage
onMounted(() => {
  loadKpiData()
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>