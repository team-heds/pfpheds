<template>
  <div class="rom-hud pointer-events-none">
    <!-- Score & Combo -->
    <div class="absolute top-0 left-0 p-4 w-full flex justify-content-between align-items-start z-2">
      <div class="bg-black-alpha-60 text-white p-3 border-round-xl backdrop-blur-sm">
        <div class="text-3xl font-bold mb-1">{{ store.score }}</div>
        <div class="text-xs uppercase opacity-70">Points</div>
      </div>

      <!-- Barre de vie -->
      <div class="flex gap-2">
         <i v-for="n in 3" :key="n" 
            class="pi pi-heart-fill text-2xl transition-all"
            :class="n <= store.health ? 'text-red-500' : 'text-gray-600'"
         ></i>
      </div>

      <!-- Combo Meter -->
      <div v-if="store.combo > 1" class="combo-container">
        <div class="text-4xl font-black text-yellow-400 animate-bounce">
          x{{ store.combo }}
        </div>
        <div class="text-xs font-bold text-white uppercase text-right">Combo</div>
      </div>
    </div>

    <!-- Timer -->
    <div class="absolute top-0 left-50 transform -translate-x-50 mt-4 z-2">
        <div class="bg-white text-900 font-bold px-4 py-2 border-round-2xl shadow-2 text-xl">
            {{ store.timeLeft }}s
        </div>
    </div>

    <!-- Feedback Popup (Perfect/Miss) -->
    <Transition name="pop">
      <div v-if="feedback" :key="feedback.id" class="absolute top-30 left-50 transform -translate-x-50 z-3 text-center">
        <div class="text-5xl font-black drop-shadow-md"
             :class="{
               'text-green-400': feedback.type === 'PERFECT',
               'text-yellow-400': feedback.type === 'GOOD',
               'text-red-500': feedback.type === 'MISS'
             }">
          {{ feedback.text }}
        </div>
      </div>
    </Transition>

    <!-- Guide des touches (Bas de l'écran) -->
    <div class="absolute bottom-0 left-0 w-full p-4 z-2 bg-gradient-to-t from-black-alpha-80 to-transparent">
        <div class="flex justify-content-center gap-4">
            <div class="key-group flex flex-column align-items-center">
                <div class="flex gap-2">
                    <div class="key-cap bg-green-500">Q</div>
                    <div class="key-cap bg-red-500">W</div>
                </div>
                <span class="text-white text-xs mt-1 font-bold">Flex/Ext</span>
            </div>
            
            <div class="border-right-1 border-white-alpha-20 mx-2"></div>

            <div class="key-group flex flex-column align-items-center">
                <div class="flex gap-2">
                    <div class="key-cap bg-blue-500">A</div>
                    <div class="key-cap bg-yellow-500">S</div>
                </div>
                <span class="text-white text-xs mt-1 font-bold">Abd/Add</span>
            </div>

             <div class="border-right-1 border-white-alpha-20 mx-2"></div>

            <div class="key-group flex flex-column align-items-center">
                <div class="flex gap-2">
                    <div class="key-cap bg-pink-500">Z</div>
                    <div class="key-cap bg-cyan-500">X</div>
                </div>
                <span class="text-white text-xs mt-1 font-bold">Rotations</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useRomRunnerStore } from '@/stores/romRunnerStore'

const store = useRomRunnerStore()
const feedback = ref(null)

watch(() => store.lastFeedback, (newVal) => {
    if(newVal) {
        feedback.value = newVal
        setTimeout(() => {
            if(feedback.value && feedback.value.id === newVal.id) {
                feedback.value = null
            }
        }, 800)
    }
})

</script>

<style scoped>
.rom-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.key-cap {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 4px 0 rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.2);
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pop-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.5);
}

.pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(1.5);
}
</style>
