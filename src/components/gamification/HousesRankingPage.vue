<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="houses-ranking-page mt-5" style="--house-color: #f4c300; --house-foreground: #172033;">
    <GamificationPageHeader
      title="Classement des maisons"
      description="Comparez la progression collective et découvrez la dynamique de chaque maison."
      eyebrow="Progression collective"
      icon="pi pi-crown"
      @back="$router.go(-1)"
    >
      <template #actions>
        <Button
          class="refresh-btn"
          aria-label="Actualiser le classement"
          title="Actualiser"
          @click="refreshRanking"
          :disabled="loading"
        >
          <i class="pi pi-refresh" :class="{ 'pi-spin': loading }" aria-hidden="true"></i>
        </Button>
      </template>
    </GamificationPageHeader>

    <div class="ranking-container" v-if="housesRanking?.ranking.length">
      <section v-if="errorState.hasError" class="ranking-refresh-error" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div><h2>Le classement n’a pas pu être actualisé</h2><p>Le dernier classement disponible reste affiché. Sa date de mise à jour est conservée.</p></div>
        <Button label="Réessayer" icon="pi pi-refresh" :disabled="loading" @click="refreshRanking" />
      </section>
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
      <h2 class="sr-only">Podium des maisons</h2>
      <div class="podium">
        <div 
          v-for="(house, index) in housesRanking.ranking.slice(0, 3)" 
          :key="house.name"
          class="podium-item"
          :class="`position-${house.position}`"
          :style="{ '--house-color': house.color, '--house-foreground': getReadableTextColor(house.color) }"
        >
          <div class="podium-rank">
            <i v-if="house.position === 1" class="pi pi-crown gold"></i>
            <i v-else-if="house.position === 2" class="pi pi-medal silver"></i>
            <i v-else-if="house.position === 3" class="pi pi-medal bronze"></i>
            <span class="rank-number">#{{ house.position }}</span>
          </div>
          
          <div
            class="house-card"
            role="button"
            tabindex="0"
            :aria-label="`Voir le détail de la maison ${house.displayName}`"
            @click="viewHouseDetails(house.name)"
            @keydown.enter="viewHouseDetails(house.name)"
            @keydown.space.prevent="viewHouseDetails(house.name)"
          >
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
                <i class="pi pi-verified" aria-hidden="true"></i> Niveau maximum atteint
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
            role="button"
            tabindex="0"
            :aria-label="`Voir le détail de la maison ${house.displayName}`"
            @click="viewHouseDetails(house.name)"
            @keydown.enter="viewHouseDetails(house.name)"
            @keydown.space.prevent="viewHouseDetails(house.name)"
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

    <!-- État d'erreur -->
    <div v-else-if="errorState.hasError" class="error-state" role="alert">
      <div class="error-content">
        <i class="pi pi-exclamation-circle"></i>
        <h2>{{ errorState.message }}</h2>
        <Button 
          v-if="errorState.canRetry" 
          @click="refreshRanking"
          :disabled="loading"
          label="Réessayer" 
          icon="pi pi-refresh"
          class="p-button-outlined"
        />
      </div>
    </div>

    <!-- Skeleton loader pendant le chargement initial -->
    <div v-else-if="loading" class="skeleton-container" role="status" aria-label="Chargement du classement" aria-busy="true">
      <div class="skeleton-stats">
        <Skeleton height="50px" class="mb-3" />
      </div>
      <div class="skeleton-podium">
        <Skeleton height="300px" class="mb-3" v-for="i in 3" :key="i" />
      </div>
      <Skeleton height="400px" />
    </div>

    <div v-else class="ranking-empty" role="status">
      <i class="pi pi-users" aria-hidden="true"></i>
      <h2>Aucun classement disponible</h2>
      <p>Les maisons apparaîtront ici dès qu’un classement sera disponible.</p>
      <Button label="Actualiser" icon="pi pi-refresh" @click="refreshRanking" />
    </div>

    
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { getReadableTextColor } from '@/utils/colorContrast'

