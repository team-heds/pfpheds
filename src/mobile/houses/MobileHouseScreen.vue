<template>
  <article class="m-house" :style="{ '--house': info.color }" :aria-busy="loading ? 'true' : 'false'">
    <header class="m-house__hero">
      <!-- L'image porte déjà le blason et le nom de la maison. -->
      <img v-if="visual" :src="visual.background" alt="" class="m-house__bg" />
      <div class="m-house__hero-inner">
        <h1 class="m-house__name" :class="{ 'm-sr-only': visual }">{{ info.name }}</h1>
        <p v-if="info.motto" class="m-house__motto">« {{ info.motto }} »</p>
        <span v-if="isMine" class="m-house__mine">Ta maison</span>
      </div>
    </header>

    <div class="m-house__body">
      <div v-if="status === 'offline'" class="m-state" role="alert">
        <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
        <p class="m-state__title">Pas de connexion</p>
        <p class="m-state__text">Les statistiques s’afficheront dès que le téléphone sera de nouveau en ligne.</p>
        <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
      </div>

      <div v-else-if="status === 'error'" class="m-state" role="alert">
        <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
        <p class="m-state__title">Les statistiques ne se chargent pas</p>
        <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
        <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
      </div>

      <template v-else>
        <section class="m-house__card" aria-label="Niveau de la maison">
          <template v-if="loading">
            <span class="m-skeleton m-house__sk-line m-house__sk-line--short" aria-hidden="true"></span>
            <span class="m-skeleton m-house__sk-line" aria-hidden="true"></span>
            <span class="m-skeleton m-house__sk-bar" aria-hidden="true"></span>
          </template>
          <template v-else>
            <p class="m-house__eyebrow">Niveau {{ level.niveau }}</p>
            <p class="m-house__level">{{ level.name }}</p>
            <div
              class="m-house__bar"
              role="progressbar"
              :aria-valuenow="progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`Progression vers le niveau suivant : ${progress} %`"
            >
              <span :style="{ width: `${progress}%` }"></span>
            </div>
            <p class="m-house__muted">
              {{ formatNumber(stats.totalXP) }} XP
              <template v-if="level.xpToNext > 0"> · encore {{ formatNumber(level.xpToNext) }} XP pour le niveau {{ level.niveau + 1 }}</template>
            </p>
          </template>
        </section>

        <dl v-if="!loading" class="m-house__facts">
          <div>
            <dt>Membres</dt>
            <dd>{{ formatNumber(stats.totalMembers) }}</dd>
          </div>
          <div>
            <dt>XP par membre</dt>
            <dd>{{ formatNumber(stats.averageXP) }}</dd>
          </div>
          <div v-if="stats.averageLevel != null">
            <dt>Niveau moyen</dt>
            <dd>{{ stats.averageLevel }}</dd>
          </div>
        </dl>

        <section v-if="info.description && !loading" aria-labelledby="m-house-about">
          <h2 id="m-house-about" class="m-house__section">La maison</h2>
          <p class="m-house__text">{{ info.description }}</p>
        </section>

        <section v-if="!loading && members.length" aria-labelledby="m-house-members">
          <h2 id="m-house-members" class="m-house__section">Membres les plus actifs</h2>
          <ol class="m-house__members">
            <li v-for="(member, index) in shownMembers" :key="member.userId || index" :class="{ 'is-me': member.userId === userId }">
              <span class="m-house__rank">{{ index + 1 }}</span>
              <span class="m-house__member">
                <span>{{ member.displayName || member.prenom }}<template v-if="member.userId === userId"> (toi)</template></span>
                <small>Niveau {{ member.niveau }}</small>
              </span>
              <span class="m-house__member-xp">{{ formatNumber(member.totalXP) }} XP</span>
            </li>
          </ol>
          <button
            v-if="members.length > MEMBERS_PREVIEW"
            type="button"
            class="m-ghost-button m-house__more"
            :aria-expanded="showAll ? 'true' : 'false'"
            @click="showAll = !showAll"
          >
            {{ showAll ? 'Afficher moins' : `Tout afficher (${members.length})` }}
          </button>
        </section>
      </template>
    </div>
  </article>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import MIcon from '@/mobile/ui/MIcon.vue'
