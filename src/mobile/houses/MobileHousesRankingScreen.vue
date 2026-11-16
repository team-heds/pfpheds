<template>
  <div class="m-houses" :aria-busy="loading ? 'true' : 'false'">
    <h1 class="m-sr-only">Classement des maisons</h1>

    <div v-if="status === 'offline'" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Pas de connexion</p>
      <p class="m-state__text">Le classement s’affichera dès que le téléphone sera de nouveau en ligne.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <div v-else-if="status === 'error'" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Le classement ne se charge pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <template v-else>
      <!-- Ta maison -->
      <section v-if="loading" class="m-houses__mine m-houses__mine--skeleton" aria-hidden="true">
        <span class="m-skeleton m-houses__sk-crest"></span>
        <span class="m-houses__sk-text">
          <span class="m-skeleton m-houses__sk-line m-houses__sk-line--short"></span>
          <span class="m-skeleton m-houses__sk-line"></span>
          <span class="m-skeleton m-houses__sk-bar"></span>
        </span>
      </section>
      <button
        v-else-if="mine"
        type="button"
        class="m-houses__mine"
        :style="{ '--house': mine.color }"
        @click="openHouse(mine)"
      >
        <img v-if="visual(mine)" :src="visual(mine).crest" alt="" class="m-houses__crest m-houses__crest--large" />
        <span class="m-houses__mine-text">
          <span class="m-houses__eyebrow">Ta maison · {{ mine.position === 1 ? '1re' : `${mine.position}e` }} place</span>
          <span class="m-houses__mine-name">{{ mine.displayName }}</span>
          <span class="m-houses__mine-meta">Niveau {{ mine.level }} · {{ mine.levelName }}</span>
          <span class="m-houses__bar" aria-hidden="true"><span :style="{ width: `${houseProgress(mine)}%` }"></span></span>
          <span class="m-houses__mine-meta">
            <template v-if="mine.xpToNext > 0">{{ formatNumber(mine.xpToNext) }} XP avant le niveau {{ mine.level + 1 }}</template>
            <template v-else>Niveau maximum atteint</template>
            <template v-if="gap !== null"> · {{ formatNumber(gap) }} XP derrière la maison devant</template>
          </span>
        </span>
        <MIcon class="m-houses__chevron" name="next" />
      </button>

      <!-- Classement -->
      <section aria-labelledby="m-houses-title">
        <h2 id="m-houses-title" class="m-houses__section">Classement</h2>
        <ol v-if="loading" class="m-houses__list" aria-hidden="true">
          <li v-for="n in 4" :key="n" class="m-houses__row m-houses__row--skeleton">
            <span class="m-skeleton m-houses__sk-rank"></span>
            <span class="m-skeleton m-houses__crest"></span>
            <span class="m-houses__sk-text">
              <span class="m-skeleton m-houses__sk-line"></span>
              <span class="m-skeleton m-houses__sk-line m-houses__sk-line--short"></span>
            </span>
          </li>
        </ol>
        <div v-else-if="!ranking.length" class="m-state">
          <span class="m-state__icon" aria-hidden="true"><MIcon name="trophy" /></span>
          <p class="m-state__title">Pas encore de classement</p>
          <p class="m-state__text">Il apparaîtra dès que les maisons auront gagné de l’XP.</p>
          <button type="button" class="m-ghost-button" @click="load">Actualiser</button>
        </div>
        <ol v-else class="m-houses__list">
          <li v-for="house in ranking" :key="house.name">
            <button
              type="button"
              class="m-houses__row"
              :class="{ 'is-mine': house.name === mineKey }"
              :style="{ '--house': house.color }"
              :aria-label="`${house.position}e : ${house.displayName}, ${formatNumber(house.totalXP)} XP${house.name === mineKey ? ', ta maison' : ''}`"
              @click="openHouse(house)"
            >
              <span class="m-houses__rank" aria-hidden="true">{{ house.position }}</span>
              <img v-if="visual(house)" :src="visual(house).crest" alt="" class="m-houses__crest" loading="lazy" />
              <span class="m-houses__main" aria-hidden="true">
                <span class="m-houses__name">{{ house.displayName }}</span>
                <span class="m-houses__meta">Niveau {{ house.level }} · {{ house.totalMembers }} {{ house.totalMembers > 1 ? 'membres' : 'membre' }}</span>
              </span>
              <span class="m-houses__xp" aria-hidden="true">{{ formatNumber(house.totalXP) }}<small>XP</small></span>
              <MIcon class="m-houses__chevron" name="next" />
            </button>
          </li>
        </ol>
        <p v-if="!loading && ranking.length" class="m-houses__foot">
          {{ formatNumber(totalUsers) }} étudiants · mis à jour {{ updatedLabel(lastUpdated) }}
        </p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import MIcon from '@/mobile/ui/MIcon.vue'
import { fetchUserHouseKey, formatNumber, gapToNext, houseProgress, houseVisual, updatedLabel } from '@/mobile/houses/houseHelpers'

