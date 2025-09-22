<template>
  <div class="gamification-stats-widget">
    <!-- En-tête du widget -->
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-trophy text-2xl" style="color: var(--primary-color)"></i>
        <h3 class="text-xl font-bold text-900 m-0">Système de Gamification</h3>
      </div>
      <div class="flex align-items-center gap-2">
        <i class="pi pi-refresh cursor-pointer text-600 hover:text-primary transition-colors" 
           @click="refreshData" 
           :class="{ 'pi-spin': loading }"
           title="Actualiser"></i>
        <small class="text-500">{{ lastUpdated }}</small>
      </div>
    </div>

    <!-- Statistiques principales -->
    <div class="grid">
      <!-- Utilisateurs Gamification -->
      <div class="col-12 md:col-6 xl:col-3">
        <div class="stat-card users-card">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.gamificationUsers || 0 }}</div>
            <div class="stat-label">Utilisateurs Actifs</div>
            <div class="stat-detail">sur {{ stats.totalUsers || 0 }} total</div>
          </div>
        </div>
      </div>

      <!-- Défis -->
      <div class="col-12 md:col-6 xl:col-3">
        <div class="stat-card challenges-card">
          <div class="stat-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalChallenges || 0 }}</div>
            <div class="stat-label">Défis Totaux</div>
            <div class="stat-detail">{{ stats.activeChallenges || 0 }} actifs</div>
          </div>
        </div>
      </div>

      <!-- Quêtes -->
      <div class="col-12 md:col-6 xl:col-3">
        <div class="stat-card quests-card">
          <div class="stat-icon">
            <i class="pi pi-flag"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalQuests || 0 }}</div>
            <div class="stat-label">Quêtes Totales</div>
            <div class="stat-detail">{{ stats.completedQuests || 0 }} complétées</div>
          </div>
        </div>
      </div>

      <!-- Badges -->
      <div class="col-12 md:col-6 xl:col-3">
        <div class="stat-card badges-card">
          <div class="stat-icon">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalBadges || 0 }}</div>
            <div class="stat-label">Badges Totaux</div>
            <div class="stat-detail">{{ Math.floor((stats.totalBadges || 0) * 0.7) }} débloqués</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Maisons (si disponibles) -->
    <div v-if="Object.keys(stats.houses || {}).length > 0" class="mt-4">
      <h4 class="text-lg font-semibold text-900 mb-3">
        <i class="pi pi-home mr-2"></i>
        Classement des Maisons
      </h4>
      <div class="grid">
        <div 
          v-for="(house, houseId) in sortedHouses" 
          :key="houseId"
          class="col-12 md:col-6 xl:col-3"
        >
          <div class="house-card" :style="{ borderLeftColor: house.color }">
            <div class="house-header">
              <h5 class="house-name">{{ house.name }}</h5>
              <div class="house-xp">{{ house.totalXP || 0 }} XP</div>
            </div>
            <div class="house-stats">
              <div class="house-stat">
                <i class="pi pi-users"></i>
                <span>{{ house.memberCount || 0 }} membres</span>
              </div>
              <div class="house-stat">
                <i class="pi pi-chart-line"></i>
                <span>Niveau {{ Math.floor((house.averageLevel || 0) * 10) / 10 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="mt-4">
      <h4 class="text-lg font-semibold text-900 mb-3">
        <i class="pi pi-cog mr-2"></i>
        Actions Rapides
      </h4>
      <div class="flex flex-wrap gap-2">
        <Button 
          label="Créer Quête" 
          icon="pi pi-flag" 
          class="p-button-outlined p-button-sm"
          @click="$router.push('/create-quest')"
        />
        <Button 
          label="Créer Défi" 
          icon="pi pi-trophy" 
          class="p-button-outlined p-button-sm"
          @click="$router.push('/create-challenge')"
        />
        <Button 
          v-if="canManageGamification"
          label="Gestion Admin" 
          icon="pi pi-cog" 
          class="p-button-outlined p-button-sm"
          @click="$router.push('/admin/gamification/analytics')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import gamificationService from '@/service/gamificationService'

const props = defineProps({
  showActions: {
    type: Boolean,
    default: true
  },
  showHouses: {
    type: Boolean,
    default: true
  },
  canManageGamification: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const stats = ref({})
const loading = ref(false)
const lastUpdated = ref('')
const listenerId = ref(null)

// Maisons triées par XP
const sortedHouses = computed(() => {
  const houses = stats.value.houses || {}
  return Object.entries(houses)
    .sort(([,a], [,b]) => (b.totalXP || 0) - (a.totalXP || 0))
    .reduce((acc, [id, house]) => {
      acc[id] = house
      return acc
    }, {})
})

// Charger les données
const loadData = async () => {
  try {
    loading.value = true
    const data = await gamificationService.getUnifiedStats()
    stats.value = data
    lastUpdated.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('[GamificationStatsWidget] Erreur lors du chargement:', error)
    stats.value = gamificationService.getDefaultStats()
  } finally {
    loading.value = false
  }
}

// Actualiser les données
const refreshData = () => {
  loadData()
}

// S'abonner aux mises à jour temps réel
const subscribeToUpdates = () => {
  listenerId.value = gamificationService.subscribeToStats((updatedStats) => {
    stats.value = updatedStats
    lastUpdated.value = new Date().toLocaleTimeString()
  })
}

// Lifecycle
onMounted(() => {
  loadData()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (listenerId.value) {
    gamificationService.unsubscribe(listenerId.value)
  }
})
</script>

<style scoped>
.gamification-stats-widget {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--primary-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.users-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.challenges-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.quests-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.badges-card .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.stat-detail {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.house-card {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #3498db;
  transition: all 0.3s ease;
}

.house-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.house-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.house-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.house-xp {
  font-size: 0.875rem;
  font-weight: bold;
  color: var(--primary-color);
}

.house-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.house-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.house-stat i {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .gamification-stats-widget {
    padding: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
