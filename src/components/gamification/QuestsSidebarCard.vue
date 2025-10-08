<template>
  <div class="quests-sidebar-card">
    <!-- Header avec badge de notification -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="header-with-badge">
        <h4 class="m-0">🗺️ Nouvelles Quêtes</h4>
        <span v-if="newQuestsCount > 0" class="notification-badge" :style="{ backgroundColor: houseColor }">
          {{ newQuestsCount }}
        </span>
      </div>
      <Button 
        icon="pi pi-arrow-right" 
        class="p-button-text p-button-sm"
        @click="goToQuests"
        v-tooltip.top="'Voir toutes les quêtes'"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center text-600 mt-4">
      <i class="pi pi-spin pi-spinner"></i>
      <p class="text-sm mt-2">Chargement...</p>
    </div>

    <!-- Liste des nouvelles quêtes -->
    <div v-else-if="newQuests.length > 0" class="quests-list">
      <div 
        v-for="quest in displayedQuests"
        :key="quest.id"
        class="quest-item"
        :class="{ 'new-quest': quest.isNew }"
        @click="viewQuestDetails(quest)"
      >
        <!-- Icône et contenu -->
        <div class="quest-icon" :style="{ backgroundColor: houseColor }">
          <i class="pi pi-flag"></i>
        </div>
        
        <div class="quest-content">
          <div class="quest-header">
            <span class="quest-title">{{ quest.title }}</span>
            <span v-if="quest.isNew" class="new-badge">NEW</span>
          </div>
          
          <div class="quest-meta">
            <span class="difficulty-badge" :class="`difficulty-${quest.difficulty}`">
              {{ getDifficultyLabel(quest.difficulty) }}
            </span>
            <span class="xp-reward" :style="{ color: houseColor }">
              <i class="pi pi-star-fill"></i>
              {{ quest.xp_reward || quest.points }} XP
            </span>
          </div>
          
          <!-- Barre de progression si commencée -->
          <div v-if="quest.progress > 0" class="mini-progress">
            <div class="progress-fill" :style="{ width: quest.progress + '%', backgroundColor: houseColor }"></div>
          </div>
        </div>

        <!-- Flèche -->
        <div class="quest-arrow">
          <i class="pi pi-chevron-right"></i>
        </div>
      </div>

      <!-- Bouton "Voir plus" si + de 3 quêtes -->
      <Button 
        v-if="newQuests.length > 3"
        @click="goToQuests"
        class="see-all-btn w-full mt-2"
        :style="{ backgroundColor: houseColor, borderColor: houseColor }"
        size="small"
      >
        Voir toutes ({{ newQuests.length }})
      </Button>
    </div>

    <!-- État vide -->
    <div v-else class="no-quests">
      <i class="pi pi-compass text-400"></i>
      <p class="text-500 text-sm mt-2">Aucune nouvelle quête pour le moment</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import userQuestsService from '@/service/userQuestsService'
import { supabase } from '@/supabase'

const router = useRouter()
const authStore = useAuthStore()

// State
const newQuests = ref([])
const loading = ref(false)
const houseColor = ref('#2E8B57') // Harmonis par défaut
let realtimeChannel = null

// Computed
const displayedQuests = computed(() => {
  return newQuests.value.slice(0, 3) // Max 3 quêtes affichées
})

const newQuestsCount = computed(() => {
  return newQuests.value.filter(q => q.isNew).length
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

const loadUserHouseColor = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('gamification_data')
      .select('house_id')
      .eq('user_id', userId)
      .single()

    if (data?.house_id) {
      const { data: houseData } = await supabase
        .from('houses')
        .select('name')
        .eq('id', data.house_id)
        .single()

      if (houseData) {
        const colors = {
          harmonis: '#2E8B57',
          elaris: '#DC143C',
          doloris: '#FFD700',
          solencia: '#4169E1',
          gamemaster: '#9333ea'
        }
        houseColor.value = colors[houseData.name.toLowerCase()] || '#2E8B57'
      }
    }
  } catch (err) {
    console.error('Erreur récupération couleur maison:', err)
  }
}

