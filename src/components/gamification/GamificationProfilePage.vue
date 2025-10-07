<template>
  <Navbar />
  
  <div class="min-h-screen flex relative lg:static">
    <div class="min-h-screen flex flex-column relative flex-auto profile-center-scrollable">
      <div class="gamification-profile-page" :style="{ '--house-color': houseColor }">
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Chargement de votre profil...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="pi pi-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <Button @click="loadUserStats" class="retry-btn">
          <i class="pi pi-refresh"></i>
          Réessayer
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="userStats" class="profile-content">
      
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-banner-wrapper">
          <div class="profile-banner" :style="{ backgroundImage: `url(${houseBackgroundImage})` }">
            <div class="profile-info">

            
            <!-- Nom avec effet brillant -->
            <div class="user-name-container">
              <h1 class="user-name-fancy">{{ userStats.displayName || userStats.nom || userStats.prenom || 'Utilisateur' }}</h1>
              <div class="name-shine"></div>
            </div>
            
            <!-- Cartes d'informations flottantes -->
            <div class="info-cards">
              <div class="info-card house-card" v-if="userStats.maison">
                <div class="card-icon">
                  <i class="pi pi-home"></i>
                </div>
                <div class="card-content">
                  <span class="card-label">Maison</span>
                  <span class="card-value">{{ userStats.maison }}</span>
                </div>
              </div>
              
              <div class="info-card level-card">
                <div class="card-icon">
                  <i class="pi pi-star"></i>
                </div>
                <div class="card-content">
                  <span class="card-label">Niveau</span>
                  <span class="card-value">{{ userStats.niveau || 1 }}</span>
                </div>
              </div>
              
              <div class="info-card xp-card">
                <div class="card-icon">
                  <i class="pi pi-bolt"></i>
                </div>
                <div class="card-content">
                  <span class="card-label">XP Total</span>
                  <span class="card-value">{{ formatNumber(userStats.xp || 0) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Particules décoratives -->
            <div class="floating-particles">
              <div class="particle" v-for="i in 6" :key="i" :style="{ '--delay': i * 0.5 + 's' }"></div>
            </div>
            
            <!-- Quick Stats -->
            
          </div>
        </div>
      </div>
      </div>

      <!-- Page header aligned with HouseStatsPage -->
      <div class="page-header">
        <div class="header-content">
          <button class="back-btn" @click="goBack">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div class="header-title-container">
            <h2 class="page-title">Mon Profil Gamification</h2>
          </div>
        </div>
      </div>

      <!-- Section principale, calquée sur HouseStatsPage -->
      <div class="stats-container">
        <!-- Carte niveau/progression (style house-level-card) -->
        <div class="house-level-card">
          <div class="level-info">
            <div class="level-badge" :style="{ backgroundColor: houseColor }">
              Niveau {{ userStats.niveau || 1 }}
            </div>
            <h2 class="level-name">Progression du Niveau</h2>
            <div class="xp-progress">
              <div class="xp-bar">
                <div 
                  class="xp-fill" 
                  :style="{ 
                    width: `${xpProgress}%`, 
                    backgroundColor: houseColor 
                  }"
                ></div>
              </div>
              <div class="xp-text">
                <span>{{ formatNumber(userStats.xp || 0) }} XP</span>
                <span>{{ formatNumber(getNextLevelXP(userStats.niveau || 1)) }} XP pour le niveau suivant</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques générales (grille 3 colonnes) -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-star"></i>
            </div>
            <div class="stat-content">
              <h3>{{ formatNumber(userStats.xp || 0) }}</h3>
              <p>XP Total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.streak || 0 }}</h3>
              <p>Série Actuelle</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-fire"></i>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.streakMax || 0 }}</h3>
              <p>Meilleure Série</p>
            </div>
          </div>
        </div>

        <!-- Outils de création
        <CreationToolsCard :userCreationStats="userCreationStats" />

        -->

        <!-- Prochaines quêtes / défis -->
        <div class="members-ranking">
          <div class="card-header">
            <h3><i class="pi pi-flag"></i> Prochaines Quêtes & Défis</h3>
            <span class="count-chip">{{ upcomingLimited.length }}</span>
          </div>
          <div class="table-container" v-if="upcomingLimited.length">
            <table class="data-table">
              <thead>
              <tr>
                <th>Défi</th>
                <th>Objectif</th>
                <th>Récompense</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(q, i) in upcomingLimited" :key="q.id || i">
                <td>{{ q.title || q.name }}</td>
                <td>{{ q.goal || q.description || '-' }}</td>
                <td>{{ q.reward ? `${formatNumber(q.reward)} XP` : '-' }}</td>
                <td>{{ q.deadline ? new Date(q.deadline).toLocaleDateString() : '-' }}</td>
                <td>
                  <span class="status-pill"
                        :class="{
                          completed: challengeStatus(q) === 'validé',
                          missed: challengeStatus(q) === 'loupé',
                          inprogress: challengeStatus(q) === 'en cours'
                        }">
                    <i class="pi" :class="challengeStatus(q) === 'validé' ? 'pi-check-circle' : (challengeStatus(q) === 'loupé' ? 'pi-times-circle' : 'pi-clock')"></i>
                    {{ challengeStatus(q) }}
                  </span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun défi planifié pour le moment.</p>
          </div>
        </div>

        <!-- Badges -->
        <div class="members-ranking">
          <div class="card-header">
            <h3><i class="pi pi-shield"></i> Mes Badges</h3>
            <div class="badge-stats">
              <span class="count-chip">{{ userBadges.length }}/{{ totalBadges }}</span>
              <span class="completion-chip" :style="{ backgroundColor: houseColor }">
                {{ badgeCompletionPercentage }}% complété
              </span>
            </div>
          </div>
          <!-- Badge Statistics -->
          <div class="badge-summary" v-if="userBadges.length > 0">
            <div class="badge-rarity-stats">
              <div v-for="(count, rarity) in badgesByRarity" :key="rarity" 
                   class="rarity-stat" :class="`rarity-${rarity}`">
                <span class="rarity-count">{{ count }}</span>
                <span class="rarity-label">{{ getRarityName(rarity) }}</span>
              </div>
            </div>
            <div class="total-xp-from-badges">
              <i class="pi pi-star-fill"></i>
              <span>{{ formatNumber(totalXPFromBadges) }} XP des badges</span>
            </div>
          </div>
          
          <!-- Badges Grid -->
          <div v-if="userBadges.length > 0" class="modern-badge-grid">
            <BadgeCard
              v-for="badge in displayedBadges"
              :key="badge.id"
              :badge="badge"
              :is-unlocked="true"
              :is-newly-unlocked="isNewlyUnlocked(badge)"
              @click="showBadgeDetails(badge)"
            />
          </div>
          
          <!-- Show More Button -->
          <div v-if="userBadges.length > displayLimit" class="show-more-section">
            <Button 
              @click="showAllBadges = !showAllBadges" 
              class="show-more-btn"
              :style="{ backgroundColor: houseColor }"
            >
              <i class="pi" :class="showAllBadges ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
              {{ showAllBadges ? 'Voir moins' : `Voir tous (${userBadges.length - displayLimit} de plus)` }}
            </Button>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun badge pour l’instant.</p>
          </div>
        </div>

        <!-- Achievements / Hauts faits -->
        <div class="members-ranking">
          <div class="card-header">
            <h3><i class="pi pi-trophy"></i> Mes Hauts Faits</h3>
            <span class="count-chip">{{ achievementsLimited.length }}</span>
          </div>
          <div class="table-container" v-if="achievementsLimited.length">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Haut fait</th>
                  <th>Statut</th>
                  <th>XP</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, i) in achievementsLimited" :key="a.id || i">
                  <td>{{ a.title || a.name }}</td>
                  <td>
                    <span class="status-pill" :class="a.completed ? 'completed' : 'inprogress'">
                      {{ a.completed ? 'Complété' : 'En cours' }}
                    </span>
                  </td>
                  <td>{{ a.xp ? formatNumber(a.xp) : '-' }}</td>
                  <td>{{ a.date ? new Date(a.date).toLocaleDateString() : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun haut fait enregistré.</p>
          </div>
        </div>
      </div>
      
      <!-- Défis Hebdomadaires -->
      <div class="members-ranking">
        <div class="card-header">
          <h3><i class="pi pi-flag"></i> Défis de la Semaine</h3>
          <div class="challenge-stats">
            <span class="count-chip">{{ completedChallengesCount }}/{{ activeChallenges.length }}</span>
            <span class="completion-chip" :style="{ backgroundColor: houseColor }">
              {{ challengeCompletionRate }}% complété
            </span>
          </div>
        </div>
        
        <!-- Challenge Statistics -->
        <div class="challenge-summary" v-if="challengeStats.totalCompleted > 0">
          <div class="challenge-overview-stats">
            <div class="stat-item">
              <i class="pi pi-trophy"></i>
              <span>{{ challengeStats.totalCompleted }} défis complétés</span>
            </div>
            <div class="stat-item">
              <i class="pi pi-star-fill"></i>
              <span>{{ formatNumber(challengeStats.totalXPFromChallenges) }} XP des défis</span>
            </div>
          </div>
        </div>
        
        <!-- Challenges Grid -->
        <div v-if="activeChallenges.length > 0" class="modern-challenge-grid">
          <ChallengeCard
            v-for="challenge in displayedChallenges"
            :key="challenge.id"
            :challenge="challenge"
            :house-color="houseColor"
            @click="showChallengeDetails(challenge)"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="activeChallenges.length > challengeDisplayLimit" class="show-more-section">
          <Button 
            @click="showAllChallenges = !showAllChallenges" 
            class="show-more-btn"
            :style="{ backgroundColor: houseColor }"
          >
            <i class="pi" :class="showAllChallenges ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            {{ showAllChallenges ? 'Voir moins' : `Voir tous les défis (${activeChallenges.length})` }}
          </Button>
        </div>
        
        <!-- Empty State -->
        <div v-if="activeChallenges.length === 0" class="empty-badge-state">
          <div class="empty-badge-icon">🎯</div>
          <h4>Aucun défi actif</h4>
          <p>Les nouveaux défis arrivent chaque lundi !</p>
          <Button 
            @click="router.push('/challenges')" 
            class="check-challenges-btn"
            :style="{ backgroundColor: houseColor }"
          >
            <i class="pi pi-external-link"></i>
            Voir tous les défis
          </Button>
        </div>
      </div>
      
      <!-- Quêtes Dynamiques -->
      <div class="members-ranking">
        <div class="card-header">
          <h3><i class="pi pi-compass"></i> Mes Quêtes</h3>
          <div class="quest-stats">
            <span class="count-chip">{{ completedQuestsCount }}/{{ activeQuests.length }}</span>
            <span class="completion-chip" :style="{ backgroundColor: houseColor }">
              {{ questCompletionRate }}% complété
            </span>
          </div>
        </div>
        
        <!-- Quest Statistics -->
        <div class="quest-summary" v-if="questStats.totalCompleted > 0">
          <div class="quest-overview-stats">
            <div class="stat-item">
              <i class="pi pi-check-circle"></i>
              <span>{{ questStats.totalCompleted }} quêtes complétées</span>
            </div>
            <div class="stat-item">
              <i class="pi pi-star-fill"></i>
              <span>{{ formatNumber(totalXPFromQuests) }} XP des quêtes</span>
            </div>
          </div>
        </div>
        
        <!-- Quests Grid -->
        <div v-if="activeQuests.length > 0" class="modern-quest-grid">
          <QuestCard
            v-for="quest in displayedQuests"
            :key="quest.id"
            :quest="quest"
            :house-color="houseColor"
            @click="showQuestDetails(quest)"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="activeQuests.length > questDisplayLimit" class="show-more-section">
          <Button 
            @click="showAllQuests = !showAllQuests" 
            class="show-more-btn"
            :style="{ backgroundColor: houseColor }"
          >
            <i class="pi" :class="showAllQuests ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            {{ showAllQuests ? 'Voir moins' : `Voir toutes les quêtes (${activeQuests.length})` }}
          </Button>
        </div>
        
        <!-- Empty State -->
        <div v-if="activeQuests.length === 0" class="empty-badge-state">
          <div class="empty-badge-icon">🗺️</div>
          <h4>Aucune quête active</h4>
          <p>Explorez de nouvelles aventures et débloquez des quêtes !</p>
          <Button 
            @click="router.push('/quests')" 
            class="check-quests-btn"
            :style="{ backgroundColor: houseColor }"
          >
            <i class="pi pi-external-link"></i>
            Voir toutes les quêtes
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Section de test pour forcer le scroll -->
    <div class="test-scroll-section" v-if="userStats">
      <div class="scroll-spacer"></div>
    </div>
    
      </div>
    </div>
  </div>

  <!-- Achievement Notification -->
  <AchievementNotification
    v-if="showNotification && currentNotification"
    :badge="currentNotification"
    @close="onNotificationClose"
  />

  <!-- Detail Modal -->
  <DetailModal
    v-model="showDetailModal"
    :type="modalType"
    :item="modalItem"
    @start="handleStart"
  />

  <!-- Toast Notification -->
  <GamificationToast
    v-model="showToast"
    :type="toastData.type"
    :title="toastData.title"
    :message="toastData.message"
    :xp="toastData.xp"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase.js'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import levelsConfig from '@/config/levelsConfig'
import Navbar from '@/components/common/utils/Navbar.vue'
import BadgeCard from '@/components/gamification/BadgeCard.vue'
import ChallengeCard from '@/components/gamification/ChallengeCard.vue'
import QuestCard from '@/components/gamification/QuestCard.vue'
import AchievementNotification from '@/components/gamification/AchievementNotification.vue'
import CreationToolsCard from '@/components/gamification/CreationToolsCard.vue'
import DetailModal from '@/components/gamification/DetailModal.vue'
import GamificationToast from '@/components/gamification/GamificationToast.vue'
// Background images per house (align with HouseStatsPage)
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'

// Router and auth
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const error = ref(null)
const userStats = ref(null)
let unsubscribeDefis = null

// Badge system state
const userBadges = ref([])
const allBadges = ref([])
const showAllBadges = ref(false)
const displayLimit = ref(6)
const newlyUnlockedBadges = ref(new Set())
const showNotification = ref(false)
const currentNotification = ref(null)

// Challenge system state
const activeChallenges = ref([])
const challengeStats = ref({})
const showAllChallenges = ref(false)
const challengeDisplayLimit = ref(3)

// Quest system state
const activeQuests = ref([])
const questStats = ref({})
const showAllQuests = ref(false)
const questDisplayLimit = ref(3)

// Creation tools stats
const userCreationStats = ref({
  questsCreated: 0,
  challengesCreated: 0,
  totalEngagement: 0
})

// House configuration
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#2E8B57' }, // Vert - "L'équilibre soigne"
  'Elaris': { name: 'Elaris', color: '#DC143C' }, // Rouge - "Clarifier, guider, apaiser"
  'Doloris': { name: 'Doloris', color: '#FFD700' }, // Jaune/Or - "Comprendre la douleur, c'est soigner"
  'Solencia': { name: 'Solencia', color: '#4169E1' } // Bleu - "Apaiser pour mieux guérir"
}

// Computed properties
const normalizeHouse = (val) => {
  if (!val) return null
  const s = String(val).trim().toLowerCase()
  if (s.startsWith('harm')) return 'Harmonis'
  if (s.startsWith('ela')) return 'Elaris'
  if (s.startsWith('dol')) return 'Doloris'
  if (s.startsWith('sol')) return 'Solencia'
  return null
}

const houseColor = computed(() => {
  const h = normalizeHouse(userStats.value?.maison)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})

// Calcul automatique du niveau basé sur l'XP (nouveau système 20 niveaux)
const calculateLevel = (totalXP) => {
  return levelsConfig.getLevelFromXP(totalXP)
}

const calculateXPToNext = (currentLevel, currentXP) => {
  return levelsConfig.getXPToNextLevel(currentLevel, currentXP)
}

const getLevelProgress = (currentLevel, currentXP) => {
  return levelsConfig.getLevelProgress(currentLevel, currentXP)
}

const getLevelInfo = (level) => {
  return levelsConfig.getLevelInfo(level)
}

const updateLevelFromXP = async (newTotalXP) => {
  if (!userStats.value) return
  
  const newLevel = calculateLevel(newTotalXP)
  const oldLevel = userStats.value.niveau
  const levelInfo = getLevelInfo(newLevel)
  
  // Si niveau a changé, mettre à jour la base de données
  if (newLevel !== oldLevel) {
    console.log(`🎉 NIVEAU UP ! ${oldLevel} (${getLevelInfo(oldLevel).name}) → ${newLevel} (${levelInfo.name})`)
    
    try {
      // Mettre à jour dans Supabase
      const { error } = await supabase
        .from('gamification_data')
        .update({ 
          current_level: newLevel,
          total_xp: newTotalXP
        })
        .eq('user_id', authStore.user.id)
      
      if (error) {
        console.error('Erreur mise à jour niveau:', error)
      } else {
        // Mettre à jour localement
        userStats.value.niveau = newLevel
        userStats.value.xp = newTotalXP
        userStats.value.xpToNext = calculateXPToNext(newLevel, newTotalXP)
        
        // Vérifier si c'est un palier (5, 10, 15, 20)
        const isPalierLevel = levelsConfig.isPalier(newLevel)
        
        // Afficher notification
        showToast.value = true
        toastData.value = {
          type: 'levelup',
          title: isPalierLevel ? `🎊 PALIER ${newLevel} ATTEINT !` : 'Niveau Supérieur !',
          message: `Tu es maintenant ${levelInfo.name} (niveau ${newLevel}) !`,
          xp: isPalierLevel ? levelInfo.palierBonus : 0
        }
        
        // Si c'est un palier, ajouter les points à la maison
        if (isPalierLevel && levelInfo.palierBonus && userStats.value.maison) {
          await addHousePoints(userStats.value.maison, levelInfo.palierBonus)
          console.log(`✨ +${levelInfo.palierBonus} points pour ${userStats.value.maison} !`)
        }
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }
}

const addHousePoints = async (houseName, points) => {
  try {
    // Récupérer la maison
    const { data: house, error: fetchError } = await supabase
      .from('houses')
      .select('*')
      .eq('name', houseName)
      .single()
    
    if (fetchError || !house) {
      console.error('Erreur récupération maison:', fetchError)
      return
    }
    
    const newTotalXP = (house.total_xp || 0) + points
    const oldLevel = house.level || 1
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newTotalXP / 10000)) + 1)
    
    // Ajouter les points XP (le trigger mettra à jour le niveau automatiquement)
    const { error: updateError } = await supabase
      .from('houses')
      .update({ 
        total_xp: newTotalXP
      })
      .eq('name', houseName)
    
    if (updateError) {
      console.error('Erreur ajout XP maison:', updateError)
    } else {
      console.log(`✅ +${points} XP ajoutés à ${houseName} (Total: ${newTotalXP} XP)`)
      
      // Si la maison a changé de niveau
      if (newLevel > oldLevel) {
        console.log(`🏆 ${houseName} est passée au niveau ${newLevel} !`)
        
        // Notification optionnelle pour toute la maison
        showToast.value = true
        toastData.value = {
          type: 'success',
          title: `🏆 ${houseName} niveau ${newLevel} !`,
          message: `Votre maison progresse grâce à vous !`,
          xp: 0
        }
      }
    }
  } catch (err) {
    console.error('Erreur addHousePoints:', err)
  }
}

