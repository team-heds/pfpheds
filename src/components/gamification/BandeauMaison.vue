<template>
  <div class="bandeau-maison" :style="{ '--house-color': houseColor, 'background-image': `url(${houseBackground})` }">
    <div class="background-pattern"></div>
    <div class="particles-container">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
    
    <div class="house-content">
      <div class="house-info">
        <h3 class="house-name clickable" @click="navigateToHouseStats" :title="props.maison.toLowerCase() === 'gamemaster' ? 'Voir le classement' : 'Cliquer pour voir les statistiques de la maison'">{{ houseDisplayName }}</h3>
        <p class="house-motto">"{{ houseMotto }}"</p>
        
        <div class="level-section">
          <br>
          <br>
          <span class="level-text">Niveau {{ niveau }}</span>
        </div>
        
        <!-- Streak Display -->
        <div v-if="loginStreak > 0" class="streak-display">
          <div class="streak-flame">
            <i class="pi pi-bolt" :class="{ 'streak-active': loginStreak >= 3 }"></i>
            <span class="streak-count">{{ loginStreak }}</span>
          </div>
          <span class="streak-text">{{ streakText }}</span>
        </div>
      </div>
      
      <div class="house-actions">
        <Button class="action-btn" @click="navigateToProfile" title="Voir le profil">
          <i class="pi pi-user"></i>
        </Button>
        <Button class="action-btn" @click="navigateToHouseStats" title="Voir les statistiques de la maison">
          <i class="pi pi-home"></i>
        </Button>
        <Button class="action-btn" @click="navigateToGlobalRanking" title="Voir le classement global des maisons">
          <i class="pi pi-chart-bar"></i>
        </Button>
      </div>
    </div>
    
    <div class="shine-effect"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Import des images de fond des maisons
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'
import MaitreDuJeuFond from '@/assets/maisons/MaitreDuJeuFond.png'