const loadNewQuests = async () => {
  try {
    loading.value = true
    const user = authStore.user
    if (!user) return
    
    const userId = authStore.isFirebaseUser ? user.uid : user.id

    console.log('🔍 Chargement des nouvelles quêtes pour:', userId)

    // Utiliser getActiveQuests au lieu de getNewQuests pour afficher toutes les quêtes non complétées
    const quests = await userQuestsService.getActiveQuests(userId)
    
    // Marquer comme nouvelles si créées récemment (7 jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    newQuests.value = quests.map(q => ({
      ...q,
      isNew: new Date(q.created_at || q.userProgress?.started_at) > sevenDaysAgo,
      progress: q.userProgress?.progress || 0
    }))

    console.log(`✅ ${newQuests.value.length} quêtes chargées (${newQuestsCount.value} nouvelles)`)
  } catch (err) {
    console.error('❌ Erreur lors du chargement des quêtes:', err)
    newQuests.value = []
  } finally {
    loading.value = false
  }
}

const subscribeToQuestUpdates = () => {
  const user = authStore.user
  if (!user) return
  
  const userId = authStore.isFirebaseUser ? user.uid : user.id

  console.log('🔔 Abonnement aux nouvelles quêtes pour:', userId)

  // Utiliser le service pour s'abonner aux mises à jour
  realtimeChannel = userQuestsService.subscribeToQuestUpdates(userId, (payload) => {
    console.log('🔄 Changement de quête détecté:', payload.eventType)
    loadNewQuests() // Recharger les quêtes
  })
}

const viewQuestDetails = (quest) => {
  router.push('/gamification-profile')
}

const goToQuests = () => {
  router.push('/gamification-profile')
}

// Lifecycle
onMounted(async () => {
  await loadUserHouseColor()
  await loadNewQuests()
  subscribeToQuestUpdates()
})

onBeforeUnmount(() => {
  if (realtimeChannel) {
    userQuestsService.unsubscribeFromQuestUpdates(realtimeChannel)
  }
})
</script>

<style scoped>
.quests-sidebar-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  margin-left: 4rem;
}

/* Header */
.header-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-with-badge h4 {
  font-weight: bold;
  margin: 0;
}

.notification-badge {
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
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Liste des quêtes */
.quests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quest-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
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

.quest-item.new-quest {
  border: 2px solid var(--primary-color);
  box-shadow: 0 0 15px rgba(var(--primary-color-rgb), 0.2);
}

/* Icône de la quête */
.quest-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* Contenu */
.quest-content {
  flex: 1;
  min-width: 0;
}

.quest-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.quest-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  padding: 0.125rem 0.4rem;
  border-radius: 0.5rem;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Meta info */
.quest-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.difficulty-badge {
  padding: 0.125rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

.difficulty-easy { background: #10b981; color: white; }
.difficulty-medium { background: #f59e0b; color: white; }
.difficulty-hard { background: #ef4444; color: white; }
.difficulty-expert { background: #8b5cf6; color: white; }

.xp-reward {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.xp-reward i {
  font-size: 0.7rem;
}

/* Mini barre de progression */
.mini-progress {
  margin-top: 0.5rem;
  height: 3px;
  background: var(--surface-border);
  border-radius: 1.5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 1.5px;
  transition: width 0.5s ease;
}

/* Flèche */
.quest-arrow {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* Bouton "Voir tout" */
.see-all-btn {
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
.no-quests {
  text-align: center;
  padding: 2rem 1rem;
}

.no-quests i {
  font-size: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .quests-sidebar-card {
    margin-left: 0;
  }
  
  .quest-title {
    font-size: 0.85rem;
  }
  
  .quest-meta {
    flex-wrap: wrap;
  }
}
</style>
