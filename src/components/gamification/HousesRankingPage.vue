<template>
  <Navbar />
  <div class="houses-ranking-page mt-5">

    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="$router.go(-1)">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div class="title-section">
          <h1>🏆 Classement des Maisons</h1>

        </div>
        <button class="refresh-btn" @click="refreshRanking" :disabled="loading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
        </button>
      </div>
    </div>

    <div class="ranking-container" v-if="housesRanking">
      <!-- Statistiques globales -->
      <div class="global-stats">
        <div class="stat-item">
          <i class="pi pi-users"></i>
          <span>{{ housesRanking.totalUsers }} Étudiants</span>
        </div>
        <div class="stat-item">
          <i class="pi pi-clock"></i>
          <span>Mis à jour {{ formatDate(housesRanking.lastUpdated) }}</span>
        </div>
      </div>

      <!-- Podium des 3 premières maisons -->
      <div class="podium">
        <div 
          v-for="(house, index) in housesRanking.ranking.slice(0, 3)" 
          :key="house.name"
          class="podium-item"
          :class="`position-${house.position}`"
          :style="{ '--house-color': house.color }"
        >
          <div class="podium-rank">
            <i v-if="house.position === 1" class="pi pi-crown gold"></i>
            <i v-else-if="house.position === 2" class="pi pi-medal silver"></i>
            <i v-else-if="house.position === 3" class="pi pi-medal bronze"></i>
            <span class="rank-number">#{{ house.position }}</span>
          </div>
          
          <div class="house-card" @click="viewHouseDetails(house.name)">
            <div class="house-header" :style="{ backgroundColor: house.color }">
              <h3>{{ house.displayName }}</h3>
              <p class="house-motto">{{ house.motto }}</p>
            </div>
            
            <div class="house-stats">
              <div class="level-info">
                <span class="level-badge" :style="{ backgroundColor: house.color }">
                  Niveau {{ house.level }}
                </span>
                <span class="level-name">{{ house.levelName }}</span>
              </div>
              
              <div class="stats-grid">
                <div class="stat">
                  <strong>{{ formatNumber(house.totalXP) }}</strong>
                  <span>XP Total</span>
                </div>
                <div class="stat">
                  <strong>{{ house.totalMembers }}</strong>
                  <span>Membres</span>
                </div>
                <div class="stat">
                  <strong>{{ formatNumber(house.averageXP) }}</strong>
                  <span>XP Moyen</span>
                </div>
                <div class="stat">
                  <strong>{{ house.averageLevel }}</strong>
                  <span>Niveau Moyen</span>
                </div>
              </div>
              
              <div v-if="house.xpToNext > 0" class="progress-section">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ 
                      width: `${calculateProgress(house)}%`, 
                      backgroundColor: house.color 
                    }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ formatNumber(house.xpToNext) }} XP pour le niveau {{ house.level + 1 }}
                </span>
              </div>
              <div v-else class="max-level">
                🎉 Niveau Maximum Atteint !
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Classement complet -->
      <div class="full-ranking">
        <h2>Classement Complet</h2>
        <div class="ranking-list">
          <div 
            v-for="house in housesRanking.ranking" 
            :key="house.name"
            class="ranking-item"
            :class="{ 'top-three': house.position <= 3 }"
            @click="viewHouseDetails(house.name)"
          >
            <div class="rank-section">
              <span class="rank-number">#{{ house.position }}</span>
              <i v-if="house.position === 1" class="pi pi-crown gold"></i>
              <i v-else-if="house.position === 2" class="pi pi-medal silver"></i>
              <i v-else-if="house.position === 3" class="pi pi-medal bronze"></i>
            </div>
            
            <div class="house-info">
              <div class="house-name" :style="{ color: house.color }">
                {{ house.displayName }}
              </div>
              <div class="house-level">
                Niveau {{ house.level }} - {{ house.levelName }}
              </div>
            </div>
            
            <div class="house-metrics">
              <div class="metric">
                <span class="value">{{ formatNumber(house.totalXP) }}</span>
                <span class="label">XP Total</span>
              </div>
              <div class="metric">
                <span class="value">{{ house.totalMembers }}</span>
                <span class="label">Membres</span>
              </div>
              <div class="metric">
                <span class="value">{{ formatNumber(house.averageXP) }}</span>
                <span class="label">XP Moyen</span>
              </div>
            </div>
            
            <div class="arrow">
              <i class="pi pi-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Chargement du classement...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHousesRanking, HOUSE_LEVEL_CONFIG } from '@/service/hesHousesService'
