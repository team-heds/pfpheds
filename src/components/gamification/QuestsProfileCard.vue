<template>
  <div class="quests-profile-card surfaces-card">
    <!-- Header -->
    <div class="card-header">
      <div class="header-left">
        <i class="pi pi-compass header-icon"></i>
        <h3>🗺️ Mes Quêtes Actives</h3>
      </div>
      <span class="quest-count-badge" :style="{ backgroundColor: houseColor }">
        {{ activeQuests.length }}
      </span>
    </div>
    
    <!-- Statistiques rapides -->
    <div class="quick-stats" v-if="activeQuests.length > 0">
      <div class="stat-item">
        <span class="stat-value">{{ completedCount }}</span>
        <span class="stat-label">Complétées</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ totalXP }}</span>
        <span class="stat-label">XP Total</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ averageProgress }}%</span>
        <span class="stat-label">Progression Moy.</span>
      </div>
    </div>
    
    <!-- Liste des quêtes -->
    <div class="quests-list" v-if="activeQuests.length > 0">
      <div 
        v-for="quest in displayedQuests" 
        :key="quest.id" 
        class="quest-item"
        @click="navigateToQuestDetails(quest)"
      >
        <div class="quest-icon" :style="{ backgroundColor: houseColor }">
          <i class="pi pi-flag"></i>
        </div>
        
        <div class="quest-info">
          <div class="quest-header">
            <h4>{{ quest.title }}</h4>
            <span class="difficulty-badge" :class="`difficulty-${quest.difficulty}`">
              {{ getDifficultyLabel(quest.difficulty) }}
            </span>
          </div>
          <p class="quest-description">{{ quest.description }}</p>
          
          <!-- Barre de progression -->
          <div class="quest-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: quest.progress + '%', backgroundColor: houseColor }"
              ></div>
            </div>
            <span class="progress-text">{{ quest.progress }}%</span>
          </div>
        </div>
        
        <div class="quest-reward">
          <div class="xp-badge" :style="{ borderColor: houseColor }">
            <i class="pi pi-star-fill"></i>
            <span>{{ quest.xp_reward || quest.points }} XP</span>
          </div>
        </div>
      </div>
      
      <!-- Bouton Voir Plus -->
      <Button 
        v-if="activeQuests.length > 3"
        @click="navigateToAllQuests"
        class="see-more-btn"
        :style="{ backgroundColor: houseColor }"
      >
        <i class="pi pi-arrow-right"></i>
        Voir toutes mes quêtes ({{ activeQuests.length }})
      </Button>
    </div>
    
    <!-- État vide -->
    <div v-else class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h4>Aucune quête active</h4>
      <p>Commence ton aventure en acceptant ta première quête !</p>
      <Button 
        @click="navigateToAllQuests"
        class="explore-btn"
        :style="{ backgroundColor: houseColor }"
      >
        <i class="pi pi-compass"></i>
        Découvrir les quêtes
      </Button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

// Props
const props = defineProps({
  userId: {
    type: String,
    default: null
  },
  houseColor: {
    type: String,
    default: '#2E8B57' // Harmonis par défaut
  }
})

// State
const activeQuests = ref([])
const loading = ref(false)
let realtimeChannel = null

// Computed
const displayedQuests = computed(() => {
  return activeQuests.value.slice(0, 3) // Afficher max 3 quêtes
})

const completedCount = computed(() => {
  return activeQuests.value.filter(q => q.completed).length
})

const totalXP = computed(() => {
  return activeQuests.value.reduce((sum, q) => sum + (q.xp_reward || q.points || 0), 0)
})

const averageProgress = computed(() => {
  if (activeQuests.value.length === 0) return 0
  const total = activeQuests.value.reduce((sum, q) => sum + (q.progress || 0), 0)
  return Math.round(total / activeQuests.value.length)
})

// Methods
const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert'
  }
  return labels[difficulty] || difficulty
}