const props = defineProps({
  maison: {
    type: String,
    required: true
  },
  niveau: {
    type: Number,
    default: 1
  },
  loginStreak: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['viewProfile', 'viewStats', 'viewHouseRankings'])

const router = useRouter()

// Fonctions de navigation
const navigateToProfile = () => {
  console.log('Navigating to gamification profile...')
  try {
    // Navigation vers le profil de l'utilisateur connecté (sans userId)
    router.push({ 
      name: 'GamificationProfilePage'
      // Pas de params.userId → charge le profil de l'utilisateur connecté
    })
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const navigateToHouseStats = () => {
  console.log('Navigating to house stats...')
  try {
    // Pour Game Master, aller vers le classement au lieu des stats
    if (props.maison.toLowerCase() === 'gamemaster') {
      router.push('/houses/ranking')
    } else {
      // Navigation vers les statistiques de la maison avec le nom de la maison
      router.push(`/houses/${props.maison}/stats`)
    }
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const navigateToGlobalRanking = () => {
  console.log('Navigating to global ranking...')
  try {
    // Navigation vers le classement global des maisons
    router.push('/houses/ranking')
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const houseConfig = {
  harmonis: {
    color: '#2E8B57',
    icon: 'pi pi-circle',
    motto: 'L\'équilibre soigne',
    background: FondHarmonis
  },
  elaris: {
    color: '#DC143C',
    icon: 'pi pi-sun',
    motto: 'Clarifier, guider, apaiser',
    background: FondElaris
  },
  doloris: {
    color: '#FFD700',
    icon: 'pi pi-heart',
    motto: 'Comprendre la douleur, c\'est soigner',
    background: FondDoloris
  },
  solencia: {
    color: '#4169E1',
    icon: 'pi pi-moon',
    motto: 'Apaiser pour mieux guérir',
    background: FondSolencia
  },
  gamemaster: {
    color: '#9333ea',
    icon: 'pi pi-crown',
    motto: 'Voir tout, gérer tout',
    background: MaitreDuJeuFond
  }
}

const houseColor = computed(() => {
  return houseConfig[props.maison.toLowerCase()]?.color || '#6366F1'
})

const houseMotto = computed(() => {
  return houseConfig[props.maison.toLowerCase()]?.motto || ''
})

const houseBackground = computed(() => {
  return houseConfig[props.maison.toLowerCase()]?.background || ''
})

const houseDisplayName = computed(() => {
  const house = props.maison.toLowerCase()
  if (house === 'gamemaster') {
    return '🎮 Maître du Jeu 🎮'
  }
  // Capitaliser la première lettre pour les autres maisons
  return props.maison.charAt(0).toUpperCase() + props.maison.slice(1)
})

const streakText = computed(() => {
  if (props.loginStreak === 1) return 'jour de connexion'
  else return `${props.loginStreak} jours de connexion`
})

const getParticleStyle = (index) => {
  const delay = Math.random() * 4
  const duration = 3 + Math.random() * 2
  const size = 2 + Math.random() * 4
  const left = Math.random() * 100
  
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`
  }
}
</script>

<style scoped>
.bandeau-maison {
  position: relative;
  background: linear-gradient(135deg, var(--house-color), color-mix(in srgb, var(--house-color) 80%, black));
  border-radius: 20px;
  padding: 3.5rem 4.5rem;
  color: white;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: none;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 12px 40px rgba(0,0,0,0.25),
    0 0 0 1px rgba(255,255,255,0.1);
  overflow: hidden;
  backdrop-filter: blur(10px);
  background-size: cover;
  background-position: center;
}

.bandeau-maison::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5));
  z-index: 1;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}



@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
}

.house-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  z-index: 3;
  width: 100%;
  height: 100%;
}

.house-info {
  flex: 1;
  min-width: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.house-name {
  font-size: 2.8rem;
  font-weight: 700;
  margin: 0 0 0.8rem 0;
  text-transform: capitalize;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.house-name.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.house-name.clickable:hover {
  transform: scale(1.05);
  text-shadow: 0 4px 8px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3);
}

.house-name.clickable:active {
  transform: scale(0.98);
}

.house-motto {
  font-size: 1.3rem;
  font-weight: 400;
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  line-height: 1.4;
}

.level-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;
}

.level-text {
  font-weight: 600;
  background: rgba(255,255,255,0.25);
  padding: 0.6rem 1.5rem;
  border-radius: 30px;
  font-size: 1.1rem;
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(15px);
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.level-text:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.streak-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  width: 100%;
}

.streak-flame {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.streak-flame .pi-bolt {
  font-size: 1.5rem;
  color: #ff6b35;
  filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.6));
  animation: flameFlicker 2s ease-in-out infinite alternate;
}

.streak-flame .pi-bolt.streak-active {
  color: #ff4500;
  filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.8));
  animation: flameIntense 1.5s ease-in-out infinite alternate;
}

@keyframes flameFlicker {
  0% { 
    transform: scale(1) rotate(-2deg);
    opacity: 0.8;
  }
  50% { 
    transform: scale(1.1) rotate(2deg);
    opacity: 1;
  }
  100% { 
    transform: scale(1.05) rotate(-1deg);
    opacity: 0.9;
  }
}

@keyframes flameIntense {
  0% { 
    transform: scale(1) rotate(-3deg);
    opacity: 0.9;
    filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.8));
  }
  50% { 
    transform: scale(1.2) rotate(3deg);
    opacity: 1;
    filter: drop-shadow(0 0 16px rgba(255, 69, 0, 1));
  }
  100% { 
    transform: scale(1.1) rotate(-2deg);
    opacity: 0.95;
    filter: drop-shadow(0 0 14px rgba(255, 69, 0, 0.9));
  }
}

.streak-count {
  font-weight: 600;
  font-size: 1.1rem;
}

.streak-text {
  font-size: 1.1rem;
  opacity: 0.9;
}

.house-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.action-btn {
  width: 45px;
  height: 45px;
  border: none;
  background: rgba(255,255,255,0.2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  font-size: 1.1rem;
}

.action-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

.shine-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

@media (max-width: 768px) {
  .bandeau-maison {
    padding: 1.5rem;
  }
  
  .house-content {
    gap: 1rem;
  }
  
  .house-name {
    font-size: 1.5rem;
  }
  
  .house-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .level-section {
    justify-content: center;
  }
}
</style>