const STALE_AFTER = 60_000

const router = useRouter()
const authStore = useAuthStore()

const status = ref('loading')
const ranking = ref([])
const totalUsers = ref(0)
const lastUpdated = ref(null)
let generation = 0
let loadedAt = 0
let disposed = false

const loading = computed(() => status.value === 'loading')
const mineKey = ref(null)
const mine = computed(() => ranking.value.find((house) => house.name === mineKey.value) || null)
const gap = computed(() => gapToNext(ranking.value, mineKey.value))
const visual = (house) => houseVisual(house?.name)

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

async function load() {
  if (disposed) return
  const current = ++generation
  if (isOffline()) {
    if (!loadedAt) status.value = 'offline'
    return
  }
  if (!loadedAt) status.value = 'loading'
  try {
    const [result, myHouse] = await Promise.all([
      gamificationServiceSupabase.getHousesRanking(),
      fetchUserHouseKey(gamificationServiceSupabase, authStore.user),
    ])
    if (disposed || current !== generation) return
    mineKey.value = myHouse
    if (!Array.isArray(result?.ranking)) throw new Error('Classement des maisons illisible')
    ranking.value = result.ranking
    totalUsers.value = Number(result.totalUsers || 0)
    lastUpdated.value = result.lastUpdated || new Date().toISOString()
    loadedAt = Date.now()
    status.value = 'ready'
  } catch (error) {
    if (disposed || current !== generation) return
    console.error('Maisons : classement indisponible', error)
    // Un rechargement raté garde le classement déjà affiché.
    if (!loadedAt) status.value = isOffline() ? 'offline' : 'error'
  }
}

function openHouse(house) {
  router.push(`/houses/${house.name}/stats`)
}

const onOnline = () => {
  if (status.value === 'offline') load()
}

onMounted(() => {
  load()
  window.addEventListener('online', onOnline)
})
onActivated(() => {
  if (loadedAt && Date.now() - loadedAt > STALE_AFTER) load()
})
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('online', onOnline)
})

defineExpose({ load })
</script>

<style scoped>
.m-houses {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 16px calc(24px + var(--m-tabbar-space, 0px));
}

.m-houses__mine {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--house, var(--m-accent)) 45%, transparent);
  border-radius: var(--m-radius);
  background: linear-gradient(135deg, color-mix(in srgb, var(--house, var(--m-accent)) 26%, var(--m-surface)), var(--m-surface) 70%);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms ease;
}
.m-houses__mine:active {
  transform: scale(0.98);
}
.m-houses__mine:focus-visible,
.m-houses__row:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-houses__mine--skeleton {
  border-color: transparent;
  background: var(--m-surface);
  cursor: default;
}
.m-houses__mine-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.m-houses__eyebrow {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-houses__mine-name {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
}
.m-houses__mine-meta {
  color: var(--m-muted);
  font-size: 0.8125rem;
  line-height: 1.35;
}
.m-houses__bar {
  display: block;
  height: 8px;
  margin: 4px 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--m-raised);
}
.m-houses__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--house, var(--m-accent));
  transition: width 300ms cubic-bezier(0, 0, 0.2, 1);
}

.m-houses__section {
  margin: 0 0 8px;
  font-size: 1.0625rem;
  font-weight: 600;
}
.m-houses__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-houses__row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 12px;
  border: 0;
  border-left: 4px solid var(--house, transparent);
  border-radius: var(--m-radius);
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms ease, background-color 120ms ease;
}
.m-houses__row:active {
  transform: scale(0.98);
  background: var(--m-raised);
}
@media (hover: hover) {
  .m-houses__row:hover,
  .m-houses__mine:hover {
    filter: brightness(1.08);
  }
}
.m-houses__row.is-mine {
  background: color-mix(in srgb, var(--house) 14%, var(--m-surface));
}
.m-houses__row--skeleton {
  border-left-color: transparent;
  cursor: default;
}
.m-houses__rank {
  flex-shrink: 0;
  width: 24px;
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.m-houses__crest {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
}
.m-houses__crest--large {
  width: 64px;
  height: 64px;
}
.m-houses__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-houses__name {
  font-size: 1rem;
  font-weight: 600;
}
.m-houses__meta {
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-houses__xp {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.m-houses__xp small {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 500;
}
.m-houses__chevron {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--m-muted);
}
.m-houses__foot {
  margin: 12px 0 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
  text-align: center;
}

.m-houses__sk-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-houses__sk-crest {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
}
.m-houses__sk-rank {
  width: 24px;
  height: 20px;
  border-radius: 6px;
}
.m-houses__sk-line {
  display: block;
  height: 14px;
  border-radius: 7px;
}
.m-houses__sk-line--short {
  width: 45%;
}
.m-houses__sk-bar {
  display: block;
  height: 8px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .m-houses__mine,
  .m-houses__row,
  .m-houses__bar span {
    transition: none;
  }
}
</style>