// Map background image by normalized house
const houseImages = {
  harmonis: FondHarmonis,
  elaris: FondElaris,
  doloris: FondDoloris,
  solencia: FondSolencia
}

const houseBackgroundImage = computed(() => {
  const h = normalizeHouse(userStats.value?.maison)
  const key = (h || 'Harmonis').toLowerCase()
  return houseImages[key] || FondHarmonis
})

const xpProgress = computed(() => {
  if (!userStats.value) return 0
  const currentXP = userStats.value.xp || 0
  const nextLevelXP = getNextLevelXP(userStats.value.niveau || 1)
  const currentLevelXP = getCurrentLevelXP(userStats.value.niveau || 1)
  return Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
})

// Collections (safe fallbacks)
const badges = computed(() => userStats.value?.badges || [])
const achievements = computed(() => userStats.value?.achievements || [])
const upcoming = computed(() => userStats.value?.upcomingChallenges || userStats.value?.upcoming || [])

// Limited views (10 max)
const badgesLimited = computed(() => {
  const arr = [...badges.value]
  arr.sort((a, b) => new Date(b.date || b.earnedAt || b.createdAt || 0) - new Date(a.date || a.earnedAt || a.createdAt || 0))
  return arr.slice(0, 10)
})

const achievementsLimited = computed(() => {
  const arr = [...achievements.value]
  arr.sort((a, b) => new Date(b.date || b.completedAt || b.createdAt || 0) - new Date(a.date || a.completedAt || a.createdAt || 0))
  return arr.slice(0, 10)
})

