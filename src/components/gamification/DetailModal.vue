<template>
  <Dialog 
    v-model:visible="visible" 
    :modal="true" 
    :closable="true"
    :dismissableMask="true"
    :style="{ width: '90vw', maxWidth: '600px' }"
    :contentStyle="{ padding: 0 }"
  >
    <!-- Badge Detail -->
    <template v-if="type === 'badge' && item">
      <div class="detail-modal badge-detail" :class="`rarity-${item.rarity}`">
        <div class="detail-header">
          <div class="icon-container">
            <i :class="item.icon || 'pi pi-star'" class="detail-icon"></i>
            <div class="rarity-glow"></div>
          </div>
          <div class="rarity-badge" :class="`rarity-${item.rarity}`">
            {{ getRarityLabel(item.rarity) }}
          </div>
        </div>
        
        <div class="detail-content">
          <h2 class="detail-title">{{ item.name }}</h2>
          <p class="detail-description">{{ item.description }}</p>
          
          <div class="detail-stats">
            <div class="stat-item">
              <i class="pi pi-bolt"></i>
              <span>+{{ item.points || item.xp_reward || 0 }} XP</span>
            </div>
            <div class="stat-item" v-if="item.badge_type || item.category">
              <i class="pi pi-tag"></i>
              <span>{{ item.badge_type || item.category }}</span>
            </div>
          </div>
          
          <div class="unlock-info" v-if="item.unlocked_at">
            <i class="pi pi-check-circle"></i>
            <span>Débloqué le {{ formatDate(item.unlocked_at) }}</span>
          </div>
          
          <div class="requirements" v-if="item.requirements">
            <h3>Condition de déblocage :</h3>
            <p>{{ formatRequirements(item.requirements) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Challenge Detail -->
    <template v-else-if="type === 'challenge' && item">
      <div class="detail-modal challenge-detail">
        <div class="detail-header challenge-header">
          <div class="icon-container">
            <i :class="item.icon || 'pi pi-flag'" class="detail-icon"></i>
          </div>
          <div class="difficulty-badge" :class="`difficulty-${item.difficulty}`">
            {{ getDifficultyLabel(item.difficulty) }}
          </div>
        </div>
        
        <div class="detail-content">
          <h2 class="detail-title">{{ item.title }}</h2>
          <p class="detail-description">{{ item.description }}</p>
          
          <div class="progress-section" v-if="item.progress !== undefined">
            <div class="progress-header">
              <span>Progression</span>
              <span class="progress-value">{{ item.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
            </div>
          </div>
          
          <div class="detail-stats">
            <div class="stat-item">
              <i class="pi pi-bolt"></i>
              <span>+{{ item.points || item.xp_reward || 0 }} XP</span>
            </div>
            <div class="stat-item" v-if="item.type">
              <i class="pi pi-tag"></i>
              <span>{{ item.type }}</span>
            </div>
            <div class="stat-item" v-if="item.end_date">
              <i class="pi pi-calendar"></i>
              <span>Jusqu'au {{ formatDate(item.end_date) }}</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <Button 
              v-if="!item.completed"
              label="Commencer" 
              icon="pi pi-play" 
              class="start-btn"
              @click="startChallenge"
            />
            <Button 
              v-else
              label="Complété" 
              icon="pi pi-check" 
              class="completed-btn"
              disabled
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Quest Detail -->
    <template v-else-if="type === 'quest' && item">
      <div class="detail-modal quest-detail">
        <div class="detail-header quest-header">
          <div class="icon-container">
            <i :class="item.icon || 'pi pi-compass'" class="detail-icon"></i>
          </div>
          <div class="difficulty-badge" :class="`difficulty-${item.difficulty}`">
            {{ getDifficultyLabel(item.difficulty) }}
          </div>
        </div>
        
        <div class="detail-content">
          <h2 class="detail-title">{{ item.title }}</h2>
          <p class="detail-description">{{ item.description }}</p>
          
          <div class="story-section" v-if="item.story">
            <h3>Histoire</h3>
            <p class="story-text">{{ item.story }}</p>
          </div>
          
          <div class="steps-section" v-if="item.steps">
            <h3>Étapes ({{ item.steps_completed || 0 }}/{{ item.total_steps || item.steps.length }})</h3>
            <div class="steps-list">
              <div 
                v-for="(step, index) in item.steps" 
                :key="index"
                class="step-item"
                :class="{ completed: index < (item.steps_completed || 0) }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.description }}</p>
                  <span class="step-xp">+{{ step.xp }} XP</span>
                </div>
                <i 
                  v-if="index < (item.steps_completed || 0)" 
                  class="pi pi-check-circle step-check"
                ></i>
              </div>
            </div>
          </div>
          
          <div class="detail-stats">
            <div class="stat-item">
              <i class="pi pi-bolt"></i>
              <span>+{{ item.points || item.xp_reward || 0 }} XP Total</span>
            </div>
            <div class="stat-item" v-if="item.is_daily">
              <i class="pi pi-calendar"></i>
              <span>Quotidienne</span>
            </div>
            <div class="stat-item" v-if="item.is_weekly">
              <i class="pi pi-calendar"></i>
              <span>Hebdomadaire</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <Button 
              v-if="!item.completed"
              label="Commencer la quête" 
              icon="pi pi-play" 
              class="start-btn"
              @click="startQuest"
            />
            <Button 
              v-else
              label="Quête complétée" 
              icon="pi pi-check" 
              class="completed-btn"
              disabled
            />
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  modelValue: Boolean,
  type: String, // 'badge', 'challenge', 'quest'
  item: Object
})

const emit = defineEmits(['update:modelValue', 'start'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getRarityLabel = (rarity) => {
  const labels = {
    common: 'Commun',
    uncommon: 'Peu Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
    mythic: 'Mythique'
  }
  return labels[rarity] || rarity
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert'
  }
  return labels[difficulty] || difficulty
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatRequirements = (requirements) => {
  if (!requirements) return ''
  if (typeof requirements === 'string') {
    try {
      requirements = JSON.parse(requirements)
    } catch {
      return requirements
    }
  }
  
  const { type, value } = requirements
  const messages = {
    quests_completed: `Complète ${value} quête(s)`,
    level: `Atteins le niveau ${value}`,
    login_streak: `Connecte-toi ${value} jours d'affilée`,
    comments: `Fais ${value} commentaires`,
    likes_received: `Reçois ${value} likes`,
    help_count: `Aide ${value} personne(s)`,
    house: `Rejoins la maison ${value}`,
    challenges_completed: `Complète ${value} défi(s)`,
    badges_count: `Débloque ${value} badges`
  }
  
  return messages[type] || `${type}: ${value}`
}

const startChallenge = () => {
  emit('start', { type: 'challenge', item: props.item })
  visible.value = false
}

const startQuest = () => {
  emit('start', { type: 'quest', item: props.item })
  visible.value = false
}
</script>

<style scoped>
.detail-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  overflow: hidden;
}

.detail-header {
  position: relative;
  padding: 3rem 2rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1));
}

.icon-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.detail-icon {
  font-size: 4rem;
  color: white;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  position: relative;
  z-index: 2;
}

.rarity-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
}

