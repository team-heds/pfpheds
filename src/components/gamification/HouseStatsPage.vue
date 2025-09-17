<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="house-stats-page">
    <!-- Bandeau de la maison -->
    <div class="house-banner" >
      <div class="house-banner-content">
        <div class="house-display">
          <div class="house-image-container">
            <img :src="houseBackgroundImage" :alt="houseInfo?.name" class="house-image" />
          </div>
          <div class="house-text-content">
            <h1 class="house-name">{{ houseInfo?.name }}</h1>
            <p class="house-motto">"{{ houseInfo?.motto }}"</p>
            <div class="house-level-badge">
              <span class="level-text">Niveau {{ houseStats?.houseLevel?.niveau || 1 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-header">
      <div class="header-content">
        <Button class="back-btn" @click="$router.go(-1)">
          <i class="pi pi-arrow-left"></i>
        </Button>
        <div class="header-title-container">
          <h2 class="page-title">Statistiques de la Maison</h2>
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
          <div class="stat-icon" :style="{ backgroundColor: houseInfo?.color }">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ houseStats.totalMembers }}</h3>
            <p>Membres</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" :style="{ backgroundColor: houseInfo?.color }">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-content">
            <h3>{{ formatNumber(houseStats.averageXP) }}</h3>
            <p>XP Moyen</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" :style="{ backgroundColor: houseInfo?.color }">
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
              <h4>{{ member.displayName || `${member.prenom} ${member.nom}` }}</h4>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getHouseDetailedStats, getHouseInfo } from '@/service/hesHousesService'
import Navbar from '@/components/common/utils/Navbar.vue'

// Import des images de fond des maisons
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'

const route = useRoute()
const houseStats = ref(null)
const houseInfo = ref(null)
const loading = ref(true)

const houseName = route.params.houseName || 'harmonis'

// Configuration des images de maisons
const houseImages = {
  harmonis: FondHarmonis,
  elaris: FondElaris,
  doloris: FondDoloris,
  solencia: FondSolencia
}

// Image de fond de la maison
const houseBackgroundImage = computed(() => {
  return houseImages[houseName] || FondHarmonis
})

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
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.house-stats-page {
  width: 100%;
  position: relative;
  padding-bottom: 2rem;
}

.house-banner {
  padding: 4rem 1rem;
  color: white;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.house-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 1;
}

.house-banner-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.house-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
  width: 100%;
}

.house-image-container {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;

  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  padding: 4px;
}

.house-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.house-text-content {
  text-align: center;
  max-width: 600px;
}

.house-name {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  font-weight: bold;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}

.house-motto {
  font-size: 1.4rem;
  opacity: 0.95;
  margin: 0 0 1.5rem 0;
  font-style: italic;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: 300;
}

.house-level-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.level-text {
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.page-header {
  padding: 1.5rem 1rem;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: flex-start;
}

.back-btn {
  background: var(--surface-card);
  border: none;
  color: var(--text-color);
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: var(--surface-hover);
  transform: translateX(-2px);
}

.header-title-container {
  flex: 1;
  display: flex;
  justify-content: center;
  margin-right: 3rem; /* Compense la largeur du bouton back pour centrer parfaitement */
}

.page-title {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.house-level-card {
  background: var(--surface-card);
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
  color: white;
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
  color: white;
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
  background: var(--surface-card);
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.stat-content h3 {
  font-size: 1.8rem;
  margin: 0;
  color: white;
}

.stat-content p {
  margin: 0;
  color: white;
  font-size: 0.9rem;
}

.members-ranking {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.members-ranking h2 {
  margin: 0 0 1.5rem 0;
  color: white;
}

.member-item {
  display: flex;
  background: var(--surface-hover);
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.member-item:hover {
  background: var(--surface-card);
}

.top-member {
  background: var(--surface-hover);
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
  color: white;
}

.pi-crown.gold { color: #f1c40f; }
.pi-medal.silver { color: #95a5a6; }
.pi-medal.bronze { color: #e67e22; }

.member-info h4 {
  margin: 0 0 0.5rem 0;
  color: white;
}

.member-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: white;
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
  color: white;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
}


@media (max-width: 768px) {
  .house-banner {
    padding: 3rem 1rem;
    min-height: 250px;
  }
  
  .house-banner-content {
    max-width: 100%;
  }
  
  .house-display {
    gap: 1.5rem;
  }
  
  .house-image-container {
    width: 120px;
    height: 120px;
    border: 4px solid rgba(255, 255, 255, 0.4);
  }
  
  .house-name {
    font-size: 2.5rem;
    letter-spacing: 1px;
  }
  
  .house-motto {
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
  }
  
  .house-level-badge {
    padding: 0.6rem 1.5rem;
    font-size: 1rem;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .header-title-container {
    margin-right: 2rem;
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
