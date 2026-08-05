<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="student-stats-page">
      <!-- Header -->
      <div class="col-12">
        <Card>
          <template #content>
            <div class="flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 class="text-2xl font-bold text-900 m-0 mb-1">📊 Statistiques Étudiants</h1>
                <p class="text-600 text-sm m-0">Visualisations interactives des données étudiantes</p>
              </div>
              <Button
                icon="pi pi-refresh"
                label="Actualiser"
                @click="loadStats"
                :loading="loading"
                outlined
                size="small"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="col-12">
        <div class="flex justify-content-center align-items-center p-8">
          <ProgressSpinner />
        </div>
      </div>

      <!-- Stats Grid -->
      <template v-else>
        <!-- Répartition par Classe -->
        <div class="col-12">
          <Card>
            <template #content>
              <div class="mb-3">
                <h3 class="text-lg font-semibold m-0 mb-1">📊 Répartition par Classe</h3>
                <p class="text-600 text-sm m-0">{{ stats.totalStudents }} étudiants au total</p>
              </div>
              <SmartVisualization
                :data="classChartData"
                title="Répartition Classes"
                :auto-detect="true"
                :height="300"
                :show-refresh="true"
                @refresh="loadStats"
              />
            </template>
          </Card>
        </div>

        <!-- Étudiants avec SAE -->
        <div class="col-12 lg:col-6">
          <StatsCard
            title="Étudiants avec SAE"
            subtitle="Situations d'apprentissage et d'évaluation"
            :value="stats.studentsWithSAE"
            icon="pi pi-bookmark"
            color="#10b981"
            :trend="stats.saeTrend"
            :chart-data="saeChartData"
            default-chart-type="doughnut"
            :chart-height="250"
            :additional-info="[
              { label: 'Avec SAE', value: stats.studentsWithSAE },
              { label: 'Sans SAE', value: stats.studentsWithoutSAE },
              { label: 'Taux SAE', value: saePercentage + '%' }
            ]"
          />
        </div>

        <!-- Évolution des Inscriptions -->
        <div class="col-12">
          <StatsCard
            title="Évolution des Inscriptions"
            subtitle="Nombre d'étudiants par mois"
            icon="pi pi-chart-line"
            color="#8b5cf6"
            :chart-data="evolutionChartData"
            default-chart-type="line"
            :chart-height="280"
            :show-value="false"
          />
        </div>

        <!-- Comparaison par Année -->
        <div class="col-12 lg:col-8">
          <StatsCard
            title="Comparaison par Année Académique"
            subtitle="Analyse comparative"
            icon="pi pi-chart-bar"
            color="#f59e0b"
            :chart-data="classChartData"
            default-chart-type="bar"
            :chart-height="280"
            :show-value="false"
            :additional-info="classAdditionalInfo"
          />
        </div>

        <!-- Maisons (Gamification) -->
        <div class="col-12 lg:col-4" v-if="housesChartData.length > 0">
          <StatsCard
            title="Répartition Maisons"
            subtitle="Système de gamification"
            :value="stats.totalStudents"
            icon="pi pi-home"
            color="#ec4899"
            :chart-data="housesChartData"
            default-chart-type="doughnut"
            :chart-height="280"
          />
        </div>

        <!-- Quick Stats Grid -->
        <div class="col-12">
          <Card>
            <template #header>
              <div class="p-4 pb-0">
                <h3 class="text-xl font-semibold m-0">Statistiques Rapides</h3>
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-12 md:col-6 lg:col-3" v-for="stat in quickStats" :key="stat.label">
                  <div class="quick-stat-card" :style="{ borderLeftColor: stat.color }">
                    <div class="flex align-items-center gap-3">
                      <div class="stat-icon" :style="{ background: stat.color + '20', color: stat.color }">
                        <i :class="stat.icon" class="text-2xl"></i>
                      </div>
                      <div class="flex-1">
                        <div class="stat-value">{{ stat.value }}</div>
                        <div class="stat-label">{{ stat.label }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import StatsCard from '@/components/admin/widgets/StatsCard.vue'
import SmartVisualization from '@/components/admin/widgets/SmartVisualization.vue'
import studentsService from '@/service/studentDirectoryService'

const router = useRouter()
const loading = ref(true)
const stats = ref({
  totalStudents: 0,
  studentsWithSAE: 0,
  studentsWithoutSAE: 0,
  classTrend: 0,
  saeTrend: 0,
  byClass: {},
  byHouse: {}
})

const lastUpdate = computed(() => {
  return new Date().toLocaleString('fr-FR')
})

// Données pour graphique classes
const classChartData = computed(() => {
  const colors = {
    'BA22': '#ef4444',
    'BA23': '#f59e0b',
    'BA24': '#10b981',
    'BA25': '#3b82f6',
    'Non défini': '#6b7280'
  }
  
  return Object.entries(stats.value.byClass).map(([classe, count]) => ({
    label: classe,
    value: count,
    color: colors[classe] || '#6b7280'
  }))
})

// Données pour graphique SAE
const saeChartData = computed(() => [
  {
    label: 'Avec SAE',
    value: stats.value.studentsWithSAE,
    color: '#10b981'
  },
  {
    label: 'Sans SAE',
    value: stats.value.studentsWithoutSAE,
    color: '#ef4444'
  }
])

// Données pour graphique évolution
const evolutionChartData = computed(() => {
  // Simuler une évolution mensuelle
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const baseValue = Math.floor(stats.value.totalStudents / 12)
  
  return months.map((month, index) => ({
    x: month,
    y: baseValue + Math.floor(Math.random() * 30) - 15
  }))
})

// Données pour graphique maisons
const housesChartData = computed(() => {
  const colors = {
    'Harmonis': '#3b82f6',
    'Elaris': '#10b981',
    'Doloris': '#f59e0b',
    'Solencia': '#ec4899'
  }
  
  return Object.entries(stats.value.byHouse).map(([house, count]) => ({
    label: house,
    value: count,
    color: colors[house] || '#6b7280'
  }))
})

// Infos additionnelles classes
const classAdditionalInfo = computed(() => {
  return Object.entries(stats.value.byClass).map(([classe, count]) => ({
    label: classe,
    value: count
  }))
})

// Pourcentage SAE
const saePercentage = computed(() => {
  if (stats.value.totalStudents === 0) return 0
  return ((stats.value.studentsWithSAE / stats.value.totalStudents) * 100).toFixed(1)
})

// Quick Stats
const quickStats = computed(() => [
  {
    label: 'Total Étudiants',
    value: stats.value.totalStudents,
    icon: 'pi pi-users',
    color: '#3b82f6'
  },
  {
    label: 'Classes Actives',
    value: Object.keys(stats.value.byClass).length,
    icon: 'pi pi-th-large',
    color: '#10b981'
  },
  {
    label: 'Taux SAE',
    value: saePercentage.value + '%',
    icon: 'pi pi-bookmark',
    color: '#f59e0b'
  },
  {
    label: 'Maisons',
    value: Object.keys(stats.value.byHouse).length,
    icon: 'pi pi-home',
    color: '#ec4899'
  }
])

async function loadStats() {
  loading.value = true
  try {
    const students = await studentsService.getAllStudents()
    
    // Total
    stats.value.totalStudents = students.length
    
    // Par classe
    stats.value.byClass = students.reduce((acc, s) => {
      const classe = s.Classe || 'Non défini'
      acc[classe] = (acc[classe] || 0) + 1
      return acc
    }, {})
    
    // SAE
    stats.value.studentsWithSAE = students.filter(s => s.SAE).length
    stats.value.studentsWithoutSAE = students.length - stats.value.studentsWithSAE
    
    // Par maison (si disponible)
    stats.value.byHouse = students.reduce((acc, s) => {
      if (s.house_id) {
        acc[s.house_id] = (acc[s.house_id] || 0) + 1
      }
      return acc
    }, {})
    
    // Trends (simulés)
    stats.value.classTrend = Math.floor(Math.random() * 20) - 10
    stats.value.saeTrend = Math.floor(Math.random() * 15)
    
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.student-stats-page {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2rem;
}

.quick-stat-card {
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 12px;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.quick-stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .student-stats-page {
    padding: 1rem;
    gap: 1rem;
  }
}
</style>