.rarity-badge,
.difficulty-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
}

/* Rarity colors */
.rarity-common { background: linear-gradient(135deg, #95a5a6, #7f8c8d); }
.rarity-uncommon { background: linear-gradient(135deg, #27ae60, #229954); }
.rarity-rare { background: linear-gradient(135deg, #3498db, #2980b9); }
.rarity-epic { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
.rarity-legendary { background: linear-gradient(135deg, #f39c12, #e67e22); }
.rarity-mythic { background: linear-gradient(135deg, #e74c3c, #c0392b); }

/* Difficulty colors */
.difficulty-easy { background: linear-gradient(135deg, #2ecc71, #27ae60); }
.difficulty-medium { background: linear-gradient(135deg, #f39c12, #e67e22); }
.difficulty-hard { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.difficulty-expert { background: linear-gradient(135deg, #8e44ad, #71368a); }

.detail-content {
  background: white;
  padding: 2rem;
  border-radius: 16px 16px 0 0;
  margin-top: -16px;
}

.detail-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.detail-description {
  font-size: 1rem;
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.detail-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.5rem 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ecf0f1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #34495e;
}

.stat-item i {
  color: #3498db;
}

.unlock-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #d5f4e6;
  border-radius: 8px;
  color: #27ae60;
  font-weight: 500;
  margin: 1rem 0;
}

.requirements {
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #f39c12;
  border-radius: 4px;
  margin: 1rem 0;
}

.requirements h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #856404;
  margin: 0 0 0.5rem 0;
}

.requirements p {
  font-size: 0.95rem;
  color: #856404;
  margin: 0;
}

.progress-section {
  margin: 1.5rem 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.progress-value {
  color: #3498db;
}

.progress-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.story-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.story-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
}

.story-text {
  font-size: 0.95rem;
  color: #7f8c8d;
  line-height: 1.6;
  font-style: italic;
  margin: 0;
}

.steps-section {
  margin: 1.5rem 0;
}

.steps-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #bdc3c7;
  transition: all 0.3s ease;
}

.step-item.completed {
  background: #d5f4e6;
  border-left-color: #27ae60;
}

.step-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-weight: 600;
  color: #7f8c8d;
  flex-shrink: 0;
}

.step-item.completed .step-number {
  background: #27ae60;
  color: white;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
}

.step-content p {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
}

.step-xp {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3498db;
}

.step-check {
  font-size: 1.5rem;
  color: #27ae60;
  align-self: center;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.start-btn {
  flex: 1;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  border: none;
  padding: 0.75rem;
  font-weight: 600;
}

.start-btn:hover {
  background: linear-gradient(135deg, #2980b9, #27ae60);
}

.completed-btn {
  flex: 1;
  background: #95a5a6;
  border: none;
  padding: 0.75rem;
  font-weight: 600;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .detail-content {
    padding: 1.5rem;
  }
  
  .detail-title {
    font-size: 1.5rem;
  }
  
  .detail-stats {
    flex-direction: column;
  }
}
</style>