const loadUserQuests = async () => {
  try {
    loading.value = true
    const userId = props.userId || authStore.user?.id
    
    if (!userId) {
      console.warn('Aucun userId fourni pour charger les quêtes')
      return
    }
    
    console.log('🔍 Chargement des quêtes pour:', userId)
    
    // Récupérer les quêtes actives de l'utilisateur avec leurs infos complètes
    const { data: userQuests, error } = await supabase
      .from('user_quest_progress')
      .select(`
        *,
        quest:quests(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erreur chargement quêtes:', error)
      return
    }
    
    if (userQuests && userQuests.length > 0) {
      // Formater les données
      activeQuests.value = userQuests.map(uq => ({
        id: uq.quest_id,
        title: uq.quest?.title || 'Quête',
        description: uq.quest?.description || '',
        difficulty: uq.quest?.difficulty || 'medium',
        xp_reward: uq.quest?.xp_reward || uq.quest?.points || 0,
        points: uq.quest?.points || 0,
        progress: uq.progress || 0,
        completed: uq.completed || false,
        steps_completed: uq.steps_completed || 0,
        total_steps: uq.quest?.steps?.length || 1
      }))
      
      console.log(`✅ ${activeQuests.value.length} quêtes chargées`)
    } else {
      activeQuests.value = []
      console.log('📭 Aucune quête active trouvée')
    }
  } catch (err) {
    console.error('❌ Erreur lors du chargement des quêtes:', err)
  } finally {
    loading.value = false
  }
}

const subscribeToQuestUpdates = () => {
  const userId = props.userId || authStore.user?.id
  
  if (!userId) return
  
  console.log('🔔 Abonnement aux mises à jour des quêtes pour:', userId)
  
  realtimeChannel = supabase
    .channel('user-quests-updates')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_quest_progress',
        filter: `user_id=eq.${userId}`
      }, 
      (payload) => {
        console.log('🔄 Mise à jour quête détectée:', payload.eventType)
        loadUserQuests() // Recharger les quêtes
      }
    )
    .subscribe()
}

const navigateToQuestDetails = (quest) => {
  router.push('/quests')
}

const navigateToAllQuests = () => {
  router.push('/quests')
}

// Lifecycle
onMounted(() => {
  loadUserQuests()
  subscribeToQuestUpdates()
})

onBeforeUnmount(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})
</script>

<style scoped>
.quests-profile-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.quests-profile-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--surface-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.quest-count-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: bold;
  font-size: 0.9rem;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.stat-label {
  font-size: 0.75rem;
  color: white;
  opacity: 0.8;
  text-align: center;
}

/* Liste des quêtes */
.quests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quest-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.quest-item:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quest-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.quest-info {
  flex: 1;
  min-width: 0;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.quest-info h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.difficulty-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.difficulty-easy { background: #10b981; color: white; }
.difficulty-medium { background: #f59e0b; color: white; }
.difficulty-hard { background: #ef4444; color: white; }
.difficulty-expert { background: #8b5cf6; color: white; }

.quest-description {
  font-size: 0.85rem;
  color: white;
  opacity: 0.8;
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Barre de progression */
.quest-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--surface-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  min-width: 35px;
  text-align: right;
}

/* Récompense */
.quest-reward {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.xp-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid;
  border-radius: 0.75rem;
  font-weight: bold;
  font-size: 0.85rem;
  color: white;
  background: var(--surface-card);
}

.xp-badge i {
  font-size: 0.9rem;
}

/* Boutons */
.see-more-btn,
.explore-btn {
  width: 100%;
  margin-top: 0.5rem;
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.see-more-btn:hover,
.explore-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
}

/* État vide */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  color: white;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.empty-state p {
  color: white;
  opacity: 0.7;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

/* Loading */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  z-index: 10;
}

.loading-overlay i {
  font-size: 2rem;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .quest-item {
    flex-direction: column;
  }
  
  .quest-reward {
    align-self: flex-start;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
