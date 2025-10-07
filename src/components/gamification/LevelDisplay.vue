<template>
  <div class="level-display" :class="`phase-${levelInfo.phase?.toLowerCase()}`">
    <div class="level-header">
      <div class="level-icon" :style="{ backgroundColor: levelInfo.color }">
        <i :class="levelInfo.icon || 'pi-star'"></i>
      </div>
      <div class="level-info">
        <div class="level-number">Niveau {{ level }}</div>
        <div class="level-title">{{ levelInfo.name }}</div>
        <div class="level-phase">{{ levelInfo.phase }}</div>
      </div>
      <div v-if="levelInfo.isPalier" class="palier-badge">
        <i class="pi pi-trophy"></i>
        <span>PALIER</span>
      </div>
    </div>
    
    <div class="level-description">
      {{ levelInfo.description }}
    </div>
    
    <div v-if="showProgress && !levelInfo.isMaxLevel" class="level-progress">
      <div class="progress-header">
        <span>Progression</span>
        <span class="progress-value">{{ currentProgress.toFixed(1) }}%</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ 
            width: currentProgress + '%',
            backgroundColor: levelInfo.color 
          }"
        ></div>
      </div>
      <div class="progress-info">
        <span>{{ formatXP(currentXP) }} XP</span>
        <span>{{ formatXP(xpToNext) }} XP restants</span>
      </div>
    </div>
    
    <div v-if="levelInfo.isMaxLevel" class="max-level-reached">
      <i class="pi pi-check-circle"></i>
      <span>NIVEAU MAXIMUM ATTEINT !</span>
    </div>
    
    <div v-if="levelInfo.rewards && levelInfo.rewards.length > 0" class="level-rewards">
      <h4><i class="pi pi-gift"></i> Récompenses</h4>
      <div class="rewards-list">
        <div 
          v-for="(reward, index) in levelInfo.rewards" 
          :key="index"
          class="reward-item"
        >
          <i class="pi pi-check"></i>
          <span>{{ formatReward(reward) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="levelInfo.isPalier && levelInfo.palierBonus" class="palier-bonus">
      <i class="pi pi-star-fill"></i>
      <span>+{{ levelInfo.palierBonus }} points pour ta maison !</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import levelsConfig from '@/config/levelsConfig'

const props = defineProps({
  level: {
    type: Number,
    required: true,
    default: 1
  },
  currentXP: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: false
  }
})

const levelInfo = computed(() => {
  return levelsConfig.getLevelInfo(props.level)
})

const xpToNext = computed(() => {
  return levelsConfig.getXPToNextLevel(props.level, props.currentXP)
})

const currentProgress = computed(() => {
  return levelsConfig.getLevelProgress(props.level, props.currentXP)
})

const formatXP = (xp) => {
  return xp.toLocaleString('fr-FR')
}

const formatReward = (reward) => {
  const rewardMap = {
    'unlock_forum_posts': 'Publications forum débloquées',
    'badge_assistant': 'Badge Assistant·e',
    'house_points_500': '+500 points de maison',
    'unlock_discussions': 'Créer des discussions',
    'badge_diplome': 'Badge Diplômé·e',
    'unlock_quizzes': 'Créer des quiz',
    'badge_specialiste': 'Badge Spécialiste',
    'house_points_1000': '+1000 points de maison',
    'unlock_challenges': 'Créer des défis',
    'avatar_special': 'Avatar spécial de maison',
    'unlock_mentoring': 'Devenir mentor',
    'unlock_teaching': 'Créer du contenu éducatif',
    'badge_manager': 'Badge Manager',
    'house_points_1500': '+1500 points de maison',
    'unlock_quests_creation': 'Créer des quêtes',
    'custom_title': 'Titre personnalisé',
    'name_color': 'Couleur de nom unique',
    'unlock_consulting': 'Mode Consultant',
    'unlock_research': 'Accès Recherche',
    'unlock_courses': 'Créer des cours',
    'badge_legende': 'Badge Légende HES (animé)',
    'house_points_3000': '+3000 points de maison',
    'all_privileges': 'Tous les privilèges',
    'hall_of_fame': 'Hall of Fame',
    'mentor_badge_permanent': 'Badge Mentor permanent',
    'profile_skin_exclusive': 'Skin de profil exclusif',
    'animated_badge': 'Badge animé'
  }
  return rewardMap[reward] || reward
}
</script>

<style scoped>
.level-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
}

.phase-novice {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.phase-intermédiaire {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.phase-avancé {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
}

.phase-maître {
  background: linear-gradient(135deg, #e74c3c 0%, #8e44ad 100%);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.level-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.level-info {
  flex: 1;
}

.level-number {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

.level-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0.25rem 0;
}

.level-phase {
  font-size: 0.85rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.palier-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.palier-badge i {
  font-size: 1.5rem;
}

.level-description {
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.95;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.level-progress {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.progress-bar {
  height: 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  opacity: 0.9;
}

.max-level-reached {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.max-level-reached i {
  font-size: 1.5rem;
}

.level-rewards {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.level-rewards h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.95;
}

.reward-item i {
  color: #2ecc71;
}

.palier-bonus {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255,215,0,0.3);
  border: 2px solid rgba(255,215,0,0.5);
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.05rem;
}

.palier-bonus i {
  font-size: 1.25rem;
  color: #FFD700;
}

@media (max-width: 768px) {
  .level-display {
    padding: 1.5rem;
  }
  
  .level-header {
    flex-direction: column;
    text-align: center;
  }
  
  .level-icon {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }
  
  .level-title {
    font-size: 1.5rem;
  }
}
</style>