const upcomingLimited = computed(() => {
  const arr = [...upcoming.value]
  arr.sort((a, b) => new Date(a.deadline || Infinity) - new Date(b.deadline || Infinity))
  return arr.slice(0, 10)
})

// Badge system computed properties
const totalBadges = computed(() => allBadges.value.length)

const badgeCompletionPercentage = computed(() => {
  if (totalBadges.value === 0) return 0
  return Math.round((userBadges.value.length / totalBadges.value) * 100)
})

const badgesByRarity = computed(() => {
  const rarityCount = { common: 0, rare: 0, epic: 0, legendary: 0 }
  userBadges.value.forEach(badge => {
    if (rarityCount.hasOwnProperty(badge.rarity)) {
      rarityCount[badge.rarity]++
    }
  })
  return rarityCount
})

const totalXPFromBadges = computed(() => {
  return userBadges.value.reduce((total, badge) => total + (badge.xpBonus || 0), 0)
})

const displayedBadges = computed(() => {
  if (showAllBadges.value) return userBadges.value
  return userBadges.value.slice(0, displayLimit.value)
})

const lockedBadges = computed(() => {
  const unlockedIds = new Set(userBadges.value.map(b => b.id))
  return allBadges.value.filter(badge => !unlockedIds.has(badge.id))
})

