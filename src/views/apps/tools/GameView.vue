<template>
  <div class="game-root">
    <Navbar />
    <div class="game-content">
      <div class="game-header">
        <i class="pi pi-star text-3xl text-primary mr-3" />
        <h2 class="game-title">Espace Jeux</h2>
      </div>

      <div class="grid">
        <!-- Daily Wheel Widget -->
        <div class="col-12 md:col-6 lg:col-6">
          <DailyWheelWidget />
        </div>

        <!-- ROM Runner Game Card -->
        <div class="col-12 md:col-6 lg:col-6">
          <div class="game-card h-full flex flex-column bg-gray-900 text-white overflow-hidden relative">
            <!-- Background effect -->
            <div class="absolute inset-0 opacity-20 pointer-events-none" 
                 style="background: radial-gradient(circle at center, #4ade80 0%, transparent 70%);">
            </div>
            
            <div class="p-4 z-1 flex-1 flex flex-column">
                <div class="flex align-items-center gap-3 mb-3">
                    <div class="w-3rem h-3rem bg-green-500 border-circle flex align-items-center justify-content-center shadow-4">
                        <i class="pi pi-bolt text-xl text-white"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-black m-0 text-white">ROM RUNNER</h3>
                        <span class="text-green-400 text-sm font-bold uppercase tracking-wider">Arcade Physio</span>
                    </div>
                </div>
                
                <p class="text-gray-300 line-height-3 mb-4 flex-1">
                    Exercez vos réflexes et votre reconnaissance des mouvements articulaires dans ce runner 3D ultra-rapide.
                </p>

                <div class="flex align-items-center justify-content-between mt-auto">
                    <div class="flex gap-2">
                        <span class="bg-white-alpha-10 px-2 py-1 border-round text-xs">Reflexes</span>
                        <span class="bg-white-alpha-10 px-2 py-1 border-round text-xs">Mouvements</span>
                    </div>
                    <Button 
                        label="JOUER" 
                        icon="pi pi-play" 
                        class="p-button-rounded p-button-success font-bold px-4"
                        @click="router.push('/rom-runner')"
                    />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Navbar from '@/components/common/utils/Navbar.vue';
import DailyWheelWidget from '@/components/gamification/daily/DailyWheelWidget.vue';
import Button from 'primevue/button';

const router = useRouter();
</script>

<style scoped>
.game-root {
  min-height: 100vh;
  background: none;
  overflow-y: auto;
  padding-top: 20px;
}
.game-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.2rem;
}
.game-header {
  display: flex;
  align-items: center;
  margin-bottom: 2.2rem;
}
.game-title {
  font-size: 2.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color, #222);
}
.game-card {
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.game-card:hover {
  transform: translateY(-5px);
}
</style>