const router = useRouter()
const toast = useToast()
const housesRanking = ref(null)
const loading = ref(false)
const errorState = ref({ hasError: false, message: '', canRetry: true })
const justRefreshed = ref(false)
let loadGeneration = 0

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
  if (!Number.isFinite(date.getTime())) return 'à une date indisponible'
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffMinutes < 1) return 'à l\'instant'
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`
  if (diffMinutes < 1440) return `il y a ${Math.floor(diffMinutes / 60)}h`
  return `il y a ${Math.floor(diffMinutes / 1440)} jour(s)`
}

// Returned by the service from the canonical house-level thresholds.
const calculateProgress = (house) => {
  if (house.level >= 20) return 100
  if (house.xpToNext <= 0) return 100
  return Math.min(100, Math.max(0, Number(house.progressPercent) || 0))
}

// Navigation vers les détails d'une maison
const viewHouseDetails = (houseName) => {
  router.push(`/houses/${houseName}/stats`)
}

// Cache localStorage
const CACHE_KEY = 'houses_ranking'
const CACHE_DURATION = 10 * 1000 // 10 secondes (rafraîchissement plus fréquent)

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp, version } = JSON.parse(cached)
    const now = Date.now()
    if (version !== 2 || !Array.isArray(data?.ranking) || !Number.isFinite(timestamp)
      || !data.ranking.every(house => house && typeof house.name === 'string' && Number.isFinite(house.progressPercent))) return null
    
    if (now >= timestamp && now - timestamp < CACHE_DURATION) {
      console.log('📦 Chargement du classement depuis le cache')
      return data
    } else {
      console.log('⏰ Cache du classement expiré')
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  } catch (err) {
    console.error('❌ Erreur lecture cache classement:', err)
    return null
  }
}

const saveToCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: 2,
      data,
      timestamp: Date.now()
    }))
    console.log('💾 Classement sauvegardé dans le cache')
  } catch (err) {
    console.error('❌ Erreur sauvegarde cache classement:', err)
  }
}

// Actualisation du classement
const refreshRanking = async () => {
  if (loading.value) return
  justRefreshed.value = true
  try { localStorage.removeItem(CACHE_KEY) } catch { /* The network refresh still works without browser storage. */ }
  await loadRanking()
}

// Chargement des données depuis Supabase
const loadRanking = async () => {
  const generation = ++loadGeneration
  const manualRefresh = justRefreshed.value
  try {
    loading.value = true
    errorState.value = { hasError: false, message: '', canRetry: true }
    
    // Charger depuis le cache d'abord (sauf si refresh manuel)
    if (!justRefreshed.value) {
      const cachedData = loadFromCache()
      if (cachedData) {
        housesRanking.value = cachedData
        loading.value = false
        return
      }
    }
    
    console.log('🔄 Chargement du classement des maisons depuis Supabase...')
    const ranking = await gamificationServiceSupabase.getHousesRanking()
    if (generation !== loadGeneration) return
    if (!Array.isArray(ranking?.ranking)) throw new Error('Invalid house ranking response')
    housesRanking.value = ranking
    
    // Sauvegarder dans le cache
    saveToCache(ranking)
    
    console.log('✅ Classement chargé:', ranking)
    
    // Afficher un toast de succès si c'est un refresh
    if (manualRefresh) {
      toast.add({
        severity: 'success',
        summary: 'Mis à jour !',
        detail: 'Le classement a été actualisé',
        life: 3000
      })
      justRefreshed.value = false
    }
  } catch (error) {
    if (generation !== loadGeneration) return
    console.error('❌ Erreur lors du chargement du classement:', error)
    
    errorState.value = {
      hasError: true,
      message: 'Impossible de charger le classement. Veuillez réessayer.',
      canRetry: true
    }
    
    // Toast d'erreur
    toast.add({
      severity: 'error',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger le classement des maisons',
      life: 5000
    })
    
    // Keep genuine previous data and its timestamp; a failure is never a zero ranking.
  } finally {
    if (generation === loadGeneration) {
      loading.value = false
      justRefreshed.value = false
    }
  }
}

onMounted(() => {
  loadRanking()
})
onUnmounted(() => { loadGeneration += 1 })
</script>

<style scoped>
/* Page wrapper pour le scroll - même structure que GamificationProfilePage et HouseStatsPage */
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  /* Masquer la scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

/* Masquer la scrollbar pour WebKit (Chrome, Safari, Edge) */
.page-wrapper::-webkit-scrollbar {
  display: none;
}

.houses-ranking-page {
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 2rem;
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
  width: 44px;
  min-width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover, .refresh-btn:hover {
  background: var(--surface-hover);
}

.back-btn:focus-visible,
.refresh-btn:focus-visible,
.house-card:focus-visible,
.ranking-item:focus-visible {
  outline: 3px solid #f1c40f;
  outline-offset: 3px;
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
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1rem;
}

.refresh-btn {
  display: grid;
  width: 44px;
  min-width: 44px;
  height: 44px;
  place-items: center;
  color: #172033;
  background: #f4c300;
  border: 0;
  border-radius: 0.75rem;
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
  color: var(--house-foreground);
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
  color: var(--house-foreground);
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

/* État d'erreur */
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  text-align: center;
  background: var(--surface-card);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.error-content i {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-content h2 {
  color: var(--text-color);
  margin-bottom: 2rem;
}

.ranking-refresh-error {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
}
.ranking-refresh-error > i { color: var(--primary-color); font-size: 1.5rem; }
.ranking-refresh-error > div { flex: 1 1 16rem; min-width: 0; }
.ranking-refresh-error h2 { margin: 0 0 .4rem; color: var(--text-color); font-size: 1.15rem; }
.ranking-refresh-error p { margin: 0; line-height: 1.5; color: var(--text-color-secondary); }
.ranking-empty { padding: 3rem 1.5rem; text-align: center; color: var(--text-color); }
.ranking-empty > i { font-size: 2rem; color: var(--primary-color); }
.ranking-empty h2 { margin: 1rem 0 .75rem; font-size: 1.5rem; }
.ranking-empty p { margin: 0 auto 1.5rem; max-width: 36rem; color: var(--text-color-secondary); line-height: 1.5; }

/* Skeleton loaders */
.skeleton-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem 1rem;
}

.skeleton-stats {
  margin-bottom: 2rem;
}

.skeleton-podium {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
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
