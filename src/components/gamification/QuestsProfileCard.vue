<template>
  <div class="quests-profile-card">
    <!-- Header -->
    <div class="card-header">
      <div class="header-with-badge">
        <h4>🗺️ Mes Quêtes Actives</h4>
        <span v-if="activeQuests.length > 0" class="count-badge" :style="{ backgroundColor: houseColor }">
          {{ activeQuests.length }}
        </span>
      </div>
      <Button 
        icon="pi pi-arrow-right" 
        class="p-button-text p-button-sm"
        @click="navigateToAllQuests"
        v-tooltip.top="'Voir toutes les quêtes'"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner :style="{ width: '40px', height: '40px' }" strokeWidth="4" />
      <p class="text-sm text-600 mt-2">Chargement...</p>
    </div>

    <!-- Liste des quêtes -->
    <div v-else-if="activeQuests.length > 0" class="quests-list">
      <div 
        v-for="quest in displayedQuests"
        :key="quest.id"
        class="quest-item"
        @click="navigateToQuestDetails(quest)"
      >
        <!-- Icône -->
        <div class="quest-icon" :style="{ backgroundColor: houseColor }">
          <i class="pi pi-flag"></i>
        </div>
        
        <!-- Contenu -->
        <div class="quest-content">
          <div class="quest-header">
            <span class="quest-title">{{ quest.title }}</span>
            <span class="difficulty-badge" :class="`difficulty-${quest.difficulty}`">
              {{ getDifficultyLabel(quest.difficulty) }}
            </span>
          </div>
          
          <p class="quest-description">{{ quest.description }}</p>
          
          <!-- Barre de progression -->
          <div class="quest-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: quest.progress + '%', backgroundColor: houseColor }"></div>
            </div>
            <span class="progress-text">{{ quest.progress }}%</span>
          </div>
        </div>

        <!-- Récompense -->
        <div class="quest-reward">
          <div class="xp-badge" :style="{ color: houseColor, borderColor: houseColor }">
            <i class="pi pi-star-fill"></i>
            {{ quest.xp_reward || quest.points }} XP
          </div>
          <i class="pi pi-chevron-right quest-arrow"></i>
        </div>
      </div>

      <!-- Bouton Voir Plus -->
      <Button 
        v-if="activeQuests.length > 3"
        @click="navigateToAllQuests"
        :label="`Voir toutes mes quêtes (${activeQuests.length})`"
        icon="pi pi-arrow-right"
        iconPos="right"
        class="see-all-btn"
        size="small"
        :style="{ backgroundColor: houseColor, borderColor: houseColor }"
      />
    </div>

    <!-- État vide -->
    <div v-else class="empty-state">
      <div class="empty-icon">🗺️</div>
      <p class="text-600 text-sm">Aucune quête active pour le moment</p>
      <Button 
        @click="navigateToAllQuests"
        label="Explorer les quêtes"
        icon="pi pi-compass"
        class="p-button-sm mt-3"
        :style="{ backgroundColor: houseColor, borderColor: houseColor }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

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
    
    // Récupérer UNIQUEMENT les quêtes actives (non complétées) de l'utilisateur
    const { data: userQuests, error } = await supabase
      .from('user_quest_progress')
      .select(`
        *,
        quest:quests(*)
      `)
      .eq('user_id', userId)
      .eq('completed', false) // Filtrer les quêtes NON complétées
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
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.header-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-with-badge h4 {
  font-weight: bold;
  margin: 0;
  font-size: 1.1rem;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  border-radius: 12px;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 2rem;
}

/* Liste des quêtes */
.quests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quest-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--surface-ground);
}

.quest-item:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Icône */
.quest-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.quest-item:hover .quest-icon {
  transform: scale(1.05);
}

/* Contenu */
.quest-content {
  flex: 1;
  min-width: 0;
}

.quest-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.quest-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color);
  flex: 1;
  min-width: 0;
}

.difficulty-badge {
  padding: 0.15rem 0.5rem;
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
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

/* Progression */
.quest-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  color: var(--text-color-secondary);
  min-width: 35px;
  text-align: right;
}

/* Récompense */
.quest-reward {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.xp-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 2px solid;
  border-radius: 0.75rem;
  font-weight: bold;
  font-size: 0.85rem;
  background: var(--surface-card);
}

.xp-badge i {
  font-size: 0.8rem;
}

.quest-arrow {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

/* Bouton voir tout */
.see-all-btn {
  width: 100%;
  margin-top: 0.5rem;
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.see-all-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* État vide */
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Responsive */
@media (max-width: 768px) {
  .quest-item {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .quest-reward {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
  
  .quest-title {
    font-size: 0.95rem;
  }
}
</style>