import { fetchUserHouseKey, formatNumber, houseKey, houseVisual } from '@/mobile/houses/houseHelpers'

const MEMBERS_PREVIEW = 10
const STALE_AFTER = 60_000

const route = useRoute()
const authStore = useAuthStore()
// L'écran reste en mémoire pour cette adresse : la maison ne change pas.
const key = houseKey(route.params.houseName) || 'harmonis'
const info = gamificationServiceSupabase.getHouseInfo(key)
const visual = houseVisual(key)

const status = ref('loading')
const stats = ref({ totalXP: 0, totalMembers: 0, averageXP: 0, averageLevel: null, members: [], houseLevel: null })
const showAll = ref(false)
let generation = 0
let loadedAt = 0
let disposed = false

const loading = computed(() => status.value === 'loading')
const userId = computed(() => authStore.user?.id || null)
const myHouse = ref(null)
const isMine = computed(() => myHouse.value === key)
const level = computed(() => stats.value.houseLevel || { niveau: 1, name: '', xpToNext: 0, xpRequired: 0 })
const progress = computed(() => {
  const { xpToNext = 0, xpRequired = 0 } = level.value
  if (xpToNext <= 0) return 100
  const span = Number(stats.value.totalXP) + xpToNext - xpRequired
  return span > 0 ? Math.round(Math.min(100, Math.max(0, ((stats.value.totalXP - xpRequired) / span) * 100))) : 0
})
const members = computed(() => stats.value.members || [])
const shownMembers = computed(() => (showAll.value ? members.value : members.value.slice(0, MEMBERS_PREVIEW)))

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
    const [result, mine] = await Promise.all([
      gamificationServiceSupabase.getHouseDetailedStats(key),
      fetchUserHouseKey(gamificationServiceSupabase, authStore.user),
    ])
    if (disposed || current !== generation) return
    myHouse.value = mine
    stats.value = { ...stats.value, ...result }
    loadedAt = Date.now()
    status.value = 'ready'
  } catch (error) {
    if (disposed || current !== generation) return
    console.error('Maison : statistiques indisponibles', error)
    if (!loadedAt) status.value = isOffline() ? 'offline' : 'error'
  }
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
.m-house {
  padding-bottom: calc(24px + var(--m-tabbar-space, 0px));
}

.m-house__hero {
  margin-bottom: 16px;
}
.m-house__bg {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  max-height: 240px;
  object-fit: cover;
}
.m-house__hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 0;
  text-align: center;
}
.m-house__name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.15;
}
.m-house__motto {
  margin: 0;
  max-width: 30ch;
  color: var(--m-fg);
  font-size: 0.9375rem;
  font-style: italic;
  opacity: 0.9;
}
.m-house__mine {
  margin-top: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--house);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
}

.m-house__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 16px;
}
.m-house__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-house__eyebrow {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-house__level {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.m-house__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--m-raised);
}
.m-house__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--house);
  transition: width 300ms cubic-bezier(0, 0, 0.2, 1);
}
.m-house__muted {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
}

.m-house__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}
.m-house__facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-house__facts dd {
  order: -1;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.m-house__facts dt {
  color: var(--m-muted);
  font-size: 0.8125rem;
}

.m-house__section {
  margin: 0 0 8px;
  font-size: 1.0625rem;
  font-weight: 600;
}
.m-house__text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.m-house__members {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-house__members li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-house__members li.is-me {
  background: color-mix(in srgb, var(--house) 18%, var(--m-surface));
}
.m-house__rank {
  flex-shrink: 0;
  width: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.m-house__member {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  overflow-wrap: anywhere;
}
.m-house__member small {
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-house__member-xp {
  flex-shrink: 0;
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.m-house__more {
  width: 100%;
  margin-top: 8px;
}

.m-house__sk-line {
  display: block;
  height: 14px;
  border-radius: 7px;
}
.m-house__sk-line--short {
  width: 40%;
}
.m-house__sk-bar {
  display: block;
  height: 8px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .m-house__bar span {
    transition: none;
  }
}
</style>
