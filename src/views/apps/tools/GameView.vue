<template>
  <div class="game-root">
    <Navbar />
    <div class="game-content">
      <div class="game-header">
        <i class="pi pi-star text-3xl text-primary mr-3" />
        <h2 class="game-title">Espace Jeux</h2>
      </div>

      <div class="grid">
        <div v-if="gamificationFeatures.ventriglisse" class="col-12">
          <section class="ventriglisse-card" aria-labelledby="ventriglisse-title">
            <div class="ventriglisse-preview" aria-hidden="true">
              <span v-for="index in 4" :key="index" :style="{ '--lane': index }"></span>
              <i class="pi pi-send"></i>
            </div>
            <div class="ventriglisse-copy">
              <h3 id="ventriglisse-title">Ventriglisse 3D</h3>
              <p>Composez les couloirs et lancez une course amicale en 3D, de 2 à 6 personnes.</p>
              <div class="game-tags" aria-label="Caractéristiques du jeu">
                <span>Course locale</span><span>2–6 joueurs</span><span>Aucun XP</span>
              </div>
            </div>
            <Button
              label="Jouer"
              icon="pi pi-play"
              class="play-button"
              @click="router.push('/ventriglisse3d')"
            />
          </section>
        </div>

        <!-- Daily Wheel Widget -->
        <div v-if="gamificationFeatures.dailyWheel" class="col-12 md:col-6 lg:col-6">
          <DailyWheelWidget />
        </div>

        <!-- ROM Runner Game Card -->
        <div v-if="gamificationFeatures.romRunner" class="col-12 md:col-6 lg:col-6">
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
import { gamificationFeatures } from '@/config/gamificationFeatures';

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

.ventriglisse-card {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.25rem;
  border: 1px solid #294360;
  border-radius: 16px;
  background: #07182d;
  color: #f7f9fc;
}

.ventriglisse-preview {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: end;
  height: 7rem;
  padding: .7rem;
  overflow: hidden;
  border-radius: 12px;
  background: #50bde8;
}

.ventriglisse-preview span {
  height: calc(25% + var(--lane) * 12%);
  border-inline-end: 1px solid rgba(255, 255, 255, .65);
}

.ventriglisse-preview i {
  position: absolute;
  top: 1rem;
  left: 1.15rem;
  color: #071426;
  font-size: 1.5rem;
  transform: rotate(90deg);
}

.ventriglisse-copy h3 { margin: 0 0 .35rem; font-size: 1.45rem; }
.ventriglisse-copy p { max-width: 60ch; margin: 0; color: #b8c7d9; }
.game-tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.game-tags span { padding: .3rem .55rem; border-radius: 8px; background: #132b47; color: #d7e1ed; font-size: .75rem; }
.play-button { min-width: 8rem; min-height: 44px; background: #ffc400; border-color: #ffc400; color: #071426; }

@media (max-width: 700px) {
  .ventriglisse-card { grid-template-columns: 1fr; }
  .ventriglisse-preview { height: 6rem; }
  .play-button { width: 100%; }
}
</style>
