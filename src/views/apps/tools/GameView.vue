<template>
  <div class="game-root">
    <Navbar />
    <main class="game-content" style="--house-color: var(--primary-color, #f3c300)">
      <GamificationPageHeader
        title="Espace jeux"
        description="Une pause à partager, avec les jeux disponibles sur la plateforme."
        icon="pi pi-play"
        @back="goBack"
      />

      <section v-if="!hasGames" class="games-empty" aria-labelledby="games-empty-title">
        <i class="pi pi-pause-circle" aria-hidden="true"></i>
        <h2 id="games-empty-title">Aucun jeu disponible pour le moment</h2>
        <p>Retrouvez vos autres activités sur la plateforme.</p>
        <Button :label="gamificationFeatures.userJourney ? 'Voir ma progression' : 'Revenir aux outils'" icon="pi pi-arrow-right" class="play-button" @click="goBack" />
      </section>

      <div v-else class="grid">
        <div v-if="gamificationFeatures.ventriglisse" class="col-12">
          <section class="ventriglisse-card" aria-labelledby="ventriglisse-title">
            <div class="ventriglisse-preview" aria-hidden="true">
              <span v-for="index in 4" :key="index" :style="{ '--lane': index }"></span>
              <i class="pi pi-send"></i>
            </div>
            <div class="ventriglisse-copy">
              <h2 id="ventriglisse-title">Ventriglisse 3D</h2>
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
                        <h2 class="text-2xl font-black m-0 text-white">ROM RUNNER</h2>
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
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Navbar from '@/components/common/utils/Navbar.vue';
import DailyWheelWidget from '@/components/gamification/daily/DailyWheelWidget.vue';
import Button from 'primevue/button';
import { gamificationFeatures } from '@/config/gamificationFeatures';
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue';
import { computed } from 'vue';

const router = useRouter();
const hasGames = computed(() => gamificationFeatures.ventriglisse || gamificationFeatures.dailyWheel || gamificationFeatures.romRunner);
const goBack = () => router.push(gamificationFeatures.userJourney ? { name: 'GamificationProfileSelf' } : '/outils');
</script>

<style scoped>
.game-root {
  min-height: 100vh;
  background: none;
  overflow-y: auto;
  padding-top: 20px;
}
.game-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.2rem;
}
:deep(.game-header) { color: var(--text-color); background: var(--surface-card); border-color: var(--surface-border); box-shadow: none; }
:deep(.game-header h1) { color: var(--text-color); }
:deep(.game-header__description) { color: var(--text-color-secondary); }
:deep(.game-header__back) { color: var(--text-color); border-color: var(--surface-border); }
.game-card {
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.game-card:hover {
  transform: translateY(-5px);
}

.games-empty { padding: clamp(1.25rem, 4vw, 2.5rem); border-radius: 16px; color: var(--text-color); background: var(--surface-card); }
.games-empty > i { color: var(--primary-color); font-size: 1.5rem; }
.games-empty h2 { margin: 1rem 0 .5rem; font-size: clamp(1.1rem, 3vw, 1.5rem); line-height: 1.3; }
.games-empty p { margin: 0 0 1.25rem; color: var(--text-color-secondary); line-height: 1.5; }

.ventriglisse-card {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.25rem;
  border: 1px solid var(--surface-border, #294360);
  border-radius: 16px;
  background: var(--surface-card, #07182d);
  color: var(--text-color, #f7f9fc);
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

.ventriglisse-copy h2 { margin: 0 0 .35rem; font-size: 1.45rem; }
.ventriglisse-copy p { max-width: 60ch; margin: 0; color: var(--text-color-secondary, #b8c7d9); line-height: 1.5; }
.game-tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.game-tags span { padding: .3rem .55rem; border-radius: 8px; background: var(--surface-ground, #132b47); color: var(--text-color-secondary, #d7e1ed); font-size: .875rem; }
.play-button { min-width: 8rem; min-height: 44px; background: #f3c300; border-color: #f3c300; color: #071426; }
.play-button:hover { background: #ffdb48; border-color: #ffdb48; color: #071426; }
:deep(button:focus-visible) { outline: 3px solid var(--primary-color); outline-offset: 3px; }

@media (max-width: 700px) {
  .ventriglisse-card { grid-template-columns: 1fr; }
  .ventriglisse-preview { height: 6rem; }
  .play-button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .game-card { transition: none; }
  .game-card:hover { transform: none; }
}
</style>
