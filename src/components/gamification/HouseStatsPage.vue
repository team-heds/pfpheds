<template>
  <div class="house-stats-page">
    <div class="page-header" :style="{ backgroundColor: houseInfo?.color }">
      <div class="header-content">
        <button class="back-btn" @click="$router.go(-1)">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div class="house-title">
          <h1>{{ houseInfo?.name }}</h1>
          <p class="house-motto">{{ houseInfo?.motto }}</p>
        </div>
      </div>
    </div>

    <div class="stats-container" v-if="houseStats">
      <!-- Niveau de la maison -->
      <div class="house-level-card">
        <div class="level-info">
          <div class="level-badge" :style="{ backgroundColor: houseInfo?.color }">
            Niveau {{ houseStats.houseLevel.niveau }}
          </div>
          <h2 class="level-name">{{ houseStats.houseLevel.name }}</h2>
          <div class="xp-progress">
            <div class="xp-bar">
              <div 
                class="xp-fill" 
                :style="{ 
                  width: `${xpProgress}%`, 
                  backgroundColor: houseInfo?.color 
                }"
              ></div>
            </div>
            <div class="xp-text">
              <span>{{ formatNumber(houseStats.totalXP) }} XP</span>
              <span v-if="houseStats.houseLevel.xpToNext > 0">
                {{ formatNumber(houseStats.houseLevel.xpToNext) }} XP pour le niveau suivant
              </span>
              <span v-else class="max-level">Niveau Maximum Atteint !</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques générales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ houseStats.totalMembers }}</h3>
            <p>Membres</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-content">
            <h3>{{ formatNumber(houseStats.averageXP) }}</h3>
            <p>XP Moyen</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>{{ houseStats.averageLevel }}</h3>
            <p>Niveau Moyen</p>
          </div>
        </div>
      </div>

      <!-- Classement des membres -->
      <div class="members-ranking">
        <h2>Classement des Membres</h2>
        <div class="ranking-list">
          <div 
            v-for="(member, index) in houseStats.members" 
            :key="member.userId"
            class="member-item"
            :class="{ 'top-member': index < 3 }"
          >
            <div class="member-rank">
              <span class="rank-number">{{ index + 1 }}</span>
              <i v-if="index === 0" class="pi pi-crown gold"></i>
              <i v-else-if="index === 1" class="pi pi-medal silver"></i>
              <i v-else-if="index === 2" class="pi pi-medal bronze"></i>
            </div>
            
            <div class="member-info">
              <h4>{{ member.prenom }} {{ member.nom }}</h4>
              <div class="member-details">
                <span class="level">Niveau {{ member.niveau }}</span>
                <span class="xp">{{ formatNumber(member.totalXP) }} XP</span>
                <span v-if="member.loginStreak > 0" class="streak">
                  <i class="pi pi-bolt"></i>
                  {{ member.loginStreak }} jours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Chargement des statistiques...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getHouseDetailedStats, getHouseInfo } from '@/service/hesHousesService'

const route = useRoute()
const houseStats = ref(null)
const houseInfo = ref(null)
const loading = ref(true)

const houseName = route.params.houseName || 'harmonis'

// Calcul du pourcentage de progression XP
const xpProgress = computed(() => {
  if (!houseStats.value || houseStats.value.houseLevel.niveau === 20) return 100
  
  const currentLevelXP = houseStats.value.houseLevel.xpRequired
  const nextLevelXP = currentLevelXP + houseStats.value.houseLevel.xpToNext
  const currentXP = houseStats.value.totalXP
  
  return Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
})

// Formatage des nombres
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Chargement des données
const loadHouseStats = async () => {
  try {
    loading.value = true
    houseInfo.value = getHouseInfo(houseName)
    houseStats.value = await getHouseDetailedStats(houseName)
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHouseStats()
})
</script>

<style scoped>
.house-stats-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  padding: 2rem 1rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: translateX(-2px);
}

.house-title h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
}

.house-motto {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.house-level-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.level-badge {
  display: inline-block;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.level-name {
  font-size: 2rem;
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.xp-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.xp-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s ease;
}

.xp-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #6c757d;
}

.max-level {
  color: #28a745 !important;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.stat-content h3 {
  font-size: 1.8rem;
  margin: 0;
  color: #2c3e50;
}

.stat-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.members-ranking {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.members-ranking h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.member-item:hover {
  background: #f8f9fa;
}

.top-member {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 2px solid #f39c12;
}

.member-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

.rank-number {
  font-weight: bold;
  font-size: 1.2rem;
  color: #2c3e50;
}

.pi-crown.gold { color: #f1c40f; }
.pi-medal.silver { color: #95a5a6; }
.pi-medal.bronze { color: #e67e22; }

.member-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.member-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.streak {
  color: #e74c3c;
  font-weight: bold;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #6c757d;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .house-title h1 {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .member-details {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