// Challenge system computed properties
const displayedChallenges = computed(() => {
  if (showAllChallenges.value) return activeChallenges.value
  return activeChallenges.value.slice(0, challengeDisplayLimit.value)
})

const completedChallengesCount = computed(() => {
  return activeChallenges.value.filter(c => c.completed).length
})

const challengeCompletionRate = computed(() => {
  if (activeChallenges.value.length === 0) return 0
  return Math.round((completedChallengesCount.value / activeChallenges.value.length) * 100)
})

// Quest system computed properties
const displayedQuests = computed(() => {
  if (showAllQuests.value) return activeQuests.value
  return activeQuests.value.slice(0, questDisplayLimit.value)
})

const completedQuestsCount = computed(() => {
  return activeQuests.value.filter(q => q.status === 'completed').length
})

const questCompletionRate = computed(() => {
  if (activeQuests.value.length === 0) return 0
  return Math.round((completedQuestsCount.value / activeQuests.value.length) * 100)
})

const totalXPFromQuests = computed(() => {
  return questStats.value.totalXPFromQuests || 0
})

// Helper: status for a challenge
const challengeStatus = (q) => {
  if (q?.completed || q?.status === 'completed') return 'validé'
  const now = new Date()
  const deadline = q?.deadline ? new Date(q.deadline) : null
  if (q?.failed || q?.status === 'failed' || (deadline && deadline < now)) return 'loupé'
  return 'en cours'
}