import Navbar from '@/components/common/utils/Navbar.vue'

const router = useRouter()
const housesRanking = ref(null)
const loading = ref(false)

// Formatage des nombres
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Formatage de la date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffMinutes < 1) return 'à l\'instant'
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`
  if (diffMinutes < 1440) return `il y a ${Math.floor(diffMinutes / 60)}h`
  return `il y a ${Math.floor(diffMinutes / 1440)} jour(s)`
}

// Calcul du pourcentage de progression
const calculateProgress = (house) => {
  if (house.level >= 20) return 100
  
  const currentLevelXP = HOUSE_LEVEL_CONFIG[house.level].xpRequired
  const nextLevelXP = HOUSE_LEVEL_CONFIG[house.level + 1].xpRequired
  const currentXP = house.totalXP
  
  return Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
}

// Navigation vers les détails d'une maison
const viewHouseDetails = (houseName) => {
  router.push(`/houses/${houseName}/stats`)
}

// Actualisation du classement
const refreshRanking = async () => {
  await loadRanking()
}

// Chargement des données
const loadRanking = async () => {
  try {
    loading.value = true
    housesRanking.value = await getHousesRanking()
  } catch (error) {
    console.error('Erreur lors du chargement du classement:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRanking()
})
</script>

<style scoped>
.houses-ranking-page {
  min-height: 100vh;
}

.page-header {
  padding: 2rem 1rem;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn, .refresh-btn {
  background: var(--surface-card);
  border: none;
  color: white;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover, .refresh-btn:hover {
  background: rgba(255,255,255,0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.title-section h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
}

.title-section p {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.ranking-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem 1rem;
}

.global-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 1rem;
}

.podium {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.podium-item {
  position: relative;
}

.podium-rank {
  text-align: center;
  margin-bottom: 1rem;
}

.rank-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  margin-top: 0.5rem;
}

.pi-crown.gold { color: #f1c40f; font-size: 2rem; }
.pi-medal.silver { color: #95a5a6; font-size: 1.8rem; }
.pi-medal.bronze { color: #e67e22; font-size: 1.8rem; }

.house-card {
  background: var(--surface-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.house-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}

.position-1 .house-card {
  border: 3px solid #f1c40f;
}

.position-2 .house-card {
  border: 3px solid #95a5a6;
}

.position-3 .house-card {
  border: 3px solid #e67e22;
}

.house-header {
  padding: 1.5rem;
  color: white;
  text-align: center;
}

.house-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.house-motto {
  margin: 0;
  opacity: 0.9;
  font-style: italic;
}

.house-stats {
  padding: 1.5rem;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.level-badge {
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.level-name {
  font-size: 0.9rem;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  text-align: center;
}

.stat strong {
  display: block;
  font-size: 1.2rem;
  color: white;
}

.stat span {
  font-size: 0.8rem;
  color: white;
}

.progress-section {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: white;
}

.max-level {
  text-align: center;
  color: #28a745;
  font-weight: bold;
  margin-top: 1rem;
}

.full-ranking {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.full-ranking h2 {
  margin: 0 0 1.5rem 0;
  color: white;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: var(--surface-card);
}

.top-three {
  background: var(--surface-hover);
  border: 1px solid #f39c12;
}

.rank-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.house-info {
  flex: 1;
}

.house-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.house-level {
  font-size: 0.9rem;
  color: white;
}

.house-metrics {
  display: flex;
  gap: 1.5rem;
}

.metric {
  text-align: center;
}

.metric .value {
  display: block;
  font-weight: bold;
  color: white;
}

.metric .label {
  font-size: 0.8rem;
  color: white;
}

.arrow {
  color: white;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: white;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .title-section h1 {
    font-size: 2rem;
  }
  
  .podium {
    grid-template-columns: 1fr;
  }
  
  .global-stats {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .house-metrics {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .ranking-item {
    flex-wrap: wrap;
  }
}
</style>
