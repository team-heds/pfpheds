<template>
  <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background-color: #111827; overflow: hidden;">
    
    <!-- Bouton Quitter (Toujours visible) -->
    <Button 
      icon="pi pi-times" 
      class="p-button-rounded p-button-text p-button-secondary"
      style="position: absolute; top: 1rem; right: 1rem; z-index: 50; color: white;"
      @click="$router.push('/game')"
    />

    <!-- Scène 3D (Arrière plan) -->
    <div style="position: absolute; inset: 0; z-index: 0;">
      <RomRunnerScene />
    </div>

    <!-- HUD (Overlay) -->
    <div style="position: absolute; inset: 0; z-index: 10; pointer-events: none;" v-if="store.isPlaying">
      <RomRunnerHUD />
    </div>

    <!-- Écran d'accueil (Menu) -->
    <div v-if="store.status === 'idle'" class="absolute inset-0 z-20 flex align-items-center justify-content-center bg-black-alpha-70 backdrop-blur-sm">
      <div class="surface-card p-6 border-round-2xl shadow-8 text-center max-w-lg w-full">
        <div class="mb-5">
           <i class="pi pi-bolt text-6xl text-yellow-400 mb-3 animate-pulse"></i>
           <h1 class="text-4xl font-black mb-2 text-900">ROM RUNNER</h1>
           <p class="text-600 text-lg">Le runner physio ultra-rapide</p>
        </div>

        <div class="grid text-left mb-5">
           <div class="col-12 p-3 bg-blue-50 border-round mb-2">
              <i class="pi pi-info-circle text-blue-500 mr-2"></i>
              <span class="font-bold text-blue-900">But du jeu :</span>
              <p class="m-0 mt-1 text-sm text-blue-800">Utilisez les touches correspondantes aux mouvements affichés par les obstacles (Couleurs) pour les détruire.</p>
           </div>
        </div>

        <Button 
          label="LANCER LA RUN (60s)" 
          icon="pi pi-play" 
          class="p-button-lg w-full font-bold text-xl p-button-raised p-button-warning"
          @click="startGame"
        />
      </div>
    </div>

    <!-- Écran Game Over -->
    <div v-if="store.status === 'gameover'" class="absolute inset-0 z-10 flex align-items-center justify-content-center bg-black-alpha-80 backdrop-blur-md">
      <div class="surface-card p-6 border-round-2xl shadow-8 text-center max-w-md w-full animation-scale-in">
        <h2 class="text-3xl font-black mb-1">SESSION TERMINÉE</h2>
        
        <div class="py-5">
            <div class="text-6xl font-black text-primary mb-2">{{ store.score }}</div>
            <div class="text-sm uppercase font-bold text-500 tracking-wider">Score Final</div>
        </div>

        <div class="grid mb-5">
           <div class="col-4">
              <div class="font-bold text-xl text-green-500">{{ store.stats.perfectHits }}</div>
              <div class="text-xs text-600">Parfait</div>
           </div>
           <div class="col-4">
               <div class="font-bold text-xl text-yellow-500">{{ store.maxCombo }}</div>
               <div class="text-xs text-600">Max Combo</div>
           </div>
           <div class="col-4">
               <div class="font-bold text-xl text-red-500">{{ store.stats.misses }}</div>
               <div class="text-xs text-600">Erreurs</div>
           </div>
        </div>

        <div class="flex flex-column gap-3">
            <Button 
              label="REJOUER" 
              icon="pi pi-refresh" 
              class="w-full p-button-outlined"
              @click="startGame"
            />
            <Button 
              label="QUITTER" 
              icon="pi pi-arrow-left" 
              class="w-full p-button-text p-button-secondary"
              @click="$router.push('/game')"
            />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onUnmounted } from 'vue'
import { useRomRunnerStore } from '@/stores/romRunnerStore'
import RomRunnerScene from '@/components/gamification/rom-runner/RomRunnerScene.vue'
import RomRunnerHUD from '@/components/gamification/rom-runner/RomRunnerHUD.vue'
import Button from 'primevue/button'

const store = useRomRunnerStore()
let timerInterval

const startGame = () => {
  store.startGame()
  
  // Gestion du timer global (60s)
  if (timerInterval) clearInterval(timerInterval)
  
  timerInterval = setInterval(() => {
    if (store.status !== 'playing') {
        clearInterval(timerInterval)
        return
    }

    store.timeLeft--
    
    // Accélération progressive
    if(store.timeLeft % 10 === 0) {
        store.currentSpeed += 2
    }

    if (store.timeLeft <= 0) {
        clearInterval(timerInterval)
        store.endGame()
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  store.resetState()
  store.status = 'idle'
})

</script>

<style scoped>
.animation-scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
</style>
