<template>
  <Navbar />
  <main class="th-page" data-page-scroll>
    <div class="th-shell">
      <GamificationPageHeader
        title="Chasse au trésor"
        description="Des QR codes sont cachés sur le campus. Suivez les indices, scannez-les et faites gagner des points à votre maison."
        icon="pi pi-map"
        @back="goBack"
      >
        <template #actions>
          <Button
            v-if="canManage"
            label="Gérer les chasses"
            icon="pi pi-pencil"
            outlined
            class="th-touch"
            @click="router.push(TREASURE_HUNT_MANAGE_PATH)"
          />
        </template>
      </GamificationPageHeader>

      <section v-if="loading" class="th-panel th-state" aria-busy="true" role="status">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement des chasses</h2><p class="th-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="th-panel th-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Les chasses n’ont pas pu être chargées</h2>
          <p class="th-muted">Vérifiez votre connexion puis réessayez.</p>
          <div class="th-actions th-gap"><Button label="Réessayer" icon="pi pi-refresh" @click="load" /></div>
        </div>
      </section>

      <section v-else-if="!hunts.length" class="th-panel th-state">
        <i class="pi pi-compass" aria-hidden="true"></i>
        <div>
          <h2>Aucune chasse en ce moment</h2>
          <p class="th-muted">Les prochaines chasses au trésor apparaîtront ici, avec leurs indices.</p>
        </div>
      </section>

      <ul v-else class="hunt-list">
        <li v-for="hunt in hunts" :key="hunt.id">
          <RouterLink :to="`${TREASURE_HUNT_PATH}/${hunt.id}`" class="th-panel hunt-card" :class="{ 'hunt-card--ended': hunt.state === 'ended' }">
            <span class="hunt-card__head">
              <span class="hunt-card__title">{{ hunt.title }}</span>
              <Tag :value="huntStateLabel(hunt.state)" :severity="huntStateSeverity(hunt.state)" />
            </span>
            <span class="th-meta">
              <span><i class="pi pi-calendar" aria-hidden="true"></i>{{ formatHuntPeriod(hunt.starts_at, hunt.ends_at) }}</span>
              <span><i class="pi pi-star" aria-hidden="true"></i>Jusqu’à {{ hunt.max_xp }} XP</span>
              <span v-if="hunt.ordered"><i class="pi pi-sort-numeric-up" aria-hidden="true"></i>Ordre imposé</span>
            </span>
            <span class="th-progress">
              <span class="th-progress__label">
                <span>{{ progressLabel(hunt.found_count, hunt.step_count) }}</span>
                <span v-if="hunt.completed" class="hunt-card__done"><i class="pi pi-verified" aria-hidden="true"></i> Terminée</span>
              </span>
              <span class="th-progress__track" aria-hidden="true">
                <span class="th-progress__fill" :style="{ width: `${progressPercent(hunt.found_count, hunt.step_count)}%` }"></span>
              </span>
            </span>
            <span class="hunt-card__cta">{{ hunt.state === 'open' && !hunt.completed ? 'Voir les indices' : 'Voir la chasse' }} <i class="pi pi-arrow-right" aria-hidden="true"></i></span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import {
  TREASURE_HUNT_MANAGE_PATH,
  TREASURE_HUNT_PATH,
  formatHuntPeriod,
  huntStateLabel,
  huntStateSeverity,
  listTreasureHunts,
  progressLabel,
  progressPercent,
} from '@/service/treasureHuntService'
import './treasure-shared.css'

const router = useRouter()
const loading = ref(true)
const error = ref(false)
const hunts = ref([])
const canManage = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    const data = await listTreasureHunts()
    hunts.value = data.hunts || []
    canManage.value = Boolean(data.can_manage)
  } catch (cause) {
    console.error('Chargement des chasses impossible:', cause)
    error.value = true
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push(gamificationFeatures.gamesHub ? '/game' : '/feed')
}

onMounted(load)
</script>

<style scoped>
.th-gap { margin-top: 1rem; }
.hunt-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.hunt-card { display: grid; gap: .85rem; color: inherit; text-decoration: none; transition: border-color .2s ease; }
.hunt-card:hover { border-color: var(--th-accent); }
.hunt-card--ended { opacity: .8; }
.hunt-card__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem; }
.hunt-card__title { font-size: 1.2rem; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
.hunt-card__done i { color: var(--th-accent); }
.hunt-card__cta { display: inline-flex; align-items: center; gap: .4rem; font-weight: 600; }
.hunt-card__cta i { color: var(--th-accent); }
@media (prefers-reduced-motion: reduce) { .hunt-card { transition: none; } }
</style>
