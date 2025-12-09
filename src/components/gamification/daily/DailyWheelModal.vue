<template>
  <Dialog 
    v-model:visible="showModal" 
    modal 
    :style="{ width: '90vw', maxWidth: '500px' }"
    :closable="!isSpinning"
    @hide="handleClose"
    header="Roue de la Fortune HEdS"
    class="daily-wheel-dialog"
  >
    <div class="flex flex-column align-items-center justify-content-center py-4 relative">
      
      <!-- POINTER (Triangle) -->
      <div class="wheel-pointer z-5"></div>

      <!-- THE WHEEL -->
      <div class="wheel-container relative mb-5" :style="wheelStyle">
        <div class="wheel-content">
          <!-- Segments (Text/Icons) -->
          <!-- Note: CSS conic-gradient handles background colors -->
          <div v-for="(segment, index) in segments" :key="index" 
               class="wheel-segment" 
               :style="{ transform: `rotate(${segment.rotation}deg) translate(0, -110px) rotate(-${segment.rotation}deg)` }">
            <i :class="segment.icon" class="text-2xl text-white drop-shadow-md"></i>
            <span class="text-xs font-bold text-white mt-1 block text-shadow">{{ segment.label }}</span>
          </div>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="text-center z-2 mt-4" style="min-height: 80px;">
        <div v-if="!hasSpun && !isSpinning">
          <Button 
            label="Lancer la roue !" 
            icon="pi pi-refresh" 
            class="p-button-rounded p-button-lg p-button-warning shadow-4 pulse-animation"
            @click="spin"
            :loading="loading"
          />
        </div>
        
        <div v-if="isSpinning" class="text-xl font-bold text-primary blink">
          La roue tourne...
        </div>

        <div v-if="hasSpun && result" class="fade-in-up">
          <h3 class="text-2xl font-bold m-0 mb-2" :style="{ color: resultColor }">
            {{ result.label }}
          </h3>
          <p class="text-600 m-0">{{ resultDescription }}</p>
          
          <!-- QUIZ SECTION (MVP) -->
          <div v-if="isQuizResult" class="mt-4 p-3 surface-100 border-round">
            <p class="font-bold mb-3">❓ Question Rapide</p>
            <p class="mb-3">Quelle est la capitale du Valais ?</p>
            <div class="flex gap-2 justify-content-center">
              <Button label="Sion" size="small" @click="handleQuizAnswer(true)" />
              <Button label="Lausanne" size="small" severity="secondary" @click="handleQuizAnswer(false)" />
            </div>
          </div>

          <Button v-else label="Génial !" icon="pi pi-check" class="mt-3" @click="handleClose" />
        </div>
      </div>

    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDailyWheelStore } from '@/stores/dailyWheelStore'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
// Confetti import (optional, standard canvas-confetti is great here)
// import confetti from 'canvas-confetti' 

const store = useDailyWheelStore()

// State
const currentRotation = ref(0)
const isSpinning = ref(false)
const hasSpun = ref(false)
const result = ref(null)
const loading = ref(false)

// Segments Config
const segments = [
  { id: 'QUIZ_EASY', label: 'Quiz Facile', icon: 'pi pi-question', color: '#3B82F6', rotation: 36 },    // 0-72 deg
  { id: 'XP_BONUS', label: '+5 XP', icon: 'pi pi-bolt', color: '#F59E0B', rotation: 108 },             // 72-144 deg
  { id: 'QUIZ_HARD', label: 'Quiz Difficile', icon: 'pi pi-exclamation-circle', color: '#EF4444', rotation: 180 }, // 144-216
  { id: 'HELP_CHALLENGE', label: 'Entraide', icon: 'pi pi-heart', color: '#10B981', rotation: 252 },   // 216-288
  { id: 'REROLL', label: 'Rejouer', icon: 'pi pi-refresh', color: '#8B5CF6', rotation: 324 }           // 288-360
]