// Utility functions
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const getCurrentLevelXP = (level) => {
  if (level <= 1) return 0
  return Math.floor(50 * Math.pow(1.5, level - 2))
}

const getNextLevelXP = (level) => {
  return Math.floor(50 * Math.pow(1.5, level - 1))
}

const getDaysSinceJoined = () => {
  if (!userStats.value?.joinedAt) return 0
  const joinDate = new Date(userStats.value.joinedAt)
  const today = new Date()
  const diffTime = Math.abs(today - joinDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Badge system methods
const getRarityName = (rarity) => {
  const names = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  }
  return names[rarity] || rarity
}

const isNewlyUnlocked = (badge) => {
  return newlyUnlockedBadges.value.has(badge.id)
}

// Modal and Toast states
const showDetailModal = ref(false)
const modalType = ref('badge')
const modalItem = ref(null)
const showToast = ref(false)
const toastData = ref({
  type: 'info',
  title: '',
  message: '',
  xp: 0
})

const showBadgeDetails = (badge) => {
  modalType.value = 'badge'
  modalItem.value = badge
  showDetailModal.value = true
}

const getBadgeProgressHint = (badge) => {
  // TODO: Calculer le progrès vers le déblocage du badge
  return null
}

const checkForNewBadges = async () => {
  if (!authStore.user?.id) return
  
  try {
    console.log('🔍 Vérification des nouveaux badges...')
    // TODO: Implémenter la vérification automatique des badges
    console.log('✅ Vérification badges terminée (système à implémenter)')
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des badges:', error)
  }
}

const loadBadgesData = async () => {
  if (!authStore.user?.id) return
  
  try {
    console.log('🏆 Chargement des badges depuis Supabase...')
    
    // Récupérer les badges de l'utilisateur depuis Supabase
    const { data: userBadgesData, error: userBadgesError } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', authStore.user.id)
    
    if (userBadgesError && userBadgesError.code !== 'PGRST116') {
      console.error('Erreur chargement badges utilisateur:', userBadgesError)
    }
    
    // Récupérer tous les badges disponibles
    const { data: allBadgesData, error: allBadgesError } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true })
    
    if (allBadgesError) {
      console.error('Erreur chargement badges:', allBadgesError)
    }
    
    // Formatter les données
    allBadges.value = allBadgesData || []
    
    // Formatter les badges de l'utilisateur
    if (userBadgesData && userBadgesData.length > 0) {
      userBadges.value = userBadgesData.map(ub => ({
        ...ub.badge,
        unlocked_at: ub.unlocked_at,
        progress: ub.progress || 100
      }))
    } else {
      userBadges.value = []
    }
    
    console.log(`✅ ${userBadges.value.length} badges débloqués sur ${allBadges.value.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des badges:', error)
    allBadges.value = []
    userBadges.value = []
  }
}

const onNotificationClose = () => {
  showNotification.value = false
  currentNotification.value = null
}

// Challenge system methods
const loadChallengesData = async () => {
  if (!authStore.user?.id) return
  
  try {
    console.log('🎯 Chargement des défis depuis Supabase...')
    
    // Récupérer les défis actifs (non expirés)
    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (challengesError && challengesError.code !== 'PGRST116') {
      console.error('Erreur chargement défis:', challengesError)
    }
    
    // Récupérer les progressions de l'utilisateur
    const { data: userProgressData, error: progressError } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', authStore.user.id)
    
    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Erreur chargement progression défis:', progressError)
    }
    
    // Combiner les données
    if (challengesData && challengesData.length > 0) {
      activeChallenges.value = challengesData.map(challenge => {
        const userProgress = userProgressData?.find(p => p.challenge_id === challenge.id)
        return {
          ...challenge,
          progress: userProgress?.progress || 0,
          completed: userProgress?.completed || false,
          completed_at: userProgress?.completed_at || null
        }
      })
    } else {
      activeChallenges.value = []
    }
    
    // Calculer les stats
    const completed = activeChallenges.value.filter(c => c.completed)
    challengeStats.value = {
      totalCompleted: completed.length,
      totalXPFromChallenges: completed.reduce((sum, c) => sum + (c.points || c.xp_reward || 0), 0)
    }
    
    console.log(`✅ ${activeChallenges.value.length} défis chargés (${completed.length} complétés)`)
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des défis:', error)
    activeChallenges.value = []
    challengeStats.value = { totalCompleted: 0, totalXPFromChallenges: 0 }
  }
}

const showChallengeDetails = (challenge) => {
  modalType.value = 'challenge'
  modalItem.value = challenge
  showDetailModal.value = true
}

const handleStart = ({ type, item }) => {
  showToast.value = true
  toastData.value = {
    type: type,
    title: `${type === 'challenge' ? 'Défi' : 'Quête'} commencé !`,
    message: `Tu as commencé : ${item.title}`,
    xp: 0
  }
}

// Quest system methods
const loadQuestsData = async () => {
  if (!authStore.user?.id) return
  
  try {
    console.log('🗺️ Chargement des quêtes depuis Supabase...')
    
    // Récupérer les quêtes actives
    const { data: questsData, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (questsError && questsError.code !== 'PGRST116') {
      console.error('Erreur chargement quêtes:', questsError)
    }
    
    // Récupérer les progressions de l'utilisateur
    const { data: userQuestsData, error: userQuestsError } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', authStore.user.id)
    
    if (userQuestsError && userQuestsError.code !== 'PGRST116') {
      console.error('Erreur chargement progression quêtes:', userQuestsError)
    }
    
    // Combiner les données
    if (questsData && questsData.length > 0) {
      activeQuests.value = questsData.map(quest => {
        const userQuest = userQuestsData?.find(q => q.quest_id === quest.id)
        return {
          ...quest,
          progress: userQuest?.progress || 0,
          completed: userQuest?.completed || false,
          completed_at: userQuest?.completed_at || null,
          steps_completed: userQuest?.steps_completed || 0
        }
      })
    } else {
      activeQuests.value = []
    }
    
    // Calculer les stats
    const completed = activeQuests.value.filter(q => q.completed)
    questStats.value = {
      totalCompleted: completed.length,
      totalXPFromQuests: completed.reduce((sum, q) => sum + (q.points || q.xp_reward || 0), 0)
    }
    
    console.log(`✅ ${activeQuests.value.length} quêtes chargées (${completed.length} complétées)`)
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des quêtes:', error)
    activeQuests.value = []
    questStats.value = { totalCompleted: 0, totalXPFromQuests: 0 }
  }
}

const showQuestDetails = (quest) => {
  modalType.value = 'quest'
  modalItem.value = quest
  showDetailModal.value = true
}

// Data loading - Connexion Supabase comme CardNameProfile
const loadUserStats = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Vérifier que l'utilisateur est connecté
    if (!authStore.user?.id) {
      throw new Error('Utilisateur non connecté')
    }
    
    const userId = authStore.user.id
    console.log('🔍 Chargement des stats gamification Supabase pour:', userId)
    
    // Récupérer les données de gamification depuis Supabase
    const gamificationData = await gamificationServiceSupabase.getUserGamificationData(userId)
    
    if (!gamificationData) {
      console.warn('⚠️ Aucune donnée gamification trouvée, création de données par défaut')
      userStats.value = {
        uid: userId,
        displayName: authStore.user.email?.split('@')[0] || 'Utilisateur',
        niveau: 1,
        xp: 0,
        maison: null,
        streak: 0,
        streakMax: 0
      }
      loading.value = false
      return
    }
    
    console.log('✅ Données gamification Supabase chargées:', gamificationData)
    
    // Formater le nom d'affichage
    let displayName = gamificationData.displayName || gamificationData.display_name
    if (!displayName || displayName === 'Utilisateur') {
      const email = authStore.user.email || ''
      displayName = email.split('@')[0] || 'Utilisateur'
    }
    
    // Adapter les données Supabase au format du composant
    userStats.value = {
      uid: userId,
      displayName: displayName,
      niveau: gamificationData.current_level || gamificationData.niveau || 1,
      xp: gamificationData.total_xp || gamificationData.xp || 0,
      xpToNext: gamificationData.xpToNext || gamificationData.xp_to_next || 100,
      maison: gamificationData.house_name || gamificationData.maison || null,
      loginStreak: gamificationData.loginStreak || gamificationData.login_streak || 0,
      streak: gamificationData.loginStreak || gamificationData.login_streak || 0,
      streakMax: gamificationData.streakMax || gamificationData.streak_max || 0,
      totalXP: gamificationData.totalXP || gamificationData.total_xp || 0,
      lastXPGain: gamificationData.lastXPGain || gamificationData.last_xp_gain || null,
      lastLogin: gamificationData.lastLogin || gamificationData.last_login || null,
      createdAt: gamificationData.created_at || gamificationData.createdAt || null
    }
    
    // Charger les données supplémentaires (badges, défis, quêtes)
    await Promise.all([
      loadBadgesData(),
      loadChallengesData(),
      loadQuestsData()
    ])
    
    console.log('✅ Toutes les données gamification chargées avec succès')
    
  } catch (err) {
    console.error('❌ Erreur lors du chargement des stats gamification:', err)
    error.value = err.message || 'Erreur lors du chargement des données de gamification'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// Watcher pour recalculer le niveau automatiquement quand l'XP change
watch(
  () => userStats.value?.xp,
  (newXP, oldXP) => {
    if (newXP !== undefined && newXP !== oldXP && userStats.value) {
      const expectedLevel = calculateLevel(newXP)
      if (expectedLevel !== userStats.value.niveau) {
        console.log(`🔄 XP changé: ${oldXP} → ${newXP}, recalcul du niveau...`)
        updateLevelFromXP(newXP)
      }
    }
  }
)

// Initialization
onMounted(() => {
  loadUserStats()
})

onBeforeUnmount(() => {
  if (unsubscribeDefis) {
    try { unsubscribeDefis() } catch {}
    unsubscribeDefis = null
  }
})
</script>

<style scoped>
/* ProfileView.vue structure CSS */
.profile-center-scrollable {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.gamification-profile-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  padding: 2rem;
}

/* Responsive Mobile Styles */
@media (max-width: 1200px) {
  .gamification-profile-page {
    padding: 1.5rem;
  }
}

@media (max-width: 991px) {
  .sidebar-left, .sidebar-right {
    display: none !important;
  }
  .min-h-screen.flex.relative.lg\:static {
    flex-direction: column !important;
    padding: 0;
    min-height: 0;
  }
  .min-h-screen.flex.flex-column.relative.flex-auto {
    min-height: 0;
    width: 100%;
    padding: 0;
  }
  .gamification-profile-page {
    padding: 1rem;
  }
  .flex.flex-column.flex-auto {
    width: 100% !important;
    min-width: 0;
  }
}

@media (max-width: 600px) {
  .gamification-profile-page {
    padding: 0.75rem;
  }
}

/* Loading and Error States */
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-spinner, .error-message {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-spinner i {
  font-size: 2rem;
  color: #3B82F6;
  margin-bottom: 1rem;
}

.error-message i {
  font-size: 2rem;
  color: #EF4444;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--house-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Profile Header */
.profile-header {
  margin-bottom: 1.5rem;
}

.profile-banner-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.profile-banner {
  color: white;
  padding: 4rem 0;
  border-radius: 0 0 20px 20px;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  min-height: 280px;
  display: flex;
  align-items: center;
}

.profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%);
  /* subtle tint from house color */
  box-shadow: inset 0 0 0 100vmax color-mix(in srgb, var(--house-color, #6B7280) 12%, transparent);
}

.profile-info {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1.5rem;
  width: 100%;
}

/* Avatar avec effet de halo */
.avatar-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-halo {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--house-color, #6B7280) 0%, transparent 70%);
  opacity: 0.3;
  animation: pulse-halo 3s ease-in-out infinite;
  z-index: 1;
}

.user-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 0 30px rgba(0,0,0,0.3),
    0 0 60px var(--house-color, #6B7280);
  z-index: 3;
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 
    0 0 40px rgba(0,0,0,0.4),
    0 0 80px var(--house-color, #6B7280);
}

.avatar-ring {
  position: absolute;
  width: 160px;
  height: 160px;
  border: 2px solid var(--house-color, #6B7280);
  border-radius: 50%;
  opacity: 0.6;
  animation: rotate-ring 10s linear infinite;
  z-index: 2;
}

@keyframes pulse-halo {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.1); opacity: 0.5; }
}

@keyframes rotate-ring {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.user-details {
  flex: 1;
}

/* Nom avec effet brillant */
.user-name-container {
  position: relative;
  margin: 1rem 0;
}

.user-name-fancy {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 
    0 0 20px var(--house-color, #6B7280),
    0 4px 8px rgba(0,0,0,0.3);
  margin: 0;
  position: relative;
  z-index: 2;
  background: linear-gradient(45deg, white, rgba(255,255,255,0.8));
  background-clip: text;
  -webkit-background-clip: text;
  animation: name-glow 2s ease-in-out infinite alternate;
}

.name-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shine-effect 3s ease-in-out infinite;
  z-index: 3;
}

@keyframes name-glow {
  0% { text-shadow: 0 0 20px var(--house-color, #6B7280), 0 4px 8px rgba(0,0,0,0.3); }
  100% { text-shadow: 0 0 30px var(--house-color, #6B7280), 0 4px 12px rgba(0,0,0,0.4); }
}

@keyframes shine-effect {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.user-name {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.35);
}

/* Cartes d'informations flottantes */
.info-cards {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.info-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 120px;
}

.info-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--house-color, #6B7280);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.card-icon i {
  color: white;
  font-size: 1.2rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.card-value {
  font-size: 1.1rem;
  color: white;
  font-weight: 700;
}

/* Particules décoratives */
.floating-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float-particle 6s ease-in-out infinite;
}

.particle:nth-child(1) {
  left: 10%;
  animation-delay: 0s;
  animation-duration: 6s;
}

.particle:nth-child(2) {
  left: 20%;
  animation-delay: 1s;
  animation-duration: 8s;
}

.particle:nth-child(3) {
  left: 30%;
  animation-delay: 2s;
  animation-duration: 7s;
}

.particle:nth-child(4) {
  left: 70%;
  animation-delay: 3s;
  animation-duration: 9s;
}

.particle:nth-child(5) {
  left: 80%;
  animation-delay: 4s;
  animation-duration: 6s;
}

.particle:nth-child(6) {
  left: 90%;
  animation-delay: 5s;
  animation-duration: 8s;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1);
    opacity: 0;
  }
}

.user-house {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  border: 2px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(6px);
}

.quick-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Section Content */
.section-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section-content h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

/* Progress Card */
.progress-card {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.progress-card h3 {
  margin-bottom: 1rem;
  color: white;
}

.xp-progress {
  margin-bottom: 1rem;
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

/* Supprimé - remplacé par les nouveaux styles */

/* Page Header (harmonized with HouseStatsPage) */
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
  margin-right: 3rem;
}

.page-title {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
}

/* Stats container */
.stats-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

.level-info {
  color: white;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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

/* Unified Card Styles */
.members-ranking,
.house-level-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  height: auto;
  display: flex;
  flex-direction: column;
}

.members-ranking .empty-badge-state,
.members-ranking .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 250px;
  padding: 2rem;
}

/* Adaptive responsiveness for cards */
@media (max-width: 768px) {
  .members-ranking,
  .house-level-card {
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid rgba(255,255,255,0.08);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.members-ranking h2, .members-ranking h3 {
  margin: 0 0 1.5rem 0;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header h3 {
  margin: 0;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-chip {
  background: rgba(255,255,255,0.12);
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
}

/* Badges */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.badge-item {
  background: var(--surface-hover);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.badge-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--house-color, #6B7280);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
}

.badge-title { color: white; font-weight: 600; }
.badge-desc { color: white; opacity: 0.8; font-size: 0.85rem; }
.badge-xp { color: white; font-weight: 600; }

/* Tables */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  font-weight: 600;
  color: white;
  padding: 0.75rem 0.75rem;
  border-bottom: 2px solid rgba(255,255,255,0.08);
}

.data-table tbody td {
  padding: 0.75rem 0.75rem;
  color: white;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.data-table tbody tr:hover {
  background: var(--surface-hover);
}

.status-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.status-pill.completed { 
  background: color-mix(in srgb, var(--house-color) 20%, transparent);
  color: var(--house-color);
  border: 1px solid color-mix(in srgb, var(--house-color) 40%, transparent);
}
.status-pill.inprogress { 
  background: color-mix(in srgb, var(--house-color) 10%, transparent);
  color: var(--house-color);
  border: 1px solid color-mix(in srgb, var(--house-color) 30%, transparent);
}
.status-pill.missed { 
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  opacity: 0.9;
}

.test-scroll-section {
  width: 100%;
}

.scroll-spacer {
  height: 50vh;
  background: transparent;
}

/* Membres ranking style - même que HouseStatsPage */
.card-section h2, .card-section h3 {
  margin: 0 0 1.5rem 0;
  color: white;
}

.card-section .data-table {
  width: 100%;
  border-collapse: collapse;
}

.card-section .data-table thead th {
  text-align: left;
  font-weight: 600;
  color: white;
  padding: 0.75rem;
  border-bottom: 2px solid rgba(255,255,255,0.08);
}

.card-section .data-table tbody td {
  padding: 0.75rem;
  color: white;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.card-section .data-table tbody tr:hover {
  background: var(--surface-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .quick-stats {
    justify-content: center;
  }

  .detailed-stats {
    grid-template-columns: 1fr;
  }

  .badge-grid {
    grid-template-columns: 1fr;
  }
}

/* Badge System Styles */
.badge-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.completion-chip {
  background: var(--house-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-summary {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.badge-rarity-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.rarity-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  min-width: 60px;
}

.rarity-stat.rarity-common {
  background: rgba(156, 163, 175, 0.1);
  color: #6B7280;
}

.rarity-stat.rarity-rare {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.rarity-stat.rarity-epic {
  background: rgba(147, 51, 234, 0.1);
  color: #9333EA;
}

.rarity-stat.rarity-legendary {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.rarity-count {
  font-size: 1.25rem;
  font-weight: 700;
}

.rarity-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-xp-from-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--house-color);
  font-weight: 600;
}

.modern-badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.show-more-section {
  text-align: center;
  margin: 1.5rem 0;
}

.show-more-btn {
  background: var(--house-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.empty-badge-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.check-badges-btn {
  background: var(--house-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.check-badges-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.locked-badges-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.locked-badges-section h4 {
  color: #6B7280;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.locked-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

/* Responsive adjustments for badges */
@media (max-width: 768px) {
  .badge-rarity-stats {
    justify-content: center;
  }
  
  .modern-badge-grid,
  .locked-badges-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .badge-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Styles pour les défis */
.challenge-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.challenge-summary {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.challenge-overview-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.stat-item i {
  color: var(--primary-color);
}

.modern-challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.check-challenges-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check-challenges-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Quest system styles */
.quest-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.quest-summary {
  background: rgba(0, 0, 0, 0.02);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.quest-overview-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.modern-quest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.check-quests-btn {
  background: var(--house-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.check-quests-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive pour défis et quêtes */
@media (max-width: 768px) {
  .modern-challenge-grid,
  .modern-quest-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .challenge-stats,
  .quest-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .challenge-overview-stats {
    justify-content: center;
  }
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Appliquer les animations aux cards */
.members-ranking,
.house-level-card {
  animation: fadeIn 0.6s ease-out;
  animation-fill-mode: both;
}

.members-ranking:nth-child(1) { animation-delay: 0.1s; }
.members-ranking:nth-child(2) { animation-delay: 0.2s; }
.members-ranking:nth-child(3) { animation-delay: 0.3s; }
.members-ranking:nth-child(4) { animation-delay: 0.4s; }
.members-ranking:nth-child(5) { animation-delay: 0.5s; }

/* Hover effects améliorés */
.members-ranking:hover,
.house-level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Transitions fluides */
.members-ranking,
.house-level-card,
.stat-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animation pour les badges */
.modern-badge-grid > *,
.modern-challenge-grid > *,
.modern-quest-grid > * {
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.modern-badge-grid > *:nth-child(1) { animation-delay: 0.05s; }
.modern-badge-grid > *:nth-child(2) { animation-delay: 0.1s; }
.modern-badge-grid > *:nth-child(3) { animation-delay: 0.15s; }
.modern-badge-grid > *:nth-child(4) { animation-delay: 0.2s; }
.modern-badge-grid > *:nth-child(5) { animation-delay: 0.25s; }
.modern-badge-grid > *:nth-child(6) { animation-delay: 0.3s; }

/* Loading shimmer effect */
.loading-spinner {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Smooth scroll behavior */
.profile-center-scrollable {
  scroll-behavior: smooth;
}
</style>
