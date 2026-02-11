<template>
  <div class="grid">
    <!-- Header avec permissions -->
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <div class="flex align-items-center gap-2">
            <div class="bg-blue-100 text-blue-600 p-2 border-circle">
              <i class="pi pi-chart-bar text-lg"></i>
            </div>
            <h3 class="text-xl font-bold text-900 m-0">Analytics & Statistiques</h3>
          </div>
          <div class="flex gap-2">
            <Button 
              @click="exportData"
              icon="pi pi-download"
              label="Exporter"
              severity="secondary"
              outlined
              size="small"
            />
            <Button 
              @click="refreshData"
              icon="pi pi-refresh"
              label="Actualiser"
              :loading="loading"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres de période -->
    <div class="col-12">
      <div class="card">
        <div class="flex flex-wrap gap-3 align-items-center justify-content-between">
          <div class="flex flex-wrap gap-2">
            <Button 
              v-for="period in periodOptions"
              :key="period.value"
              :label="period.label"
              :outlined="selectedPeriod !== period.value"
              @click="selectedPeriod = period.value; loadAnalytics()"
              size="small"
            />
          </div>
          
          <Calendar 
            v-model="customDateRange" 
            selectionMode="range" 
            :manualInput="false"
            placeholder="Période personnalisée"
            @date-select="onCustomDateChange"
            class="w-12rem"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="col-12">
      <div class="flex flex-column align-items-center justify-content-center py-6">
        <ProgressSpinner />
        <p class="text-600 mt-3">Chargement des analytics...</p>
      </div>
    </div>

    <div v-else class="col-12">
      <!-- Vue d'ensemble -->
      <div class="grid">
        <div class="col-12">
          <div class="flex align-items-center gap-2 mb-4">
            <div class="bg-green-100 text-green-600 p-2 border-circle">
              <i class="pi pi-eye text-lg"></i>
            </div>
            <h3 class="text-xl font-bold text-900 m-0">Vue d'ensemble</h3>
          </div>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <div class="card border-1 surface-border">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 text-blue-600 p-3 border-circle">
                <i class="pi pi-users text-xl"></i>
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-900">{{ analytics.totalUsers }}</div>
                <div class="text-600 text-sm">Utilisateurs actifs</div>
                <div class="flex align-items-center gap-1 mt-1">
                  <i :class="analytics.usersTrend > 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
                  <span :class="analytics.usersTrend > 0 ? 'text-green-500' : 'text-red-500'" class="text-sm font-semibold">
                    {{ Math.abs(analytics.usersTrend) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <div class="card border-1 surface-border">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 text-orange-600 p-3 border-circle">
                <i class="pi pi-trophy text-xl"></i>
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-900">{{ analytics.totalChallenges }}</div>
                <div class="text-600 text-sm">Défis complétés</div>
                <div class="flex align-items-center gap-1 mt-1">
                  <i class="pi pi-arrow-up text-green-500"></i>
                  <span class="text-green-500 text-sm font-semibold">{{ analytics.challengesTrend }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 md:col-6 lg:col-3">
          <div class="card border-1 surface-border">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 text-purple-600 p-3 border-circle">
                <i class="pi pi-flag text-xl"></i>
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-900">{{ analytics.totalQuests }}</div>
                <div class="text-600 text-sm">Quêtes terminées</div>
                <div class="flex align-items-center gap-1 mt-1">
                  <i class="pi pi-arrow-up text-green-500"></i>
                  <span class="text-green-500 text-sm font-semibold">{{ analytics.questsTrend }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        <div class="col-12 md:col-6 lg:col-3">
          <div class="card border-1 surface-border">
            <div class="flex align-items-center gap-3">
              <div class="bg-pink-100 text-pink-600 p-3 border-circle">
                <i class="pi pi-heart text-xl"></i>
              </div>
              <div class="flex-1">
                <div class="text-2xl font-bold text-900">{{ analytics.engagementRate }}%</div>
                <div class="text-600 text-sm">Taux d'engagement</div>
                <div class="flex align-items-center gap-1 mt-1">
                  <i :class="analytics.engagementTrend > 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"></i>
                  <span :class="analytics.engagementTrend > 0 ? 'text-green-500' : 'text-red-500'" class="text-sm font-semibold">
                    {{ Math.abs(analytics.engagementTrend) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="col-12">
        <div class="grid">
          <!-- Graphique d'activité -->
          <div class="col-12 lg:col-8">
            <div class="card">
              <div class="flex justify-content-between align-items-center mb-4">
                <div class="flex align-items-center gap-2">
                  <div class="bg-indigo-100 text-indigo-600 p-2 border-circle">
                    <i class="pi pi-chart-line text-lg"></i>
                  </div>
                  <h4 class="text-lg font-bold text-900 m-0">Activité quotidienne</h4>
                </div>
                <Dropdown 
                  v-model="activityMetric" 
                  :options="activityMetrics" 
                  optionLabel="label" 
                  optionValue="value"
                  @change="updateActivityChart"
                  class="w-10rem"
                />
              </div>
              <div class="flex align-items-center justify-content-center h-20rem bg-gray-50 border-round">
                <div class="text-center text-600">
                  <i class="pi pi-chart-line text-4xl mb-3"></i>
                  <p class="m-0">Graphique d'activité</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Répartition par maison -->
          <div class="col-12 lg:col-4">
            <div class="card">
              <div class="flex align-items-center gap-2 mb-4">
                <div class="bg-teal-100 text-teal-600 p-2 border-circle">
                  <i class="pi pi-chart-pie text-lg"></i>
                </div>
                <h4 class="text-lg font-bold text-900 m-0">Répartition par maison</h4>
              </div>
              <div class="flex align-items-center justify-content-center h-20rem bg-gray-50 border-round">
                <div class="text-center text-600">
                  <i class="pi pi-chart-pie text-4xl mb-3"></i>
                  <p class="m-0">Graphique en secteurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableaux de données -->
      <div class="col-12">
        <div class="grid">
          <!-- Top performers -->
          <div class="col-12 lg:col-6">
            <div class="card">
              <div class="flex justify-content-between align-items-center mb-4">
                <div class="flex align-items-center gap-2">
                  <div class="bg-yellow-100 text-yellow-600 p-2 border-circle">
                    <i class="pi pi-star text-lg"></i>
                  </div>
                  <h4 class="text-lg font-bold text-900 m-0">Top Performers</h4>
                </div>
                <Dropdown 
                  v-model="performerMetric" 
                  :options="performerMetrics" 
                  optionLabel="label" 
                  optionValue="value"
                  @change="loadTopPerformers"
                  class="w-10rem"
                />
              </div>
              
              <div class="flex flex-column gap-3">
                <div 
                  v-for="(performer, index) in topPerformers" 
                  :key="performer.id"
                  class="flex align-items-center gap-3 p-3 border-1 surface-border border-round"
                >
                  <div class="flex align-items-center gap-2">
                    <span class="text-sm font-bold text-600">#{{ index + 1 }}</span>
                    <i v-if="index === 0" class="pi pi-crown text-yellow-500"></i>
                  </div>
                  
                  <div class="flex align-items-center justify-content-center w-3rem h-3rem border-circle bg-gray-100">
                    <img 
                      v-if="performer.photoURL" 
                      :src="performer.photoURL" 
                      :alt="performer.name"
                      class="w-full h-full border-circle"
                    />
                    <i v-else class="pi pi-user text-gray-600"></i>
                  </div>
                  
                  <div class="flex-1">
                    <div class="font-semibold text-900">{{ performer.name }}</div>
                    <div class="text-sm text-600">{{ performer.house }}</div>
                  </div>
                  
                  <div class="text-right">
                    <div class="text-lg font-bold text-900">{{ performer.score }}</div>
                    <div class="text-xs text-600">{{ getScoreLabel(performerMetric) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Défis populaires -->
          <div class="col-12 lg:col-6">
            <div class="card">
              <div class="flex align-items-center gap-2 mb-4">
                <div class="bg-orange-100 text-orange-600 p-2 border-circle">
                  <i class="pi pi-trophy text-lg"></i>
                </div>
                <h4 class="text-lg font-bold text-900 m-0">Défis les plus populaires</h4>
              </div>
              
              <div class="flex flex-column gap-3">
                <div 
                  v-for="challenge in popularChallenges" 
                  :key="challenge.id"
                  class="flex justify-content-between align-items-center p-3 border-1 surface-border border-round"
                >
                  <div class="flex-1">
                    <div class="font-semibold text-900">{{ challenge.title }}</div>
                    <div class="text-sm text-600">{{ challenge.category }}</div>
                  </div>
                  
                  <div class="flex gap-3 text-sm">
                    <div class="flex align-items-center gap-1 text-600">
                      <i class="pi pi-users"></i>
                      <span>{{ challenge.participants }}</span>
                    </div>
                    <div class="flex align-items-center gap-1 text-600">
                      <i class="pi pi-percentage"></i>
                      <span>{{ challenge.completionRate }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Insights et recommandations -->
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center gap-2 mb-4">
            <div class="bg-cyan-100 text-cyan-600 p-2 border-circle">
              <i class="pi pi-lightbulb text-lg"></i>
            </div>
            <h3 class="text-xl font-bold text-900 m-0">Insights & Recommandations</h3>
          </div>
          
          <div class="grid">
            <div 
              v-for="insight in insights" 
              :key="insight.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="card border-1 surface-border h-full" :class="{
                'border-green-200 bg-green-50': insight.type === 'success',
                'border-orange-200 bg-orange-50': insight.type === 'warning',
                'border-blue-200 bg-blue-50': insight.type === 'info'
              }">
                <div class="flex align-items-start gap-3">
                  <div class="p-2 border-circle" :class="{
                    'bg-green-100 text-green-600': insight.type === 'success',
                    'bg-orange-100 text-orange-600': insight.type === 'warning',
                    'bg-blue-100 text-blue-600': insight.type === 'info'
                  }">
                    <i :class="insight.icon"></i>
                  </div>
                  
                  <div class="flex-1">
                    <h5 class="text-lg font-semibold text-900 mb-2">{{ insight.title }}</h5>
                    <p class="text-600 text-sm mb-3 line-height-3">{{ insight.description }}</p>
                    
                    <div v-if="insight.action">
                      <Button 
                        :label="insight.action.label"
                        :icon="insight.action.icon"
                        text
                        size="small"
                        @click="executeInsightAction(insight.action)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'
// Système de rôles temporairement désactivé - sera réintégré plus tard

// Accès libre pour le développement
const canViewAnalytics = computed(() => true)

const toast = useToast()

// Refs pour les graphiques
const activityChart = ref(null)
const houseChart = ref(null)

// État réactif
const loading = ref(true)
const analytics = ref({})
const topPerformers = ref([])
const popularChallenges = ref([])
const insights = ref([])

// Filtres
const selectedPeriod = ref('7d')
const customDateRange = ref(null)
const activityMetric = ref('users')
const performerMetric = ref('points')

// Options
const periodOptions = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '3 mois', value: '3m' },
  { label: '1 an', value: '1y' }
]

const activityMetrics = [
  { label: 'Utilisateurs actifs', value: 'users' },
  { label: 'Défis complétés', value: 'challenges' },
  { label: 'Quêtes terminées', value: 'quests' },
  { label: 'Points gagnés', value: 'points' }
]

const performerMetrics = [
  { label: 'Points totaux', value: 'points' },
  { label: 'Défis complétés', value: 'challenges' },
  { label: 'Quêtes terminées', value: 'quests' },
  { label: 'Badges obtenus', value: 'badges' }
]

// Permissions supprimées - système de rôles désactivé

// Méthodes
const loadAnalytics = async () => {
  try {
    loading.value = true
    
    // Simuler le chargement des analytics
    const mockAnalytics = {
      totalUsers: 176,
      usersTrend: 12,
      totalChallenges: 342,
      challengesTrend: 8,
      totalQuests: 89,
      questsTrend: 15,
      engagementRate: 73,
      engagementTrend: -3
    }
    
    analytics.value = mockAnalytics
    
    await loadTopPerformers()
    await loadPopularChallenges()
    await loadInsights()
    
  } catch (error) {
    console.error('Erreur lors du chargement des analytics:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les analytics',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadTopPerformers = async () => {
  const mockPerformers = [
    {
      id: '1',
      name: 'Alice Dubois',
      house: 'Serdaigle',
      score: 1250,
      photoURL: null
    },
    {
      id: '2',
      name: 'Bob Martin',
      house: 'Gryffondor',
      score: 1180,
      photoURL: null
    },
    {
      id: '3',
      name: 'Claire Leroy',
      house: 'Poufsouffle',
      score: 1095,
      photoURL: null
    }
  ]
  
  topPerformers.value = mockPerformers
}

const loadPopularChallenges = async () => {
  const mockChallenges = [
    {
      id: '1',
      title: 'Innovation Technologique',
      category: 'Technique',
      participants: 45,
      completionRate: 78
    },
    {
      id: '2',
      title: 'Travail d\'équipe',
      category: 'Social',
      participants: 38,
      completionRate: 85
    },
    {
      id: '3',
      title: 'Créativité',
      category: 'Créatif',
      participants: 32,
      completionRate: 72
    }
  ]
  
  popularChallenges.value = mockChallenges
}

const loadInsights = async () => {
  const mockInsights = [
    {
      id: '1',
      type: 'success',
      icon: 'pi pi-check-circle',
      title: 'Engagement élevé',
      description: 'Le taux d\'engagement a augmenté de 12% ce mois-ci. Les défis techniques sont particulièrement populaires.',
      action: {
        label: 'Créer plus de défis techniques',
        icon: 'pi pi-plus',
        type: 'create_challenge'
      }
    },
    {
      id: '2',
      type: 'warning',
      icon: 'pi pi-exclamation-triangle',
      title: 'Déséquilibre des maisons',
      description: 'Serdaigle domine le classement. Considérez des défis spécifiques pour équilibrer la compétition.',
      action: {
        label: 'Créer défis équilibrés',
        icon: 'pi pi-balance-scale',
        type: 'balance_houses'
      }
    },
    {
      id: '3',
      type: 'info',
      icon: 'pi pi-info-circle',
      title: 'Nouveaux utilisateurs',
      description: '23 nouveaux utilisateurs ce mois. Pensez à créer des défis d\'introduction.',
      action: {
        label: 'Défis d\'accueil',
        icon: 'pi pi-user-plus',
        type: 'welcome_challenges'
      }
    }
  ]
  
  insights.value = mockInsights
}

const refreshData = async () => {
  await loadAnalytics()
  toast.add({
    severity: 'success',
    summary: 'Actualisé',
    detail: 'Données mises à jour',
    life: 2000
  })
}

const exportData = () => {
  // Simuler l'export des données
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: 'Export des données en cours...',
    life: 3000
  })
}

const onCustomDateChange = () => {
  if (customDateRange.value && customDateRange.value.length === 2) {
    selectedPeriod.value = 'custom'
    loadAnalytics()
  }
}

const updateActivityChart = () => {
  // Mettre à jour le graphique d'activité
  console.log('Mise à jour du graphique:', activityMetric.value)
}

const executeInsightAction = (action) => {
  toast.add({
    severity: 'info',
    summary: 'Action',
    detail: `Exécution de: ${action.label}`,
    life: 3000
  })
}

// Initialisation
onMounted(() => {
  loadAnalytics()
  loadTopPerformers()
  loadPopularChallenges()
})

// Toutes les méthodes utilitaires de rôles ont été supprimées

const getScoreLabel = (metric) => {
  const labels = {
    points: 'points',
    challenges: 'défis',
    quests: 'quêtes',
    badges: 'badges'
  }
  return labels[metric] || 'score'
}

// Lifecycle
onMounted(() => {
  if (canViewAnalytics.value) {
    loadAnalytics()
  }
})
</script>

<style scoped>
/* Styles supprimés - utilisation exclusive des classes PrimeVue */
</style>