// Computed
const showModal = computed({
  get: () => store.showModal,
  set: (val) => !val && store.closeModal()
})

const wheelStyle = computed(() => ({
  transform: `rotate(${currentRotation.value}deg)`,
  transition: isSpinning.value ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
}))

const resultColor = computed(() => {
  if (!result.value) return '#000'
  const seg = segments.find(s => s.id === result.value.result_type)
  return seg ? seg.color : '#000'
})

const resultDescription = computed(() => {
  if (!result.value) return ''
  switch(result.value.result_type) {
    case 'XP_BONUS': return 'Vous avez gagné 5 XP directement !'
    case 'REROLL': return 'Vous avez gagné un jeton pour rejouer plus tard.'
    case 'HELP_CHALLENGE': return 'Nouvelle mission disponible dans votre profil.'
    default: return 'Répondez juste pour gagner !'
  }
})

const isQuizResult = computed(() => {
  return result.value && (result.value.result_type === 'QUIZ_EASY' || result.value.result_type === 'QUIZ_HARD')
})

// Methods
const spin = async () => {
  loading.value = true
  try {
    // 1. Get Result from Backend
    const spinResult = await store.spinWheel()
    const resultType = spinResult.result_type
    
    // 2. Calculate Angle
    // Segment mapping (target segment needs to be at TOP, i.e., rotation 0/360)
    // Segment centers: 36, 108, 180, 252, 324
    // If target is 36 deg, we rotate -36 deg to bring it to 0.
    const targetSegment = segments.find(s => s.id === resultType)
    const segmentAngle = targetSegment ? targetSegment.rotation : 0
    
    // Add 5-10 full spins (360 * 5 = 1800)
    // IMPORTANT: The pointer is at TOP. So we rotate the wheel such that the segment comes to TOP.
    // CSS Rotate(X). Positive = Clockwise.
    // If segment is at 36deg (Right-Top), we need to rotate Counter-Clockwise (-36) to bring it to Top (0).
    // Or rotate Clockwise (360 - 36).
    const fullSpins = 360 * 5 
    const targetRotation = fullSpins + (360 - segmentAngle)

    // 3. Start Animation
    isSpinning.value = true
    currentRotation.value = targetRotation
    
    // 4. Wait for animation
    setTimeout(() => {
      isSpinning.value = false
      hasSpun.value = true
      result.value = spinResult
      store.completeSpin(spinResult)
      
      // Fire confetti here if you have the lib
      // confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }, 4000) // Match CSS transition time

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  store.closeModal()
  // Reset for next time (though store keeps canSpin=false)
  setTimeout(() => {
    hasSpun.value = false
    currentRotation.value = 0
  }, 500)
}

const handleQuizAnswer = (isCorrect) => {
  if (isCorrect) {
    alert('Bonne réponse ! +10 XP (Simulation MVP)')
    handleClose()
  } else {
    alert('Dommage... Essayez demain !')
    handleClose()
  }
}
</script>

<style scoped>
.daily-wheel-dialog {
  overflow: hidden;
}

.wheel-container {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 8px solid #fff;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
  /* Conic Gradient for Segments */
  background: conic-gradient(
    #3B82F6 0deg 72deg,    /* Easy */
    #F59E0B 72deg 144deg,  /* Bonus */
    #EF4444 144deg 216deg, /* Hard */
    #10B981 216deg 288deg, /* Help */
    #8B5CF6 288deg 360deg  /* Reroll */
  );
  position: relative;
  overflow: hidden;
}

.wheel-pointer {
  width: 0; 
  height: 0; 
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #2d3748;
  position: absolute;
  top: 10px; /* Adjust based on padding */
  z-index: 10;
  filter: drop-shadow(0 4px 2px rgba(0,0,0,0.3));
}

.wheel-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.wheel-segment {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  /* Trick to position text/icons */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.text-shadow {
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
