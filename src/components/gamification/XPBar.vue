<template>
  <div class="xp-bar-container" :style="{ '--house-color': houseColor, '--house-color-gradient': houseColorGradient }">
    <div class="xp-header">
      <div class="xp-info">
        <div class="level-badge" :style="{ backgroundColor: houseColor }">
          <i class="pi pi-trophy level-icon"></i>
          <span class="level-number">{{ niveau }}</span>
        </div>
        <div class="xp-text">
          <span class="xp-label">Expérience</span>
          <span class="xp-values">{{ xp }} / {{ xp + xpToNext }} XP</span>
        </div>
      </div>
      <div class="xp-gain" v-if="recentXPGain > 0">
        <span class="gain-text">+{{ recentXPGain }} XP</span>
      </div>
    </div>
    
    <div class="xp-bar-track">
      <div class="xp-bar-bg"></div>
      <div 
        class="xp-bar-fill" 
        :style="{ 
          width: progressPercentage + '%',
          backgroundColor: houseColor 
        }"
      >
        <div class="xp-bar-shimmer"></div>
      </div>
      <div class="xp-bar-glow" :style="{ backgroundImage: houseColorGradient }"></div>
    </div>
    
    <div class="xp-footer">
      <span class="next-level">{{ xpToNext }} XP jusqu'au niveau {{ niveau + 1 }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Import des images de fond des maisons
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'

const props = defineProps({
  xp: {
    type: Number,
    default: 0
  },
  xpToNext: {
    type: Number,
    default: 100
  },
  niveau: {
    type: Number,
    default: 1
  },
  maison: {
    type: String,
    default: 'harmonis'
  }
})

const recentXPGain = ref(0)

const houseColors = {
  harmonis: '#2E8B57',
  elaris: '#DC143C',
  doloris: '#FFD700',
  solencia: '#4169E1'
}

const houseColor = computed(() => {
  return houseColors[props.maison.toLowerCase()] || '#6366F1'
})

const houseColorGradient = computed(() => {
  switch ((props.maison || '').toLowerCase()) {
    case 'harmonis': return `url(${FondHarmonis})`;
    case 'elaris': return `url(${FondElaris})`;
    case 'doloris': return `url(${FondDoloris})`;
    case 'solencia': return `url(${FondSolencia})`;
    default: return 'linear-gradient(90deg, #6366F1 60%, #4B6E7E 100%)';
  }
})

const progressPercentage = computed(() => {
  if (props.xpToNext === 0) return 100
  const totalXPNeeded = props.xp + props.xpToNext
  return Math.min((props.xp / totalXPNeeded) * 100, 100)
})

// Animation pour les gains d'XP
watch(() => props.xp, (newXP, oldXP) => {
  if (newXP > oldXP) {
    recentXPGain.value = newXP - oldXP
    setTimeout(() => {
      recentXPGain.value = 0
    }, 3000)
  }
})
</script>

<style scoped>
.xp-bar-container {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 
    0 4px 20px rgba(0,0,0,0.1),
    0 0 0 1px rgba(0,0,0,0.05);
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.xp-bar-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.xp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.xp-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  border-radius: 25px;
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
}

.level-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.level-icon {
  font-size: 1.2rem;
}

.level-number {
  font-size: 1.1rem;
}

.xp-text {
  display: flex;
  flex-direction: column;
}

.xp-label {
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
}

.xp-values {
  font-size: 1.1rem;
  color: #7f8c8d;
  font-weight: 500;
}

.xp-gain {
  background: var(--house-color-gradient);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  animation: gainPulse 0.6s ease-out;
  text-shadow: 0 1px 2px rgba(0,0,0,0.7);
}

@keyframes gainPulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.xp-bar-track {
  position: relative;
  height: 16px;
  margin-bottom: 0.8rem;
}

.xp-bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ecf0f1;
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.xp-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.xp-bar-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: barShimmer 2s infinite;
}

@keyframes barShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.xp-bar-glow {
  position: absolute;
  top: -2px;
  left: 0;
  bottom: -2px;
  width: var(--progress, 0%);
  border-radius: 10px;
  opacity: 0.3;
  filter: blur(4px);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background-size: 100% 100%;
}

.xp-footer {
  text-align: center;
}

.next-level {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

@media (max-width: 768px) {
  .xp-bar-container {
    padding: 1rem;
  }
  
  .xp-header {
    flex-direction: column;
    gap: 0.8rem;
    align-items: flex-start;
  }
  
  .xp-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .level-badge {
    padding: 0.6rem 1rem;
  }
  
  .xp-text {
    text-align: right;
  }
  
  .xp-gain {
    align-self: center;
  }
}
</style>
